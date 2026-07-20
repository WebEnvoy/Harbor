import { CloakBrowserReleaseError } from "./cloakbrowser-release.js";
import {
  HARBOR_MANAGED_PROVIDER_LIFECYCLE_SCHEMA,
  type ManagedProviderLifecycleError,
  type ManagedProviderLifecycleProgress,
  type ManagedProviderLifecycleState,
  type ManagedProviderLifecycleStatus
} from "./managed-provider-lifecycle-types.js";

export function baseStatus(
  state: "missing" | "ready" | "damaged",
  version: string | null,
  ownership: "harbor" | "external_override",
  platform: string | null,
  checkedAt: string
): ManagedProviderLifecycleStatus {
  const actions: ManagedProviderLifecycleStatus["available_actions"] = ownership === "external_override"
    ? ["recheck", "open_external_management"]
    : state === "ready" ? ["update", "repair", "recheck"] : state === "damaged" ? ["repair", "recheck"] : ["install", "recheck"];
  return {
    schema_version: HARBOR_MANAGED_PROVIDER_LIFECYCLE_SCHEMA,
    provider_id: "cloakbrowser",
    management_mode: ownership === "external_override" ? "external" : "managed",
    ownership,
    state,
    installed_version: version,
    target_version: null,
    release_boundary: {
      source: "cloakbrowser_official_release",
      channel: "free",
      platform,
      integrity: "ed25519_sha256_required",
      distribution: "end_user_direct_download",
      license: "upstream_binary_license"
    },
    checked_at: checkedAt,
    operation: null,
    result: null,
    error: null,
    available_actions: actions,
    public_boundary: { raw_logs: "not_exposed", binary_path: "not_exposed", checksum: "not_exposed", profile_storage: "isolated_temporary_only" }
  };
}

export function progress(phase: ManagedProviderLifecycleState, completedSteps: number): ManagedProviderLifecycleProgress {
  return { phase, completed_steps: completedSteps, total_steps: 5, downloaded_bytes: 0, total_bytes: null, percent: null };
}

export function result(
  status: "succeeded" | "cancelled" | "failed",
  operationId: string,
  version: string | null,
  integrityVerified: boolean,
  launchVerified: boolean,
  rolledBack: boolean
): NonNullable<ManagedProviderLifecycleStatus["result"]> {
  return { status, operation_id: operationId, installed_version: version, integrity_verified: integrityVerified, launch_verified: launchVerified, rolled_back: rolledBack };
}

export function error(
  code: ManagedProviderLifecycleError["code"],
  message: string,
  retryable: boolean,
  recoveryActions: ManagedProviderLifecycleError["recovery_actions"]
): ManagedProviderLifecycleError {
  return { code, message, retryable, recovery_actions: recoveryActions };
}

export function publicError(cause: unknown, phase: ManagedProviderLifecycleState, launchVerified: boolean): ManagedProviderLifecycleError {
  if (isLifecycleError(cause)) return cause;
  if (cause instanceof CloakBrowserReleaseError) {
    const code = cause.code;
    const recovery = code === "unsupported_platform" ? ["recheck"] as const : code === "install_failed" ? ["repair", "recheck"] as const : ["retry", "recheck"] as const;
    return error(code, cause.message, code !== "unsupported_platform", [...recovery]);
  }
  return phase === "launch_verifying" && !launchVerified
    ? error("launch_verification_failed", "CloakBrowser could not complete isolated launch verification.", true, ["repair", "recheck"])
    : error("install_failed", "The verified CloakBrowser release could not be installed.", true, ["repair", "recheck"]);
}

function isLifecycleError(value: unknown): value is ManagedProviderLifecycleError {
  return Boolean(value && typeof value === "object" && "code" in value && "recovery_actions" in value);
}
