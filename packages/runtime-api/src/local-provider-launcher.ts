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
import { publicReadOperationTargetUrl } from "./read-operation.js";
import { trustLocalProviderReadProbe, trustLocalProviderSiteResourceProbe, trustLocalProviderWritePrecheckProbe } from "./read-operation-probe-trust.js";
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
import type { LocalProviderWritePrecheckProbeInput, LocalProviderWritePrecheckProbeResult } from "./runtime-session-types.js";

type CdpPageTarget = { id?: string; type?: string; webSocketDebuggerUrl?: string; url?: string; title?: string };
type ObservedDetailPublicSummary = Omit<XiaohongshuNoteDetailPublicSummary, "source_citation"> | Omit<BossJobDetailPublicSummary, "detail_ref" | "source_citation">;
type ProviderReadOperationOutcome = { result: LocalProviderReadProbeResult; target_id?: string; target_retained: boolean };
type ProviderPageBinding = { targetId: string | null | undefined; requestedUrl: string; page: LocalProviderPageFacts };

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
  const reusingActiveBrowser = await removeStaleDevtoolsPort(profileStorage.profileDir);
  const child = spawn(browserPath, args, { stdio: "ignore" });
  const launchDeadline = Date.now() + Math.max(1, input.timeout_ms);
  try {
    const port = await waitForDevtoolsPort(profileStorage.profileDir, launchDeadline);
    const readbackSignal = AbortSignal.timeout(remainingLaunchTime(launchDeadline));
    const version = await fetchVersion(port, readbackSignal);
    const ownedTargetIds = new Set<string>();
    let currentTargetId: string | null | undefined = profileStorage.persistent ? null : undefined;
    const rememberTarget = (targetId: string) => {
      currentTargetId = targetId;
      ownedTargetIds.add(targetId);
    };
    const page = reusingActiveBrowser
      ? await openProviderUrl(port, input.url, readbackSignal, rememberTarget)
      : await readPageFacts(port, input.url, readbackSignal, profileStorage.persistent, (targetId) => { currentTargetId = targetId; });
    let currentUrl = page.current_url ?? input.url;
    let currentRequestedUrl = input.url;
    let currentPage = page;
    let retainedXhsSearchTargetId: string | undefined;
    let xhsReturnBinding: ProviderPageBinding | undefined;
    let readOperationTail = Promise.resolve();
    const closeTrackedTarget = async (targetId: string): Promise<boolean> => {
      ownedTargetIds.add(targetId);
      try {
        await closeProviderPage(port, targetId);
        ownedTargetIds.delete(targetId);
        return true;
      } catch {
        return false;
      }
    };
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
        let openedTargetId: string | null | undefined = profileStorage.persistent ? null : undefined;
        const nextPage = await openProviderUrl(port, url, AbortSignal.timeout(Math.max(1, input.timeout_ms)), (targetId) => {
          openedTargetId = targetId;
          if (reusingActiveBrowser) ownedTargetIds.add(targetId);
        });
        currentTargetId = openedTargetId;
        currentUrl = nextPage.current_url ?? url;
        currentRequestedUrl = url;
        currentPage = nextPage;
        return nextPage;
      },
      probeSiteResource: trustLocalProviderSiteResourceProbe((probe) => probeProviderSiteResource(port, currentUrl, probe, undefined, currentTargetId)),
      probeReadOperation: trustLocalProviderReadProbe(async (probe) => {
        const previous = readOperationTail;
        let release!: () => void;
        readOperationTail = new Promise<void>((resolve) => { release = resolve; });
        await previous;
        try {
          if (probe.operation_id === "xhs_search_notes" && retainedXhsSearchTargetId) {
            if (!await closeTrackedTarget(retainedXhsSearchTargetId)) {
              return probeUnavailable("network_resource_unavailable", "The previous search target could not be closed safely.", true);
            }
            retainedXhsSearchTargetId = undefined;
            const restored = await restoreProviderBinding(port, xhsReturnBinding);
            currentTargetId = restored.targetId;
            currentUrl = restored.page.current_url ?? restored.requestedUrl;
            currentRequestedUrl = restored.requestedUrl;
            currentPage = restored.page;
            xhsReturnBinding = undefined;
          }
          if (probe.operation_id === "xhs_search_notes") {
            xhsReturnBinding = { targetId: currentTargetId, requestedUrl: currentRequestedUrl, page: currentPage };
          }
          const outcome = await probeProviderReadOperation(port, probe, retainedXhsSearchTargetId, (targetId) => {
            ownedTargetIds.add(targetId);
          }, closeTrackedTarget);
          if (probe.operation_id === "xhs_search_notes" && outcome.target_retained && outcome.target_id && outcome.result.page) {
            retainedXhsSearchTargetId = outcome.target_id;
            currentTargetId = outcome.target_id;
            currentUrl = outcome.result.page.current_url ?? probe.target_url;
            currentRequestedUrl = publicReadOperationTargetUrl(probe.operation_id, probe.target_url);
            currentPage = outcome.result.page;
            return { ...outcome.result, session_page: { requested_url: currentRequestedUrl, page: currentPage } };
          }
          if (probe.operation_id === "xhs_search_notes") xhsReturnBinding = undefined;
          if (probe.operation_id === "xhs_read_note_detail") {
            retainedXhsSearchTargetId = undefined;
            const restored = await restoreProviderBinding(port, xhsReturnBinding);
            currentTargetId = restored.targetId;
            currentUrl = restored.page.current_url ?? restored.requestedUrl;
            currentRequestedUrl = restored.requestedUrl;
            currentPage = restored.page;
            xhsReturnBinding = undefined;
            return { ...outcome.result, session_page: { requested_url: currentRequestedUrl, page: currentPage } };
          }
          return { ...outcome.result, session_page: null };
        } finally {
          release();
        }
      }),
      probeWritePrecheck: trustLocalProviderWritePrecheckProbe((probe) => probeProviderWritePrecheck(port, currentUrl, probe, currentTargetId)),
      captureScreenshot: () => captureProviderScreenshot(port, currentUrl, currentTargetId),
      close: async () => {
        if (retainedXhsSearchTargetId) await closeTrackedTarget(retainedXhsSearchTargetId);
        for (const targetId of [...ownedTargetIds]) await closeTrackedTarget(targetId);
        await closeBrowser(child, profileStorage.profileDir, !profileStorage.persistent);
      }
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

type WritePrecheckObservation = {
  url?: string;
  origin?: string;
  pathname?: string;
  challenge_like?: boolean;
  login_like?: boolean;
  creator_app_owned?: boolean;
  creator_root_count?: number;
  upload_image_tab_active?: boolean;
  upload_image_entry_visible?: boolean;
  text_image_entry_visible?: boolean;
};

export function validateXhsWritePrecheckObservation(input: LocalProviderWritePrecheckProbeInput, observation: WritePrecheckObservation | undefined): LocalProviderWritePrecheckProbeResult {
  if (!observation) return writePrecheckUnavailable("page_changed", "The creator page returned no public semantic observation.");
  if (observation.challenge_like) return writePrecheckUnavailable("safety_challenge", "The creator page shows a safety challenge.", false);
  if (observation.login_like) return writePrecheckUnavailable("login_required", "The creator page requires manual login.");
  if (observation.origin !== input.expected_origin || observation.pathname !== "/publish/publish" || observation.url !== input.target_url) return writePrecheckUnavailable("page_changed", "The current page is not the exact requested creator publish page.");
  if (!observation.creator_app_owned || observation.creator_root_count !== 1 || !observation.upload_image_tab_active || !observation.upload_image_entry_visible || !observation.text_image_entry_visible) {
    return writePrecheckUnavailable("target_not_writable", "The creator publish entrypoint or its visible image/text entry controls are unavailable.", false);
  }
  const pageSource = opaqueRef("source");
  const domSource = opaqueRef("source");
  return {
    status: "completed", observed_at: new Date().toISOString(), observed_url: input.target_url,
    page: readyPage(input.target_url, "Xiaohongshu creator publish precheck"),
    source_refs: [{ kind: "creator_publish_page_summary", ref: pageSource }, { kind: "dom_snapshot_summary", ref: domSource }],
    evidence_ref_kinds: [{ kind: "snapshot_ref", ref: opaqueRef("evidence") }],
    classification: "partial_result",
    precheck_scope: "entrypoint_only",
    composition_state: "composition_not_initialized",
    entrypoint_observations: {
      route_loaded: true,
      publish_vue_container_visible: true,
      upload_image_tab_active: true,
      upload_image_entry_visible: true,
      text_image_entry_visible: true
    },
    field_states: {
      title_input: { availability: "unavailable", observation: "not_observed" },
      content_editor: { availability: "unavailable", observation: "not_observed" },
      publish_control: { availability: "unavailable", observation: "not_observed" }
    },
    prohibited_actions_observed: { upload: false, generate: false, save: false, publish: false },
    target_ref: input.target_ref
  };
}

async function probeProviderWritePrecheck(port: string, currentUrl: string, input: LocalProviderWritePrecheckProbeInput, targetId?: string | null): Promise<LocalProviderWritePrecheckProbeResult> {
  try {
    if (currentUrl !== input.target_url) return writePrecheckUnavailable("page_changed", "The managed session is not on the requested creator publish page.");
    const page = await activePage(port, currentUrl, AbortSignal.timeout(3000), targetId);
    if (!page.webSocketDebuggerUrl) return writePrecheckUnavailable("provider_probe_unavailable", "The creator page has no controlled CDP target.");
    const observedAt = Date.now();
    const observation = await withCdp(page.webSocketDebuggerUrl, async (client) => {
      await client.send("Runtime.enable");
      const evaluated = await client.send("Runtime.evaluate", { expression: writePrecheckProbeExpression(), returnByValue: true, awaitPromise: true });
      return (evaluated.result as { value?: WritePrecheckObservation } | undefined)?.value;
    }, AbortSignal.timeout(3000));
    const validation = validateXhsWritePrecheckObservation(input, observation);
    if (validation.status === "unavailable") return validation;
    const screenshot = await withCdp(page.webSocketDebuggerUrl, captureProbeScreenshot, AbortSignal.timeout(3000));
    if (!screenshot) return writePrecheckUnavailable("evidence_unavailable", "The refs-only precheck snapshot evidence could not be captured.");
    const after = await withCdp(page.webSocketDebuggerUrl, async (client) => {
      const evaluated = await client.send("Runtime.evaluate", { expression: writePrecheckProbeExpression(), returnByValue: true, awaitPromise: true });
      return (evaluated.result as { value?: WritePrecheckObservation } | undefined)?.value;
    }, AbortSignal.timeout(3000));
    if (!validWritePrecheckFreshness(input, observation, after, observedAt, Date.now())) return writePrecheckUnavailable("page_changed", "The creator page changed while snapshot evidence was captured.");
    return { ...validation, observed_at: new Date(observedAt).toISOString(), evidence_ref_kinds: [{ kind: "snapshot_ref", ref: screenshot.screenshot_ref }] };
  } catch {
    return writePrecheckUnavailable("provider_probe_unavailable", "The creator write-precheck probe failed.");
  }
}

function writePrecheckUnavailable(failure_class: Extract<LocalProviderWritePrecheckProbeResult, { status: "unavailable" }>["failure_class"], message: string, retryable = true): LocalProviderWritePrecheckProbeResult {
  return { status: "unavailable", failure_class, message, retryable };
}

export function writePrecheckProbeExpression(): string {
  return `(async () => {
    const observe = () => {
    const text = (document.body?.innerText || '').slice(0, 20000).toLowerCase();
    const visible = (el) => { const s = el ? getComputedStyle(el) : null; const r = el?.getBoundingClientRect(); return Boolean(el && !el.hidden && !el.disabled && !el.closest('[aria-hidden="true"], [aria-disabled="true"], [hidden], [data-decoy="true"], [data-testid*="decoy"], .decoy') && s && s.visibility !== 'hidden' && s.display !== 'none' && s.pointerEvents !== 'none' && s.zIndex !== '-1' && Number(s.opacity) >= 0.01 && r && r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight && (typeof el.checkVisibility !== 'function' || el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))); };
    const app = document.querySelector('#app');
    const frameworkOwned = Boolean(app?.__vue_app__);
    const roots = [...document.querySelectorAll('#web.publish-vue-container')].filter((root) => visible(root) && app?.contains(root));
    const exactText = (el, expected) => (el.textContent || '').trim() === expected;
    const rootFacts = roots.map((root) => { const activeTab = [...root.querySelectorAll('.creator-tab.active, .creator-tab[aria-selected="true"]')].some((el) => visible(el) && exactText(el, '上传图文')); const buttons = [...root.querySelectorAll('button, [role="button"]')].filter(visible); return { activeTab, uploadImage: buttons.some((el) => exactText(el, '上传图片')), textImage: buttons.some((el) => exactText(el, '文字配图')) }; });
    const entrypoint = rootFacts.find((fact) => fact.activeTab && fact.uploadImage && fact.textImage);
    const loginSurface = location.pathname.startsWith('/login') || [...document.querySelectorAll('[class*="login"], [class*="qrcode"], [class*="qr-code"]')].some((el) => visible(el) && /扫码登录|手机号登录|登录二维码/.test(el.textContent || ''));
    return { url: location.href, origin: location.origin, pathname: location.pathname, challenge_like: /验证码|安全验证|访问受限|captcha/.test(text), login_like: loginSurface, creator_app_owned: frameworkOwned && Boolean(entrypoint), creator_root_count: roots.length, upload_image_tab_active: Boolean(entrypoint?.activeTab), upload_image_entry_visible: Boolean(entrypoint?.uploadImage), text_image_entry_visible: Boolean(entrypoint?.textImage) };
    };
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const observation = observe();
      if (observation.challenge_like || observation.login_like || observation.creator_app_owned) return observation;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return observe();
  })()`;
}

export function validWritePrecheckFreshness(input: LocalProviderWritePrecheckProbeInput, before: WritePrecheckObservation | undefined, after: WritePrecheckObservation | undefined, startedAt: number, completedAt: number): boolean {
  if (completedAt < startedAt || completedAt - startedAt > 2000) return false;
  if (validateXhsWritePrecheckObservation(input, before).status !== "completed" || validateXhsWritePrecheckObservation(input, after).status !== "completed") return false;
  return JSON.stringify(before) === JSON.stringify(after);
}

const BOSS_SITE_RESOURCE_PROBE_DEADLINE_MS = 3000;

export async function probeProviderSiteResource(
  port: string,
  requestedUrl: string,
  input: LocalProviderSiteResourceProbeInput,
  deadlineMs = BOSS_SITE_RESOURCE_PROBE_DEADLINE_MS,
  targetId?: string | null
): Promise<LocalProviderSiteResourceProbeResult> {
  if (input.site_id !== "boss" || (input.task_kind !== "job_search" && input.task_kind !== "boss_job_search")) {
    return siteResourceProbeUnavailable("unknown", "provider_probe_unavailable", "The local provider has no safe probe for this site resource.");
  }
  const deadline = AbortSignal.timeout(Math.max(1, Math.min(deadlineMs, BOSS_SITE_RESOURCE_PROBE_DEADLINE_MS)));
  const signal = input.signal ? AbortSignal.any([input.signal, deadline]) : deadline;
  try {
    const page = await activePage(port, requestedUrl, signal, targetId);
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

async function waitForDevtoolsPort(profileDir: string, deadline: number): Promise<string> {
  const portFile = join(profileDir, "DevToolsActivePort");
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

function remainingLaunchTime(deadline: number): number {
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new Error("Timed out reading local browser CDP readiness.");
  return remaining;
}

async function removeStaleDevtoolsPort(profileDir: string): Promise<boolean> {
  const portFile = join(profileDir, "DevToolsActivePort");
  let port = "";
  try {
    [port] = (await readFile(portFile, "utf8")).trim().split("\n");
  } catch {
    return false;
  }
  if (port && await isDevtoolsPortReachable(port)) return true;
  await rm(portFile, { force: true });
  return false;
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

async function openProviderUrl(port: string, url: string, signal?: AbortSignal, onOpened?: (targetId: string) => void): Promise<LocalProviderPageFacts> {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: "PUT", signal });
    if (!response.ok) throw new Error(`CDP open-url probe failed: ${response.status}`);
    const target = await response.json() as CdpPageTarget;
    if (!target.id) throw new Error("CDP open-url target has no id.");
    onOpened?.(target.id);
    return readTargetPageFacts(await openedPageTarget(port, target.id, signal), url, signal);
  } catch (cause) {
    return unavailablePageFacts("url_unreachable", url, cause);
  }
}

async function openedPageTarget(port: string, targetId: string, signal?: AbortSignal): Promise<CdpPageTarget> {
  for (let attempt = 0; attempt < 20; attempt++) {
    signal?.throwIfAborted();
    const target = (await pageTargets(port, signal)).find((candidate) => candidate.id === targetId);
    if (target) return target;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("CDP opened target is unavailable.");
}

async function probeProviderReadOperation(
  port: string,
  input: LocalProviderReadProbeInput,
  retainedXhsSearchTargetId?: string,
  trackTarget: (targetId: string) => void = () => {},
  closeTarget: (targetId: string) => Promise<boolean> = async (targetId) => {
    await closeProviderPage(port, targetId);
    return true;
  }
): Promise<ProviderReadOperationOutcome> {
  let operationTargetId: string | undefined;
  let operationTargetRetained = false;
  try {
    const retainedPage = input.operation_id === "xhs_read_note_detail" && input.navigation_source_url && retainedXhsSearchTargetId
      ? (await pageTargets(port)).find((candidate) => candidate.id === retainedXhsSearchTargetId)
      : undefined;
    if (input.operation_id === "xhs_read_note_detail" && !retainedPage) {
      return { result: probeUnavailable("page_not_ready", "The search page bound to this detail ref is no longer available.", true), target_retained: false };
    }
    const page = retainedPage ?? await createBlankProviderPage(port);
    if (!page.id) throw new Error("Read-operation page has no target id.");
    operationTargetId = page.id;
    trackTarget(page.id);
    if (!page.webSocketDebuggerUrl) throw new Error("Read-operation page has no CDP websocket.");
    let keepPage = false;
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
      if (input.operation_id === "xhs_read_note_detail" && input.navigation_source_url) {
        await client.send("Page.bringToFront");
        let clickPoint: { x: number; y: number } | undefined;
        for (let attempt = 0; attempt < 20 && !clickPoint; attempt++) {
          const evaluated = await client.send("Runtime.evaluate", {
            expression: xhsDetailClickPointExpression(input.target_url),
            returnByValue: true
          });
          clickPoint = (evaluated.result as { value?: { x?: unknown; y?: unknown } } | undefined)?.value as { x: number; y: number } | undefined;
          if (!Number.isFinite(clickPoint?.x) || !Number.isFinite(clickPoint?.y)) clickPoint = undefined;
          if (!clickPoint) await new Promise((resolve) => setTimeout(resolve, 250));
        }
        if (!clickPoint) {
          stopObservingNetwork();
          stopIntercepting();
          return null;
        }
        navigationStarted = true;
        await client.send("Input.dispatchMouseEvent", { type: "mousePressed", x: clickPoint.x, y: clickPoint.y, button: "left", clickCount: 1 });
        await client.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: clickPoint.x, y: clickPoint.y, button: "left", clickCount: 1 });
      } else {
        navigationStarted = true;
        await client.send("Page.navigate", { url: input.target_url });
      }
      const maxProbeAttempts = 40;
      for (let attempt = 0; attempt < maxProbeAttempts; attempt++) {
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
        if (value?.origin && (value.challenge_like || (value.login_like && attempt === maxProbeAttempts - 1))) {
          stopObservingNetwork();
          stopIntercepting();
          return { validation: validateReadOperationProbe(input, value) };
        }
        if (value?.login_like) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          continue;
        }
        if (value?.origin && value.ready && observedResponse !== null && (input.operation_id !== "boss_read_job_detail" || observedBossDetailResponse !== null)) {
          if (input.operation_id === "xhs_read_note_detail") {
            const targetId = new URL(input.target_url).pathname.split("/").filter(Boolean).at(-1) ?? "";
            const matchesTarget = await xhsDetailResponseMatchesTarget(client, observedResponse.requestId, targetId);
            if (matchesTarget === null) {
              await new Promise((resolve) => setTimeout(resolve, 250));
              continue;
            }
            if (!matchesTarget) {
              operationResponse = null;
              continue;
            }
          }
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
          if (input.operation_id === "xhs_search_notes") {
            keepPage = true;
            operationTargetRetained = true;
          }
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
    }).finally(() => keepPage ? undefined : closeTarget(page.id!).then(() => undefined));
    const pageFacts = readOperationPageFacts(input.operation_id, input.target_url);
    if (!observation) return readOperationOutcome(probeUnavailable("page_not_ready", "The read-operation page did not reach a ready state.", true, pageFacts), operationTargetId, operationTargetRetained);
    if (observation.blocked_redirect) return readOperationOutcome(probeUnavailable("origin_drift", "A cross-origin document redirect was blocked before navigation.", false, pageFacts), operationTargetId, operationTargetRetained);
    if (observation.evidence_missing) return readOperationOutcome(probeUnavailable("evidence_refs_missing", "The local provider could not capture required refs-only evidence.", true, pageFacts), operationTargetId, operationTargetRetained);
    const validation = observation.validation;
    if (!validation || validation.status === "unavailable") {
      return readOperationOutcome(probeUnavailable(validation?.failure_class ?? "page_not_ready", validation?.message ?? "The read-operation page did not reach a ready state.", validation?.retryable ?? true, pageFacts), operationTargetId, operationTargetRetained);
    }
    const source_refs = validation.source_kinds.map((kind) => ({ kind, ref: opaqueRef("source") }));
    const evidence_ref_kinds = [
      { kind: "snapshot_ref", ref: observation.screenshot_ref! },
      ...(input.operation_id === "boss_job_search" ? [{ kind: "network_summary_ref", ref: opaqueRef("evidence") }] : [])
    ];
    return readOperationOutcome({
      status: "completed",
      observed_at: new Date().toISOString(),
      observed_origin: input.expected_origin,
      page: pageFacts,
      source_refs,
      evidence_ref_kinds,
      public_summary_source_ref: source_refs.find((source) => source.kind === "network_summary" || source.kind === "wapi_job_detail_summary")?.ref ?? source_refs[0]!.ref,
      public_summary: validation.public_summary,
      detail_targets: validation.detail_urls?.map((canonical_url) => ({ canonical_url, source_url: input.target_url }))
    }, operationTargetId, operationTargetRetained);
  } catch (cause) {
    return readOperationOutcome(probeUnavailable(
      "network_resource_unavailable",
      cause instanceof Error ? cause.message : "The provider read-only probe failed.",
      true
    ), operationTargetId, false);
  }
}

function readOperationOutcome(result: LocalProviderReadProbeResult, target_id: string | undefined, target_retained: boolean): ProviderReadOperationOutcome {
  return { result, ...(target_id ? { target_id } : {}), target_retained };
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
      return url.origin === "https://www.xiaohongshu.com" && !url.username && !url.password && !url.hash &&
        /^\/explore\/[a-f0-9]{24}$/i.test(url.pathname) &&
        [...url.searchParams.keys()].every((key) => key === "xsec_token" || key === "xsec_source") &&
        url.searchParams.getAll("xsec_token").length <= 1 && url.searchParams.getAll("xsec_source").length <= 1;
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
    const clean = (value, max) => typeof value === "string" || typeof value === "number" ? String(value).replace(/\\s+/g, " ").trim().slice(0, max) : "";
    const pick = (selectors, max) => clean(document.querySelector(selectors)?.textContent, max);
    const visibleSurfaceElement = (element) => {
      const view = document.defaultView;
      if (!view) return false;
      if (typeof element.checkVisibility === 'function' && !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
      const style = view.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 &&
        rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < view.innerHeight && rect.left < view.innerWidth;
    };
    const visibleSurface = (selectors) => typeof document.querySelectorAll === 'function' && Array.from(document.querySelectorAll(selectors)).some(visibleSurfaceElement);
    const challengeSurface = visibleSurface('[class*="captcha"], [id*="captcha"], [class*="challenge"], [id*="challenge"], [class*="security-check"], [id*="security-check"]');
    const challenge = /验证码|安全验证|访问异常|captcha|challenge required|verification challenge|security check|verification required|complete verification/i.test(text) || challengeSurface;
    const login = ${operationId === "xhs_read_note_detail"
      ? "location.pathname.startsWith('/login') || visibleSurface('.login-dialog, [class*=\"login\"] form, [class*=\"login\"] [class*=\"qrcode\"]')"
      : "location.pathname.startsWith('/web/user/') || visibleSurface('.login-dialog, [class*=\"login\"] form, [class*=\"login\"] [class*=\"qrcode\"]')"};
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
    const noteId = location.pathname.split('/').filter(Boolean).at(-1) || "";
    const noteStores = stores instanceof Map ? Array.from(stores.entries()).filter(([key]) => /note|detail/i.test(String(key))) : [];
    const storeDetails = noteStores.flatMap(([, candidate]) => {
      const state = unwrap(candidate?.$state) || candidate;
      const detailMap = unwrap(state?.noteDetailMap);
      const mapped = detailMap instanceof Map ? detailMap.get(noteId) : detailMap?.[noteId];
      return [unwrap(mapped?.note), unwrap(state?.currentNote), unwrap(state?.noteDetail), unwrap(state?.detail), unwrap(state?.note), state]
        .filter((value) => value && typeof value === "object");
    });
    const storeDetail = storeDetails.find((detail) => clean(unwrap(detail.note_id) || unwrap(detail.noteId) || unwrap(detail.id), 64) === noteId);
    const storeAuthor = unwrap(storeDetail?.author) || unwrap(storeDetail?.user) || {};
    const storeMetrics = unwrap(storeDetail?.interaction_metrics) || unwrap(storeDetail?.interactInfo) || unwrap(storeDetail?.metrics) || {};
    const domTitle = pick('.note-content .title, #detail-title, [class*="note-title"]', 200);
    const title = clean(unwrap(storeDetail?.title), 200) || domTitle;
    const body = clean(unwrap(storeDetail?.body_summary) || unwrap(storeDetail?.desc) || unwrap(storeDetail?.description) || unwrap(storeDetail?.body), 4000) || pick('#detail-desc, .note-content .desc, [class*="note-desc"]', 4000);
    const author = clean(unwrap(storeAuthor.display_name) || unwrap(storeAuthor.nickname) || unwrap(storeAuthor.name), 100) || pick('.author-container .name, .author-wrapper .name, [class*="author"] [class*="name"]', 100);
    const authorLink = document.querySelector('a[href^="/user/profile/"], a[href*="xiaohongshu.com/user/profile/"]');
    const profilePath = authorLink ? new URL(authorLink.getAttribute('href'), location.origin).pathname : "";
    const authorId = clean(unwrap(storeAuthor.author_id) || unwrap(storeAuthor.userId) || unwrap(storeAuthor.id), 100) || (profilePath.startsWith('/user/profile/') ? profilePath.slice('/user/profile/'.length).split('/')[0] : "");
    const profileUrl = authorId ? location.origin + '/user/profile/' + authorId : "";
    const likes = clean(unwrap(storeMetrics.likes) || unwrap(storeMetrics.likedCount), 40) || pick('[class*="like"] [class*="count"], .like-wrapper .count', 40);
    const comments = clean(unwrap(storeMetrics.comments) || unwrap(storeMetrics.commentCount), 40) || pick('[class*="comment"] [class*="count"], .comment-wrapper .count', 40);
    const collects = clean(unwrap(storeMetrics.collects) || unwrap(storeMetrics.collectedCount), 40) || pick('[class*="collect"] [class*="count"], .collect-wrapper .count', 40);
    const shares = clean(unwrap(storeMetrics.shares) || unwrap(storeMetrics.shareCount), 40) || pick('[class*="share"] [class*="count"], .share-wrapper .count', 40);
    const piniaReady = Boolean(storeDetail) && Boolean(title && body && author && authorId && likes && comments && collects && shares) && (!domTitle || domTitle === title);
    const normalized = piniaReady && title && body && author && authorId && profileUrl && likes && comments && collects && shares && /^[A-Za-z0-9]+$/.test(noteId) ? { kind: "xiaohongshu_note_detail", canonical_url: canonicalUrl, note_id: noteId, title, summary: body.slice(0, 500), body_summary: body, author: { display_name: author, author_id: authorId, profile_url: profileUrl }, interaction_metrics: { likes, comments, collects, shares }, source_status: "located" } : undefined;
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
    const visibleSurface = (selectors) => Array.from(document.querySelectorAll(selectors)).some((element) => {
      const view = document.defaultView;
      if (!view) return false;
      if (typeof element.checkVisibility === 'function' && !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
      const style = view.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 &&
        rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < view.innerHeight && rect.left < view.innerWidth;
    });
    const challengeSurface = visibleSurface('[class*="captcha"], [id*="captcha"], [class*="challenge"], [id*="challenge"], [class*="security-check"], [id*="security-check"]');
    const challenge = /验证码|安全验证|访问异常|captcha|challenge required|verification challenge|security check|verification required|complete verification/i.test(text) || challengeSurface;
    const login = location.pathname.startsWith('/web/user/') || visibleSurface('.login-dialog, [class*="login"] form, [class*="login"] [class*="qrcode"]');
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
    const feedIds = Array.from(new Set(allFeedIds)).slice(0, 15);
    const anchors = typeof document.querySelectorAll === "function" ? Array.from(document.querySelectorAll('a[href*="/explore/"]')) : [];
    const pageTargets = new Map();
    for (const anchor of anchors) {
      try {
        const url = new URL(anchor.getAttribute?.('href') || anchor.href || '', location.origin);
        const match = new RegExp('^/explore/([a-f0-9]{24})$', 'i').exec(url.pathname);
        if (url.origin !== location.origin || url.username || url.password || !match) continue;
        const id = match[1].toLowerCase();
        if (!feedIds.includes(id)) continue;
        const current = pageTargets.get(id);
        if (!current || (!new URL(current).search && url.search)) pageTargets.set(id, url.toString());
      } catch {}
    }
    const detailUrls = feedIds.flatMap((id) => pageTargets.has(id) ? [pageTargets.get(id)] : []);
    const listFailure = feedIds.length === 0 ? 'empty_result' : detailUrls.length === 0 ? 'page_not_ready' : undefined;
    const listValid = listFailure === undefined && detailUrls.length > 0;
    const text = document.body?.innerText || "";
    const visibleSurfaceElement = (element) => {
      const view = document.defaultView;
      if (!view) return false;
      if (typeof element.checkVisibility === 'function' && !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
      const style = view.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 &&
        rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < view.innerHeight && rect.left < view.innerWidth;
    };
    const visibleSurface = (selectors) => typeof document.querySelectorAll === 'function' && Array.from(document.querySelectorAll(selectors)).some(visibleSurfaceElement);
    const challenge = /验证码|安全验证|访问异常|captcha|challenge required|verification challenge/i.test(text) || visibleSurface('[class*="captcha"], [id*="captcha"], [class*="challenge"], [id*="challenge"]');
    const login = location.pathname.startsWith('/login') || visibleSurface('.login-dialog, [class*="login"] form, [class*="login"] [class*="qrcode"]');
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

export function xhsDetailClickPointExpression(targetUrl: string): string {
  const expectedUrl = new URL(targetUrl);
  const noteId = expectedUrl.pathname.split("/").filter(Boolean).at(-1) ?? "";
  return `(() => {
    const expectedOrigin = ${JSON.stringify(expectedUrl.origin)};
    const expectedPath = ${JSON.stringify(expectedUrl.pathname)};
    const expectedNoteId = ${JSON.stringify(noteId)};
    const anchors = Array.from(document.querySelectorAll('a[href*="/explore/"]'));
    const anchor = anchors.find((candidate) => {
      try {
        const url = new URL(candidate.getAttribute('href') || candidate.href || '', location.origin);
        const keys = [...url.searchParams.keys()];
        return url.origin === expectedOrigin && url.pathname === expectedPath && !url.username && !url.password && !url.hash &&
          keys.every((key) => key === 'xsec_token' || key === 'xsec_source') &&
          url.searchParams.getAll('xsec_token').length <= 1 && url.searchParams.getAll('xsec_source').length <= 1;
      }
      catch { return false; }
    });
    if (!anchor) return undefined;
    const card = anchor.closest('section.note-item');
    if (!card) return undefined;
    const rect = card.getBoundingClientRect();
    for (const yFraction of [0.2, 0.35, 0.5]) {
      const x = Math.max(1, Math.min(innerWidth - 1, rect.left + rect.width / 2));
      const y = Math.max(1, Math.min(innerHeight - 1, rect.top + rect.height * yFraction));
      const hit = document.elementFromPoint(x, y);
      if (!hit || !card.contains(hit) || hit.closest('button, [role="button"], input, select, textarea, label, [contenteditable="true"]')) continue;
      const hitLink = hit.closest('a');
      if (!hitLink) continue;
      try {
        const hitUrl = new URL(hitLink.getAttribute('href') || hitLink.href || '', location.origin);
        const hitPath = hitUrl.pathname;
        if (hitUrl.origin === expectedOrigin && !hitUrl.username && !hitUrl.password && !hitUrl.hash &&
          (hitPath === expectedPath || hitPath === '/search_result/' + expectedNoteId)) return { x, y };
      } catch {}
    }
    return undefined;
  })()`;
}

const MAX_XHS_DETAIL_RESPONSE_BYTES = 512 * 1024;

async function xhsDetailResponseMatchesTarget(client: CdpClient, requestId: string, targetId: string): Promise<boolean | null> {
  try {
    const response = await client.send("Network.getResponseBody", { requestId });
    const encoded = typeof response.body === "string" ? response.body : "";
    const bytes = response.base64Encoded === true ? Buffer.from(encoded, "base64") : Buffer.from(encoded, "utf8");
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_XHS_DETAIL_RESPONSE_BYTES) return false;
    return xhsFeedResponseMatchesTarget(bytes.toString("utf8"), targetId);
  } catch {
    return null;
  }
}

export function xhsFeedResponseMatchesTarget(body: string, targetId: string): boolean {
  if (!/^[a-f0-9]{24}$/i.test(targetId)) return false;
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return false;
  }
  if (!isPlainRecord(value) || !isPlainRecord(value.data) || !Array.isArray(value.data.items)) return false;
  return value.data.items.some((entry) => {
    if (!isPlainRecord(entry)) return false;
    const card = isPlainRecord(entry.note_card) ? entry.note_card : isPlainRecord(entry.noteCard) ? entry.noteCard : null;
    return [entry.id, entry.note_id, entry.noteId, card?.id, card?.note_id, card?.noteId].includes(targetId);
  });
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
  if (input.operation_id === "xhs_read_note_detail") {
    try {
      const observed = new URL(value);
      return observed.origin === "https://edith.xiaohongshu.com" && observed.pathname === "/api/sns/web/v1/feed";
    } catch {
      return false;
    }
  }
  if (input.operation_id === "boss_read_job_detail") return value === input.target_url;
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

function readOperationPageFacts(operationId: LocalProviderReadProbeInput["operation_id"], targetUrl: string): LocalProviderPageFacts {
  const publicUrl = publicReadOperationTargetUrl(operationId, targetUrl);
  const evidence_ref = opaqueRef("validation");
  return {
    current_url: publicUrl,
    title: null,
    status: "ready",
    facts: [
      { key: "page.current_url", source: "observed", value: publicUrl, evidence_ref },
      { key: "page.title", source: "observed", value: "not_read", evidence_ref },
      { key: "page.status", source: "validation_evidence", value: "operation_probe_ready", evidence_ref }
    ]
  };
}

async function readPageFacts(port: string, requested_url: string, signal: AbortSignal | undefined, requireExactTarget: boolean, onSelected?: (targetId: string) => void): Promise<LocalProviderPageFacts> {
  try {
    const page = selectPage(await pageTargets(port, signal), requested_url);
    if (requireExactTarget && !page?.id) throw new Error("Exact controlled CDP page target is unavailable.");
    if (page?.id) onSelected?.(page.id);
    return readTargetPageFacts(page, requested_url, signal);
  } catch (cause) {
    return unavailablePageFacts("cdp_unavailable", requested_url, cause);
  }
}

async function restoreProviderBinding(port: string, binding: ProviderPageBinding | undefined): Promise<ProviderPageBinding> {
  const requestedUrl = binding?.requestedUrl ?? "about:blank";
  if (typeof binding?.targetId !== "string") {
    return { targetId: null, requestedUrl, page: unavailablePageFacts("cdp_unavailable", requestedUrl, new Error("No surviving controlled CDP target is bound.")) };
  }
  try {
    const target = (await pageTargets(port)).find((candidate) => candidate.id === binding.targetId);
    if (!target) throw new Error("The previously bound CDP target is no longer available.");
    return { targetId: binding.targetId, requestedUrl, page: await readTargetPageFactsStrict(target, requestedUrl) };
  } catch (cause) {
    return { targetId: null, requestedUrl, page: unavailablePageFacts("cdp_unavailable", requestedUrl, cause) };
  }
}

async function readTargetPageFactsStrict(page: CdpPageTarget, requestedUrl: string, signal?: AbortSignal): Promise<LocalProviderPageFacts> {
  if (!page.webSocketDebuggerUrl) throw new Error("The controlled CDP target has no websocket.");
  const observed = await readPageTitle(page.webSocketDebuggerUrl, requestedUrl, signal);
  if (!observed) throw new Error("The controlled CDP target did not return page facts.");
  return readyPage(observed.url, observed.title);
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

async function captureProviderScreenshot(port: string, requested_url: string, targetId?: string | null): Promise<LocalProviderScreenshotFacts | RuntimeErrorFact> {
  try {
    const page = await activePage(port, requested_url, undefined, targetId);
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

async function activePage(port: string, requested_url: string, signal?: AbortSignal, targetId?: string | null): Promise<CdpPageTarget> {
  const pages = await pageTargets(port, signal);
  const page = targetId === undefined ? selectPage(pages, requested_url) : pages.find((candidate) => candidate.id === targetId);
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
    let lastObserved: { title: string; url: string } | null = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      const result = await client.send("Runtime.evaluate", {
        expression: "({ title: document.title, url: location.href, readyState: document.readyState })",
        returnByValue: true
      });
      const value = (result.result as { value?: { title?: string; url?: string; readyState?: string } } | undefined)?.value;
      const url = value?.url ?? "";
      if (url !== "" && url !== "about:blank" && (value?.title || value?.readyState === "complete")) {
        lastObserved = { title: value.title ?? "", url };
        if (sameOriginAndRoute(url, requested_url)) return lastObserved;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return lastObserved;
  }, signal);
}

function sameOriginAndRoute(observed: string, requested: string): boolean {
  try {
    const observedUrl = new URL(observed);
    const requestedUrl = new URL(requested);
    return observedUrl.origin === requestedUrl.origin && observedUrl.pathname === requestedUrl.pathname;
  } catch {
    return observed === requested;
  }
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
