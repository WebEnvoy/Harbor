import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, readFile, readdir, rename, rm, unlink, type FileHandle } from "node:fs/promises";
import { join, resolve } from "node:path";

export const PROVIDER_CACHE_OWNERSHIP_LOCK = ".harbor-provider-ownership.lock";
export const PROVIDER_CACHE_OWNERSHIP_DIRECTORY = ".harbor-provider-ownership";
export const PROVIDER_CACHE_OWNERSHIP_STALE_MS = 60_000;
const HEARTBEAT_MS = 5_000;
const MAX_LOCK_BYTES = 4_096;
const MAX_CLAIMS = 128;
const CLAIM = /^claim-([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.lock$/i;
const OWNERSHIP_CONSTRUCTION = Symbol("provider-cache-ownership");
const PROCESS_STARTED_AT = new Date(Date.now() - process.uptime() * 1_000).toISOString();

interface LockOwner {
  pid: number;
  token: string;
  created_at?: string;
  process_started_at?: string;
}

interface ClaimSnapshot {
  path: string;
  device: number;
  inode: number;
  modifiedAt: number;
  owner: LockOwner | null;
}

export interface AcquireProviderCacheOwnershipOptions {
  on_ready_to_publish?: () => Promise<void>;
  on_claim_published?: () => Promise<void>;
}

export class ProviderCacheOwnershipBusy extends Error {
  constructor() {
    super("The managed provider cache is owned by another runtime.");
  }
}

export class ProviderCacheOwnership {
  private released = false;
  private lost = false;
  private refreshing: Promise<void> | null = null;
  private readonly heartbeat: NodeJS.Timeout;

  constructor(
    construction: typeof OWNERSHIP_CONSTRUCTION,
    private readonly cacheDir: string,
    private readonly claimPath: string,
    private readonly token: string,
    private readonly device: number,
    private readonly inode: number,
    private readonly claim: FileHandle
  ) {
    if (construction !== OWNERSHIP_CONSTRUCTION) throw new Error("Managed provider cache ownership cannot be constructed directly.");
    this.heartbeat = setInterval(() => void this.refreshLease().catch(() => undefined), HEARTBEAT_MS);
    this.heartbeat.unref();
  }

  async assert(cacheDir: string): Promise<void> {
    if (this.released || this.lost || resolve(cacheDir) !== this.cacheDir) throw ownershipLost();
    await this.refreshLease();
  }

  async release(): Promise<void> {
    if (this.released) return;
    this.released = true;
    clearInterval(this.heartbeat);
    await this.refreshing?.catch(() => undefined);
    const actual = await this.matchesActualClaim().catch(() => false);
    await this.claim.close().catch(() => undefined);
    if (actual) await unlink(this.claimPath).catch(() => undefined);
  }

  private refreshLease(): Promise<void> {
    if (this.refreshing) return this.refreshing;
    this.refreshing = this.refreshLeaseOnce().finally(() => { this.refreshing = null; });
    return this.refreshing;
  }

  private async refreshLeaseOnce(): Promise<void> {
    if (this.released || this.lost || !await this.matchesActualClaim()) {
      this.lost = true;
      throw ownershipLost();
    }
    const now = new Date();
    await this.claim.utimes(now, now);
    if (!await this.matchesActualClaim()) {
      this.lost = true;
      throw ownershipLost();
    }
  }

  private async matchesActualClaim(): Promise<boolean> {
    const [held, actual] = await Promise.all([this.claim.stat(), lstat(this.claimPath)]);
    if (!actual.isFile() || actual.isSymbolicLink() || held.dev !== this.device || held.ino !== this.inode ||
        actual.dev !== this.device || actual.ino !== this.inode || actual.size > MAX_LOCK_BYTES || held.size > MAX_LOCK_BYTES) return false;
    const buffer = Buffer.alloc(MAX_LOCK_BYTES + 1);
    const { bytesRead } = await this.claim.read(buffer, 0, buffer.length, 0);
    if (bytesRead > MAX_LOCK_BYTES) return false;
    const owner = parseLockOwner(buffer.subarray(0, bytesRead).toString("utf8"));
    const current = await lstat(this.claimPath);
    return owner?.token === this.token && owner.pid === process.pid && owner.process_started_at === PROCESS_STARTED_AT &&
      current.dev === this.device && current.ino === this.inode;
  }
}

export async function acquireProviderCacheOwnership(
  cacheDir: string,
  options: AcquireProviderCacheOwnershipOptions = {}
): Promise<ProviderCacheOwnership> {
  const normalized = resolve(cacheDir);
  await mkdir(normalized, { recursive: true, mode: 0o700 });
  await rejectOrRemoveLegacyLock(normalized);
  const claimsDir = join(normalized, PROVIDER_CACHE_OWNERSHIP_DIRECTORY);
  await ensureClaimsDirectory(claimsDir);
  if (await removeStaleClaims(claimsDir)) throw new ProviderCacheOwnershipBusy();
  await options.on_ready_to_publish?.();

  const token = randomUUID();
  const claimPath = join(claimsDir, `claim-${token}.lock`);
  const temporary = join(claimsDir, `.claim-${token}.tmp`);
  try {
    const file = await open(temporary, "wx", 0o600);
    try {
      await file.writeFile(JSON.stringify({
        schema_version: "harbor-provider-cache-ownership/v1",
        pid: process.pid,
        process_started_at: PROCESS_STARTED_AT,
        created_at: new Date().toISOString(),
        token
      }));
      await file.sync();
    } finally {
      await file.close();
    }
    await rename(temporary, claimPath);
    await options.on_claim_published?.();
    const contenders = (await readClaims(claimsDir)).filter((entry) => entry.path !== claimPath);
    if (contenders.length > 0) throw new ProviderCacheOwnershipBusy();
    const claim = await open(claimPath, "r+");
    const entry = await claim.stat();
    return new ProviderCacheOwnership(OWNERSHIP_CONSTRUCTION, normalized, claimPath, token, entry.dev, entry.ino, claim);
  } catch (error) {
    await rm(temporary, { force: true }).catch(() => undefined);
    await rm(claimPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

async function ensureClaimsDirectory(path: string): Promise<void> {
  await mkdir(path, { mode: 0o700 }).catch((error) => {
    if (!isAlreadyExists(error)) throw error;
  });
  const entry = await lstat(path);
  if (!entry.isDirectory() || entry.isSymbolicLink()) throw new ProviderCacheOwnershipBusy();
}

async function removeStaleClaims(claimsDir: string): Promise<boolean> {
  const claims = await readClaims(claimsDir);
  let liveClaim = false;
  for (const claim of claims) {
    if (!claimIsStale(claim)) liveClaim = true;
    else await removeStaleClaim(claim);
  }
  return liveClaim;
}

async function readClaims(claimsDir: string): Promise<ClaimSnapshot[]> {
  const names = (await readdir(claimsDir)).filter((name) => CLAIM.test(name));
  if (names.length > MAX_CLAIMS) throw new ProviderCacheOwnershipBusy();
  const claims: ClaimSnapshot[] = [];
  for (const name of names) {
    const path = join(claimsDir, name);
    const entry = await lstat(path).catch(() => null);
    if (!entry) continue;
    if (!entry.isFile() || entry.isSymbolicLink() || entry.size > MAX_LOCK_BYTES) {
      claims.push({ path, device: entry.dev, inode: entry.ino, modifiedAt: entry.mtimeMs, owner: null });
      continue;
    }
    claims.push({
      path,
      device: entry.dev,
      inode: entry.ino,
      modifiedAt: entry.mtimeMs,
      owner: parseLockOwner(await readFile(path, "utf8").catch(() => ""))
    });
  }
  return claims;
}

function claimIsStale(claim: ClaimSnapshot): boolean {
  if (claim.owner && !processIsAlive(claim.owner.pid)) return true;
  return Date.now() - claim.modifiedAt > PROVIDER_CACHE_OWNERSHIP_STALE_MS;
}

async function removeStaleClaim(claim: ClaimSnapshot): Promise<void> {
  const quarantine = `${claim.path}.stale-${randomUUID()}`;
  try {
    await rename(claim.path, quarantine);
    const moved = await lstat(quarantine);
    if (moved.dev !== claim.device || moved.ino !== claim.inode || moved.mtimeMs !== claim.modifiedAt) {
      await rename(quarantine, claim.path).catch(() => undefined);
      return;
    }
    await rm(quarantine, { force: true });
  } catch (error) {
    if (!isMissing(error)) throw error;
  }
}

async function rejectOrRemoveLegacyLock(cacheDir: string): Promise<void> {
  const path = join(cacheDir, PROVIDER_CACHE_OWNERSHIP_LOCK);
  const entry = await lstat(path).catch(() => null);
  if (!entry) return;
  if (!entry.isFile() || entry.isSymbolicLink() || entry.size > MAX_LOCK_BYTES) throw new ProviderCacheOwnershipBusy();
  const owner = parseLockOwner(await readFile(path, "utf8").catch(() => ""));
  if (Date.now() - entry.mtimeMs <= PROVIDER_CACHE_OWNERSHIP_STALE_MS && (!owner || processIsAlive(owner.pid))) {
    throw new ProviderCacheOwnershipBusy();
  }
  const quarantine = `${path}.stale-${randomUUID()}`;
  try {
    await rename(path, quarantine);
    const moved = await lstat(quarantine);
    if (moved.dev !== entry.dev || moved.ino !== entry.ino || moved.mtimeMs !== entry.mtimeMs) {
      await rename(quarantine, path).catch(() => undefined);
      throw new ProviderCacheOwnershipBusy();
    }
    await rm(quarantine, { force: true });
  } catch (error) {
    if (!isMissing(error)) throw error;
  }
}

function parseLockOwner(value: string): LockOwner | null {
  try {
    const parsed = JSON.parse(value) as Partial<LockOwner>;
    return Number.isInteger(parsed.pid) && Number(parsed.pid) > 0 && typeof parsed.token === "string" &&
      parsed.token.length > 0 && parsed.token.length <= 200
      ? { pid: Number(parsed.pid), token: parsed.token, created_at: parsed.created_at, process_started_at: parsed.process_started_at }
      : null;
  } catch {
    return null;
  }
}

function processIsAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return !(error && typeof error === "object" && "code" in error && error.code === "ESRCH");
  }
}

function ownershipLost(): Error {
  return new Error("Managed provider cache ownership is not held by this runtime.");
}

function isAlreadyExists(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "EEXIST");
}

function isMissing(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "ENOENT");
}
