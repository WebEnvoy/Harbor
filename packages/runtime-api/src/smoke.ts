import { createFixtureLauncher, HarborRuntime } from "./index.js";

const useLocalProvider = process.argv.includes("--local");
const runtime = new HarborRuntime(useLocalProvider ? undefined : createFixtureLauncher("ready"));
const providerStatus = runtime.getBrowserProviderStatus();
const providerBinding = runtime.getIdentityEnvironmentProviderBinding();
const identityEnvironment = runtime.getLocalIdentityEnvironmentFacts({
  identity_environment_ref: "identity-env_smoke",
  execution_identity_ref: "execution-identity_smoke",
  profile_ref: "profile_smoke",
  site: {
    site_id: "example",
    origin: "https://example.test",
    display_name: "Example",
    account_identifier: "fixture-account",
    account_ref: "account_smoke"
  },
  login_state: "manual_auth_required",
  storage_state: "present",
  proxy_ref: "proxy_smoke",
  region: "US",
  language: "en-US",
  timezone: "America/Los_Angeles",
  fingerprint_summary: "fixture-provider-claim",
  credential_ref: "credential_smoke",
  keychain_ref: "keychain://harbor/smoke",
  login_method: "manual",
  human_verification: ["manual_login", "captcha"]
});
const identityConsistency = runtime.getIdentityConsistencyFacts({
  identity_environment: identityEnvironment,
  observed_environment: {
    proxy_ref: "proxy_smoke",
    region: "US",
    language: "en-US",
    timezone: "America/Los_Angeles",
    login_state: "manual_auth_required"
  },
  risk_events: ["login_missing"]
});
const managedIdentityEnvironment = runtime.createLocalIdentityEnvironment({
  identity_environment_ref: "identity-env_smoke-managed",
  execution_identity_ref: "execution-identity_smoke-managed",
  profile_ref: "profile_smoke-managed",
  profile_storage_ref: "profile-storage_smoke-managed",
  site: {
    site_id: "xiaohongshu",
    origin: "https://www.xiaohongshu.com",
    display_name: "小红书",
    account_ref: "account_smoke-managed"
  },
  login_state: "manual_auth_required",
  storage_state: "present",
  proxy_ref: "proxy_smoke-managed",
  region: "US",
  language: "en-US",
  timezone: "America/Los_Angeles",
  fingerprint_summary: "fixture-provider-claim"
});
const session = await runtime.createSession();
const visibleViewerRuntime = new HarborRuntime(createFixtureLauncher("ready"));
const visibleViewerSession = await visibleViewerRuntime.createSession({ headless: false, control_owner: "core_task" });
const visibleViewerControl = visibleViewerRuntime.getViewerControlFacts(visibleViewerSession.runtime_session_ref);
const browserSession = await runtime.openIdentityEnvironmentSession({
  identity_environment: identityEnvironment,
  url: useLocalProvider ? "about:blank" : "https://example.test/runtime-session",
  control_owner: "agent",
  holder_ref: "smoke-agent"
});
const managedBrowserSession = await runtime.openManagedIdentityEnvironmentSession({
  identity_environment_ref: "identity-env_smoke-managed",
  url: useLocalProvider ? "about:blank" : "https://www.xiaohongshu.com/explore",
  control_owner: "agent",
  holder_ref: "smoke-managed-agent"
});
const browserSessionReusable = "status" in browserSession || browserSession.lifecycle_state !== "active"
  ? browserSession
  : await runtime.openIdentityEnvironmentSession({
      identity_environment: identityEnvironment,
      url: useLocalProvider ? "about:blank" : "https://example.test/runtime-session/reused",
      control_owner: "agent",
      holder_ref: "smoke-agent"
    });
const browserSessionReleased = "status" in browserSessionReusable || browserSessionReusable.lifecycle_state !== "active"
  ? browserSessionReusable
  : runtime.releaseSession(browserSessionReusable.runtime_session_ref, { control_owner: "agent" });
const browserSessionStopped = "status" in browserSessionReleased || browserSessionReleased.lifecycle_state === "failed"
  ? browserSessionReleased
  : await runtime.stopSession(browserSessionReleased.runtime_session_ref);
const capture = session.lifecycle_state === "active"
  ? runtime.captureSnapshot(session.runtime_session_ref, {
      title: useLocalProvider ? "Local runtime smoke" : "Fixture runtime smoke",
      url: "about:blank",
      summary: "Runtime Session can produce low-noise snapshot, refmap, and evidence refs.",
      capture_method: useLocalProvider ? "provided_context" : "fixture",
      source_locator: useLocalProvider ? "local://about-blank" : "fixture://runtime-smoke",
      elements: [{ label: "Runtime smoke page", role: "document" }]
    })
  : null;
const readback = runtime.getSession(session.runtime_session_ref);
const viewerControl = runtime.getViewerControlFacts(session.runtime_session_ref);
const handoff = runtime.recordHandoff(session.runtime_session_ref, {
  control_owner: "user",
  handoff_reason: "viewer_only"
});
const coreRuntime = runtime.getCoreRuntimeFacts(session.runtime_session_ref);
const validationRuntime = runtime.getValidationRuntimeFacts(session.runtime_session_ref);
const writePrecheck = runtime.getWritePrecheckFacts(session.runtime_session_ref);
const appStatus = runtime.getAppRuntimeStatusFixture(session.runtime_session_ref);
const scene = capture?.status === "captured" ? runtime.getCoreSceneReference(capture.snapshot_ref) : capture;
const evidenceStatus = capture?.status === "captured" ? runtime.getEvidenceStatusFixture(capture.snapshot_ref) : capture;
const previewEvidence = runtime.capturePreviewEvidence(session.runtime_session_ref);
const redactedPreviewExport = "status" in previewEvidence ? previewEvidence : runtime.getRedactedPreviewExportFixture(previewEvidence.before_preview.snapshot_ref);
const closed = await runtime.closeSession(session.runtime_session_ref);
const staleEvidenceStatus = capture?.status === "captured" ? runtime.getEvidenceStatusFixture(capture.snapshot_ref) : capture;

console.log(JSON.stringify({
  mode: useLocalProvider ? "local" : "fixture",
  session,
  visibleViewerSession,
  visibleViewerControl,
  providerStatus,
  providerBinding,
  identityEnvironment,
  identityConsistency,
  managedIdentityEnvironment,
  browserSession,
  managedBrowserSession,
  browserSessionReusable,
  browserSessionReleased,
  browserSessionStopped,
  capture,
  scene,
  previewEvidence,
  readback,
  viewerControl,
  handoff,
  coreRuntime,
  validationRuntime,
  writePrecheck,
  redactedPreviewExport,
  appStatus,
  evidenceStatus,
  staleEvidenceStatus,
  closed
}, null, 2));

const localUnavailableAllowed = useLocalProvider && session.lifecycle_state === "failed" && Boolean(session.current_error);
const browserSessionReady = !("status" in browserSession) && browserSession.current_page.status === "ready";
const browserSessionFailedWithFacts = "status" in browserSession || (!("status" in browserSession) && browserSession.current_error !== null);
const staleEvidenceInvalid = !staleEvidenceStatus ||
  "status" in staleEvidenceStatus ||
  staleEvidenceStatus.scene_status.display_state !== "stale";

if (
  !readback ||
  !closed ||
  providerStatus.providers.length !== 2 ||
  !providerStatus.excluded_providers.some((provider) => provider.provider === "chromium") ||
  !providerStatus.excluded_providers.some((provider) => provider.provider === "donut_browser") ||
  providerBinding.schema_version !== "harbor-identity-provider-binding/v0" ||
  visibleViewerSession.availability.viewer !== "available" ||
  "status" in visibleViewerControl ||
  identityEnvironment.schema_version !== "harbor-local-identity-environment/v0" ||
  identityConsistency.schema_version !== "harbor-identity-consistency-facts/v0" ||
  identityEnvironment.login_state.recovery_required !== true ||
  identityConsistency.resources.some((resource) => resource.key === "proxy") !== true ||
  identityConsistency.public_facts.core !== "admission_resource_facts_and_blocking_reasons" ||
  identityEnvironment.consumer_boundary.not_exposed.includes("cookie_value") !== true ||
  managedIdentityEnvironment.public_boundary.output !== "status_and_redacted_refs_only" ||
  runtime.listLocalIdentityEnvironments().length !== 1 ||
  (!localUnavailableAllowed && (!capture || capture.status !== "captured")) ||
  (!useLocalProvider && !browserSessionReady) ||
  (!useLocalProvider && ("status" in managedBrowserSession || managedBrowserSession.current_page.status !== "ready")) ||
  (useLocalProvider && !browserSessionReady && !browserSessionFailedWithFacts) ||
  "status" in viewerControl ||
  "status" in handoff ||
  "status" in coreRuntime ||
  "status" in validationRuntime ||
  (!localUnavailableAllowed && "status" in writePrecheck) ||
  "status" in appStatus ||
  (!localUnavailableAllowed && (!evidenceStatus || "status" in evidenceStatus)) ||
  (!localUnavailableAllowed && "status" in previewEvidence) ||
  (!localUnavailableAllowed && "status" in redactedPreviewExport) ||
  (!localUnavailableAllowed && staleEvidenceInvalid)
) {
  process.exitCode = 1;
}
