import { spawn, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  bindIdentityEnvironmentDefaultProvider,
  classifyLaunchFailure,
  diagnoseBrowserProviderFailure,
  type BrowserProviderDetectionInput,
  type IdentityEnvironmentProviderBinding
} from "./provider-management.js";
import { opaqueRef } from "./refs.js";
import {
  resolveIdentityEnvironmentLaunchConfiguration,
  type ResolvedIdentityEnvironmentLaunchConfiguration
} from "./identity-environment-configuration.js";
import { prepareProfileStorage } from "./profile-storage.js";
import { trustLocalProviderReadProbe, trustLocalProviderSiteResourceProbe } from "./read-operation-probe-trust.js";
import type {
  BossJobDetailPublicSummary,
  LocalProviderLaunchInput,
  LocalProviderLauncher,
  LocalProviderLaunchResult,
  LocalProviderDetailPublicSummary,
  LocalProviderPageFacts,
  LocalProviderReadProbeInput,
  LocalProviderReadProbeResult,
  LocalProviderReadProbePublicSummary,
  LocalProviderSiteResourceProbeInput,
  LocalProviderSiteResourceProbeResult,
  LocalProviderScreenshotFacts,
  RuntimeErrorCode,
  RuntimeErrorFact,
  RuntimeFact,
  XiaohongshuNoteDetailPublicSummary
} from "./runtime-session-types.js";

type CdpPageTarget = { id?: string; type?: string; webSocketDebuggerUrl?: string; url?: string; title?: string };
type ObservedDetailPublicSummary = Omit<XiaohongshuNoteDetailPublicSummary, "source_citation"> | Omit<BossJobDetailPublicSummary, "detail_ref" | "source_citation">;

export async function launchLocalDedicatedProvider(input: LocalProviderLaunchInput): Promise<LocalProviderLaunchResult> {
  const explicitBrowserPath = input.browser_path || process.env.HARBOR_BROWSER_PATH || "";
  const providerBinding = explicitBrowserPath
    ? null
    : resolveRuntimeProviderBinding(input.identity_environment);
  const browserPath = explicitBrowserPath || providerBinding?.selected_provider?.install.path || "";
  if (!browserPath) {
    const diagnostic = providerBinding?.diagnostics[0] ?? diagnoseBrowserProviderFailure({ provider_id: "cloakbrowser", failure_class: "not_installed" });
    return unavailable("provider_unavailable", diagnostic.app_summary, providerBindingFacts(providerBinding));
  }
  const profileStorage = await prepareProfileStorage(input.profile_storage_ref);
  const providerConfiguration = input.identity_environment
    ? resolveIdentityEnvironmentLaunchConfiguration(input.identity_environment, input.resolve_proxy)
    : null;
  if (input.identity_environment && !providerConfiguration) {
    return unavailable("unsupported", "Identity environment configuration cannot be resolved by the selected local provider.", [
      ...providerBindingFacts(providerBinding),
      ...profileStorage.facts
    ]);
  }
  const args = providerLaunchArguments(input, profileStorage.profileDir, providerConfiguration);
  await removeStaleDevtoolsPort(profileStorage.profileDir);
  const child = spawn(browserPath, args, { stdio: "ignore" });
  const launchDeadline = Date.now() + Math.max(1, input.timeout_ms);
  try {
    const port = await waitForDevtoolsPort(profileStorage.profileDir, launchDeadline);
    const readbackSignal = AbortSignal.timeout(remainingLaunchTime(launchDeadline));
    const version = await fetchVersion(port, readbackSignal);
    const configurationFacts = providerConfiguration
      ? await applyAndReadbackProviderConfiguration(port, input.url, providerConfiguration, readbackSignal)
      : [];
    const page = await readPageFacts(port, input.url, readbackSignal);
    let currentUrl = page.current_url ?? input.url;
    const evidence_ref = opaqueRef("validation");
    return {
      status: "ready",
      execution_surface: "local_provider",
      cdp_ref: opaqueRef("cdp"),
      viewer_entry: viewerEntry(input.headless),
      page,
      facts: [
        ...providerBindingFacts(providerBinding),
        ...configurationFacts,
        ...profileStorage.facts,
        { key: "browser.launch", source: "observed", value: "ready", evidence_ref },
        { key: "cdp.version", source: "validation_evidence", value: `${version.Browser} ${version["Protocol-Version"]}`, evidence_ref },
        ...page.facts
      ],
      openUrl: async (url) => {
        const nextPage = await openProviderUrl(port, url, AbortSignal.timeout(Math.max(1, input.timeout_ms)));
        currentUrl = nextPage.current_url ?? url;
        return nextPage;
      },
      probeSiteResource: trustLocalProviderSiteResourceProbe((probe) => probeProviderSiteResource(port, currentUrl, probe)),
      probeReadOperation: trustLocalProviderReadProbe(async (probe) => {
        const result = await probeProviderReadOperation(port, probe);
        if (result.page?.current_url) currentUrl = result.page.current_url;
        return result;
      }),
      captureScreenshot: () => captureProviderScreenshot(port, currentUrl),
      close: () => closeBrowser(child, profileStorage.profileDir, !profileStorage.persistent)
    };
  } catch (error) {
    await closeBrowser(child, profileStorage.profileDir, !profileStorage.persistent);
    const diagnostic = diagnoseBrowserProviderFailure({
      provider_id: providerBinding?.selected_provider_id ?? providerConfiguration?.provider_id ?? "cloakbrowser",
      failure_class: classifyLaunchFailure(error),
      path: browserPath,
      message: error instanceof Error ? error.message : "Browser launch failed."
    });
    return unavailable("launch_failed", diagnostic.app_summary, [...providerBindingFacts(providerBinding), ...profileStorage.facts]);
  }
}

export function resolveRuntimeProviderBinding(
  identityEnvironment: LocalProviderLaunchInput["identity_environment"],
  detection: BrowserProviderDetectionInput = {}
): IdentityEnvironmentProviderBinding {
  const persisted = identityEnvironment?.provider_binding;
  return bindIdentityEnvironmentDefaultProvider({
    ...detection,
    ...(persisted?.selected_provider_id ? { requested_provider_id: persisted.selected_provider_id } : {}),
    execution_identity_ref: identityEnvironment?.execution_identity_ref,
    profile_ref: identityEnvironment?.profile_ref
  });
}

export interface LocalProviderLaunchVerification {
  browser_version: string;
}

export async function verifyLocalProviderLaunch(
  browserPath: string,
  options: { expected_version?: string; timeout_ms?: number; signal?: AbortSignal } = {}
): Promise<LocalProviderLaunchVerification> {
  const profileDir = await mkdtemp(join(tmpdir(), "harbor-provider-verify-"));
  const child = spawn(browserPath, providerLaunchArguments({ headless: true, url: "about:blank" }, profileDir, null), { stdio: "ignore" });
  const deadline = Date.now() + Math.max(1, options.timeout_ms ?? 10_000);
  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(Math.max(1, options.timeout_ms ?? 10_000))])
    : AbortSignal.timeout(Math.max(1, options.timeout_ms ?? 10_000));
  try {
    const port = await waitForDevtoolsPort(profileDir, deadline, signal);
    const versionFacts = await fetchVersion(port, signal);
    const browserVersion = observedBrowserVersion(versionFacts);
    if (options.expected_version && !compatibleBrowserVersion(browserVersion, options.expected_version)) {
      throw new Error(`Provider version ${browserVersion} does not match target ${options.expected_version}.`);
    }
    const page = await readPageFacts(port, "about:blank", signal);
    if (page.status !== "ready") throw new Error("Provider launch readback was not ready.");
    return { browser_version: browserVersion };
  } finally {
    await closeBrowser(child, profileDir, true);
  }
}

export function providerLaunchArguments(
  input: Pick<LocalProviderLaunchInput, "headless" | "url">,
  profileDir: string,
  configuration: ResolvedIdentityEnvironmentLaunchConfiguration | null
): string[] {
  return [
    "--remote-debugging-port=0",
    `--user-data-dir=${profileDir}`,
    "--no-default-browser-check",
    "--no-first-run",
    ...(input.headless ? ["--headless=new"] : []),
    ...(configuration?.proxy_server ? [`--proxy-server=${configuration.proxy_server}`] : []),
    ...(configuration?.language ? [`--lang=${configuration.language}`] : []),
    ...(configuration?.viewport ? [`--window-size=${configuration.viewport.width},${configuration.viewport.height}`] : []),
    configuration ? "about:blank" : input.url
  ];
}

const BOSS_SITE_RESOURCE_PROBE_DEADLINE_MS = 3000;

export async function probeProviderSiteResource(
  port: string,
  requestedUrl: string,
  input: LocalProviderSiteResourceProbeInput,
  deadlineMs = BOSS_SITE_RESOURCE_PROBE_DEADLINE_MS
): Promise<LocalProviderSiteResourceProbeResult> {
  if (input.site_id !== "boss" || (input.task_kind !== "job_search" && input.task_kind !== "boss_job_search")) {
    return siteResourceProbeUnavailable("unknown", "provider_probe_unavailable", "The local provider has no safe probe for this site resource.");
  }
  const deadline = AbortSignal.timeout(Math.max(1, Math.min(deadlineMs, BOSS_SITE_RESOURCE_PROBE_DEADLINE_MS)));
  const signal = input.signal ? AbortSignal.any([input.signal, deadline]) : deadline;
  try {
    const page = await activePage(port, requestedUrl, signal);
    if (!page.webSocketDebuggerUrl) {
      return siteResourceProbeUnavailable("unknown", "provider_probe_unavailable", "The BOSS page has no controlled CDP target.");
    }
    const observation = await withCdp(page.webSocketDebuggerUrl, async (client) => {
      await client.send("Runtime.enable");
      const evaluated = await client.send("Runtime.evaluate", {
        expression: readProbeExpression("boss", ""),
        returnByValue: true
      });
      return (evaluated.result as { value?: ReadProbeObservation } | undefined)?.value;
    }, signal);
    return validateBossSpaResourceProbe(observation);
  } catch {
    return siteResourceProbeUnavailable("unknown", "provider_probe_unavailable", "The BOSS SPA could not be verified through the controlled CDP probe.");
  }
}

export function validateBossSpaResourceProbe(observation: ReadProbeObservation | undefined): LocalProviderSiteResourceProbeResult {
  if (!observation) return siteResourceProbeUnavailable("unknown", "provider_probe_unavailable", "The BOSS SPA probe returned no public observation.");
  if (observation.challenge_like) return siteResourceProbeUnavailable("blocked", "safety_challenge", "The BOSS page shows a verification or safety challenge.");
  if (observation.login_like) return siteResourceProbeUnavailable("blocked", "not_logged_in", "The BOSS page requires manual login.");
  if (observation.origin !== "https://www.zhipin.com" || observation.pathname !== "/web/geek/job") {
    return siteResourceProbeUnavailable("unavailable", "page_not_ready", "The active page is not the canonical BOSS job-search surface.");
  }
  if (!observation.ready || !observation.vue_owned || !observation.rendered_surface || !observation.job_cards_valid || !observation.job_card_count) {
    return siteResourceProbeUnavailable("unavailable", "page_not_ready", "The canonical BOSS page has no verified SPA job-search surface.");
  }
  return { status: "available", observed_at: new Date().toISOString(), evidence_ref: opaqueRef("validation") };
}

function siteResourceProbeUnavailable(
  status: "blocked" | "unavailable" | "unknown",
  failure_class: Extract<LocalProviderSiteResourceProbeResult, { status: "blocked" | "unavailable" | "unknown" }>["failure_class"],
  message: string
): LocalProviderSiteResourceProbeResult {
  return { status, failure_class, message };
}

export function createFixtureLauncher(status: "ready" | "unavailable" | "profile_locked" | "session_lost" = "ready"): LocalProviderLauncher {
  return async (input) => {
    if (status === "unavailable") return unavailable("provider_unavailable", "Fixture provider unavailable.");
    if (status === "profile_locked") return unavailable("profile_locked", "Fixture profile is locked by another local browser process.");
    if (status === "session_lost") return unavailable("session_lost", "Fixture Runtime Session was lost before validation could complete.");
    const configuration = input.identity_environment
      ? resolveIdentityEnvironmentLaunchConfiguration(input.identity_environment, input.resolve_proxy)
      : null;
    if (input.identity_environment && !configuration) return unavailable("unsupported", "Fixture provider could not resolve identity environment configuration.");
    const evidence_ref = opaqueRef("validation");
    const page = readyPage(input.url, `Fixture page for ${input.url}`);
    return {
      status: "ready",
      execution_surface: "fixture",
      cdp_ref: opaqueRef("cdp"),
      viewer_entry: viewerEntry(input.headless),
      page,
      facts: [
        ...fixtureIdentityEnvironmentConfigurationFacts(configuration, evidence_ref),
        { key: "browser.launch", source: "observed", value: "ready", evidence_ref },
        { key: "cdp.version", source: "validation_evidence", value: "FixtureBrowser 1.0", evidence_ref },
        ...page.facts
      ],
      openUrl: async (url) => readyPage(url, `Fixture page for ${url}`),
      captureScreenshot: async () => fixtureScreenshot(input.url),
      close: async () => {}
    };
  };
}

function unavailable(code: RuntimeErrorCode, message: string, facts: RuntimeFact[] = []): LocalProviderLaunchResult {
  return {
    status: "unavailable",
    error: { code, message, retryable: code !== "unsupported" },
    facts: [...facts, { key: "browser.launch", source: "observed", value: code }]
  };
}

function error(code: RuntimeErrorCode, message: string, retryable = true): RuntimeErrorFact {
  return { code, message, retryable };
}

function readyPage(current_url: string, title: string | null): LocalProviderPageFacts {
  const evidence_ref = opaqueRef("validation");
  return {
    current_url,
    title,
    status: "ready",
    facts: [
      { key: "page.current_url", source: "observed", value: current_url, evidence_ref },
      { key: "page.title", source: "observed", value: title ?? "unavailable", evidence_ref },
      { key: "page.status", source: "validation_evidence", value: "ready", evidence_ref }
    ]
  };
}

function providerBindingFacts(binding: IdentityEnvironmentProviderBinding | null): RuntimeFact[] {
  const facts: RuntimeFact[] = [
    { key: "provider.management.registered", source: "configured", value: "cloakbrowser,chrome_official" },
    { key: "provider.default", source: "configured", value: "cloakbrowser" },
    { key: "provider.excluded.chromium", source: "configured", value: "not_user_selectable" },
    { key: "provider.reference.donut_browser", source: "configured", value: "mechanism_reference_only" }
  ];
  if (!binding) return facts;
  facts.push(
    { key: "identity_environment.provider_selection", source: "configured", value: binding.selection_reason },
    { key: "identity_environment.provider_notice_required", source: "configured", value: String(binding.requires_user_notice) }
  );
  if (binding.selected_provider) {
    facts.push(
      { key: "provider.id", source: "configured", value: binding.selected_provider.provider_id },
      { key: "provider.role", source: "configured", value: binding.selected_provider.role }
    );
  }
  return facts;
}

function fixtureIdentityEnvironmentConfigurationFacts(
  configuration: ResolvedIdentityEnvironmentLaunchConfiguration | null,
  evidence_ref: string
): RuntimeFact[] {
  if (!configuration) return [];
  const facts: RuntimeFact[] = [
    { key: "identity_environment.provider_id", source: "validation_evidence", value: configuration.provider_id, evidence_ref }
  ];
  if (configuration.proxy_server) facts.push({ key: "identity_environment.proxy", source: "configured", value: "provider_argument_applied" });
  if (configuration.language) facts.push({ key: "identity_environment.language", source: "observed", value: configuration.language, evidence_ref });
  if (configuration.timezone) facts.push({ key: "identity_environment.timezone", source: "observed", value: configuration.timezone, evidence_ref });
  if (configuration.viewport) facts.push({ key: "identity_environment.viewport", source: "observed", value: `${configuration.viewport.width}x${configuration.viewport.height}`, evidence_ref });
  return facts;
}

async function applyAndReadbackProviderConfiguration(
  port: string,
  requestedUrl: string,
  configuration: ResolvedIdentityEnvironmentLaunchConfiguration,
  signal: AbortSignal
): Promise<RuntimeFact[]> {
  const evidence_ref = opaqueRef("validation");
  const facts: RuntimeFact[] = [
    { key: "identity_environment.provider_id", source: "validation_evidence", value: configuration.provider_id, evidence_ref }
  ];
  if (configuration.proxy_server) {
    facts.push({ key: "identity_environment.proxy", source: "configured", value: "provider_argument_applied" });
  }

  const opened = await openProviderUrl(port, requestedUrl, signal);
  if (opened.status !== "ready") throw new Error("Identity environment configuration could not open the requested page.");
  const page = await activePage(port, requestedUrl, signal);
  if (!page.webSocketDebuggerUrl) throw new Error("Identity environment configuration has no controlled CDP page target.");
  const observed = await withCdp(page.webSocketDebuggerUrl, async (client) => {
    if (configuration.language) await client.send("Emulation.setLocaleOverride", { locale: configuration.language });
    if (configuration.timezone) await client.send("Emulation.setTimezoneOverride", { timezoneId: configuration.timezone });
    if (configuration.viewport) {
      await client.send("Emulation.setDeviceMetricsOverride", {
        width: configuration.viewport.width,
        height: configuration.viewport.height,
        deviceScaleFactor: 1,
        mobile: false
      });
    }
    const result = await client.send("Runtime.evaluate", {
      expression: `(() => ({ language: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, width: window.innerWidth, height: window.innerHeight }))()`,
      returnByValue: true
    });
    const value = (result.result as { value?: { language?: unknown; timezone?: unknown; width?: unknown; height?: unknown } } | undefined)?.value;
    return value;
  }, signal);
  if (!observed) throw new Error("Provider environment readback returned no observation.");
  if (configuration.language) {
    if (observed.language !== configuration.language) throw new Error("Provider locale readback did not match configured language.");
    facts.push({ key: "identity_environment.language", source: "observed", value: configuration.language, evidence_ref });
  }
  if (configuration.timezone) {
    if (observed.timezone !== configuration.timezone) throw new Error("Provider timezone readback did not match configured timezone.");
    facts.push({ key: "identity_environment.timezone", source: "observed", value: configuration.timezone, evidence_ref });
  }
  if (configuration.viewport) {
    if (observed.width !== configuration.viewport.width || observed.height !== configuration.viewport.height) {
      throw new Error("Provider viewport readback did not match configured dimensions.");
    }
    facts.push({
      key: "identity_environment.viewport",
      source: "observed",
      value: `${configuration.viewport.width}x${configuration.viewport.height}`,
      evidence_ref
    });
  }
  return facts;
}

function viewerEntry(headless: boolean): Exclude<LocalProviderLaunchResult, { status: "unavailable" }>["viewer_entry"] {
  return headless ? {
    availability: "unsupported",
    access_mode: "none",
    transport: "not_applicable",
    input_capabilities: [],
    unavailable_reason: "unsupported"
  } : {
    availability: "available",
    access_mode: "interactive",
    transport: "local_window",
    input_capabilities: ["keyboard_mouse"]
  };
}

async function waitForDevtoolsPort(profileDir: string, deadline: number, signal?: AbortSignal): Promise<string> {
  const portFile = join(profileDir, "DevToolsActivePort");
  while (Date.now() < deadline) {
    if (signal?.aborted) throw signal.reason ?? new DOMException("The operation was aborted.", "AbortError");
    try {
      const [port] = (await readFile(portFile, "utf8")).trim().split("\n");
      if (port) return port;
    } catch {
      await abortableDelay(25, signal);
    }
  }
  throw new Error("Timed out waiting for local browser CDP readiness.");
}

async function abortableDelay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw signal.reason ?? new DOMException("The operation was aborted.", "AbortError");
  await new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? new DOMException("The operation was aborted.", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, milliseconds);
    signal?.addEventListener("abort", abort, { once: true });
  });
}

function remainingLaunchTime(deadline: number): number {
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new Error("Timed out reading local browser CDP readiness.");
  return remaining;
}

async function removeStaleDevtoolsPort(profileDir: string): Promise<void> {
  const portFile = join(profileDir, "DevToolsActivePort");
  let port = "";
  try {
    [port] = (await readFile(portFile, "utf8")).trim().split("\n");
  } catch {
    return;
  }
  if (port && await isDevtoolsPortReachable(port)) return;
  await rm(portFile, { force: true });
}

async function isDevtoolsPortReachable(port: string): Promise<boolean> {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(500) });
    return response.ok && hasCdpWebSocketEndpoint(await response.json());
  } catch {
    return false;
  }
}

function hasCdpWebSocketEndpoint(version: unknown): boolean {
  const endpoint = typeof version === "object" && version !== null
    ? (version as Record<string, unknown>).webSocketDebuggerUrl
    : null;
  if (typeof endpoint !== "string") return false;
  try {
    const url = new URL(endpoint);
    return (url.protocol === "ws:" || url.protocol === "wss:") && url.hostname !== "";
  } catch {
    return false;
  }
}

async function fetchVersion(port: string, signal?: AbortSignal): Promise<Record<string, string>> {
  const response = await fetch(`http://127.0.0.1:${port}/json/version`, { signal });
  if (!response.ok) throw new Error(`CDP readiness probe failed: ${response.status}`);
  return (await response.json()) as Record<string, string>;
}

function observedBrowserVersion(facts: Record<string, string>): string {
  const product = facts.Browser ?? "";
  const match = product.match(/(?:^|\/)([0-9]+(?:\.[0-9]+){3,4})$/);
  if (!match) throw new Error("Provider launch did not report a supported browser version.");
  return match[1]!;
}

function compatibleBrowserVersion(observed: string, target: string): boolean {
  const observedParts = observed.split(".");
  const targetParts = target.split(".");
  return observed === target || observedParts.slice(0, 4).join(".") === targetParts.slice(0, 4).join(".");
}

async function openProviderUrl(port: string, url: string, signal?: AbortSignal): Promise<LocalProviderPageFacts> {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: "PUT", signal });
    if (!response.ok) throw new Error(`CDP open-url probe failed: ${response.status}`);
    return readTargetPageFacts(await response.json() as CdpPageTarget, url, signal);
  } catch (cause) {
    return unavailablePageFacts("url_unreachable", url, cause);
  }
}

async function probeProviderReadOperation(port: string, input: LocalProviderReadProbeInput): Promise<LocalProviderReadProbeResult> {
  try {
    const page = await createBlankProviderPage(port);
    if (!page.id || !page.webSocketDebuggerUrl) throw new Error("Read-operation page has no target id or CDP websocket.");
    const observation = await withCdp(page.webSocketDebuggerUrl, async (client) => {
      await client.send("Page.enable");
      await client.send("Runtime.enable");
      await client.send("Network.enable");
      await client.send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
      let blockedRedirect = false;
      const stopIntercepting = client.on("Fetch.requestPaused", (event) => {
        const requestId = typeof event.requestId === "string" ? event.requestId : "";
        const resourceType = event.resourceType;
        const request = event.request as { url?: unknown } | undefined;
        const url = typeof request?.url === "string" ? request.url : "";
        if (!requestId) return;
        if (shouldBlockReadOperationDocumentNavigation(resourceType, url, input.expected_origin)) {
          blockedRedirect = true;
          void client.send("Fetch.failRequest", { requestId, errorReason: "Aborted" }).catch(() => undefined);
          return;
        }
        void client.send("Fetch.continueRequest", { requestId }).catch(() => undefined);
      });
      let navigationStarted = false;
      let operationResponse: { requestId: string; status: number; url: string } | null = null;
      let bossDetailResponse: { requestId: string; status: number; url: string } | null = null;
      const stopObservingNetwork = client.on("Network.responseReceived", (event) => {
        const response = event.response as { url?: unknown; status?: unknown } | undefined;
        const status = typeof response?.status === "number" ? response.status : null;
        const requestId = typeof event.requestId === "string" ? event.requestId : "";
        if (navigationStarted && input.operation_id === "boss_read_job_detail" && status !== null && status >= 200 && status < 300 && requestId && isBossJobDetailWapiUrl(input, response?.url)) {
          bossDetailResponse = { requestId, status, url: response!.url as string };
        } else if (
          navigationStarted &&
          status !== null &&
          status >= 200 &&
          status < 300 &&
          requestId && isOperationReadNetworkUrl(input, response?.url)
        ) operationResponse = { requestId, status, url: response!.url as string };
      });
      navigationStarted = true;
      await client.send("Page.navigate", { url: input.target_url });
      for (let attempt = 0; attempt < 20; attempt++) {
        if (blockedRedirect) {
          stopObservingNetwork();
          stopIntercepting();
          return { blocked_redirect: true };
        }
        const evaluated = await client.send("Runtime.evaluate", {
          expression: readProbeExpression(input.site_id, input.query ?? "", input.city_code, input.operation_id),
          returnByValue: true
        });
        const value = (evaluated.result as { value?: {
          origin?: string;
          pathname?: string;
          search?: string;
          ready?: boolean;
          rendered_surface?: boolean;
          login_like?: boolean;
          challenge_like?: boolean;
          vue_ready?: boolean;
          pinia_ready?: boolean;
          list_valid?: boolean;
          list_failure?: "empty_result" | "page_not_ready" | "site_changed";
          note_count?: number;
          normalized?: ObservedDetailPublicSummary;
          detail_urls?: string[];
        } } | undefined)?.value;
        const observedResponse = operationResponse as { requestId: string; status: number; url: string } | null;
        const observedBossDetailResponse = bossDetailResponse as { requestId: string; status: number; url: string } | null;
        if (value?.origin && (value.challenge_like || value.login_like)) {
          stopObservingNetwork();
          stopIntercepting();
          return { validation: validateReadOperationProbe(input, value) };
        }
        if (value?.origin && value.ready && observedResponse !== null && (input.operation_id !== "boss_read_job_detail" || observedBossDetailResponse !== null)) {
          stopObservingNetwork();
          stopIntercepting();
          const bossResponse = input.operation_id === "boss_job_search"
            ? await readBossJobSearchResponseSummary(client, observedResponse.requestId)
            : null;
          const bossDetailSummary = input.operation_id === "boss_read_job_detail" && observedBossDetailResponse
            ? await readBossJobDetailResponseSummary(client, observedBossDetailResponse.requestId, bossDetailTargetId(input.target_url))
            : null;
          const validation = validateReadOperationProbe(input, {
            ...value,
            operation_response_status: observedResponse.status,
            operation_response_url: observedResponse.url,
            boss_response: bossResponse,
            boss_detail_response: bossDetailSummary,
            boss_detail_response_status: observedBossDetailResponse?.status,
            boss_detail_response_url: observedBossDetailResponse?.url
          });
          if (validation.status === "unavailable") return { validation };
          const screenshot = await captureProbeScreenshot(client);
          return screenshot ? {
            validation,
            screenshot_ref: screenshot.screenshot_ref
          } : { evidence_missing: true };
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      stopObservingNetwork();
      stopIntercepting();
      return null;
    }).finally(() => closeProviderPage(port, page.id!));
    const pageFacts = readOperationPageFacts(input.target_url);
    if (!observation) return probeUnavailable("page_not_ready", "The read-operation page did not reach a ready state.", true, pageFacts);
    if (observation.blocked_redirect) return probeUnavailable("origin_drift", "A cross-origin document redirect was blocked before navigation.", false, pageFacts);
    if (observation.evidence_missing) return probeUnavailable("evidence_refs_missing", "The local provider could not capture required refs-only evidence.", true, pageFacts);
    const validation = observation.validation;
    if (!validation || validation.status === "unavailable") {
      return probeUnavailable(validation?.failure_class ?? "page_not_ready", validation?.message ?? "The read-operation page did not reach a ready state.", validation?.retryable ?? true, pageFacts);
    }
    const source_refs = validation.source_kinds.map((kind) => ({ kind, ref: opaqueRef("source") }));
    const evidence_ref_kinds = [
      { kind: "snapshot_ref", ref: observation.screenshot_ref! },
      ...(input.operation_id === "boss_job_search" ? [{ kind: "network_summary_ref", ref: opaqueRef("evidence") }] : [])
    ];
    return {
      status: "completed",
      observed_at: new Date().toISOString(),
      observed_origin: input.expected_origin,
      page: pageFacts,
      source_refs,
      evidence_ref_kinds,
      public_summary_source_ref: source_refs.find((source) => source.kind === "network_summary" || source.kind === "wapi_job_detail_summary")?.ref ?? source_refs[0]!.ref,
      public_summary: validation.public_summary,
      detail_targets: validation.detail_urls?.map((canonical_url) => ({ canonical_url }))
    };
  } catch (cause) {
    return probeUnavailable(
      "network_resource_unavailable",
      cause instanceof Error ? cause.message : "The provider read-only probe failed.",
      true
    );
  }
}

function probeUnavailable(
  failure_class: Extract<LocalProviderReadProbeResult, { status: "unavailable" }>["failure_class"],
  message: string,
  retryable: boolean,
  page?: LocalProviderPageFacts
): LocalProviderReadProbeResult {
  return { status: "unavailable", failure_class, message, retryable, page };
}

interface ReadProbeObservation {
  origin?: string;
  pathname?: string;
  search?: string;
  ready?: boolean;
  rendered_surface?: boolean;
  vue_owned?: boolean;
  job_card_count?: number;
  job_cards_valid?: boolean;
  login_like?: boolean;
  challenge_like?: boolean;
  vue_ready?: boolean;
  pinia_ready?: boolean;
  list_valid?: boolean;
  list_failure?: "empty_result" | "page_not_ready" | "site_changed";
  note_count?: number;
  normalized?: ObservedDetailPublicSummary;
  detail_urls?: string[];
  operation_response_status?: number;
  operation_response_url?: string;
  boss_response?: BossJobSearchResponseSummary | BossJobSearchResponseFailure | null;
  boss_detail_response?: BossJobDetailResponseSummary | BossJobSearchResponseFailure | null;
  boss_detail_response_status?: number;
  boss_detail_response_url?: string;
  blocked_redirect?: boolean;
  evidence_missing?: boolean;
  screenshot_ref?: string;
  validation?: ReturnType<typeof validateReadOperationProbe>;
}

async function createBlankProviderPage(port: string): Promise<CdpPageTarget> {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" });
  if (!response.ok) throw new Error(`CDP read-operation target creation failed: ${response.status}`);
  return await response.json() as CdpPageTarget;
}

async function closeProviderPage(port: string, targetId: string): Promise<void> {
  const response = await fetch(`http://127.0.0.1:${port}/json/close/${encodeURIComponent(targetId)}`);
  if (!response.ok) throw new Error(`CDP read-operation target cleanup failed: ${response.status}`);
}

export function shouldBlockReadOperationDocumentNavigation(resourceType: unknown, value: string, expectedOrigin: string): boolean {
  if (resourceType !== "Document") return false;
  try {
    return new URL(value).origin !== expectedOrigin;
  } catch {
    return true;
  }
}

async function captureProbeScreenshot(client: CdpClient): Promise<LocalProviderScreenshotFacts | null> {
  try {
    const result = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
    const data = typeof result.data === "string" ? result.data : "";
    return data ? screenshotFacts(Buffer.from(data, "base64")) : null;
  } catch {
    return null;
  }
}

export function validateReadOperationProbe(
  input: LocalProviderReadProbeInput,
  observation: ReadProbeObservation
):
  | { status: "completed"; source_kinds: string[]; public_summary: LocalProviderReadProbePublicSummary; detail_urls?: string[] }
  | { status: "unavailable"; failure_class: Extract<LocalProviderReadProbeResult, { status: "unavailable" }>["failure_class"]; message: string; retryable: boolean } {
  if (observation.origin !== input.expected_origin) return { status: "unavailable", failure_class: "origin_drift", message: "The read-operation page left the pinned allowed origin.", retryable: false };
  if (observation.challenge_like) return { status: "unavailable", failure_class: "safety_challenge", message: "The read-operation page shows a verification or safety challenge.", retryable: false };
  if (observation.login_like) return { status: "unavailable", failure_class: "not_logged_in", message: "The read-operation page requires a manual login refresh.", retryable: true };
  if (!observation.ready) return { status: "unavailable", failure_class: "page_not_ready", message: "The read-operation page did not reach the expected operation surface.", retryable: true };
  if (input.operation_id === "xhs_read_note_detail" || input.operation_id === "boss_read_job_detail") {
    const xhs = input.operation_id === "xhs_read_note_detail";
    if (xhs && (!observation.vue_ready || !observation.pinia_ready)) {
      return { status: "unavailable", failure_class: "page_not_ready", message: "The Xiaohongshu detail Vue app or Pinia note store is not ready.", retryable: true };
    }
    const expectedPath = new URL(input.target_url).pathname;
    const pathMatches = observation.pathname === expectedPath;
    const rendered = observation.rendered_surface === true;
    if (!pathMatches || !rendered || !isSuccessfulReadResponse(observation.operation_response_status) || !isOperationReadNetworkUrl(input, observation.operation_response_url)) {
      return { status: "unavailable", failure_class: rendered ? "site_changed" : "empty_result", message: "The bound detail page did not expose the expected read-only surface.", retryable: true };
    }
    const normalized = validateDetailNormalizedSummary(input, observation.normalized);
    if (!normalized) return { status: "unavailable", failure_class: "field_missing", message: "Required bounded public detail fields are missing.", retryable: true };
    if (!xhs) {
      if (!isSuccessfulReadResponse(observation.boss_detail_response_status) || !isBossJobDetailWapiUrl(input, observation.boss_detail_response_url)) {
        return { status: "unavailable", failure_class: "network_resource_unavailable", message: "The bound BOSS detail WAPI response was not observed.", retryable: true };
      }
      if (!observation.boss_detail_response || observation.boss_detail_response.status === "unavailable") {
        return observation.boss_detail_response ?? { status: "unavailable", failure_class: "network_resource_unavailable", message: "The BOSS detail WAPI summary is unavailable.", retryable: true };
      }
      if (!sameBossDetailSummary(normalized, observation.boss_detail_response)) {
        return { status: "unavailable", failure_class: "site_changed", message: "The BOSS detail WAPI and rendered summary do not match.", retryable: true };
      }
    }
    return {
      status: "completed",
      source_kinds: xhs
        ? ["pinia_store_summary", "network_summary", "dom_snapshot_summary"]
        : ["wapi_job_detail_summary", "dom_snapshot_summary"],
      public_summary: {
        schema_version: "harbor-read-operation-public-summary/v0",
        operation_id: input.operation_id,
        result_kind: xhs ? "xiaohongshu_note_detail_surface" : "boss_job_detail_surface",
        surface: xhs ? "note_detail" : "job_detail",
        result_state: "operation_read_response_observed",
        response_status: observation.operation_response_status,
        normalized,
        source_signals: xhs
          ? ["pinia_note_store_ready", "xhs_note_detail_document", "xhs_note_detail_rendered"]
          : ["boss_job_detail_document"]
      }
    };
  }
  if (input.operation_id === "xhs_search_notes") {
    const xhsSurface = observation.pathname === "/search_result";
    if (!xhsSurface || !hasExactPublicQuery(observation.search, "keyword", input.query ?? "") || !observation.pinia_ready || !isSuccessfulReadResponse(observation.operation_response_status) || !isOperationReadNetworkUrl(input, observation.operation_response_url)) {
      return { status: "unavailable", failure_class: "page_not_ready", message: "Xiaohongshu search/note, Pinia, or operation-specific read signal is unavailable.", retryable: true };
    }
    const detailUrls = observation.detail_urls ?? [];
    if (observation.list_failure) {
      return { status: "unavailable", failure_class: observation.list_failure, message: "Xiaohongshu search did not expose a valid page-matched note list.", retryable: true };
    }
    if (!observation.list_valid) {
      return { status: "unavailable", failure_class: "page_not_ready", message: "Xiaohongshu search note results are not correlated with the rendered page.", retryable: true };
    }
    if (!Number.isInteger(observation.note_count) || observation.note_count! < 1 || observation.note_count! > 15 || detailUrls.length !== observation.note_count || !validXhsSearchTargets(detailUrls)) {
      return { status: "unavailable", failure_class: "site_changed", message: "Xiaohongshu search note targets do not match the expected public shape.", retryable: true };
    }
    return {
      status: "completed",
      source_kinds: ["pinia_store_summary", "network_summary", "dom_snapshot_summary"],
      public_summary: {
        schema_version: "harbor-read-operation-public-summary/v0",
        operation_id: "xhs_search_notes",
        result_kind: "xiaohongshu_search_notes_surface",
        surface: "search_result",
        result_state: "operation_read_response_observed",
        response_status: observation.operation_response_status,
        result_count: observation.note_count,
        source_signals: ["pinia_store", "xhs_search_read_network"]
      },
      detail_urls: detailUrls
    };
  }
  const bossJobsSurface = observation.pathname === "/web/geek/job";
  if (!hasExactPublicQuery(observation.search, "city", input.city_code ?? "")) {
    return { status: "unavailable", failure_class: "city_unresolved", message: "BOSS search city does not match the admitted city code.", retryable: true };
  }
  if (!bossJobsSurface || !hasExactBossSearch(observation.search, input.query ?? "", input.city_code ?? "") || !observation.rendered_surface || !isSuccessfulReadResponse(observation.operation_response_status) || !isOperationReadNetworkUrl(input, observation.operation_response_url)) {
    return { status: "unavailable", failure_class: "page_not_ready", message: "BOSS jobs surface or required WAPI read signal is unavailable.", retryable: true };
  }
  if (!observation.boss_response) return { status: "unavailable", failure_class: "site_changed", message: "BOSS WAPI response summary is unavailable.", retryable: true };
  if (observation.boss_response.status === "unavailable") return observation.boss_response;
  return {
    status: "completed",
    source_kinds: ["network_summary"],
    public_summary: {
      schema_version: "harbor-read-operation-public-summary/v0",
      operation_id: "boss_job_search",
      result_kind: "boss_job_search_surface",
      surface: "web_geek_jobs",
      result_state: "operation_read_response_observed",
      response_status: observation.operation_response_status,
      query: input.query,
      city_code: input.city_code,
      business_code: observation.boss_response.business_code,
      job_count: observation.boss_response.job_count,
      source_signals: ["boss_wapi_zpgeek_read_network"]
    },
    detail_urls: observation.boss_response.detail_urls
  };
}

function validXhsSearchTargets(values: readonly string[]): boolean {
  if (new Set(values).size !== values.length) return false;
  return values.every((value) => {
    try {
      const url = new URL(value);
      return url.origin === "https://www.xiaohongshu.com" && !url.username && !url.password && !url.search && !url.hash && /^\/explore\/[a-f0-9]{24}$/i.test(url.pathname);
    } catch {
      return false;
    }
  });
}

function isSuccessfulReadResponse(status: unknown): status is number {
  return typeof status === "number" && Number.isInteger(status) && status >= 200 && status < 300;
}

function validateDetailNormalizedSummary(
  input: LocalProviderReadProbeInput,
  value: ObservedDetailPublicSummary | undefined
): LocalProviderDetailPublicSummary | null {
  const target = new URL(input.target_url);
  const canonical_url = `${target.origin}${target.pathname}`;
  if (input.operation_id === "xhs_read_note_detail") {
    const noteId = target.pathname.split("/").filter(Boolean).at(-1) ?? "";
    if (value?.kind !== "xiaohongshu_note_detail" || value.canonical_url !== canonical_url || value.note_id !== noteId || !/^[a-f0-9]{24}$/i.test(value.note_id) ||
      !boundedText(value.title, 200) || !boundedText(value.summary, 500) || !boundedText(value.body_summary, 2000) ||
      !boundedText(value.author.display_name, 100) || !boundedText(value.author.author_id, 100) ||
      !validPublicProfileUrl(value.author.profile_url, value.author.author_id) || !validMetrics(value.interaction_metrics) ||
      (value.source_status !== "located" && value.source_status !== "partially_located")) return null;
    return {
      kind: value.kind,
      canonical_url,
      note_id: value.note_id,
      title: value.title,
      summary: value.summary,
      body_summary: value.body_summary,
      author: { display_name: value.author.display_name, author_id: value.author.author_id, profile_url: value.author.profile_url },
      interaction_metrics: { ...value.interaction_metrics },
      source_citation: {
        kind: "xhs_note_detail_ref",
        note_id: value.note_id,
        url: canonical_url,
        // Lode v0 has one aggregate citation for all validated public fields.
        field_sources: ["pinia_store_summary", "network_summary", "dom_snapshot_summary"]
      },
      source_status: value.source_status
    };
  }
  if (value?.kind !== "boss_job_detail" || value.canonical_url !== canonical_url ||
    !boundedText(value.title, 200) || !boundedText(value.summary, 500) || !boundedText(value.job.title, 200) ||
    !boundedText(value.job.description, 4000) || !boundedText(value.job.status, 100) || !optionalBoundedText(value.job.salary, 100) || !optionalBoundedText(value.job.location, 100) ||
    !boundedText(value.company.name, 200) || !boundedText(value.recruiter.name, 100) || !boundedText(value.recruiter.title, 100) ||
    (value.source_status !== "located" && value.source_status !== "partially_located")) return null;
  if (!input.detail_ref || !/^detail_ref_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.detail_ref)) return null;
  return {
    kind: value.kind,
    canonical_url,
    detail_ref: input.detail_ref,
    title: value.title,
    summary: value.summary,
    job: {
      title: value.job.title,
      description: value.job.description,
      status: value.job.status,
      ...(value.job.salary ? { salary: value.job.salary } : {}),
      ...(value.job.location ? { location: value.job.location } : {})
    },
    company: { name: value.company.name },
    recruiter: { name: value.recruiter.name, title: value.recruiter.title },
    source_citation: {
      kind: "boss_job_detail_ref",
      detail_ref: input.detail_ref,
      url: canonical_url,
      field_sources: ["wapi_job_detail_summary", "dom_snapshot_summary"]
    },
    source_status: value.source_status
  };
}

function boundedText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max && value.trim() === value && !/[\u0000-\u001f\u007f]/.test(value);
}

function optionalBoundedText(value: unknown, max: number): boolean {
  return value === undefined || boundedText(value, max);
}

function validPublicProfileUrl(value: string, authorId: string): boolean {
  return value === `https://www.xiaohongshu.com/user/profile/${authorId}` && /^[A-Za-z0-9_]+$/.test(authorId);
}

function validMetrics(value: XiaohongshuNoteDetailPublicSummary["interaction_metrics"]): boolean {
  return [value.likes, value.comments, value.collects, value.shares].every((entry) => boundedText(entry, 40));
}

function sameBossDetailSummary(value: LocalProviderDetailPublicSummary, source: BossJobDetailResponseSummary): boolean {
  return value.kind === "boss_job_detail" && value.title === source.title && value.summary === source.summary &&
    value.job.title === source.title && value.job.description === source.description && value.job.status === source.job_status &&
    value.job.salary === source.salary && value.job.location === source.location && value.company.name === source.company_name &&
    value.recruiter.name === source.recruiter_name && value.recruiter.title === source.recruiter_title;
}

export function readProbeExpression(siteId: LocalProviderReadProbeInput["site_id"], query: string, cityCode?: string, operationId?: LocalProviderReadProbeInput["operation_id"]): string {
  if (operationId === "xhs_read_note_detail" || operationId === "boss_read_job_detail") return `(() => {
    const text = document.body?.innerText || "";
    const clean = (value, max) => typeof value === "string" ? value.replace(/\\s+/g, " ").trim().slice(0, max) : "";
    const pick = (selectors, max) => clean(document.querySelector(selectors)?.textContent, max);
    const challengeSurface = typeof document.querySelectorAll === 'function' && Array.from(document.querySelectorAll('[class*="captcha"], [id*="captcha"], [class*="challenge"], [id*="challenge"], [class*="security-check"], [id*="security-check"]')).some((element) => {
      const view = document.defaultView;
      if (!view) return false;
      const style = view.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 &&
        rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < view.innerHeight && rect.left < view.innerWidth;
    });
    const challenge = /验证码|安全验证|访问异常|captcha|challenge required|verification challenge|security check|verification required|complete verification/i.test(text) || challengeSurface;
    const login = /登录后|扫码登录|手机号登录/.test(text) || Boolean(document.querySelector('.login-dialog, [class*="login"] form, [class*="login"] [class*="qrcode"]'));
    const canonicalUrl = location.origin + location.pathname;
    const rendered = ${operationId === "xhs_read_note_detail"
      ? "Boolean(document.querySelector('#detail-desc, .note-detail-mask, [class*=note-content], [class*=interaction-container]'))"
      : "Boolean(document.querySelector('.job-detail-box, .job-detail-container, [class*=job-detail], .job-sec-text'))"};
    ${operationId === "xhs_read_note_detail" ? `
    const app = document.querySelector('#app');
    const vue = app?.__vue_app__;
    const pinia = window.__PINIA__ || window.__pinia || vue?.config?.globalProperties?.$pinia;
    const stores = pinia?._s;
    const unwrap = (value) => value && typeof value === "object" && "value" in value ? value.value : value;
    const title = pick('.note-content .title, #detail-title, [class*="note-title"]', 200);
    const body = pick('#detail-desc, .note-content .desc, [class*="note-desc"]', 4000);
    const author = pick('.author-container .name, .author-wrapper .name, [class*="author"] [class*="name"]', 100);
    const authorLink = document.querySelector('a[href^="/user/profile/"], a[href*="xiaohongshu.com/user/profile/"]');
    const profilePath = authorLink ? new URL(authorLink.getAttribute('href'), location.origin).pathname : "";
    const authorId = profilePath.startsWith('/user/profile/') ? profilePath.slice('/user/profile/'.length).split('/')[0] : "";
    const profileUrl = authorId ? location.origin + '/user/profile/' + authorId : "";
    const likes = pick('[class*="like"] [class*="count"], .like-wrapper .count', 40);
    const comments = pick('[class*="comment"] [class*="count"], .comment-wrapper .count', 40);
    const collects = pick('[class*="collect"] [class*="count"], .collect-wrapper .count', 40);
    const shares = pick('[class*="share"] [class*="count"], .share-wrapper .count', 40);
    const noteId = location.pathname.split('/').filter(Boolean).at(-1) || "";
    const noteStores = stores instanceof Map ? Array.from(stores.entries()).filter(([key]) => /note|detail/i.test(String(key))) : [];
    const matchesStore = ([, candidate]) => {
      const state = unwrap(candidate?.$state) || candidate;
      const details = [unwrap(state?.currentNote), unwrap(state?.noteDetail), unwrap(state?.detail), unwrap(state?.note), state].filter((value) => value && typeof value === "object");
      return details.some((detail) => {
        const storeAuthor = unwrap(detail.author) || unwrap(detail.user) || {};
        const storeMetrics = unwrap(detail.interaction_metrics) || unwrap(detail.interactInfo) || unwrap(detail.metrics) || {};
        return clean(unwrap(detail.note_id) || unwrap(detail.noteId) || unwrap(detail.id), 64) === noteId &&
          clean(unwrap(detail.title), 200) === title && clean(unwrap(detail.body_summary) || unwrap(detail.desc) || unwrap(detail.description) || unwrap(detail.body), 4000) === body &&
          clean(unwrap(storeAuthor.display_name) || unwrap(storeAuthor.nickname) || unwrap(storeAuthor.name), 100) === author &&
          clean(unwrap(storeAuthor.author_id) || unwrap(storeAuthor.userId) || unwrap(storeAuthor.id), 100) === authorId &&
          clean(unwrap(storeMetrics.likes) || unwrap(storeMetrics.likedCount), 40) === likes &&
          clean(unwrap(storeMetrics.comments) || unwrap(storeMetrics.commentCount), 40) === comments &&
          clean(unwrap(storeMetrics.collects) || unwrap(storeMetrics.collectedCount), 40) === collects &&
          clean(unwrap(storeMetrics.shares) || unwrap(storeMetrics.shareCount), 40) === shares;
      });
    };
    const piniaReady = noteStores.some(matchesStore);
    const normalized = piniaReady && title && body && author && authorId && profileUrl && likes && comments && collects && shares && /^[A-Za-z0-9]+$/.test(noteId) ? { kind: "xiaohongshu_note_detail", canonical_url: canonicalUrl, note_id: noteId, title, summary: body.slice(0, 2000), body_summary: body, author: { display_name: author, author_id: authorId, profile_url: profileUrl }, interaction_metrics: { likes, comments, collects, shares }, source_status: "located" } : undefined;
    return { origin: location.origin, pathname: location.pathname, ready: document.readyState !== 'loading', rendered_surface: rendered, login_like: login, challenge_like: challenge, vue_ready: Boolean(vue), pinia_ready: piniaReady, normalized };`
      : `
    const title = pick('.job-name, .job-detail-box h1, [class*="job-title"]', 200);
    const description = pick('.job-sec-text, .job-detail-section, [class*="job-description"]', 4000);
    const company = pick('.company-info .name, .company-name, [class*="company"] [class*="name"]', 200);
    const recruiter = pick('.boss-name, .job-boss-info .name, [class*="recruiter"] [class*="name"]', 100);
    const recruiterTitle = pick('.boss-info-attr, .job-boss-info .boss-info-attr, [class*="recruiter"] [class*="title"]', 100);
    const salary = pick('.salary, [class*="salary"]', 100);
    const locationText = pick('.location-address, [class*="job-address"], [class*="location"]', 100);
    const status = /职位已关闭|停止招聘|已下线/.test(text) ? "closed" : "available";
    const normalized = title && description && company && recruiter && recruiterTitle ? { kind: "boss_job_detail", canonical_url: canonicalUrl, title, summary: description.slice(0, 500), job: { title, description, status, ...(salary ? { salary } : {}), ...(locationText ? { location: locationText } : {}) }, company: { name: company }, recruiter: { name: recruiter, title: recruiterTitle }, source_status: "located" } : undefined;
    return { origin: location.origin, pathname: location.pathname, ready: document.readyState !== 'loading', rendered_surface: rendered, login_like: login, challenge_like: challenge, normalized };`}
  })()`;
  if (siteId === "boss") return `(() => {
    const text = document.body?.innerText || "";
    const challengeSurface = Array.from(document.querySelectorAll('[class*="captcha"], [id*="captcha"], [class*="challenge"], [id*="challenge"], [class*="security-check"], [id*="security-check"]')).some((element) => {
      const view = document.defaultView;
      if (!view) return false;
      const style = view.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 &&
        rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < view.innerHeight && rect.left < view.innerWidth;
    });
    const challenge = /验证码|安全验证|访问异常|captcha|challenge required|verification challenge|security check|verification required|complete verification/i.test(text) || challengeSurface;
    const login = /登录后|扫码登录|手机号登录/.test(text) || location.pathname.startsWith('/web/user/') || Boolean(document.querySelector('.login-dialog, [class*="login"] form, [class*="login"] [class*="qrcode"]'));
    const app = document.querySelector('#wrap, #app');
    const vue3App = app?.__vue_app__;
    const rootComponent = app?._vnode?.component;
    const mountedElement = rootComponent?.vnode?.el || rootComponent?.subTree?.el;
    const vue3Owned = typeof vue3App?.version === 'string' &&
      typeof vue3App?.config?.globalProperties === 'object' &&
      vue3App?._container === app &&
      rootComponent === vue3App?._instance &&
      rootComponent?.appContext?.app === vue3App &&
      Boolean(mountedElement && (mountedElement === app || app.contains(mountedElement)));
    const vue2Instance = app?.__vue__;
    const vue2Owned = Boolean(vue2Instance?._isMounted === true && vue2Instance?.$root === vue2Instance && vue2Instance?.$el === app);
    const vueOwned = vue3Owned || vue2Owned;
    const list = app?.querySelector('.job-list-box, .job-list, [class*="job-list"]');
    const cards = list ? Array.from(list.querySelectorAll('.job-card-wrapper, li.job-card-box, [ka^="search_list_"]')).slice(0, 20) : [];
    const validCards = cards.length > 0 && cards.every((card) => {
      if (!app.contains(list) || !list.contains(card)) return false;
      const jobName = (card.querySelector('.job-name, .job-title, [class*="job-name"]')?.textContent || '').trim();
      const companyName = (card.querySelector('.company-name, [class*="company-name"]')?.textContent || '').trim();
      const link = card.querySelector('a[href*="/job_detail/"]');
      let validLink = false;
      try {
        const href = new URL(link?.getAttribute('href') || '', location.origin);
        validLink = href.origin === location.origin && href.pathname.startsWith('/job_detail/');
      } catch {}
      return jobName.length > 0 && jobName.length <= 200 && companyName.length > 0 && companyName.length <= 200 && validLink;
    });
    return {
      origin: location.origin,
      pathname: location.pathname,
      search: location.search,
      ready: document.readyState !== 'loading' && vueOwned && Boolean(list) && app.contains(list),
      vue_owned: vueOwned,
      rendered_surface: vueOwned && Boolean(list) && app.contains(list) && validCards,
      job_card_count: cards.length,
      job_cards_valid: validCards,
      login_like: login,
      challenge_like: challenge
    };
  })()`;
  return `(() => {
    const expectedQuery = ${JSON.stringify(query)};
    const pinia = window.__PINIA__ || window.__pinia || document.querySelector('#app')?.__vue_app__?.config?.globalProperties?.$pinia;
    const store = pinia?._s instanceof Map ? pinia._s.get("search") : undefined;
    const unwrap = (value) => value && typeof value === "object" && "value" in value ? value.value : value;
    const feeds = unwrap(store?.feeds);
    const boundedFeeds = Array.isArray(feeds) ? feeds.slice(0, 60) : [];
    const noteCandidate = (feed) => {
      const card = unwrap(feed?.noteCard) || unwrap(feed?.note_card) || {};
      const values = [unwrap(feed?.id), unwrap(feed?.noteId), unwrap(feed?.note_id), unwrap(card?.id), unwrap(card?.noteId), unwrap(card?.note_id)];
      const value = values.find((entry) => entry !== undefined && entry !== null && entry !== "");
      const noteLike = Boolean(feed?.noteCard || feed?.note_card || values.some((entry) => entry !== undefined));
      if (!noteLike) return { kind: 'other' };
      return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value)
        ? { kind: 'note', id: value.toLowerCase() }
        : { kind: 'malformed' };
    };
    const candidates = boundedFeeds.map(noteCandidate);
    const allFeedIds = candidates.filter((candidate) => candidate.kind === 'note').map((candidate) => candidate.id);
    const feedIds = allFeedIds.slice(0, 15);
    const malformedFeed = candidates.some((candidate) => candidate.kind === 'malformed');
    const duplicateFeed = new Set(allFeedIds).size !== allFeedIds.length;
    const anchors = typeof document.querySelectorAll === "function" ? Array.from(document.querySelectorAll('a[href*="/explore/"]')).slice(0, 60) : [];
    const pageTargets = new Map();
    let invalidPageTarget = false;
    let duplicatePageTarget = false;
    for (const anchor of anchors) {
      try {
        const url = new URL(anchor.getAttribute?.('href') || anchor.href || '', location.origin);
        const match = new RegExp('^/explore/([a-f0-9]{24})$', 'i').exec(url.pathname);
        if (url.origin !== location.origin || url.username || url.password || !match) {
          invalidPageTarget = true;
          continue;
        }
        const id = match[1].toLowerCase();
        if (pageTargets.has(id)) duplicatePageTarget = true;
        pageTargets.set(id, location.origin + '/explore/' + id);
      } catch { invalidPageTarget = true; }
    }
    const detailUrls = feedIds.flatMap((id) => pageTargets.has(id) ? [pageTargets.get(id)] : []);
    const structuralDrift = malformedFeed || duplicateFeed || invalidPageTarget || duplicatePageTarget;
    const listFailure = structuralDrift ? 'site_changed' : feedIds.length === 0 ? 'empty_result' : detailUrls.length === 0 ? 'page_not_ready' : undefined;
    const listValid = listFailure === undefined && detailUrls.length > 0;
    const text = document.body?.innerText || "";
    const challenge = /验证码|安全验证|访问异常|captcha|challenge required|verification challenge/i.test(text) || Boolean(document.querySelector?.('[class*="captcha"], [id*="captcha"], [class*="challenge"], [id*="challenge"]'));
    const login = /登录后|扫码登录|手机号登录/.test(text) || location.pathname.startsWith('/login') || Boolean(document.querySelector?.('.login-dialog, [class*="login"] form, [class*="login"] [class*="qrcode"]'));
    return {
      origin: location.origin,
      pathname: location.pathname,
      search: location.search,
      ready: document.readyState !== 'loading',
      pinia_ready: unwrap(store?.searchValue) === expectedQuery && Array.isArray(feeds),
      list_valid: listValid,
      list_failure: listFailure,
      note_count: listValid ? detailUrls.length : 0,
      detail_urls: detailUrls,
      login_like: login,
      challenge_like: challenge
    };
  })()`;
}

function hasExactPublicQuery(search: unknown, key: string, expected: string): boolean {
  if (typeof search !== "string") return false;
  const values = new URLSearchParams(search).getAll(key);
  return values.length === 1 && values[0] === expected;
}

function hasExactBossSearch(search: unknown, query: string, cityCode: string): boolean {
  if (typeof search !== "string") return false;
  const params = new URLSearchParams(search);
  return [...params.keys()].join(",") === "query,city" &&
    params.getAll("query").length === 1 && params.get("query") === query &&
    params.getAll("city").length === 1 && params.get("city") === cityCode;
}

function isOperationReadNetworkUrl(input: LocalProviderReadProbeInput, value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (input.operation_id === "xhs_read_note_detail" || input.operation_id === "boss_read_job_detail") return value === input.target_url;
  if (input.operation_id === "xhs_search_notes") {
    try {
      const observed = new URL(value);
      return observed.origin === "https://so.xiaohongshu.com" && observed.pathname === "/api/sns/web/v2/search/notes";
    } catch {
      return false;
    }
  }
  const expected = { pathname: "/wapi/zpgeek/search/joblist.json", query: "query" };
  const canonical = new URL(expected.pathname, input.expected_origin);
  canonical.searchParams.set(expected.query, input.query ?? "");
  canonical.searchParams.set("city", input.city_code ?? "");
  return value === canonical.href;
}

function bossJobDetailWapiUrl(targetUrl: string): string {
  const securityId = bossDetailTargetId(targetUrl);
  const url = new URL("/wapi/zpgeek/job/detail.json", "https://www.zhipin.com");
  url.searchParams.set("securityId", securityId);
  return url.href;
}

function isBossJobDetailWapiUrl(input: LocalProviderReadProbeInput, value: unknown): boolean {
  return input.operation_id === "boss_read_job_detail" && typeof value === "string" && value === bossJobDetailWapiUrl(input.target_url);
}

function bossDetailTargetId(targetUrl: string): string {
  return new URL(targetUrl).pathname.split("/").at(-1)?.replace(/\.html$/, "") ?? "";
}

interface BossJobSearchResponseSummary {
  status: "completed";
  business_code: 0;
  job_count: number;
  detail_urls?: string[];
}

interface BossJobDetailResponseSummary {
  status: "completed";
  title: string;
  summary: string;
  description: string;
  job_status: string;
  salary?: string;
  location?: string;
  company_name: string;
  recruiter_name: string;
  recruiter_title: string;
}

type BossJobSearchResponseFailure = {
  status: "unavailable";
  failure_class: "permission_denied" | "empty_result" | "site_changed" | "network_resource_unavailable";
  message: string;
  retryable: boolean;
};

const MAX_BOSS_RESPONSE_BYTES = 512 * 1024;

async function readBossJobSearchResponseSummary(client: CdpClient, requestId: string): Promise<BossJobSearchResponseSummary | BossJobSearchResponseFailure> {
  try {
    const response = await client.send("Network.getResponseBody", { requestId });
    const encoded = typeof response.body === "string" ? response.body : "";
    const bytes = response.base64Encoded === true ? Buffer.from(encoded, "base64") : Buffer.from(encoded, "utf8");
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_BOSS_RESPONSE_BYTES) return bossResponseFailure("network_resource_unavailable", "BOSS WAPI response is empty or exceeds the summary read limit.", true);
    return summarizeBossJobSearchResponse(bytes.toString("utf8"));
  } catch {
    return bossResponseFailure("network_resource_unavailable", "BOSS WAPI response summary could not be read.", true);
  }
}

async function readBossJobDetailResponseSummary(client: CdpClient, requestId: string, targetId: string): Promise<BossJobDetailResponseSummary | BossJobSearchResponseFailure> {
  try {
    const response = await client.send("Network.getResponseBody", { requestId });
    const encoded = typeof response.body === "string" ? response.body : "";
    const bytes = response.base64Encoded === true ? Buffer.from(encoded, "base64") : Buffer.from(encoded, "utf8");
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_BOSS_RESPONSE_BYTES) return bossResponseFailure("network_resource_unavailable", "BOSS detail WAPI response is empty or exceeds the summary read limit.", true);
    return summarizeBossJobDetailResponse(bytes.toString("utf8"), targetId);
  } catch {
    return bossResponseFailure("network_resource_unavailable", "BOSS detail WAPI response summary could not be read.", true);
  }
}

export function summarizeBossJobDetailResponse(body: string, targetId: string): BossJobDetailResponseSummary | BossJobSearchResponseFailure {
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return bossResponseFailure("site_changed", "BOSS detail WAPI response is not valid JSON.", true);
  }
  if (!isPlainRecord(value) || value.code !== 0) return bossResponseFailure("permission_denied", "BOSS detail WAPI rejected the read request.", false);
  const zpData = isPlainRecord(value.zpData) ? value.zpData : null;
  const job = zpData && isPlainRecord(zpData.jobInfo) ? zpData.jobInfo : null;
  const company = zpData && isPlainRecord(zpData.brandComInfo) ? zpData.brandComInfo : null;
  const recruiter = zpData && isPlainRecord(zpData.bossInfo) ? zpData.bossInfo : null;
  if (!zpData || !job || !company || !recruiter) return bossResponseFailure("site_changed", "BOSS detail WAPI public summary shape is unavailable.", true);
  const internalIds = [zpData.securityId, zpData.encryptJobId, job.securityId, job.encryptJobId].filter((entry): entry is string => typeof entry === "string");
  if (!/^[A-Za-z0-9_-]+$/.test(targetId) || !internalIds.includes(targetId)) return bossResponseFailure("site_changed", "BOSS detail WAPI target binding does not match the selected result.", false);
  const title = publicResponseText(job.jobName ?? job.title, 200);
  const description = publicResponseText(job.postDescription ?? job.description ?? job.jobDescription, 4000);
  const job_status = publicResponseText(job.jobStatus ?? job.status, 100);
  const company_name = publicResponseText(company.brandName ?? company.name, 200);
  const recruiter_name = publicResponseText(recruiter.name ?? recruiter.bossName, 100);
  const recruiter_title = publicResponseText(recruiter.title ?? recruiter.bossTitle, 100);
  if (!title || !description || !job_status || !company_name || !recruiter_name || !recruiter_title) return bossResponseFailure("site_changed", "BOSS detail WAPI required public fields are unavailable.", true);
  const salary = publicResponseText(job.salaryDesc ?? job.salary, 100);
  const location = publicResponseText(job.locationName ?? job.location, 100);
  return {
    status: "completed",
    title,
    summary: description.slice(0, 500),
    description,
    job_status,
    ...(salary ? { salary } : {}),
    ...(location ? { location } : {}),
    company_name,
    recruiter_name,
    recruiter_title
  };
}

function publicResponseText(value: unknown, max: number): string | null {
  if (typeof value !== "string" || /[\u0000-\u001f\u007f]/.test(value)) return null;
  const normalized = value.replace(/\s+/g, " ").trim().slice(0, max);
  return normalized || null;
}

export function summarizeBossJobSearchResponse(body: string): BossJobSearchResponseSummary | BossJobSearchResponseFailure {
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return bossResponseFailure("site_changed", "BOSS WAPI response is not valid JSON.", true);
  }
  if (!isPlainRecord(value) || value.code !== 0) return bossResponseFailure("permission_denied", "BOSS WAPI rejected the read request.", false);
  const zpData = isPlainRecord(value.zpData) ? value.zpData : null;
  if (!zpData || !Array.isArray(zpData.jobList)) return bossResponseFailure("site_changed", "BOSS WAPI job list shape is unavailable.", true);
  const jobCount = zpData.jobList.filter(isPlainRecord).length;
  if (jobCount === 0) return bossResponseFailure("empty_result", "BOSS WAPI returned no jobs for the bound query and city.", false);
  const detail_urls = zpData.jobList.filter(isPlainRecord).slice(0, 15).flatMap((job) => {
    const securityId = typeof job.securityId === "string" ? job.securityId : typeof job.encryptJobId === "string" ? job.encryptJobId : "";
    return /^[A-Za-z0-9_-]+$/.test(securityId) ? [`https://www.zhipin.com/job_detail/${securityId}.html`] : [];
  });
  return detail_urls.length > 0
    ? { status: "completed", business_code: 0, job_count: jobCount, detail_urls }
    : { status: "completed", business_code: 0, job_count: jobCount };
}

function bossResponseFailure(failure_class: BossJobSearchResponseFailure["failure_class"], message: string, retryable: boolean): BossJobSearchResponseFailure {
  return { status: "unavailable", failure_class, message, retryable };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readOperationPageFacts(targetUrl: string): LocalProviderPageFacts {
  const evidence_ref = opaqueRef("validation");
  return {
    current_url: targetUrl,
    title: null,
    status: "ready",
    facts: [
      { key: "page.current_url", source: "observed", value: targetUrl, evidence_ref },
      { key: "page.title", source: "observed", value: "not_read", evidence_ref },
      { key: "page.status", source: "validation_evidence", value: "operation_probe_ready", evidence_ref }
    ]
  };
}

async function readPageFacts(port: string, requested_url: string, signal?: AbortSignal): Promise<LocalProviderPageFacts> {
  try {
    const page = selectPage(await pageTargets(port, signal), requested_url);
    return readTargetPageFacts(page, requested_url, signal);
  } catch (cause) {
    return unavailablePageFacts("cdp_unavailable", requested_url, cause);
  }
}

async function readTargetPageFacts(page: CdpPageTarget | undefined, requested_url: string, signal?: AbortSignal): Promise<LocalProviderPageFacts> {
  let observed: { title: string; url: string } | null = null;
  if (page?.webSocketDebuggerUrl) {
    try {
      observed = await readPageTitle(page.webSocketDebuggerUrl, requested_url, signal);
    } catch {
      // Page-list facts remain useful for login/challenge handoff when a page target rejects deeper CDP commands.
    }
  }
  return readyPage(observed?.url ?? page?.url ?? requested_url, observed?.title ?? page?.title ?? null);
}

async function captureProviderScreenshot(port: string, requested_url: string): Promise<LocalProviderScreenshotFacts | RuntimeErrorFact> {
  try {
    const page = await activePage(port, requested_url);
    if (!page.webSocketDebuggerUrl) return error("cdp_unavailable", "Active page has no CDP websocket.", true);
    const data = await withCdp(page.webSocketDebuggerUrl, async (client) => {
      await client.send("Page.bringToFront");
      await client.send("Page.enable");
      const result = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
      return String(result.data ?? "");
    });
    return screenshotFacts(Buffer.from(data, "base64"));
  } catch (cause) {
    return error("cdp_unavailable", cause instanceof Error ? cause.message : "Unable to capture screenshot.", true);
  }
}

async function activePage(port: string, requested_url: string, signal?: AbortSignal): Promise<CdpPageTarget> {
  const page = selectPage(await pageTargets(port, signal), requested_url);
  if (!page) throw new Error("CDP page target is unavailable.");
  return page;
}

async function pageTargets(port: string, signal?: AbortSignal): Promise<CdpPageTarget[]> {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal });
  if (!response.ok) throw new Error(`CDP page-list probe failed: ${response.status}`);
  return (await response.json()) as CdpPageTarget[];
}

function selectPage(pages: CdpPageTarget[], requested_url?: string) {
  return pages.find((candidate) => candidate.type === "page" && candidate.url === requested_url) ??
    pages.find((candidate) => candidate.type === "page" && candidate.webSocketDebuggerUrl) ??
    pages.find((candidate) => candidate.type === "page") ??
    pages[0];
}

async function readPageTitle(webSocketUrl: string, requested_url: string, signal?: AbortSignal): Promise<{ title: string; url: string } | null> {
  return withCdp(webSocketUrl, async (client) => {
    await client.send("Runtime.enable");
    for (let attempt = 0; attempt < 20; attempt++) {
      const result = await client.send("Runtime.evaluate", {
        expression: "({ title: document.title, url: location.href, readyState: document.readyState })",
        returnByValue: true
      });
      const value = (result.result as { value?: { title?: string; url?: string; readyState?: string } } | undefined)?.value;
      const url = value?.url ?? "";
      const navigated = url === requested_url || (url !== "" && url !== "about:blank");
      if (navigated && (value?.title || value?.readyState === "complete")) return { title: value.title ?? "", url };
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return null;
  }, signal);
}

async function withCdp<T>(webSocketUrl: string, callback: (client: CdpClient) => Promise<T>, signal?: AbortSignal): Promise<T> {
  const ws = new WebSocket(webSocketUrl);
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      ws.removeEventListener("open", onOpen);
      ws.removeEventListener("error", onError);
    };
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const onAbort = () => {
      ws.close();
      finish(new Error("CDP probe aborted."));
    };
    const onOpen = () => finish();
    const onError = () => finish(new Error("CDP websocket connection failed."));
    const timer = setTimeout(() => {
      ws.close();
      finish(new Error("Timed out connecting to CDP websocket."));
    }, 5000);
    ws.addEventListener("open", onOpen, { once: true });
    ws.addEventListener("error", onError, { once: true });
    if (signal?.aborted) onAbort();
    else signal?.addEventListener("abort", onAbort, { once: true });
  });
  const client = new CdpClient(ws, signal);
  try {
    return await callback(client);
  } finally {
    client.dispose();
    ws.close();
  }
}

class CdpClient {
  private nextId = 1;
  private readonly pending = new Map<number, {
    resolve: (result: Record<string, unknown>) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }>();
  private readonly listeners = new Map<string, Set<(params: Record<string, unknown>) => void>>();

  constructor(private readonly ws: WebSocket, private readonly signal?: AbortSignal) {
    ws.addEventListener("message", this.handleMessage);
    signal?.addEventListener("abort", this.handleAbort, { once: true });
  }

  on(method: string, listener: (params: Record<string, unknown>) => void): () => void {
    const listeners = this.listeners.get(method) ?? new Set();
    listeners.add(listener);
    this.listeners.set(method, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) this.listeners.delete(method);
    };
  }

  send(method: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    if (this.signal?.aborted) return Promise.reject(new Error(`CDP command aborted: ${method}`));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP command timed out: ${method}`));
      }, 20000);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  private readonly handleMessage = (event: MessageEvent) => {
    const text = typeof event.data === "string" ? event.data : Buffer.from(event.data as ArrayBuffer).toString("utf8");
    const payload = JSON.parse(text) as { id?: number; method?: string; params?: Record<string, unknown>; result?: Record<string, unknown>; error?: { message?: string } };
    if (payload.id !== undefined) {
      const pending = this.pending.get(payload.id);
      if (!pending) return;
      this.pending.delete(payload.id);
      clearTimeout(pending.timer);
      if (payload.error) pending.reject(new Error(payload.error.message ?? "CDP command failed."));
      else pending.resolve(payload.result ?? {});
      return;
    }
    if (!payload.method) return;
    for (const listener of this.listeners.get(payload.method) ?? []) listener(payload.params ?? {});
  };

  private readonly handleAbort = () => {
    for (const [id, pending] of this.pending) {
      this.pending.delete(id);
      clearTimeout(pending.timer);
      pending.reject(new Error("CDP probe aborted."));
    }
    this.ws.close();
  };

  dispose(): void {
    this.signal?.removeEventListener("abort", this.handleAbort);
    this.ws.removeEventListener("message", this.handleMessage);
    this.handleAbort();
  }
}

function fixtureScreenshot(seed: string): LocalProviderScreenshotFacts {
  return screenshotFacts(Buffer.from(`fixture screenshot for ${seed}`, "utf8"));
}

function screenshotFacts(bytes: Buffer): LocalProviderScreenshotFacts {
  const evidence_ref = opaqueRef("validation");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  return {
    screenshot_ref: opaqueRef("screenshot"),
    mime_type: "image/png",
    byte_length: bytes.byteLength,
    sha256,
    captured_at: new Date().toISOString(),
    facts: [
      { key: "screenshot.capture", source: "validation_evidence", value: "ready", evidence_ref },
      { key: "screenshot.mime_type", source: "observed", value: "image/png", evidence_ref },
      { key: "screenshot.byte_length", source: "observed", value: String(bytes.byteLength), evidence_ref },
      { key: "screenshot.sha256", source: "validation_evidence", value: sha256, evidence_ref }
    ]
  };
}

function unavailablePageFacts(code: RuntimeErrorCode, requested_url: string, cause: unknown): LocalProviderPageFacts {
  const current_error = error(code, cause instanceof Error ? cause.message : `Unable to open ${requested_url}.`, true);
  return {
    current_url: null,
    title: null,
    status: "unavailable",
    error: current_error,
    facts: [
      { key: "page.current_url", source: "observed", value: "unavailable" },
      { key: "page.title", source: "observed", value: "unavailable" },
      { key: "page.status", source: "observed", value: code }
    ]
  };
}

async function closeBrowser(child: ChildProcess, profileDir: string, removeProfileDir: boolean): Promise<void> {
  if (!hasExited(child)) child.kill("SIGTERM");
  await waitForExit(child, 1000);
  if (!hasExited(child)) child.kill("SIGKILL");
  await waitForExit(child, 500);
  if (removeProfileDir) await rm(profileDir, { force: true, maxRetries: 10, recursive: true, retryDelay: 100 });
}

async function waitForExit(child: ChildProcess, timeoutMs: number): Promise<void> {
  if (hasExited(child)) return;
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function hasExited(child: ChildProcess): boolean {
  return child.exitCode !== null || child.signalCode !== null;
}
