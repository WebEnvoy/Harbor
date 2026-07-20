import { randomUUID } from "node:crypto";
import { access, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { arch as hostArch, homedir, platform as hostPlatform } from "node:os";
import { join, relative } from "node:path";
import {
  CloakBrowserReleaseError,
  cloakBrowserPlatformTag,
  defaultCloakBrowserVersion,
  installCloakBrowserRelease,
  isCloakBrowserVersion,
  latestCloakBrowserVersion,
} from "./cloakbrowser-release.js";
import { verifyLocalProviderLaunch } from "./local-provider-launcher.js";
import {
  HARBOR_MANAGED_PROVIDER_LIFECYCLE_SCHEMA,
  type ManagedProviderLifecycleCommandResult,
  type ManagedProviderLifecycleError,
  type ManagedProviderLifecycleOptions,
  type ManagedProviderLifecycleProgress,
  type ManagedProviderLifecycleState,
  type ManagedProviderLifecycleStatus,
  type ManagedProviderOperationInput
} from "./managed-provider-lifecycle-types.js";
import { detectBrowserProviders, type BrowserProviderDetectionInput } from "./provider-management.js";

export { HARBOR_MANAGED_PROVIDER_LIFECYCLE_SCHEMA, isManagedProviderOperationInput } from "./managed-provider-lifecycle-types.js";
export type {
  ManagedProviderLifecycleCommandResult,
  ManagedProviderLifecycleError,
  ManagedProviderLifecycleOptions,
  ManagedProviderLifecycleProgress,
  ManagedProviderLifecycleState,
  ManagedProviderLifecycleStatus,
  ManagedProviderOperationInput,
  ManagedProviderOperationKind
} from "./managed-provider-lifecycle-types.js";

interface BeforeOperation {
  state: "missing" | "ready" | "update_available" | "damaged";
  version: string | null;
}

const activeStates = new Set<ManagedProviderLifecycleState>([
  "detecting", "downloading", "verifying", "installing", "launch_verifying", "cancelling"
]);

export class ManagedProviderLifecycle {
  private readonly cacheDir: string;
  private readonly env: Record<string, string | undefined>;
  private readonly platform: NodeJS.Platform;
  private readonly arch: string;
  private readonly installRelease: NonNullable<ManagedProviderLifecycleOptions["install_release"]>;
  private readonly resolveLatestVersion: NonNullable<ManagedProviderLifecycleOptions["resolve_latest_version"]>;
  private readonly verifyLaunch: NonNullable<ManagedProviderLifecycleOptions["verify_launch"]>;
  private readonly now: () => Date;
  private current: ManagedProviderLifecycleStatus;
  private controller: AbortController | null = null;
  private running: Promise<void> | null = null;

  constructor(options: ManagedProviderLifecycleOptions = {}) {
    this.env = options.env ?? process.env;
    this.platform = options.platform ?? hostPlatform();
    this.arch = options.arch ?? hostArch();
    this.cacheDir = options.cache_dir ?? this.env.CLOAKBROWSER_CACHE_DIR ?? join(this.env.HOME ?? homedir(), ".cloakbrowser");
    this.installRelease = options.install_release ?? installCloakBrowserRelease;
    this.resolveLatestVersion = options.resolve_latest_version ?? latestCloakBrowserVersion;
    this.verifyLaunch = options.verify_launch ?? ((binaryPath) => verifyLocalProviderLaunch(binaryPath));
    this.now = options.now ?? (() => new Date());
    this.current = this.detectStatus();
  }

  status(): ManagedProviderLifecycleStatus {
    return structuredClone(this.current);
  }

  async recheck(): Promise<ManagedProviderLifecycleStatus> {
    if (this.running) return this.status();
    const previousResult = this.current.result;
    this.current = this.detectStatus();
    this.current.result = previousResult;
    if (this.current.state === "ready" && this.current.ownership === "harbor") {
      const latest = await this.resolveLatestVersion(this.platform, this.arch);
      if (latest && this.current.installed_version && versionNewer(latest, this.current.installed_version)) {
        this.current.state = "update_available";
        this.current.target_version = latest;
        this.current.available_actions = ["update", "repair", "recheck"];
      }
    }
    return this.status();
  }

  start(input: ManagedProviderOperationInput): ManagedProviderLifecycleCommandResult {
    if (!this.running) {
      const result = this.current.result;
      const targetVersion = this.current.state === "update_available" ? this.current.target_version : null;
      this.current = this.detectStatus();
      this.current.result = result;
      if (targetVersion && this.current.state === "ready") {
        this.current.state = "update_available";
        this.current.target_version = targetVersion;
        this.current.available_actions = ["update", "repair", "recheck"];
      }
    }
    const rejection = this.operationRejection(input);
    if (rejection) return this.rejected(rejection);
    const before = this.beforeOperation();
    const operationId = `provider_operation_${randomUUID()}`;
    this.controller = new AbortController();
    this.current = {
      ...this.current,
      state: "detecting",
      target_version: input.version ?? null,
      checked_at: this.timestamp(),
      operation: {
        operation_id: operationId,
        kind: input.operation,
        before_state: before.state,
        cancellable: true,
        cancel_requested: false,
        progress: progress("detecting", 0)
      },
      result: null,
      error: null,
      available_actions: ["cancel", "recheck"]
    };
    this.running = this.runOperation(input, before, operationId, this.controller.signal)
      .finally(() => {
        this.controller = null;
        this.running = null;
      });
    return { accepted: true, lifecycle: this.status() };
  }

  cancel(): ManagedProviderLifecycleCommandResult {
    if (!this.controller || !this.current.operation?.cancellable) {
      return this.rejected(error("not_cancellable", "The provider operation cannot be cancelled in its current phase.", true, ["recheck"]));
    }
    this.current.state = "cancelling";
    this.current.operation.cancel_requested = true;
    this.current.operation.cancellable = false;
    this.current.operation.progress.phase = "cancelling";
    this.current.checked_at = this.timestamp();
    this.controller.abort(new DOMException("The provider operation was cancelled.", "AbortError"));
    return { accepted: true, lifecycle: this.status() };
  }

  async close(): Promise<void> {
    this.controller?.abort(new DOMException("Harbor Runtime is closing.", "AbortError"));
    await this.running;
  }

  private async runOperation(input: ManagedProviderOperationInput, before: BeforeOperation, operationId: string, signal: AbortSignal): Promise<void> {
    let stagingDir = "";
    let targetDir = "";
    let backupDir = "";
    let targetInstalled = false;
    let backupCreated = false;
    let integrityVerified = false;
    let launchVerified = false;
    try {
      const version = await this.targetVersion(input, before);
      this.current.target_version = version;
      await mkdir(this.cacheDir, { recursive: true });
      stagingDir = join(this.cacheDir, `.harbor-staging-${operationId}`);
      targetDir = join(this.cacheDir, `chromium-${version}`);
      backupDir = join(this.cacheDir, `.harbor-backup-${operationId}`);
      const installed = await this.installRelease({
        version,
        platform: this.platform,
        arch: this.arch,
        destination_dir: stagingDir,
        signal,
        on_progress: (update) => this.updateDownloadProgress(update.phase, update.downloaded_bytes, update.total_bytes)
      });
      integrityVerified = true;
      this.setPhase("installing", 3, false);
      if (await pathExists(targetDir)) {
        await rename(targetDir, backupDir);
        backupCreated = true;
      }
      await rename(stagingDir, targetDir);
      targetInstalled = true;
      const finalBinary = join(targetDir, relative(stagingDir, installed.binary_path));
      await access(finalBinary);
      this.setPhase("launch_verifying", 4, false);
      await this.verifyLaunch(finalBinary);
      launchVerified = true;
      await this.writeVersionMarker(version);
      await rm(backupDir, { recursive: true, force: true });
      this.completeSuccess(operationId, version);
    } catch (cause) {
      const rolledBack = await this.rollback(targetDir, backupDir, targetInstalled, backupCreated);
      if (signal.aborted) this.completeCancellation(operationId, rolledBack);
      else this.completeFailure(operationId, cause, rolledBack, integrityVerified, launchVerified);
    } finally {
      if (stagingDir) await rm(stagingDir, { recursive: true, force: true });
      if (backupDir) await rm(backupDir, { recursive: true, force: true });
    }
  }

  private async targetVersion(input: ManagedProviderOperationInput, before: BeforeOperation): Promise<string> {
    if (input.version) return input.version;
    if (input.operation === "repair" && before.version) return before.version;
    if (input.operation === "update") {
      const latest = await this.resolveLatestVersion(this.platform, this.arch);
      if (latest) return latest;
      throw error("install_source_unavailable", "No signed CloakBrowser update is available for this platform.", true, ["retry", "recheck"]);
    }
    const version = defaultCloakBrowserVersion(this.platform, this.arch);
    if (!version) throw error("unsupported_platform", "Managed CloakBrowser is unsupported on this OS and architecture.", false, ["recheck"]);
    return version;
  }

  private operationRejection(input: ManagedProviderOperationInput): ManagedProviderLifecycleError | null {
    if (this.running || activeStates.has(this.current.state)) return error("busy", "Another provider operation is already active.", true, ["recheck"]);
    if (this.current.ownership === "external_override") {
      return error("externally_managed", "The configured CloakBrowser binary is externally managed and will not be replaced by Harbor.", false, ["open_external_management", "recheck"]);
    }
    if (input.version && !isCloakBrowserVersion(input.version)) {
      return error("install_source_unavailable", "The requested CloakBrowser version is invalid.", false, ["recheck"]);
    }
    if (input.operation === "install" && (this.current.state === "ready" || this.current.state === "update_available")) {
      return error("already_ready", "CloakBrowser is already ready; use update or repair.", false, ["recheck"]);
    }
    if ((input.operation === "update" || input.operation === "repair") && this.current.state === "missing") {
      return error("not_installed", "CloakBrowser must be installed before it can be updated or repaired.", true, ["recheck"]);
    }
    return null;
  }

  private detectStatus(): ManagedProviderLifecycleStatus {
    const override = this.env.HARBOR_CLOAKBROWSER_PATH ?? this.env.CLOAKBROWSER_BINARY_PATH;
    const detection: BrowserProviderDetectionInput = {
      env: {
        ...this.env,
        HARBOR_CLOAKBROWSER_PATH: override,
        CLOAKBROWSER_BINARY_PATH: override,
        CLOAKBROWSER_CACHE_DIR: this.cacheDir
      },
      platform: this.platform,
      arch: this.arch
    };
    const provider = detectBrowserProviders(detection).providers[0]!;
    const state = provider.install.status === "installed"
      ? provider.install.launchability === "launchable" ? "ready" : "damaged"
      : provider.install.status === "path_invalid" ? "damaged" : "missing";
    const ownership = override ? "external_override" : "harbor";
    return baseStatus(state, provider.install.version, ownership, cloakBrowserPlatformTag(this.platform, this.arch), this.timestamp());
  }

  private beforeOperation(): BeforeOperation {
    const detected = this.detectStatus();
    const state: BeforeOperation["state"] = this.current.state === "update_available" && detected.state === "ready"
      ? "update_available"
      : detected.state === "ready" || detected.state === "damaged" ? detected.state : "missing";
    return { state, version: detected.installed_version };
  }

  private updateDownloadProgress(phase: "downloading" | "verifying", downloaded: number, total: number | null): void {
    if (!this.current.operation) return;
    this.current.state = phase;
    this.current.operation.cancellable = true;
    this.current.operation.progress = {
      phase,
      completed_steps: phase === "downloading" ? 1 : 2,
      total_steps: 5,
      downloaded_bytes: downloaded,
      total_bytes: total,
      percent: total ? Math.min(100, Math.floor(downloaded / total * 100)) : null
    };
    this.current.checked_at = this.timestamp();
  }

  private setPhase(phase: ManagedProviderLifecycleState, completedSteps: number, cancellable: boolean): void {
    if (!this.current.operation) return;
    this.current.state = phase;
    this.current.operation.cancellable = cancellable;
    this.current.operation.progress = {
      ...this.current.operation.progress,
      phase,
      completed_steps: completedSteps,
      percent: phase === "launch_verifying" ? 100 : this.current.operation.progress.percent
    };
    this.current.checked_at = this.timestamp();
  }

  private async writeVersionMarker(version: string): Promise<void> {
    const tag = cloakBrowserPlatformTag(this.platform, this.arch);
    if (!tag) throw new CloakBrowserReleaseError("unsupported_platform", "Managed CloakBrowser is unsupported on this platform.");
    const marker = join(this.cacheDir, `latest_version_${tag}`);
    const temporary = `${marker}.tmp-${randomUUID()}`;
    await writeFile(temporary, version, { mode: 0o600 });
    await rename(temporary, marker);
  }

  private async rollback(target: string, backup: string, targetInstalled: boolean, backupCreated: boolean): Promise<boolean> {
    try {
      if (targetInstalled) await rm(target, { recursive: true, force: true });
      if (backupCreated) await rename(backup, target);
      return targetInstalled || backupCreated;
    } catch {
      return false;
    }
  }

  private completeSuccess(operationId: string, version: string): void {
    this.setPhase("ready", 5, false);
    this.current.installed_version = version;
    this.current.result = result("succeeded", operationId, version, true, true, false);
    this.current.error = null;
    this.current.available_actions = ["update", "repair", "recheck"];
  }

  private completeCancellation(operationId: string, rolledBack: boolean): void {
    const detected = this.detectStatus();
    this.current = {
      ...detected,
      result: result("cancelled", operationId, detected.installed_version, false, false, rolledBack),
      operation: this.current.operation ? { ...this.current.operation, cancellable: false } : null
    };
    if (this.current.operation) this.current.operation.progress.phase = detected.state;
  }

  private completeFailure(operationId: string, cause: unknown, rolledBack: boolean, integrityVerified: boolean, launchVerified: boolean): void {
    const lifecycleError = publicError(cause, this.current.state, launchVerified);
    const detected = this.detectStatus();
    this.current = {
      ...detected,
      state: detected.state === "ready" ? "ready" : lifecycleError.code === "unsupported_platform" ? "unsupported" : "repairable",
      operation: this.current.operation ? { ...this.current.operation, cancellable: false } : null,
      result: result("failed", operationId, detected.installed_version, integrityVerified, launchVerified, rolledBack),
      error: lifecycleError,
      available_actions: detected.state === "ready" ? ["update", "repair", "recheck"] : ["repair", "recheck"]
    };
    if (this.current.operation) this.current.operation.progress.phase = this.current.state;
  }

  private rejected(lifecycleError: ManagedProviderLifecycleError): ManagedProviderLifecycleCommandResult {
    return { accepted: false, lifecycle: this.status(), error: lifecycleError };
  }

  private timestamp(): string {
    return this.now().toISOString();
  }
}

function baseStatus(
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
    management_mode: "managed",
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
    public_boundary: {
      raw_logs: "not_exposed",
      binary_path: "not_exposed",
      checksum: "not_exposed",
      profile_storage: "isolated_temporary_only"
    }
  };
}

function progress(phase: ManagedProviderLifecycleState, completedSteps: number): ManagedProviderLifecycleProgress {
  return {
    phase,
    completed_steps: completedSteps,
    total_steps: 5,
    downloaded_bytes: 0,
    total_bytes: null,
    percent: null
  };
}

function result(
  status: "succeeded" | "cancelled" | "failed",
  operationId: string,
  version: string | null,
  integrityVerified: boolean,
  launchVerified: boolean,
  rolledBack: boolean
): NonNullable<ManagedProviderLifecycleStatus["result"]> {
  return {
    status,
    operation_id: operationId,
    installed_version: version,
    integrity_verified: integrityVerified,
    launch_verified: launchVerified,
    rolled_back: rolledBack
  };
}

function error(
  code: ManagedProviderLifecycleError["code"],
  message: string,
  retryable: boolean,
  recoveryActions: ManagedProviderLifecycleError["recovery_actions"]
): ManagedProviderLifecycleError {
  return { code, message, retryable, recovery_actions: recoveryActions };
}

function publicError(cause: unknown, phase: ManagedProviderLifecycleState, launchVerified: boolean): ManagedProviderLifecycleError {
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

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function versionNewer(candidate: string, installed: string): boolean {
  const left = candidate.split(".").map(Number);
  const right = installed.split(".").map(Number);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    if ((left[index] ?? 0) > (right[index] ?? 0)) return true;
    if ((left[index] ?? 0) < (right[index] ?? 0)) return false;
  }
  return false;
}
