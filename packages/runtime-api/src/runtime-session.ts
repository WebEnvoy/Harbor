import {
  createLocalIdentityEnvironmentFacts,
  HARBOR_LOCAL_IDENTITY_ENVIRONMENT_SCHEMA,
  type LocalIdentityEnvironmentFacts,
  type LocalIdentityEnvironmentInput
} from "./identity-environment.js";
import { opaqueRef } from "./refs.js";
import { publicReadOperationTargetUrl } from "./read-operation.js";
import {
  HARBOR_RUNTIME_FACTS_SCHEMA,
  HARBOR_VALIDATION_RUNTIME_FACTS_SCHEMA,
  type CreateRuntimeSessionInput,
  type LocalProviderLauncher,
  type LocalProviderPageFacts,
  type LocalProviderReadProbeInput,
  type LocalProviderReadProbePublicSummary,
  type LocalProviderReadProbeResult,
  type LocalProviderScreenshotFacts,
  type LocalProviderSiteResourceProbeInput,
  type LocalProviderSiteResourceProbeResult,
  type OpenIdentityEnvironmentSessionInput,
  type RuntimeErrorCode,
  type RuntimeErrorFact,
  type RuntimeFact,
  type RuntimePageFacts,
  type RuntimeSessionControlInput,
  type RuntimeSessionFacts,
  type RuntimeSessionUnavailable,
  type RuntimeViewerEntry,
  type ValidationRuntimeFacts
} from "./runtime-session-types.js";
import { isTrustedLocalProviderReadProbe, isTrustedLocalProviderSiteResourceProbe } from "./read-operation-probe-trust.js";
import type {
  ControlOwner,
  ControlOwnerFacts,
  ViewerControlStore
} from "./viewer-control.js";

export {
  HARBOR_RUNTIME_FACTS_SCHEMA,
  HARBOR_VALIDATION_RUNTIME_FACTS_SCHEMA
} from "./runtime-session-types.js";
export type {
  AvailabilityState,
  CreateRuntimeSessionInput,
  FactSource,
  LifecycleState,
  LocalProviderLauncher,
  LocalProviderLaunchInput,
  LocalProviderLaunchResult,
  LocalProviderPageFacts,
  LocalProviderReadProbeInput,
  LocalProviderReadProbePublicSummary,
  LocalProviderReadProbeResult,
  LocalProviderScreenshotFacts,
  LocalProviderSiteResourceProbeInput,
  LocalProviderSiteResourceProbeResult,
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
} from "./runtime-session-types.js";

export interface RuntimeSessionRecord {
  facts: RuntimeSessionFacts;
  headless: boolean;
  identity_binding: {
    profile_storage_ref: string | null;
  };
  user_held_session: boolean;
  read_operation_user_confirmed: boolean;
  read_operation_user_release_pending: boolean;
  read_operation_user_handoff: boolean;
  execution_surface: "local_provider" | "fixture" | "unknown";
  openUrl?: (url: string) => Promise<LocalProviderPageFacts>;
  probeReadOperation?: (input: LocalProviderReadProbeInput) => Promise<LocalProviderReadProbeResult>;
  probeSiteResource?: (input: LocalProviderSiteResourceProbeInput) => Promise<LocalProviderSiteResourceProbeResult>;
  captureScreenshot?: () => Promise<LocalProviderScreenshotFacts | RuntimeErrorFact>;
  close?: () => Promise<void>;
}

const baselineFacts: RuntimeFact[] = [
  { key: "provider.mode", source: "configured", value: "local_dedicated_profile" },
  { key: "provider.binary_boundary", source: "configured", value: "user_provided_browser" },
  { key: "provider.license_boundary", source: "configured", value: "user_provided_local_browser_license" },
  { key: "provider.anti_detection_success", source: "provider_claim", value: "not_claimed" }
];

export class RuntimeSessionStore {
  private readonly records = new Map<string, RuntimeSessionRecord>();

  constructor(
    private readonly viewerControls: ViewerControlStore,
    private readonly launcher: LocalProviderLauncher
  ) {}

  async createSession(input: CreateRuntimeSessionInput = {}): Promise<RuntimeSessionFacts> {
    const now = new Date().toISOString();
    const provider_ref = input.provider_ref ?? opaqueRef("provider");
    const profile_ref = input.profile_ref ?? opaqueRef("profile");
    const requestedUrl = input.url ?? "about:blank";
    const controlOwner = input.control_owner ?? "system";
    const headless = input.headless ?? controlOwner !== "user";
    const launch = await this.launcher({
      browser_path: input.browser_path ?? "",
      headless,
      timeout_ms: input.timeout_ms ?? 5000,
      url: requestedUrl,
      profile_ref,
      profile_storage_ref: input.profile_storage_ref,
      provider_ref
    });
    const runtime_session_ref = opaqueRef("session");
    const ready = launch.status === "ready";
    const viewer_entry: RuntimeViewerEntry = ready ? launch.viewer_entry : {
      availability: "unsupported",
      access_mode: "none",
      transport: "not_applicable",
      input_capabilities: [],
      unavailable_reason: "unsupported"
    };
    const current_error = ready ? launch.page.error ?? null : launch.error;
    const current_page = ready ? pageFacts(requestedUrl, launch.page, now) : unavailablePage(requestedUrl, launch.error, now);
    const facts: RuntimeSessionFacts = {
      schema_version: HARBOR_RUNTIME_FACTS_SCHEMA,
      runtime_session_ref,
      identity_environment_ref: input.identity_environment_ref,
      execution_identity_ref: input.execution_identity_ref,
      profile_ref,
      provider_ref,
      provider_mode: "local_dedicated_profile",
      lifecycle_state: ready ? "active" : "failed",
      created_at: now,
      last_seen_at: now,
      availability: {
        cdp: ready ? "available" : "unavailable",
        viewer: viewerAvailabilityState(viewer_entry.availability),
        snapshot: "unavailable",
        evidence: "unavailable"
      },
      cdp_ref: ready ? launch.cdp_ref : undefined,
      viewer_entry,
      current_page,
      control_owner: ready ? controlOwner : "none",
      control_lock: {
        owner: ready ? controlOwner : "none",
        state: ready ? "held" : "released",
        holder_ref: ready ? input.holder_ref ?? controlOwner : null,
        updated_at: now,
        conflict_error: null
      },
      current_error,
      facts: [...baselineFacts, ...launch.facts]
    };
    const viewerControl = this.viewerControls.create(facts, now);
    facts.viewer_ref = viewerControl.viewer.viewer_ref;
    facts.facts.push(
      { key: "page.requested_url", source: "configured", value: requestedUrl },
      { key: "page.current_url", source: ready ? "observed" : "configured", value: current_page.current_url ?? "unavailable" },
      { key: "page.title", source: ready ? "observed" : "configured", value: current_page.title ?? "unavailable" },
      { key: "page.status", source: ready ? "observed" : "configured", value: current_page.status },
      { key: "viewer.ref", source: "configured", value: viewerControl.viewer.viewer_ref },
      { key: "viewer.availability", source: "configured", value: viewerControl.viewer.availability },
      { key: "viewer.transport", source: "configured", value: viewerControl.viewer.transport },
      { key: "control.owner", source: "configured", value: viewerControl.control.owner },
      { key: "control.lock_state", source: "configured", value: facts.control_lock.state },
      { key: "lifecycle.reference.donut_browser", source: "configured", value: "mechanism_reference_only" }
    );
    this.records.set(runtime_session_ref, {
      facts,
      headless,
      identity_binding: {
        profile_storage_ref: input.profile_storage_ref ?? null
      },
      // HTTP session creation carries no authenticated user-handoff fact.
      user_held_session: false,
      read_operation_user_confirmed: false,
      read_operation_user_release_pending: false,
      read_operation_user_handoff: false,
      execution_surface: ready ? launch.execution_surface ?? "unknown" : "unknown",
      openUrl: ready ? launch.openUrl : undefined,
      probeReadOperation: ready ? launch.probeReadOperation : undefined,
      probeSiteResource: ready ? launch.probeSiteResource : undefined,
      captureScreenshot: ready ? launch.captureScreenshot : undefined,
      close: ready ? launch.close : undefined
    });
    return snapshot(facts);
  }

  getSession(runtime_session_ref: string): RuntimeSessionFacts | null {
    const facts = this.records.get(runtime_session_ref)?.facts;
    return facts ? snapshot(facts) : null;
  }

  getRecord(runtime_session_ref: string): RuntimeSessionRecord | undefined {
    return this.records.get(runtime_session_ref);
  }

  async openIdentityEnvironmentSession(input: OpenIdentityEnvironmentSessionInput): Promise<RuntimeSessionFacts | RuntimeSessionUnavailable> {
    const urlError = validateRuntimeUrl(input.url);
    if (urlError) return unavailableSession("url_unreachable", urlError);

    const identityEnvironment = isLocalIdentityEnvironmentFacts(input.identity_environment)
      ? input.identity_environment
      : createLocalIdentityEnvironmentFacts(input.identity_environment);
    const identityError = identityEnvironmentUnavailable(identityEnvironment);
    if (identityError) return unavailableSession("identity_environment_unavailable", identityError);

    const owner = input.control_owner ?? "agent";
    const holder = input.holder_ref ?? owner;
    const headless = input.headless ?? owner !== "user";
    const existing = input.reuse_existing === false
      ? null
      : this.findIdentitySession(
        identityEnvironment.profile_ref,
        identityEnvironment.identity_environment_ref,
        identityEnvironment.execution_identity_ref
      );
    if (existing && (
      existing.headless === headless ||
      (owner === "core_task" && !existing.headless &&
        (existing.read_operation_user_release_pending || existing.read_operation_user_confirmed))
    )) {
      const conflict = this.acquireControl(existing, owner, holder);
      if (conflict) return conflict;
      if (existing.openUrl) this.applyPageFacts(existing, input.url, await existing.openUrl(input.url));
      return snapshot(existing.facts);
    }

    if (existing) {
      if (
        existing.read_operation_user_release_pending &&
        owner !== "core_task" &&
        !(owner === "user" && existing.headless && !headless)
      ) return lockConflict(existing, owner);
      if (hasControlConflict(existing, owner, holder)) return lockConflict(existing, owner);
      try {
        const closed = await this.closeSession(existing.facts.runtime_session_ref);
        if (closed?.lifecycle_state !== "closed") return cleanupFailed();
      } catch {
        return cleanupFailed();
      }
    }

    return this.createSession({
      ...input,
      url: input.url,
      identity_environment_ref: identityEnvironment.identity_environment_ref,
      execution_identity_ref: identityEnvironment.execution_identity_ref,
      profile_ref: identityEnvironment.profile_ref,
      profile_storage_ref: identityEnvironment.browser_storage.profile_storage_ref,
      control_owner: owner,
      holder_ref: holder,
      headless
    });
  }

  lockSession(runtime_session_ref: string, input: RuntimeSessionControlInput = {}): RuntimeSessionFacts | RuntimeSessionUnavailable {
    const record = this.records.get(runtime_session_ref);
    if (!record) return unavailableSession("session_missing", error("session_lost", "Runtime Session is missing.", true));
    const conflict = this.acquireControl(record, input.control_owner ?? "user", input.holder_ref ?? input.control_owner ?? "user");
    if (conflict) return conflict;
    const now = new Date().toISOString();
    record.facts.lifecycle_state = "locked";
    record.facts.last_seen_at = now;
    record.facts.control_lock.state = "held";
    record.facts.control_lock.updated_at = now;
    record.facts.facts.push({ key: "session.lock", source: "observed", value: record.facts.control_owner });
    return snapshot(record.facts);
  }

  releaseSession(runtime_session_ref: string, input: RuntimeSessionControlInput = {}): RuntimeSessionFacts | RuntimeSessionUnavailable {
    const record = this.records.get(runtime_session_ref);
    if (!record) return unavailableSession("session_missing", error("session_lost", "Runtime Session is missing.", true));
    const owner = input.control_owner;
    if (owner && record.facts.control_lock.owner !== owner && record.facts.control_lock.state === "held") return lockConflict(record, owner);

    const confirmedReadControllerRelease = record.read_operation_user_confirmed &&
      record.facts.control_lock.state === "held" && (
        (record.facts.control_owner === "user" && record.facts.control_lock.owner === "user") ||
        (record.read_operation_user_handoff && record.facts.control_owner === "core_task" && record.facts.control_lock.owner === "core_task")
      );
    const now = new Date().toISOString();
    record.facts.lifecycle_state = "idle";
    record.facts.last_seen_at = now;
    record.facts.control_owner = "none";
    record.facts.control_lock = {
      owner: "none",
      state: "released",
      holder_ref: null,
      updated_at: now,
      conflict_error: null
    };
    record.user_held_session = false;
    record.read_operation_user_release_pending = confirmedReadControllerRelease;
    record.read_operation_user_handoff = false;
    this.viewerControls.recordHandoff(runtime_session_ref, { control_owner: "none" });
    record.facts.facts.push({ key: "session.release", source: "observed", value: owner ?? "unscoped" });
    return snapshot(record.facts);
  }

  async stopSession(runtime_session_ref: string, input: RuntimeSessionControlInput = {}): Promise<RuntimeSessionFacts | RuntimeSessionUnavailable> {
    const record = this.records.get(runtime_session_ref);
    if (!record) return unavailableSession("session_missing", error("session_lost", "Runtime Session is missing.", true));
    const owner = input.control_owner;
    if (owner && record.facts.control_lock.owner !== owner && record.facts.control_lock.state === "held") return lockConflict(record, owner);
    return (await this.closeSession(runtime_session_ref)) ?? unavailableSession("session_missing", error("session_lost", "Runtime Session is missing.", true));
  }

  async closeSession(runtime_session_ref: string): Promise<RuntimeSessionFacts | null> {
    const record = this.records.get(runtime_session_ref);
    if (!record) return null;
    await record.close?.();
    const now = new Date().toISOString();
    record.facts.lifecycle_state = "closed";
    record.facts.closed_at = now;
    record.facts.last_seen_at = now;
    record.facts.availability.cdp = "unavailable";
    record.facts.availability.viewer = "unavailable";
    record.facts.availability.snapshot = "unavailable";
    record.facts.control_owner = "none";
    record.facts.control_lock = {
      owner: "none",
      state: "closed",
      holder_ref: null,
      updated_at: now,
      conflict_error: null
    };
    record.user_held_session = false;
    record.read_operation_user_release_pending = false;
    record.read_operation_user_handoff = false;
    record.facts.current_page = { ...record.facts.current_page, status: "unavailable", observed_at: now };
    this.viewerControls.markClosed(runtime_session_ref, now);
    return snapshot(record.facts);
  }

  markSnapshotCaptured(runtime_session_ref: string, captured_at: string, evidence_refs: readonly string[]): void {
    const record = this.records.get(runtime_session_ref);
    if (!record) return;
    record.facts.last_seen_at = captured_at;
    record.facts.availability.snapshot = "available";
    record.facts.availability.evidence = "available";
    record.facts.facts.push(
      { key: "snapshot.capture", source: "observed", value: "available", evidence_ref: evidence_refs[0] },
      { key: "evidence.capture", source: "validation_evidence", value: "refs_available", evidence_ref: evidence_refs[1] }
    );
  }

  applyHandoff(runtime_session_ref: string, control: Pick<ControlOwnerFacts, "owner" | "previous_owner" | "handoff_reason" | "takeover" | "updated_at">): void {
    const record = this.records.get(runtime_session_ref);
    if (!record) return;
    record.facts.control_owner = control.owner;
    record.facts.last_seen_at = control.updated_at;
    record.facts.control_lock = {
      owner: control.owner,
      state: control.owner === "none" ? "released" : "held",
      holder_ref: control.owner === "user" ? "harbor_mediated_user" : control.owner === "none" ? null : control.owner,
      updated_at: control.updated_at,
      conflict_error: null
    };
    // Only the server-owned handoff path calls applyHandoff; create/lock input
    // must never be treated as proof that a user held this session.
    record.user_held_session = control.owner === "user" && isInteractiveUserViewer(record.facts);
    record.read_operation_user_release_pending = false;
    record.read_operation_user_handoff = record.read_operation_user_confirmed &&
      control.previous_owner === "user" &&
      control.owner === "core_task";
    record.facts.facts.push(
      { key: "control.owner", source: "observed", value: control.owner },
      { key: "handoff.reason", source: "observed", value: control.handoff_reason ?? "none" },
      { key: "takeover.available", source: "observed", value: String(control.takeover.available) }
    );
  }

  isTrustedUserHeldSession(runtime_session_ref: string): boolean {
    const record = this.records.get(runtime_session_ref);
    return !!record && record.user_held_session && isInteractiveUserViewer(record.facts);
  }

  isSupervisorConfirmableLocalProviderUserSession(runtime_session_ref: string): boolean {
    const record = this.records.get(runtime_session_ref);
    return !!record && hasHeldUserLock(record) && record.execution_surface === "local_provider";
  }

  markReadOperationUserConfirmed(runtime_session_ref: string): void {
    const record = this.records.get(runtime_session_ref);
    if (!record || (!this.isTrustedUserHeldSession(runtime_session_ref) && !this.isSupervisorConfirmableLocalProviderUserSession(runtime_session_ref))) return;
    record.user_held_session = true;
    record.read_operation_user_confirmed = true;
    record.read_operation_user_release_pending = false;
    record.read_operation_user_handoff = false;
  }

  getValidationRuntimeFacts(runtime_session_ref: string): ValidationRuntimeFacts | null {
    const record = this.records.get(runtime_session_ref);
    if (!record) return null;
    return {
      schema_version: HARBOR_VALIDATION_RUNTIME_FACTS_SCHEMA,
      runtime_session_ref,
      provider_ref: record.facts.provider_ref,
      profile_ref: record.facts.profile_ref,
      validation_refs: record.facts.facts.flatMap((fact) => fact.evidence_ref ? [fact.evidence_ref] : []),
      runtime_ready: record.facts.lifecycle_state === "active" || record.facts.lifecycle_state === "idle",
      blocking_reasons: record.facts.current_error ? [record.facts.current_error] : [],
      availability: snapshot(record.facts.availability),
      unavailable: null
    };
  }

  isReadable(runtime_session_ref: string): boolean {
    const lifecycle = this.records.get(runtime_session_ref)?.facts.lifecycle_state;
    return lifecycle === "active" || lifecycle === "idle";
  }

  async probeReadOperation(
    runtime_session_ref: string,
    input: LocalProviderReadProbeInput
  ): Promise<LocalProviderReadProbeResult> {
    const record = this.records.get(runtime_session_ref);
    if (!record) {
      return {
        status: "unavailable",
        failure_class: "provider_probe_unavailable",
        message: "Runtime Session is missing.",
        retryable: true
      };
    }
    if (record.execution_surface === "fixture") {
      return {
        status: "unavailable",
        failure_class: "fixture_runtime",
        message: "Fixture launchers cannot execute allowlisted read operations.",
        retryable: false
      };
    }
    const probeReadOperation = record.probeReadOperation;
    if (record.execution_surface !== "local_provider" || !isTrustedLocalProviderReadProbe(probeReadOperation)) {
      return {
        status: "unavailable",
        failure_class: "evidence_refs_missing",
        message: "The managed local provider does not expose a trusted read-only probe adapter.",
        retryable: false
      };
    }
    const result = await probeReadOperation(input);
    if (result.page) this.applyPageFacts(record, publicReadOperationTargetUrl(input.operation_id, input.target_url), result.page);
    return result;
  }

  async probeSiteResource(
    runtime_session_ref: string,
    input: LocalProviderSiteResourceProbeInput
  ): Promise<LocalProviderSiteResourceProbeResult> {
    const record = this.records.get(runtime_session_ref);
    const probe = record?.probeSiteResource;
    if (!record || record.execution_surface !== "local_provider" || !isTrustedLocalProviderSiteResourceProbe(probe)) {
      return {
        status: "unknown",
        failure_class: "provider_probe_unavailable",
        message: "The managed local provider does not expose a trusted site-resource probe."
      };
    }
    return probe(input);
  }

  private findIdentitySession(
    profile_ref: string,
    identity_environment_ref: string,
    execution_identity_ref: string
  ): RuntimeSessionRecord | null {
    for (const record of this.records.values()) {
      if (
        record.facts.profile_ref === profile_ref &&
        record.facts.identity_environment_ref === identity_environment_ref &&
        record.facts.execution_identity_ref === execution_identity_ref &&
        record.facts.lifecycle_state !== "closed" &&
        record.facts.lifecycle_state !== "failed" &&
        record.facts.lifecycle_state !== "expired"
      ) {
        return record;
      }
    }
    return null;
  }

  private acquireControl(record: RuntimeSessionRecord, owner: ControlOwner, holder_ref: string): RuntimeSessionUnavailable | null {
    if (hasControlConflict(record, owner, holder_ref)) return lockConflict(record, owner);
    if (record.read_operation_user_release_pending && owner !== "core_task") return lockConflict(record, owner);
    const now = new Date().toISOString();
    record.facts.lifecycle_state = "active";
    record.facts.last_seen_at = now;
    record.facts.control_owner = owner;
    record.facts.control_lock = {
      owner,
      state: "held",
      holder_ref,
      updated_at: now,
      conflict_error: null
    };
    record.user_held_session = false;
    record.read_operation_user_handoff = record.read_operation_user_release_pending && owner === "core_task";
    record.read_operation_user_release_pending = false;
    this.viewerControls.recordHandoff(record.facts.runtime_session_ref, { control_owner: owner });
    record.facts.facts.push(
      { key: "session.reuse", source: "observed", value: "same_profile_session" },
      { key: "control.owner", source: "observed", value: owner },
      { key: "control.lock_state", source: "observed", value: "held" }
    );
    return null;
  }

  private applyPageFacts(record: RuntimeSessionRecord, requested_url: string, page: LocalProviderPageFacts): void {
    const now = new Date().toISOString();
    record.facts.current_page = pageFacts(requested_url, page, now);
    record.facts.last_seen_at = now;
    record.facts.current_error = page.error ?? null;
    if (page.error) record.facts.lifecycle_state = "failed";
    record.facts.facts.push(
      ...page.facts,
      { key: "page.requested_url", source: "configured", value: requested_url },
      { key: "page.current_url", source: "observed", value: record.facts.current_page.current_url ?? "unavailable" },
      { key: "page.title", source: "observed", value: record.facts.current_page.title ?? "unavailable" },
      { key: "page.status", source: "observed", value: record.facts.current_page.status }
    );
  }
}

function unavailableSession(failure_class: RuntimeSessionUnavailable["failure_class"], current_error: RuntimeErrorFact): RuntimeSessionUnavailable {
  return {
    status: "unavailable",
    failure_class,
    message: current_error.message,
    retryable: current_error.retryable,
    current_error
  };
}

function error(code: RuntimeErrorCode, message: string, retryable = true): RuntimeErrorFact {
  return { code, message, retryable };
}

function lockConflict(record: RuntimeSessionRecord, requestedOwner: ControlOwner): RuntimeSessionUnavailable {
  const current_error = error(
    "session_locked",
    `Runtime Session is controlled by ${record.facts.control_lock.owner}; ${requestedOwner} cannot take it without release.`,
    true
  );
  record.facts.current_error = current_error;
  record.facts.control_lock.conflict_error = current_error;
  return unavailableSession("session_locked", current_error);
}

function hasControlConflict(record: RuntimeSessionRecord, owner: ControlOwner, holder_ref: string): boolean {
  return record.facts.control_lock.state === "held" &&
    (record.facts.control_lock.owner !== owner || record.facts.control_lock.holder_ref !== holder_ref);
}

function cleanupFailed(): RuntimeSessionUnavailable {
  return unavailableSession(
    "session_cleanup_failed",
    error("session_cleanup_failed", "The incompatible Runtime Session could not be closed safely.", true)
  );
}

function validateRuntimeUrl(url: string): RuntimeErrorFact | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "about:") return null;
  } catch {
    return error("url_unreachable", `URL is invalid and cannot be opened: ${url}`, false);
  }
  return error("url_unreachable", `URL scheme is unsupported for browser launch: ${url}`, false);
}

function isLocalIdentityEnvironmentFacts(value: LocalIdentityEnvironmentInput | LocalIdentityEnvironmentFacts): value is LocalIdentityEnvironmentFacts {
  return "schema_version" in value && value.schema_version === HARBOR_LOCAL_IDENTITY_ENVIRONMENT_SCHEMA;
}

function identityEnvironmentUnavailable(identityEnvironment: LocalIdentityEnvironmentFacts): RuntimeErrorFact | null {
  if (!identityEnvironment.profile_ref) return error("identity_environment_unavailable", "Identity environment has no profile_ref.", false);
  return null;
}

function pageFacts(requested_url: string, page: LocalProviderPageFacts, observed_at: string): RuntimePageFacts {
  return {
    requested_url,
    current_url: page.current_url,
    title: page.title,
    status: page.status,
    error_reason: page.error ?? null,
    observed_at
  };
}

function viewerAvailabilityState(availability: RuntimeViewerEntry["availability"]): RuntimeSessionFacts["availability"]["viewer"] {
  if (availability === "available") return "available";
  if (availability === "permission_denied") return "policy_denied";
  return availability === "unsupported" ? "unsupported" : "unavailable";
}

function isInteractiveUserViewer(facts: RuntimeSessionFacts): boolean {
  return facts.viewer_entry?.availability === "available" &&
    facts.viewer_entry.access_mode === "interactive" &&
    facts.viewer_entry.input_capabilities.includes("keyboard_mouse");
}

function hasHeldUserLock(record: RuntimeSessionRecord): boolean {
  return record.facts.control_owner === "user" &&
    record.facts.control_lock.owner === "user" &&
    record.facts.control_lock.state === "held";
}

function unavailablePage(requested_url: string, current_error: RuntimeErrorFact, observed_at: string): RuntimePageFacts {
  return {
    requested_url,
    current_url: null,
    title: null,
    status: "unavailable",
    error_reason: current_error,
    observed_at
  };
}

function snapshot<T>(value: T): T {
  return structuredClone(value);
}
