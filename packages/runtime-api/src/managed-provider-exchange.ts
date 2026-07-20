import { randomUUID } from "node:crypto";
import { access, lstat, mkdir, open, readFile, readdir, rename, rm } from "node:fs/promises";
import { basename, join } from "node:path";
import type { ProviderCacheOwnership } from "./managed-provider-cache-ownership.js";

export const PROVIDER_EXCHANGE_JOURNAL = ".harbor-provider-exchange.json";

export interface ProviderExchangeJournal {
  schema_version: "harbor-provider-exchange/v0";
  operation_id: string;
  version: string;
  target_name: string;
  staging_name: string;
  backup_name: string;
  marker_name: string;
  previous_version: string | null;
  phase: "prepared" | "backup_created" | "target_published" | "rollback_started" | "committed";
  rollback_action: "restore_backup" | "remove_target" | "none" | null;
}

export interface ProviderExchangeFileOperations {
  rename: typeof rename;
  rm: typeof rm;
}

const defaultOperations: ProviderExchangeFileOperations = { rename, rm };
const MAX_STALE_ARTIFACT_REMOVALS = 64;
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const DOWNLOAD_ARTIFACT = new RegExp(`^\\.harbor-download-${UUID}\\.(?:zip|tar\\.gz)$`, "i");
const STAGING_ARTIFACT = new RegExp(`^\\.harbor-staging-provider_operation_${UUID}$`, "i");

export async function writeProviderExchangeJournal(
  cacheDir: string,
  journal: ProviderExchangeJournal,
  ownership: ProviderCacheOwnership,
  signal?: AbortSignal
): Promise<void> {
  await ownership.assert(cacheDir);
  assertNotAborted(signal);
  await mkdir(cacheDir, { recursive: true });
  const existing = await readJournal(cacheDir);
  if (existing && existing.operation_id !== journal.operation_id) {
    throw new Error("An unresolved provider exchange journal already exists.");
  }
  const path = join(cacheDir, PROVIDER_EXCHANGE_JOURNAL);
  const temporary = `${path}.tmp-${randomUUID()}`;
  try {
    const file = await open(temporary, "w", 0o600);
    try {
      await file.writeFile(JSON.stringify(journal));
      await file.sync();
    } finally {
      await file.close();
    }
    assertNotAborted(signal);
    await rename(temporary, path);
  } catch (error) {
    await rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
  try {
    const directory = await open(cacheDir, "r");
    try { await directory.sync(); } finally { await directory.close(); }
  } catch {}
}

export async function publishProviderExchange(
  cacheDir: string,
  journal: ProviderExchangeJournal,
  operations: ProviderExchangeFileOperations,
  ownership: ProviderCacheOwnership,
  signal: AbortSignal
): Promise<void> {
  await ownership.assert(cacheDir);
  await writeProviderExchangeJournal(cacheDir, journal, ownership, signal);
  const paths = journalPaths(cacheDir, journal);
  if (await pathExists(paths.target)) {
    assertNotAborted(signal);
    await operations.rename(paths.target, paths.backup);
    journal.phase = "backup_created";
    await writeProviderExchangeJournal(cacheDir, journal, ownership, signal);
  }
  assertNotAborted(signal);
  await operations.rename(paths.staging, paths.target);
  journal.phase = "target_published";
  await writeProviderExchangeJournal(cacheDir, journal, ownership, signal);
}

export async function commitProviderExchange(
  cacheDir: string,
  journal: ProviderExchangeJournal,
  operations: ProviderExchangeFileOperations,
  ownership: ProviderCacheOwnership
): Promise<void> {
  await ownership.assert(cacheDir);
  const paths = journalPaths(cacheDir, journal);
  await pruneManagedVersions(cacheDir, journal.version, operations);
  await operations.rm(paths.backup, { recursive: true, force: true });
  await operations.rm(join(cacheDir, PROVIDER_EXCHANGE_JOURNAL), { force: true });
}

export async function writeProviderVersionMarker(
  cacheDir: string,
  markerName: string,
  version: string,
  ownership: ProviderCacheOwnership,
  signal: AbortSignal
): Promise<void> {
  await ownership.assert(cacheDir);
  await writeMarker(cacheDir, markerName, version, signal);
}

export async function recoverProviderExchange(
  cacheDir: string,
  ownership: ProviderCacheOwnership,
  operations: ProviderExchangeFileOperations = defaultOperations
): Promise<boolean> {
  await ownership.assert(cacheDir);
  const journal = await readJournal(cacheDir);
  if (!journal) return false;
  const paths = journalPaths(cacheDir, journal);
  if (journal.phase === "committed") {
    if (await pathExists(paths.target)) {
      await writeMarker(cacheDir, journal.marker_name, journal.version);
      await pruneManagedVersions(cacheDir, journal.version, operations);
      await operations.rm(paths.backup, { recursive: true, force: true });
    } else if (await pathExists(paths.backup)) {
      await operations.rename(paths.backup, paths.target);
      await restoreMarker(cacheDir, journal);
    } else {
      throw new Error("Committed provider exchange is missing both target and backup.");
    }
  } else if (journal.phase === "rollback_started") {
    if (journal.rollback_action === "restore_backup") {
      if (await pathExists(paths.backup)) {
        if (await pathExists(paths.target)) await operations.rm(paths.target, { recursive: true, force: true });
        await operations.rename(paths.backup, paths.target);
      } else if (!await pathExists(paths.target)) {
        throw new Error("Provider rollback lost both target and backup.");
      }
    } else if (journal.rollback_action === "remove_target") {
      await operations.rm(paths.target, { recursive: true, force: true });
    }
    await restoreMarker(cacheDir, journal);
  } else if (journal.phase === "prepared" && await pathExists(paths.target) &&
      await pathExists(paths.staging) && !await pathExists(paths.backup)) {
    // No exchange rename occurred before the crash.
  } else {
    if (await pathExists(paths.target)) await operations.rm(paths.target, { recursive: true, force: true });
    if (await pathExists(paths.backup)) await operations.rename(paths.backup, paths.target);
    await restoreMarker(cacheDir, journal);
  }
  await operations.rm(paths.staging, { recursive: true, force: true });
  await operations.rm(join(cacheDir, PROVIDER_EXCHANGE_JOURNAL), { force: true });
  return true;
}

export async function rollbackProviderExchange(
  cacheDir: string,
  journal: ProviderExchangeJournal,
  ownership: ProviderCacheOwnership,
  operations: ProviderExchangeFileOperations = defaultOperations
): Promise<boolean> {
  await ownership.assert(cacheDir);
  const paths = journalPaths(cacheDir, journal);
  try {
    const backupExists = await pathExists(paths.backup);
    const originalPhase = journal.phase;
    journal.phase = "rollback_started";
    journal.rollback_action = backupExists
      ? "restore_backup"
      : originalPhase === "target_published" || originalPhase === "committed" ? "remove_target" : "none";
    await writeProviderExchangeJournal(cacheDir, journal, ownership);
    if (backupExists && await pathExists(paths.target)) await operations.rm(paths.target, { recursive: true, force: true });
    else if (!backupExists && journal.rollback_action === "remove_target") {
      await operations.rm(paths.target, { recursive: true, force: true });
    }
    if (backupExists) {
      await operations.rename(paths.backup, paths.target);
    }
    await restoreMarker(cacheDir, journal);
    await operations.rm(join(cacheDir, PROVIDER_EXCHANGE_JOURNAL), { force: true });
    return true;
  } catch {
    return false;
  }
}

export async function scavengeStaleProviderArtifacts(
  cacheDir: string,
  ownership: ProviderCacheOwnership,
  operations: ProviderExchangeFileOperations = defaultOperations
): Promise<number> {
  await ownership.assert(cacheDir);
  const journal = await readJournal(cacheDir);
  const protectedNames = new Set(journal ? [journal.staging_name, journal.backup_name] : []);
  let removed = 0;
  for (const name of (await readdir(cacheDir)).sort()) {
    if (removed >= MAX_STALE_ARTIFACT_REMOVALS || protectedNames.has(name)) continue;
    const download = DOWNLOAD_ARTIFACT.test(name);
    const staging = STAGING_ARTIFACT.test(name);
    if (!download && !staging) continue;
    const path = join(cacheDir, name);
    const entry = await lstat(path).catch(() => null);
    if (!entry || entry.isSymbolicLink() || download && !entry.isFile() || staging && !entry.isDirectory()) continue;
    await operations.rm(path, { recursive: staging, force: true });
    removed += 1;
  }
  return removed;
}

export function providerExchangeJournal(
  operationId: string,
  version: string,
  targetDir: string,
  stagingDir: string,
  backupDir: string,
  markerName: string,
  previousVersion: string | null
): ProviderExchangeJournal {
  return {
    schema_version: "harbor-provider-exchange/v0",
    operation_id: operationId,
    version,
    target_name: basename(targetDir),
    staging_name: basename(stagingDir),
    backup_name: basename(backupDir),
    marker_name: markerName,
    previous_version: previousVersion,
    phase: "prepared",
    rollback_action: null
  };
}

async function readJournal(cacheDir: string): Promise<ProviderExchangeJournal | null> {
  let text: string;
  try {
    const path = join(cacheDir, PROVIDER_EXCHANGE_JOURNAL);
    const facts = await lstat(path);
    if (!facts.isFile() || facts.isSymbolicLink() || facts.size > 16_384) throw new Error("Provider exchange journal is not a bounded regular file.");
    text = await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
  if (Buffer.byteLength(text) > 16_384) throw new Error("Provider exchange journal exceeds its size limit.");
  const value = JSON.parse(text) as Partial<ProviderExchangeJournal>;
  if (value.schema_version !== "harbor-provider-exchange/v0" ||
      !validName(value.target_name, "chromium-") ||
      !validName(value.staging_name, ".harbor-staging-") ||
      !validName(value.backup_name, ".harbor-backup-") ||
      !validName(value.marker_name, "latest_version_") ||
      !(value.previous_version === null || validVersion(value.previous_version)) ||
      typeof value.operation_id !== "string" || value.operation_id.length < 1 || value.operation_id.length > 200 ||
      !validVersion(value.version) ||
      value.target_name !== `chromium-${value.version}` ||
      !["prepared", "backup_created", "target_published", "rollback_started", "committed"].includes(value.phase ?? "") ||
      !(value.rollback_action === null || ["restore_backup", "remove_target", "none"].includes(value.rollback_action ?? "")) ||
      (value.phase === "rollback_started") !== (value.rollback_action !== null)) {
    throw new Error("Provider exchange journal is invalid.");
  }
  return value as ProviderExchangeJournal;
}

async function restoreMarker(cacheDir: string, journal: ProviderExchangeJournal): Promise<void> {
  if (journal.previous_version) await writeMarker(cacheDir, journal.marker_name, journal.previous_version);
  else await rm(join(cacheDir, journal.marker_name), { force: true });
}

async function writeMarker(cacheDir: string, markerName: string, version: string, signal?: AbortSignal): Promise<void> {
  const path = join(cacheDir, markerName);
  const temporary = `${path}.tmp-${randomUUID()}`;
  try {
    const file = await open(temporary, "w", 0o600);
    try {
      await file.writeFile(version);
      await file.sync();
    } finally {
      await file.close();
    }
    assertNotAborted(signal);
    await rename(temporary, path);
  } catch (error) {
    await rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
}

async function pruneManagedVersions(
  cacheDir: string,
  retainedVersion: string,
  operations: ProviderExchangeFileOperations
): Promise<void> {
  const retainedName = `chromium-${retainedVersion}`;
  for (const name of await readdir(cacheDir)) {
    if (name !== retainedName && /^chromium-[0-9]+(?:\.[0-9]+){3,4}$/.test(name)) {
      await operations.rm(join(cacheDir, name), { recursive: true, force: true });
    }
  }
}

function journalPaths(cacheDir: string, journal: ProviderExchangeJournal): { target: string; staging: string; backup: string } {
  return {
    target: join(cacheDir, journal.target_name),
    staging: join(cacheDir, journal.staging_name),
    backup: join(cacheDir, journal.backup_name)
  };
}

function validName(value: unknown, prefix: string): value is string {
  return typeof value === "string" && value.startsWith(prefix) && basename(value) === value && value.length <= 200;
}

function validVersion(value: unknown): value is string {
  return typeof value === "string" && /^[0-9]+(?:\.[0-9]+){3,4}$/.test(value);
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw signal.reason ?? new DOMException("The operation was aborted.", "AbortError");
}
