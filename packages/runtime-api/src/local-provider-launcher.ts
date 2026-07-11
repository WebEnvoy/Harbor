import { spawn, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { chmod, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import {
  bindIdentityEnvironmentDefaultProvider,
  classifyLaunchFailure,
  diagnoseBrowserProviderFailure,
  type IdentityEnvironmentProviderBinding
} from "./provider-management.js";
import { opaqueRef } from "./refs.js";
import { trustLocalProviderReadProbe } from "./read-operation-probe-trust.js";
import type {
  LocalProviderLaunchInput,
  LocalProviderLauncher,
  LocalProviderLaunchResult,
  LocalProviderPageFacts,
  LocalProviderReadProbeInput,
  LocalProviderReadProbeResult,
  LocalProviderReadProbePublicSummary,
  LocalProviderScreenshotFacts,
  RuntimeErrorCode,
  RuntimeErrorFact,
  RuntimeFact
} from "./runtime-session-types.js";

type CdpPageTarget = { id?: string; type?: string; webSocketDebuggerUrl?: string; url?: string; title?: string };

export async function launchLocalDedicatedProvider(input: LocalProviderLaunchInput): Promise<LocalProviderLaunchResult> {
  const explicitBrowserPath = input.browser_path || process.env.HARBOR_BROWSER_PATH || "";
  const providerBinding = explicitBrowserPath ? null : bindIdentityEnvironmentDefaultProvider();
  const browserPath = explicitBrowserPath || providerBinding?.selected_provider?.install.path || "";
  if (!browserPath) {
    const diagnostic = providerBinding?.diagnostics[0] ?? diagnoseBrowserProviderFailure({ provider_id: "cloakbrowser", failure_class: "not_installed" });
    return unavailable("provider_unavailable", diagnostic.app_summary, providerBindingFacts(providerBinding));
  }
  const profileStorage = await prepareProfileStorage(input.profile_storage_ref);
  const args = [
    "--remote-debugging-port=0",
    `--user-data-dir=${profileStorage.profileDir}`,
    "--no-default-browser-check",
    "--no-first-run",
    ...(input.headless ? ["--headless=new"] : []),
    input.url
  ];
  await removeStaleDevtoolsPort(profileStorage.profileDir);
  const child = spawn(browserPath, args, { stdio: "ignore" });
  try {
    const port = await waitForDevtoolsPort(profileStorage.profileDir, input.timeout_ms);
    const version = await fetchVersion(port);
    const page = await readPageFacts(port, input.url);
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
        ...profileStorage.facts,
        { key: "browser.launch", source: "observed", value: "ready", evidence_ref },
        { key: "cdp.version", source: "validation_evidence", value: `${version.Browser} ${version["Protocol-Version"]}`, evidence_ref },
        ...page.facts
      ],
      openUrl: async (url) => {
        const nextPage = await openProviderUrl(port, url);
        currentUrl = nextPage.current_url ?? url;
        return nextPage;
      },
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
      provider_id: providerBinding?.selected_provider_id ?? "cloakbrowser",
      failure_class: classifyLaunchFailure(error),
      path: browserPath,
      message: error instanceof Error ? error.message : "Browser launch failed."
    });
    return unavailable("launch_failed", diagnostic.app_summary, [...providerBindingFacts(providerBinding), ...profileStorage.facts]);
  }
}

export function createFixtureLauncher(status: "ready" | "unavailable" | "profile_locked" | "session_lost" = "ready"): LocalProviderLauncher {
  return async (input) => {
    if (status === "unavailable") return unavailable("provider_unavailable", "Fixture provider unavailable.");
    if (status === "profile_locked") return unavailable("profile_locked", "Fixture profile is locked by another local browser process.");
    if (status === "session_lost") return unavailable("session_lost", "Fixture Runtime Session was lost before validation could complete.");
    const evidence_ref = opaqueRef("validation");
    const page = readyPage(input.url, `Fixture page for ${input.url}`);
    return {
      status: "ready",
      execution_surface: "fixture",
      cdp_ref: opaqueRef("cdp"),
      viewer_entry: viewerEntry(input.headless),
      page,
      facts: [
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

async function prepareProfileStorage(profileStorageRef: string | undefined): Promise<{
  profileDir: string;
  persistent: boolean;
  facts: RuntimeFact[];
}> {
  if (!profileStorageRef) {
    return {
      profileDir: await mkdtemp(join(tmpdir(), "harbor-profile-")),
      persistent: false,
      facts: [{ key: "profile.storage_scope", source: "configured", value: "ephemeral" }]
    };
  }

  const storageRoot = process.env.HARBOR_PROFILE_STORAGE_ROOT || join(homedir(), ".webenvoy", "harbor", "profiles");
  const storageId = createHash("sha256").update(profileStorageRef).digest("hex").slice(0, 32);
  const profileDir = join(storageRoot, storageId);
  await mkdir(profileDir, { recursive: true, mode: 0o700 });
  await chmod(profileDir, 0o700);
  return {
    profileDir,
    persistent: true,
    facts: [
      { key: "profile.storage_scope", source: "configured", value: "persistent_ref" },
      { key: "profile.storage_ref.bound", source: "configured", value: "redacted_ref" }
    ]
  };
}

async function waitForDevtoolsPort(profileDir: string, timeoutMs: number): Promise<string> {
  const portFile = join(profileDir, "DevToolsActivePort");
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const [port] = (await readFile(portFile, "utf8")).trim().split("\n");
      if (port) return port;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error("Timed out waiting for local browser CDP readiness.");
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

async function fetchVersion(port: string): Promise<Record<string, string>> {
  const response = await fetch(`http://127.0.0.1:${port}/json/version`);
  if (!response.ok) throw new Error(`CDP readiness probe failed: ${response.status}`);
  return (await response.json()) as Record<string, string>;
}

async function openProviderUrl(port: string, url: string): Promise<LocalProviderPageFacts> {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
    if (!response.ok) throw new Error(`CDP open-url probe failed: ${response.status}`);
    return readTargetPageFacts(await response.json() as CdpPageTarget, url);
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
      let operationResponse: { status: number; url: string } | null = null;
      const stopObservingNetwork = client.on("Network.responseReceived", (event) => {
        const response = event.response as { url?: unknown; status?: unknown } | undefined;
        const status = typeof response?.status === "number" ? response.status : null;
        if (
          navigationStarted &&
          status !== null &&
          status >= 200 &&
          status < 300 &&
          isOperationReadNetworkUrl(input, response?.url)
        ) operationResponse = { status, url: response!.url as string };
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
          expression: readProbeExpression(input.site_id, input.query),
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
          pinia_ready?: boolean;
        } } | undefined)?.value;
        const observedResponse = operationResponse as { status: number; url: string } | null;
        if (value?.origin && value.ready && observedResponse !== null) {
          stopObservingNetwork();
          stopIntercepting();
          const validation = validateReadOperationProbe(input, { ...value, operation_response_status: observedResponse.status, operation_response_url: observedResponse.url });
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
      public_summary_source_ref: source_refs.find((source) => source.kind === "network_summary")?.ref ?? source_refs[0]!.ref,
      public_summary: validation.public_summary
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
  login_like?: boolean;
  challenge_like?: boolean;
  pinia_ready?: boolean;
  operation_response_status?: number;
  operation_response_url?: string;
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
  | { status: "completed"; source_kinds: string[]; public_summary: LocalProviderReadProbePublicSummary }
  | { status: "unavailable"; failure_class: Extract<LocalProviderReadProbeResult, { status: "unavailable" }>["failure_class"]; message: string; retryable: boolean } {
  if (observation.origin !== input.expected_origin) return { status: "unavailable", failure_class: "origin_drift", message: "The read-operation page left the pinned allowed origin.", retryable: false };
  if (observation.challenge_like) return { status: "unavailable", failure_class: "safety_challenge", message: "The read-operation page shows a verification or safety challenge.", retryable: false };
  if (observation.login_like) return { status: "unavailable", failure_class: "not_logged_in", message: "The read-operation page requires a manual login refresh.", retryable: true };
  if (!observation.ready) return { status: "unavailable", failure_class: "page_not_ready", message: "The read-operation page did not reach the expected operation surface.", retryable: true };
  if (input.operation_id === "xhs_search_notes") {
    const xhsSurface = observation.pathname === "/search_result";
    if (!xhsSurface || !hasExactPublicQuery(observation.search, "keyword", input.query) || !observation.pinia_ready || !isSuccessfulReadResponse(observation.operation_response_status) || !isOperationReadNetworkUrl(input, observation.operation_response_url)) {
      return { status: "unavailable", failure_class: "page_not_ready", message: "Xiaohongshu search/note, Pinia, or operation-specific read signal is unavailable.", retryable: true };
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
        source_signals: ["pinia_store", "xhs_search_read_network"]
      }
    };
  }
  const bossJobsSurface = observation.pathname === "/web/geek/jobs";
  if (!bossJobsSurface || !isSuccessfulReadResponse(observation.operation_response_status) || !isOperationReadNetworkUrl(input, observation.operation_response_url)) {
    return { status: "unavailable", failure_class: "page_not_ready", message: "BOSS jobs surface or required WAPI read signal is unavailable.", retryable: true };
  }
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
      source_signals: ["boss_wapi_zpgeek_read_network"]
    }
  };
}

function isSuccessfulReadResponse(status: unknown): status is number {
  return typeof status === "number" && Number.isInteger(status) && status >= 200 && status < 300;
}

export function readProbeExpression(_siteId: LocalProviderReadProbeInput["site_id"], query: string): string {
  return `(() => {
    const expectedQuery = ${JSON.stringify(query)};
    const pinia = window.__PINIA__ || window.__pinia || document.querySelector('#app')?.__vue_app__?.config?.globalProperties?.$pinia;
    const store = pinia?._s instanceof Map ? pinia._s.get("search") : undefined;
    const unwrap = (value) => value && typeof value === "object" && "value" in value ? value.value : value;
    return {
      origin: location.origin,
      pathname: location.pathname,
      search: location.search,
      ready: true,
      pinia_ready: unwrap(store?.searchValue) === expectedQuery && Array.isArray(unwrap(store?.feeds))
    };
  })()`;
}

function hasExactPublicQuery(search: unknown, key: string, expected: string): boolean {
  if (typeof search !== "string") return false;
  const values = new URLSearchParams(search).getAll(key);
  return values.length === 1 && values[0] === expected;
}

function isOperationReadNetworkUrl(input: LocalProviderReadProbeInput, value: unknown): boolean {
  if (typeof value !== "string") return false;
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
  canonical.searchParams.set(expected.query, input.query);
  return value === canonical.href;
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

async function readPageFacts(port: string, requested_url: string): Promise<LocalProviderPageFacts> {
  try {
    const page = selectPage(await pageTargets(port), requested_url);
    return readTargetPageFacts(page, requested_url);
  } catch (cause) {
    return unavailablePageFacts("cdp_unavailable", requested_url, cause);
  }
}

async function readTargetPageFacts(page: CdpPageTarget | undefined, requested_url: string): Promise<LocalProviderPageFacts> {
  const observed = page?.webSocketDebuggerUrl ? await readPageTitle(page.webSocketDebuggerUrl, requested_url) : null;
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

async function activePage(port: string, requested_url: string): Promise<CdpPageTarget> {
  const page = selectPage(await pageTargets(port), requested_url);
  if (!page) throw new Error("CDP page target is unavailable.");
  return page;
}

async function pageTargets(port: string): Promise<CdpPageTarget[]> {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`);
  if (!response.ok) throw new Error(`CDP page-list probe failed: ${response.status}`);
  return (await response.json()) as CdpPageTarget[];
}

function selectPage(pages: CdpPageTarget[], requested_url?: string) {
  return pages.find((candidate) => candidate.type === "page" && candidate.url === requested_url) ??
    pages.find((candidate) => candidate.type === "page" && candidate.webSocketDebuggerUrl) ??
    pages.find((candidate) => candidate.type === "page") ??
    pages[0];
}

async function readPageTitle(webSocketUrl: string, requested_url: string): Promise<{ title: string; url: string } | null> {
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
  });
}

async function withCdp<T>(webSocketUrl: string, callback: (client: CdpClient) => Promise<T>): Promise<T> {
  const ws = new WebSocket(webSocketUrl);
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out connecting to CDP websocket.")), 5000);
    ws.addEventListener("open", () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
    ws.addEventListener("error", () => {
      clearTimeout(timer);
      reject(new Error("CDP websocket connection failed."));
    }, { once: true });
  });
  try {
    return await callback(new CdpClient(ws));
  } finally {
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

  constructor(private readonly ws: WebSocket) {
    ws.addEventListener("message", this.handleMessage);
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
