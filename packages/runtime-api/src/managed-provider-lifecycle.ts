import { randomUUID } from "node:crypto";
import { access, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { arch as hostArch, homedir, platform as hostPlatform } from "node:os";
import { isAbsolute, join, relative } from "node:path";
import {
  CloakBrowserReleaseError,
  cloakBrowserPlatformTag,
  defaultCloakBrowserVersion,
  installCloakBrowserRelease,
  isCloakBrowserVersion,
  latestCloakBrowserVersion
} from "./cloakbrowser-release.js";
import {
  PROVIDER_EXCHANGE_JOURNAL,
  providerExchangeJournal,
  recoverProviderExchange,
  rollbackProviderExchange,
  writeProviderExchangeJournal,
  type ProviderExchangeFileOperations,
  type ProviderExchangeJournal
} from "./managed-provider-exchange.js";
import { verifyLocalProviderLaunch } from "./local-provider-launcher.js";
import {
  type ManagedProviderLifecycleCommandResult,
  type ManagedProviderLifecycleError,
  type ManagedProviderLifecycleOptions,
  type ManagedProviderLifecycleState,
  type ManagedProviderLifecycleStatus,
  type ManagedProviderOperationInput
} from "./managed-provider-lifecycle-types.js";
import { baseStatus, error, progress, publicError, result } from "./managed-provider-lifecycle-status.js";
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
  private readonly exchangeOperations: ProviderExchangeFileOperations;
  private readonly now: () => Date;
  private current: ManagedProviderLifecycleStatus;
  private controller: AbortController | null = null;
  private running: Promise<void> | null = null;
  private activeOperationId: string | null = null;
  private recoveryBlocked = false;
  private controlTail: Promise<void> = Promise.resolve();
  private readonly initialization: Promise<void>;

  constructor(options: ManagedProviderLifecycleOptions = {}) {
    this.env = options.env ?? process.env;
    this.platform = options.platform ?? hostPlatform();
    this.arch = options.arch ?? hostArch();
    this.cacheDir = options.cache_dir ?? this.env.CLOAKBROWSER_CACHE_DIR ?? join(this.env.HOME ?? homedir(), ".cloakbrowser");
    this.installRelease = options.install_release ?? installCloakBrowserRelease;
    this.resolveLatestVersion = options.resolve_latest_version ?? ((platform, arch, signal) =>
      latestCloakBrowserVersion(platform, arch, fetch, signal));
    this.verifyLaunch = options.verify_launch ?? ((binaryPath, expectedVersion, signal) =>
      verifyLocalProviderLaunch(binaryPath, { expected_version: expectedVersion, signal }));
    this.exchangeOperations = options.exchange_file_operations ?? { rename, rm };
    this.now = options.now ?? (() => new Date());
    this.current = this.detectStatus();
    this.initialization = this.recoverInterruptedExchange();
  }

  status(): ManagedProviderLifecycleStatus {
    return structuredClone(this.current);
  }

  async recheck(): Promise<ManagedProviderLifecycleStatus> {
    return this.serial(async () => {
      await this.initialization;
      if (this.running) return this.status();
      await this.recoverInterruptedExchange();
      if (this.recoveryBlocked) return this.status();
      if (this.running) return this.status();
      const previousResult = this.current.result;
      this.current = this.detectStatus();
      this.current.result = previousResult;
      if (this.current.state === "ready" && this.current.ownership === "harbor") {
        const latest = await this.resolveLatestVersion(this.platform, this.arch);
        if (this.running) return this.status();
        if (latest && this.current.installed_version && versionNewer(latest, this.current.installed_version)) {
          this.current.state = "update_available";
          this.current.target_version = latest;
          this.current.available_actions = ["update", "repair", "recheck"];
        }
      }
      return this.status();
    });
  }

  async start(input: ManagedProviderOperationInput): Promise<ManagedProviderLifecycleCommandResult> {
    return this.serial(async () => {
      await this.initialization;
      if (!this.running && !this.recoveryBlocked) this.refreshDetection();
      const rejection = this.operationRejection(input);
      if (rejection) return this.rejected(rejection);
      const before = this.beforeOperation();
      const operationId = `provider_operation_${randomUUID()}`;
      this.controller = new AbortController();
      this.activeOperationId = operationId;
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
      const signal = this.controller.signal;
      const running = this.runOperation(input, before, operationId, signal);
      this.running = running;
      void running.then(() => {
        if (this.activeOperationId === operationId) {
          this.controller = null;
          this.running = null;
          this.activeOperationId = null;
        }
      }, () => {
        if (this.activeOperationId === operationId) {
          this.controller = null;
          this.running = null;
          this.activeOperationId = null;
        }
      });
      return { accepted: true, lifecycle: this.status() };
    });
  }

  async cancel(): Promise<ManagedProviderLifecycleCommandResult> {
    return this.serial(async () => {
      await this.initialization;
      const operationId = this.activeOperationId;
      if (!operationId || !this.running || !this.controller || !this.current.operation?.cancellable ||
          this.current.operation.operation_id !== operationId) {
        return this.rejected(error("not_cancellable", "The provider operation cannot be cancelled in its current phase.", true, ["recheck"]));
      }
      this.current.state = "cancelling";
      this.current.operation.cancel_requested = true;
      this.current.operation.cancellable = false;
      this.current.operation.progress.phase = "cancelling";
      this.current.checked_at = this.timestamp();
      this.controller.abort(new DOMException("The provider operation was cancelled.", "AbortError"));
      return { accepted: true, lifecycle: this.status() };
    });
  }

  async close(): Promise<void> {
    this.controller?.abort(new DOMException("Harbor Runtime is closing.", "AbortError"));
    await this.initialization;
    await this.running;
    await this.controlTail;
  }

  private async runOperation(input: ManagedProviderOperationInput, before: BeforeOperation, operationId: string, signal: AbortSignal): Promise<void> {
    let stagingDir = "";
    let journal: ProviderExchangeJournal | null = null;
    let integrityVerified = false;
    let launchVerified = false;
    let commitPersisted = false;
    try {
      const version = await this.targetVersion(input, before, signal);
      this.assertActive(operationId, signal);
      this.current.target_version = version;
      await mkdir(this.cacheDir, { recursive: true });
      stagingDir = join(this.cacheDir, `.harbor-staging-${operationId}`);
      const targetDir = join(this.cacheDir, `chromium-${version}`);
      const backupDir = join(this.cacheDir, `.harbor-backup-${operationId}`);
      const installed = await this.installRelease({
        version,
        platform: this.platform,
        arch: this.arch,
        destination_dir: stagingDir,
        signal,
        on_progress: (update) => this.updateReleaseProgress(operationId, update.phase, update.downloaded_bytes, update.total_bytes)
      });
      integrityVerified = true;
      this.assertActive(operationId, signal);
      const stagedRelative = relative(stagingDir, installed.binary_path);
      if (isAbsolute(stagedRelative) || stagedRelative === ".." || stagedRelative.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)) {
        throw new CloakBrowserReleaseError("install_failed", "The installed executable is outside the staging directory.");
      }
      this.setPhase(operationId, "launch_verifying", 4, true);
      const verification = await this.verifyLaunch(installed.binary_path, version, signal);
      this.assertActive(operationId, signal);
      if (!compatibleBrowserVersion(verification.browser_version, version)) {
        throw error("launch_verification_failed", "CloakBrowser reported a version outside the target compatibility range.", true, ["repair", "recheck"]);
      }
      launchVerified = true;
      this.setPhase(operationId, "installing", 4, true);
      journal = providerExchangeJournal(operationId, version, targetDir, stagingDir, backupDir, this.markerName(), before.version);
      await writeProviderExchangeJournal(this.cacheDir, journal);
      this.assertActive(operationId, signal);
      if (await pathExists(targetDir)) {
        await this.exchangeOperations.rename(targetDir, backupDir);
        journal.phase = "backup_created";
        await writeProviderExchangeJournal(this.cacheDir, journal);
      }
      this.assertActive(operationId, signal);
      await this.exchangeOperations.rename(stagingDir, targetDir);
      journal.phase = "target_published";
      await writeProviderExchangeJournal(this.cacheDir, journal);
      const finalBinary = join(targetDir, stagedRelative);
      await access(finalBinary);
      this.assertActive(operationId, signal);
      await this.writeVersionMarker(version);
      this.assertActive(operationId, signal);
      if (this.current.operation) this.current.operation.cancellable = false;
      journal.phase = "committed";
      await writeProviderExchangeJournal(this.cacheDir, journal);
      commitPersisted = true;
      await this.exchangeOperations.rm(backupDir, { recursive: true, force: true });
      await this.exchangeOperations.rm(join(this.cacheDir, PROVIDER_EXCHANGE_JOURNAL), { force: true });
      this.completeSuccess(operationId, version);
    } catch (cause) {
      const rolledBack = journal && !commitPersisted
        ? await rollbackProviderExchange(this.cacheDir, journal, this.exchangeOperations)
        : false;
      const recoveryFailed = commitPersisted || Boolean(journal) && !rolledBack;
      if (signal.aborted || this.cancelRequested(operationId)) {
        this.completeCancellation(operationId, rolledBack, recoveryFailed, integrityVerified, launchVerified);
      }
      else this.completeFailure(operationId, cause, rolledBack, integrityVerified, launchVerified, recoveryFailed);
    } finally {
      if (stagingDir) await rm(stagingDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private async recoverInterruptedExchange(): Promise<void> {
    try {
      const recovered = await recoverProviderExchange(this.cacheDir, this.exchangeOperations);
      this.recoveryBlocked = false;
      if (recovered) this.current = this.detectStatus();
    } catch {
      this.recoveryBlocked = true;
      this.current = {
        ...this.detectStatus(),
        state: "repairable",
        error: error("recovery_failed", "An interrupted provider exchange could not be recovered; the backup was preserved.", true, ["repair", "recheck"]),
        available_actions: ["repair", "recheck"]
      };
    }
  }

  private async targetVersion(input: ManagedProviderOperationInput, before: BeforeOperation, signal: AbortSignal): Promise<string> {
    if (input.version) return input.version;
    if (input.operation === "repair" && before.version) return before.version;
    if (input.operation === "update") {
      const latest = await this.resolveLatestVersion(this.platform, this.arch, signal);
      if (latest) return latest;
      throw error("install_source_unavailable", "No signed CloakBrowser update is available for this platform.", true, ["retry", "recheck"]);
    }
    const version = defaultCloakBrowserVersion(this.platform, this.arch);
    if (!version) throw error("unsupported_platform", "Managed CloakBrowser is unsupported on this OS and architecture.", false, ["recheck"]);
    return version;
  }

  private operationRejection(input: ManagedProviderOperationInput): ManagedProviderLifecycleError | null {
    if (this.recoveryBlocked) return error("recovery_failed", "Recover the interrupted provider exchange before starting another operation.", true, ["recheck"]);
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
      env: { ...this.env, HARBOR_CLOAKBROWSER_PATH: override, CLOAKBROWSER_BINARY_PATH: override, CLOAKBROWSER_CACHE_DIR: this.cacheDir },
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

  private refreshDetection(): void {
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

  private beforeOperation(): BeforeOperation {
    const detected = this.detectStatus();
    const state: BeforeOperation["state"] = this.current.state === "update_available" && detected.state === "ready"
      ? "update_available" : detected.state === "ready" || detected.state === "damaged" ? detected.state : "missing";
    return { state, version: detected.installed_version };
  }

  private updateReleaseProgress(
    operationId: string,
    phase: "downloading" | "verifying" | "installing",
    downloaded: number,
    total: number | null
  ): void {
    if (!this.isActive(operationId) || !this.current.operation) return;
    const previous = this.current.operation.progress;
    const stableDownloaded = Math.max(previous.downloaded_bytes, downloaded);
    const percent = total ? Math.min(100, Math.floor(stableDownloaded / total * 100)) : previous.percent;
    this.current.state = phase;
    this.current.operation.cancellable = true;
    this.current.operation.progress = {
      phase,
      completed_steps: phase === "downloading"
        ? Math.max(1, previous.completed_steps)
        : phase === "verifying" ? Math.max(2, previous.completed_steps) : Math.max(3, previous.completed_steps),
      total_steps: 5,
      downloaded_bytes: stableDownloaded,
      total_bytes: total ?? previous.total_bytes,
      percent: previous.percent === null ? percent : percent === null ? previous.percent : Math.max(previous.percent, percent)
    };
    this.current.checked_at = this.timestamp();
  }

  private setPhase(operationId: string, phase: ManagedProviderLifecycleState, completedSteps: number, cancellable: boolean): void {
    if (!this.isActive(operationId) || !this.current.operation) return;
    this.current.state = phase;
    this.current.operation.cancellable = cancellable;
    this.current.operation.progress = {
      ...this.current.operation.progress,
      phase,
      completed_steps: Math.max(completedSteps, this.current.operation.progress.completed_steps),
      percent: completedSteps === 5 ? 100 : this.current.operation.progress.percent
    };
    this.current.checked_at = this.timestamp();
  }

  private async writeVersionMarker(version: string): Promise<void> {
    const marker = join(this.cacheDir, this.markerName());
    const temporary = `${marker}.tmp-${randomUUID()}`;
    await writeFile(temporary, version, { mode: 0o600 });
    await rename(temporary, marker);
  }

  private markerName(): string {
    const tag = cloakBrowserPlatformTag(this.platform, this.arch);
    if (!tag) throw new CloakBrowserReleaseError("unsupported_platform", "Managed CloakBrowser is unsupported on this platform.");
    return `latest_version_${tag}`;
  }

  private completeSuccess(operationId: string, version: string): void {
    if (!this.isActive(operationId) || this.cancelRequested(operationId)) return;
    this.setPhase(operationId, "ready", 5, false);
    this.current.installed_version = version;
    this.current.result = result("succeeded", operationId, version, true, true, false);
    this.current.error = null;
    this.current.available_actions = ["update", "repair", "recheck"];
  }

  private completeCancellation(
    operationId: string,
    rolledBack: boolean,
    recoveryFailed: boolean,
    integrityVerified: boolean,
    launchVerified: boolean
  ): void {
    if (!this.isActive(operationId)) return;
    const operation = this.current.operation;
    const detected = this.detectStatus();
    this.current = {
      ...detected,
      state: recoveryFailed ? "repairable" : detected.state,
      result: result("cancelled", operationId, detected.installed_version, integrityVerified, launchVerified, rolledBack),
      operation: operation ? { ...operation, cancellable: false } : null,
      error: recoveryFailed ? error("recovery_failed", "Cancellation could not fully roll back the provider exchange; the backup was preserved.", true, ["repair", "recheck"]) : null,
      available_actions: recoveryFailed ? ["repair", "recheck"] : detected.available_actions
    };
    if (this.current.operation) this.current.operation.progress.phase = this.current.state;
  }

  private completeFailure(operationId: string, cause: unknown, rolledBack: boolean, integrityVerified: boolean, launchVerified: boolean, recoveryFailed: boolean): void {
    if (!this.isActive(operationId)) return;
    const lifecycleError = recoveryFailed
      ? error("recovery_failed", "The provider exchange could not be rolled back; the backup was preserved.", true, ["repair", "recheck"])
      : publicError(cause, this.current.state, launchVerified);
    const detected = this.detectStatus();
    this.current = {
      ...detected,
      state: recoveryFailed ? "repairable" : detected.state === "ready" ? "ready" : lifecycleError.code === "unsupported_platform" ? "unsupported" : "repairable",
      operation: this.current.operation ? { ...this.current.operation, cancellable: false } : null,
      result: result("failed", operationId, detected.installed_version, integrityVerified, launchVerified, rolledBack),
      error: lifecycleError,
      available_actions: recoveryFailed || detected.state !== "ready" ? ["repair", "recheck"] : ["update", "repair", "recheck"]
    };
    if (this.current.operation) this.current.operation.progress.phase = this.current.state;
  }

  private assertActive(operationId: string, signal: AbortSignal): void {
    if (signal.aborted || this.cancelRequested(operationId)) throw signal.reason ?? new DOMException("The operation was aborted.", "AbortError");
    if (!this.isActive(operationId)) throw new Error("Provider operation is no longer active.");
  }

  private isActive(operationId: string): boolean {
    return this.activeOperationId === operationId && this.current.operation?.operation_id === operationId;
  }

  private cancelRequested(operationId: string): boolean {
    return this.current.operation?.operation_id === operationId && this.current.operation.cancel_requested;
  }

  private rejected(lifecycleError: ManagedProviderLifecycleError): ManagedProviderLifecycleCommandResult {
    return { accepted: false, lifecycle: this.status(), error: lifecycleError };
  }

  private serial<T>(action: () => Promise<T>): Promise<T> {
    const next = this.controlTail.then(action, action);
    this.controlTail = next.then(() => undefined, () => undefined);
    return next;
  }

  private timestamp(): string {
    return this.now().toISOString();
  }
}

async function pathExists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

function compatibleBrowserVersion(observed: string, target: string): boolean {
  return observed === target || observed.split(".").slice(0, 4).join(".") === target.split(".").slice(0, 4).join(".");
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
