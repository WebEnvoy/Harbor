import { createIdentityConsistencyFacts, type IdentityConsistencyFacts, type IdentityConsistencyFactsInput } from "./identity-consistency.js";
import { createLocalIdentityEnvironmentFacts, type LocalIdentityEnvironmentFacts, type LocalIdentityEnvironmentInput } from "./identity-environment.js";
import {
  HARBOR_LOCAL_IDENTITY_ENVIRONMENT_STORE_SCHEMA,
  LocalIdentityEnvironmentManager,
  type LocalIdentityEnvironmentManagerOptions,
  type LocalIdentityEnvironmentPublicRecord,
  type LocalIdentityEnvironmentStateUpdate,
  type ManagedLocalIdentityEnvironmentInput
} from "./identity-environment-manager.js";
import {
  HARBOR_EVIDENCE_STATUS_FIXTURE_SCHEMA,
  HARBOR_PAGE_SCENE_REFS_SCHEMA,
  PageSceneStore,
  type CaptureSnapshotInput,
  type CoreSceneReference,
  type EvidenceRecord,
  type EvidenceFreshnessState,
  type EvidenceStatusDisplayState,
  type EvidenceStatusFixture,
  type PageSceneUnavailable,
  type RefMapRecord,
  type ScreenshotArtifactInput,
  type SnapshotCaptureResult,
  type SnapshotRecord
} from "./page-scene.js";
import {
  bindIdentityEnvironmentDefaultProvider,
  detectBrowserProviders,
  diagnoseBrowserProviderFailure,
  getDefaultBrowserProviderExecutable,
  HARBOR_BROWSER_PROVIDER_STATUS_SCHEMA,
  HARBOR_IDENTITY_PROVIDER_BINDING_SCHEMA,
  type BrowserProviderCatalog,
  type BrowserProviderDetectionInput,
  type IdentityEnvironmentProviderBinding,
  type IdentityEnvironmentProviderBindingInput
} from "./provider-management.js";
import { opaqueRef } from "./refs.js";
import { createFixtureLauncher, launchLocalDedicatedProvider } from "./local-provider-launcher.js";
import {
  createSiteResourceFacts,
  HARBOR_SITE_RESOURCE_FACTS_SCHEMA,
  missingSiteRuntimeSession,
  siteResourceElements,
  type SiteResourceFacts,
  type SiteResourceFactsInput,
  type SiteResourceFactsUnavailable
} from "./site-runtime-facts.js";
import {
  HARBOR_PREVIEW_EVIDENCE_STATUS_FIXTURE_SCHEMA, HARBOR_REDACTED_PREVIEW_EXPORT_FIXTURE_SCHEMA, HARBOR_WRITE_PRECHECK_FACTS_SCHEMA,
  type PreviewEvidenceInput, type PreviewEvidenceState, type PreviewEvidenceStatusFixture, type RedactedPreviewExportFixture, type WritePrecheckFacts,
  type WritePrecheckInput
} from "./runtime-fixtures.js";
import {
  HARBOR_RUNTIME_FACTS_SCHEMA,
  HARBOR_VALIDATION_RUNTIME_FACTS_SCHEMA,
  RuntimeSessionStore,
  type CreateRuntimeSessionInput,
  type LocalProviderLauncher,
  type OpenIdentityEnvironmentSessionInput,
  type RuntimeSessionControlInput,
  type RuntimeSessionFacts,
  type RuntimeSessionUnavailable,
  type ValidationRuntimeFacts
} from "./runtime-session.js";
import {
  appRuntimeStatusFixture,
  coreRuntimeFacts,
  HARBOR_APP_RUNTIME_STATUS_FIXTURE_SCHEMA,
  HARBOR_CORE_RUNTIME_FACTS_SCHEMA,
  HARBOR_VIEWER_CONTROL_FACTS_SCHEMA,
  ViewerControlStore,
  type AppRuntimeStatusFixture,
  type CoreRuntimeFacts,
  type ControlOwner,
  type RecordHandoffInput,
  type ViewerControlFacts,
  type ViewerControlUnavailable
} from "./viewer-control.js";

export const DEFAULT_IDENTITY_SITE_URLS = {
  xiaohongshu: "https://www.xiaohongshu.com/explore",
  boss: "https://www.zhipin.com/"
} as const;

export { HARBOR_EVIDENCE_STATUS_FIXTURE_SCHEMA, HARBOR_PAGE_SCENE_REFS_SCHEMA } from "./page-scene.js";
export { createIdentityConsistencyFacts, HARBOR_IDENTITY_CONSISTENCY_FACTS_SCHEMA } from "./identity-consistency.js";
export { createLocalIdentityEnvironmentFacts, HARBOR_LOCAL_IDENTITY_ENVIRONMENT_SCHEMA } from "./identity-environment.js";
export { HARBOR_LOCAL_IDENTITY_ENVIRONMENT_STORE_SCHEMA, LocalIdentityEnvironmentManager } from "./identity-environment-manager.js";
export {
  bindIdentityEnvironmentDefaultProvider,
  detectBrowserProviders,
  diagnoseBrowserProviderFailure,
  getDefaultBrowserProviderExecutable,
  HARBOR_BROWSER_PROVIDER_STATUS_SCHEMA,
  HARBOR_IDENTITY_PROVIDER_BINDING_SCHEMA
} from "./provider-management.js";
export { createFixtureLauncher, launchLocalDedicatedProvider } from "./local-provider-launcher.js";
export { HARBOR_SITE_RESOURCE_FACTS_SCHEMA } from "./site-runtime-facts.js";
export { HARBOR_PREVIEW_EVIDENCE_STATUS_FIXTURE_SCHEMA, HARBOR_REDACTED_PREVIEW_EXPORT_FIXTURE_SCHEMA, HARBOR_WRITE_PRECHECK_FACTS_SCHEMA } from "./runtime-fixtures.js";
export { HARBOR_RUNTIME_FACTS_SCHEMA, HARBOR_VALIDATION_RUNTIME_FACTS_SCHEMA } from "./runtime-session.js";
export { HARBOR_APP_RUNTIME_STATUS_FIXTURE_SCHEMA, HARBOR_CORE_RUNTIME_FACTS_SCHEMA, HARBOR_VIEWER_CONTROL_FACTS_SCHEMA } from "./viewer-control.js";
export type {
  CaptureFailureClass,
  CaptureMethod,
  CaptureSnapshotInput,
  CoreSceneReference,
  EvidenceAccessState,
  EvidenceCapturePolicy,
  EvidenceRecord,
  EvidenceFreshnessState,
  EvidenceStatusDisplayState,
  EvidenceStatusEntry,
  EvidenceStatusFixture,
  EvidenceType,
  PageSceneUnavailable,
  RedactionState,
  RefMapElementInput,
  RefMapElementRef,
  RefMapRecord,
  RetentionState,
  ScreenshotArtifactInput,
  SnapshotCaptureResult,
  SnapshotRecord,
  SourceTrace,
  StorageScope
} from "./page-scene.js";
export type {
  SiteResourceFact,
  SiteResourceFactSeverity,
  SiteResourceFactSource,
  SiteResourceFactState,
  SiteResourceFacts,
  SiteResourceFactsInput,
  SiteResourceFactsUnavailable,
  SiteRuntimeId
} from "./site-runtime-facts.js";
export type {
  FormInputStateField,
  InputExportPolicy,
  InputSensitivity,
  InputValueState,
  PreWriteGuardStatus,
  PreviewEvidenceInput,
  PreviewEvidenceState,
  PreviewEvidenceStatusFixture,
  RedactedPreviewExportFixture,
  WritableTargetRef,
  WritableTargetRole,
  WritePrecheckFacts,
  WritePrecheckInput
} from "./runtime-fixtures.js";
export type {
  IdentityConsistencyFacts,
  IdentityConsistencyFactsInput,
  IdentityConsistencyReadiness,
  IdentityConsistencyResourceFact,
  IdentityConsistencyResourceKey,
  IdentityConsistencyRiskEvent,
  IdentityConsistencyRiskState,
  IdentityConsistencyState
} from "./identity-consistency.js";
export type {
  BrowserStorageState,
  ExportPolicy,
  HumanVerificationKind,
  LocalIdentityEnvironmentFacts,
  LocalIdentityEnvironmentInput,
  LoginState,
  ManualAuthenticationState,
  MaterialBoundary,
  ProtectedMaterialClass,
  SiteBindingInput
} from "./identity-environment.js";
export type {
  LocalIdentityEnvironmentManagerOptions,
  LocalIdentityEnvironmentOperation,
  LocalIdentityEnvironmentPublicRecord,
  LocalIdentityEnvironmentReadiness,
  LocalIdentityEnvironmentStateUpdate,
  ManagedLocalIdentityEnvironmentInput,
  ManagedSiteId,
  StoredLocalIdentityEnvironmentRecord
} from "./identity-environment-manager.js";
export type {
  BrowserProviderCapabilityFact,
  BrowserProviderCapabilityKey,
  BrowserProviderCapabilityState,
  BrowserProviderCatalog,
  BrowserProviderDetectionInput,
  BrowserProviderDiagnostic,
  BrowserProviderDownloadGuide,
  BrowserProviderFailureClass,
  BrowserProviderId,
  BrowserProviderInstallFacts,
  BrowserProviderInstallStatus,
  BrowserProviderLaunchability,
  BrowserProviderRole,
  BrowserProviderStatus,
  IdentityEnvironmentProviderBinding,
  IdentityEnvironmentProviderBindingInput
} from "./provider-management.js";
export type {
  AvailabilityState,
  CreateRuntimeSessionInput,
  FactSource,
  LifecycleState,
  LocalProviderLauncher,
  LocalProviderLaunchInput,
  LocalProviderLaunchResult,
  LocalProviderPageFacts,
  LocalProviderScreenshotFacts,
  OpenIdentityEnvironmentSessionInput,
  ProviderMode,
  RuntimeControlLockFacts,
  RuntimeControlLockState,
  RuntimeErrorCode,
  RuntimeErrorFact,
  RuntimeFact,
  RuntimePageFacts,
  RuntimePageStatus,
  RuntimeSessionControlInput,
  RuntimeSessionFacts,
  RuntimeSessionUnavailable,
  RuntimeViewerEntry,
  ValidationRuntimeFacts
} from "./runtime-session.js";
export type {
  AppBrowserStatus,
  AppRuntimeStatusFixture,
  ControlOwner,
  ControlOwnerFacts,
  CoreRuntimeFacts,
  HandoffReason,
  InputCapability,
  RecordHandoffInput,
  TakeoverUnavailableReason,
  ViewerAccessMode,
  ViewerAvailability,
  ViewerControlFacts,
  ViewerControlFailureClass,
  ViewerControlUnavailable,
  ViewerRefFacts,
  ViewerTransport
} from "./viewer-control.js";

export class HarborRuntime {
  private readonly pageScenes = new PageSceneStore();
  private readonly viewerControls = new ViewerControlStore();
  private readonly identityEnvironments: LocalIdentityEnvironmentManager;
  private readonly runtimeSessions: RuntimeSessionStore;

  constructor(launcher: LocalProviderLauncher = launchLocalDedicatedProvider, identityEnvironmentOptions: LocalIdentityEnvironmentManagerOptions = {}) {
    this.identityEnvironments = new LocalIdentityEnvironmentManager(identityEnvironmentOptions);
    this.runtimeSessions = new RuntimeSessionStore(this.viewerControls, launcher);
  }

  async createSession(input: CreateRuntimeSessionInput = {}): Promise<RuntimeSessionFacts> {
    return this.runtimeSessions.createSession(input);
  }

  getSession(runtime_session_ref: string): RuntimeSessionFacts | null {
    return this.runtimeSessions.getSession(runtime_session_ref);
  }

  async openIdentityEnvironmentSession(input: OpenIdentityEnvironmentSessionInput): Promise<RuntimeSessionFacts | RuntimeSessionUnavailable> {
    return this.runtimeSessions.openIdentityEnvironmentSession(input);
  }

  lockSession(runtime_session_ref: string, input: RuntimeSessionControlInput = {}): RuntimeSessionFacts | RuntimeSessionUnavailable {
    return this.runtimeSessions.lockSession(runtime_session_ref, input);
  }

  releaseSession(runtime_session_ref: string, input: RuntimeSessionControlInput = {}): RuntimeSessionFacts | RuntimeSessionUnavailable {
    return this.runtimeSessions.releaseSession(runtime_session_ref, input);
  }

  async stopSession(runtime_session_ref: string, input: RuntimeSessionControlInput = {}): Promise<RuntimeSessionFacts | RuntimeSessionUnavailable> {
    return this.runtimeSessions.stopSession(runtime_session_ref, input);
  }

  getBrowserProviderStatus(input: BrowserProviderDetectionInput = {}): BrowserProviderCatalog {
    return detectBrowserProviders(input);
  }

  getIdentityEnvironmentProviderBinding(input: IdentityEnvironmentProviderBindingInput = {}): IdentityEnvironmentProviderBinding {
    return bindIdentityEnvironmentDefaultProvider(input);
  }

  getLocalIdentityEnvironmentFacts(input: LocalIdentityEnvironmentInput): LocalIdentityEnvironmentFacts {
    return createLocalIdentityEnvironmentFacts(input);
  }

  createLocalIdentityEnvironment(input: ManagedLocalIdentityEnvironmentInput): LocalIdentityEnvironmentPublicRecord {
    return this.identityEnvironments.create(input);
  }

  importLocalIdentityEnvironment(input: ManagedLocalIdentityEnvironmentInput): LocalIdentityEnvironmentPublicRecord {
    return this.identityEnvironments.importIdentityEnvironment(input);
  }

  updateLocalIdentityEnvironment(identity_environment_ref: string, input: LocalIdentityEnvironmentStateUpdate): LocalIdentityEnvironmentPublicRecord | null {
    return this.identityEnvironments.update(identity_environment_ref, input);
  }

  getManagedLocalIdentityEnvironment(identity_environment_ref: string): LocalIdentityEnvironmentPublicRecord | null {
    return this.identityEnvironments.get(identity_environment_ref);
  }

  listLocalIdentityEnvironments(): LocalIdentityEnvironmentPublicRecord[] {
    return this.identityEnvironments.list();
  }

  deleteLocalIdentityEnvironment(identity_environment_ref: string): LocalIdentityEnvironmentPublicRecord | null {
    return this.identityEnvironments.delete(identity_environment_ref);
  }

  async openManagedIdentityEnvironmentSession(input: Omit<OpenIdentityEnvironmentSessionInput, "identity_environment"> & { identity_environment_ref: string }): Promise<RuntimeSessionFacts | RuntimeSessionUnavailable> {
    const identity_environment = this.identityEnvironments.getFacts(input.identity_environment_ref);
    if (!identity_environment) {
      return {
        status: "unavailable",
        failure_class: "identity_environment_unavailable",
        message: "Local identity environment is not registered.",
        retryable: true,
        current_error: {
          code: "identity_environment_unavailable",
          message: "Local identity environment is not registered.",
          retryable: true
        }
      };
    }
    return this.runtimeSessions.openIdentityEnvironmentSession({ ...input, identity_environment });
  }

  async openManagedDefaultSiteSession(input: Omit<OpenIdentityEnvironmentSessionInput, "identity_environment" | "url"> & { identity_environment_ref: string }): Promise<RuntimeSessionFacts | RuntimeSessionUnavailable> {
    const identity_environment = this.identityEnvironments.getFacts(input.identity_environment_ref);
    if (!identity_environment) {
      return {
        status: "unavailable",
        failure_class: "identity_environment_unavailable",
        message: "Local identity environment is not registered.",
        retryable: true,
        current_error: {
          code: "identity_environment_unavailable",
          message: "Local identity environment is not registered.",
          retryable: true
        }
      };
    }
    return this.runtimeSessions.openIdentityEnvironmentSession({
      ...input,
      identity_environment,
      url: defaultIdentitySiteUrl(identity_environment.site_binding.site_id, identity_environment.site_binding.origin)
    });
  }

  getIdentityConsistencyFacts(input: IdentityConsistencyFactsInput): IdentityConsistencyFacts {
    return createIdentityConsistencyFacts(input);
  }

  captureSnapshot(runtime_session_ref: string, input: CaptureSnapshotInput = {}): SnapshotCaptureResult {
    const record = this.runtimeSessions.getRecord(runtime_session_ref);
    const result = this.pageScenes.capture(record?.facts ?? null, input);
    if (record && result.status === "captured") {
      this.runtimeSessions.markSnapshotCaptured(runtime_session_ref, result.core_scene_ref.captured_at, result.evidence_refs);
    }
    return result;
  }

  async captureLiveSnapshot(runtime_session_ref: string, input: CaptureSnapshotInput = {}): Promise<SnapshotCaptureResult> {
    const record = this.runtimeSessions.getRecord(runtime_session_ref);
    if (!record) return this.pageScenes.capture(null, input);
    const screenshot = await record.captureScreenshot?.();
    const screenshot_artifact = screenshot && !("code" in screenshot) ? screenshotArtifact(screenshot) : undefined;
    const evidence_policy = screenshot && "code" in screenshot ? { ...input.evidence_policy, screenshot: "deny" as const } : input.evidence_policy;
    const result = this.pageScenes.capture(record.facts, {
      title: input.title ?? record.facts.current_page.title ?? "Untitled page",
      url: input.url ?? record.facts.current_page.current_url ?? record.facts.current_page.requested_url,
      summary: input.summary ?? "Live browser page captured as Harbor refs with raw screenshot bytes withheld.",
      capture_method: input.capture_method ?? (screenshot_artifact ? "cdp_screenshot" : "provided_context"),
      source_locator: input.source_locator ?? `runtime-session://${runtime_session_ref}/current-page`,
      elements: input.elements,
      screenshot_artifact,
      evidence_policy
    });
    if (result.status === "captured") {
      this.runtimeSessions.markSnapshotCaptured(runtime_session_ref, result.core_scene_ref.captured_at, result.evidence_refs);
      if (screenshot && !("code" in screenshot)) record.facts.facts.push(...screenshot.facts);
    }
    return result;
  }

  getSnapshot(snapshot_ref: string): SnapshotRecord | PageSceneUnavailable {
    return this.pageScenes.getSnapshot(snapshot_ref, (runtime_session_ref) => this.runtimeSessions.isReadable(runtime_session_ref));
  }

  getRefMap(refmap_ref: string): RefMapRecord | PageSceneUnavailable {
    return this.pageScenes.getRefMap(refmap_ref, (runtime_session_ref) => this.runtimeSessions.isReadable(runtime_session_ref));
  }

  getEvidence(evidence_ref: string): EvidenceRecord | PageSceneUnavailable {
    return this.pageScenes.getEvidence(evidence_ref);
  }

  expireEvidence(evidence_ref: string): EvidenceRecord | PageSceneUnavailable {
    return this.pageScenes.expireEvidence(evidence_ref);
  }

  getCoreSceneReference(snapshot_ref: string): CoreSceneReference | PageSceneUnavailable {
    return this.pageScenes.getCoreSceneReference(snapshot_ref, (runtime_session_ref) => this.runtimeSessions.isReadable(runtime_session_ref));
  }

  getEvidenceStatusFixture(snapshot_ref: string): EvidenceStatusFixture | PageSceneUnavailable {
    return this.pageScenes.getEvidenceStatusFixture(snapshot_ref, (runtime_session_ref) => this.runtimeSessions.isReadable(runtime_session_ref));
  }

  capturePreviewEvidence(runtime_session_ref: string, input: PreviewEvidenceInput = {}): PreviewEvidenceStatusFixture | PageSceneUnavailable {
    const capture = this.captureSnapshot(runtime_session_ref, {
      title: input.title ?? "Before preview fixture",
      url: input.url ?? "https://example.test/write-precheck",
      summary: input.summary ?? "Before-preview redacted target state.",
      capture_method: input.capture_method ?? "fixture",
      source_locator: input.source_locator ?? "fixture://before-preview",
      elements: input.elements ?? [{ label: "Contact form", role: "form", locator_hint: "form[data-webenvoy-fixture='contact']" }],
      evidence_policy: input.evidence_policy
    });
    if (capture.status !== "captured") {
      return capture;
    }
    return this.getPreviewEvidenceStatusFixture(capture.snapshot_ref, input.current_url);
  }

  getPreviewEvidenceStatusFixture(snapshot_ref: string, current_url?: string): PreviewEvidenceStatusFixture | PageSceneUnavailable {
    const scene = this.getCoreSceneReference(snapshot_ref);
    if ("status" in scene) {
      return scene;
    }
    const evidenceStatus = this.getEvidenceStatusFixture(snapshot_ref);
    if ("status" in evidenceStatus) {
      return evidenceStatus;
    }
    const observedUrl = current_url ?? scene.page_summary.url;
    const evidenceUnavailable = evidenceStatus.evidence_status.some((entry) =>
      entry.display_state === "expired" || entry.display_state === "missing" || entry.display_state === "unavailable"
    );
    const pageChanged = observedUrl !== scene.page_summary.url;
    const stale = evidenceStatus.scene_status.display_state === "stale";
    const state: PreviewEvidenceState = evidenceUnavailable ? "evidence_unavailable" : pageChanged ? "page_changed" : stale ? "stale_refmap" : "available";
    return {
      schema_version: HARBOR_PREVIEW_EVIDENCE_STATUS_FIXTURE_SCHEMA,
      runtime_session_ref: scene.runtime_session_ref,
      before_preview: scene,
      target_state_provenance: {
        snapshot_ref: scene.snapshot_ref,
        refmap_ref: scene.refmap_ref,
        source_trace_ref: scene.source_trace_ref,
        captured_at: scene.captured_at,
        captured_url: scene.page_summary.url,
        current_url: observedUrl,
        producer: "harbor_runtime_api"
      },
      freshness: {
        state,
        blocking_reason: state === "available" ? null : state === "stale_refmap" ? "refmap_stale" : state,
        retryable: state !== "available"
      },
      viewer_evidence_status: evidenceStatus,
      privacy_boundary: {
        raw_material: "not_exposed",
        export_boundary: "refs_and_redacted_status_only",
        credential_storage: "not_exposed"
      },
      unavailable: null
    };
  }

  getRedactedPreviewExportFixture(snapshot_ref: string, current_url?: string): RedactedPreviewExportFixture | PageSceneUnavailable {
    const preview = this.getPreviewEvidenceStatusFixture(snapshot_ref, current_url);
    if ("status" in preview) {
      return preview;
    }
    return {
      schema_version: HARBOR_REDACTED_PREVIEW_EXPORT_FIXTURE_SCHEMA,
      runtime_session_ref: preview.runtime_session_ref,
      before_preview_refs: {
        snapshot_ref: preview.before_preview.snapshot_ref,
        refmap_ref: preview.before_preview.refmap_ref,
        source_trace_ref: preview.before_preview.source_trace_ref,
        evidence_refs: preview.before_preview.evidence_refs
      },
      preview_state: preview.freshness.state,
      no_submit_guard: {
        status: "active",
        blocked_events: ["submit", "publish", "send", "delete", "pay"],
        enforcement: "facts_only_no_real_submit"
      },
      private_boundary: {
        local_capture_store: "process_memory_only",
        restricted_material: "not_exported",
        export_boundary: "redacted_preview_refs_only"
      },
      redacted_export: {
        page_summary: preview.before_preview.page_summary,
        evidence_status: preview.viewer_evidence_status.evidence_status
      },
      unavailable: null
    };
  }

  getViewerControlFacts(runtime_session_ref: string): ViewerControlFacts | ViewerControlUnavailable {
    return this.viewerControls.get(runtime_session_ref);
  }

  recordHandoff(runtime_session_ref: string, input: RecordHandoffInput): ViewerControlFacts | ViewerControlUnavailable {
    const result = this.viewerControls.recordHandoff(runtime_session_ref, input);
    if (!("status" in result)) {
      this.runtimeSessions.applyHandoff(runtime_session_ref, result.control);
    }
    return result;
  }

  getCoreRuntimeFacts(runtime_session_ref: string): CoreRuntimeFacts | ViewerControlUnavailable {
    const record = this.runtimeSessions.getRecord(runtime_session_ref);
    if (!record) {
      return { status: "unavailable", failure_class: "session_missing", message: "Runtime Session is missing.", retryable: true };
    }
    const viewerControl = this.viewerControls.get(runtime_session_ref);
    if ("status" in viewerControl) return viewerControl;
    return coreRuntimeFacts(record.facts, viewerControl);
  }

  getValidationRuntimeFacts(runtime_session_ref: string): ValidationRuntimeFacts | ViewerControlUnavailable {
    const facts = this.runtimeSessions.getValidationRuntimeFacts(runtime_session_ref);
    if (!facts) {
      return { status: "unavailable", failure_class: "session_missing", message: "Runtime Session is missing.", retryable: true };
    }
    return facts;
  }

  getWritePrecheckFacts(runtime_session_ref: string, input: WritePrecheckInput = {}): WritePrecheckFacts | ViewerControlUnavailable {
    const record = this.runtimeSessions.getRecord(runtime_session_ref);
    if (!record) {
      return { status: "unavailable", failure_class: "session_missing", message: "Runtime Session is missing.", retryable: true };
    }
    const capture = this.captureSnapshot(runtime_session_ref, {
      title: input.title ?? record.facts.current_page.title ?? "Write precheck target",
      url: input.url ?? record.facts.current_page.current_url ?? record.facts.current_page.requested_url,
      summary: input.summary ?? "Refs-only target state for validate-only write precheck.",
      capture_method: "provided_context",
      source_locator: `runtime-session://${runtime_session_ref}/write-precheck`,
      elements: [
        { label: input.target_label ?? "Write target", role: "form", locator_hint: input.locator_hint ?? "runtime-session://current-write-target" }
      ]
    });
    if (capture.status !== "captured") {
      return { status: "unavailable", failure_class: "viewer_unavailable", message: capture.message, retryable: capture.retryable };
    }
    const now = capture.core_scene_ref.captured_at;
    const target_ref = opaqueRef("writable-target");
    const fields = (input.fields ?? [
      { label: "Email", input_kind: "email", required: true, sensitivity: "sensitive", export_policy: "redacted", value_state: "redacted" },
      { label: "Message", input_kind: "textarea", required: true, sensitivity: "public", export_policy: "safe_summary", value_state: "present" },
      { label: "Password", input_kind: "password", required: false, sensitivity: "secret", export_policy: "never_export", value_state: "unavailable" }
    ]).map((field) => ({
      field_ref: opaqueRef("field"),
      target_ref,
      label: field.label,
      input_kind: field.input_kind ?? "text",
      required: field.required ?? false,
      sensitivity: field.sensitivity ?? "public",
      export_policy: field.export_policy ?? (field.sensitivity === "secret" ? "never_export" : "safe_summary"),
      value_state: field.value_state ?? (field.sensitivity === "secret" ? "unavailable" : "present")
    }));
    return {
      schema_version: HARBOR_WRITE_PRECHECK_FACTS_SCHEMA,
      runtime_session_ref,
      provider_ref: record.facts.provider_ref,
      profile_ref: record.facts.profile_ref,
      writable_target: {
        target_ref,
        runtime_session_ref,
        snapshot_ref: capture.snapshot_ref,
        refmap_ref: capture.refmap_ref ?? "",
        evidence_refs: capture.evidence_refs,
        role: "form",
        label: input.target_label ?? "Write target",
        locator_hint: input.locator_hint ?? "runtime-session://current-write-target",
        provenance: {
          source: "provided_context",
          captured_at: now
        }
      },
      submitted: false,
      form_state: {
        snapshot_ref: capture.snapshot_ref,
        fields,
        state_summary: "Field values are summarized as state only; raw values stay private."
      },
      pre_write_guard: {
        status: record.facts.lifecycle_state === "active" || record.facts.lifecycle_state === "idle" ? "active" : "blocked",
        no_submit_guard: "active",
        blocked_events: ["submit", "publish", "send", "delete", "pay"],
        enforcement: "facts_only_no_real_submit",
        runtime_ready: record.facts.lifecycle_state === "active" || record.facts.lifecycle_state === "idle",
        blocking_reasons: record.facts.current_error ? [record.facts.current_error] : []
      },
      privacy_boundary: {
        raw_values: "not_exposed",
        credential_profile_storage: "not_exposed",
        page_network_capture: "not_exposed",
        export_boundary: "refs_and_redacted_field_state_only"
      },
      unavailable: null
    };
  }

  getSessionWritePrecheckFacts(runtime_session_ref: string, input: WritePrecheckInput = {}): WritePrecheckFacts | ViewerControlUnavailable {
    return this.getWritePrecheckFacts(runtime_session_ref, sessionBoundWritePrecheckInput(input));
  }

  getSiteResourceFacts(runtime_session_ref: string, input: SiteResourceFactsInput = {}): SiteResourceFacts | SiteResourceFactsUnavailable {
    const record = this.runtimeSessions.getRecord(runtime_session_ref);
    if (!record) return missingSiteRuntimeSession(runtime_session_ref, input);
    const capture = this.captureSnapshot(runtime_session_ref, {
      title: record.facts.current_page.title ?? "Site resource facts",
      url: record.facts.current_page.current_url ?? record.facts.current_page.requested_url,
      summary: "Refs-only site resource facts for Core admission.",
      capture_method: "provided_context",
      source_locator: `runtime-session://${runtime_session_ref}/site-resource-facts`,
      elements: siteResourceElements(input)
    });
    return createSiteResourceFacts(record.facts, input, capture);
  }

  getAppRuntimeStatusFixture(runtime_session_ref: string): AppRuntimeStatusFixture | ViewerControlUnavailable {
    const record = this.runtimeSessions.getRecord(runtime_session_ref);
    if (!record) {
      return { status: "unavailable", failure_class: "session_missing", message: "Runtime Session is missing.", retryable: true };
    }
    const viewerControl = this.viewerControls.get(runtime_session_ref);
    if ("status" in viewerControl) return viewerControl;
    return appRuntimeStatusFixture(record.facts, viewerControl);
  }

  async closeSession(runtime_session_ref: string): Promise<RuntimeSessionFacts | null> {
    return this.runtimeSessions.closeSession(runtime_session_ref);
  }
}

function sessionBoundWritePrecheckInput(input: WritePrecheckInput): WritePrecheckInput {
  return {
    target_label: input.target_label,
    fields: input.fields
  };
}

export function defaultIdentitySiteUrl(site_id: string, origin: string): string {
  if (site_id === "xiaohongshu") return DEFAULT_IDENTITY_SITE_URLS.xiaohongshu;
  if (site_id === "boss") return DEFAULT_IDENTITY_SITE_URLS.boss;
  return origin;
}

function screenshotArtifact(screenshot: { screenshot_ref: string; mime_type: "image/png"; byte_length: number; sha256: string }): ScreenshotArtifactInput {
  return {
    artifact_ref: screenshot.screenshot_ref,
    mime_type: screenshot.mime_type,
    byte_length: screenshot.byte_length,
    sha256: screenshot.sha256
  };
}
