import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, readFile, unlink } from "node:fs/promises";
import { resolve, join } from "node:path";

export const PROVIDER_CACHE_OWNERSHIP_LOCK = ".harbor-provider-ownership.lock";
const MAX_LOCK_BYTES = 4_096;
const INVALID_LOCK_STALE_MS = 30_000;
const OWNERSHIP_CONSTRUCTION = Symbol("provider-cache-ownership");

interface LockOwner {
  pid: number;
  token: string;
}

export class ProviderCacheOwnershipBusy extends Error {
  constructor() {
    super("The managed provider cache is owned by another runtime.");
  }
}

export class ProviderCacheOwnership {
  private released = false;

  constructor(
    construction: typeof OWNERSHIP_CONSTRUCTION,
    private readonly cacheDir: string,
    private readonly lockPath: string,
    private readonly token: string,
    private readonly device: number,
    private readonly inode: number
  ) {
    if (construction !== OWNERSHIP_CONSTRUCTION) throw new Error("Managed provider cache ownership cannot be constructed directly.");
  }

  assert(cacheDir: string): void {
    if (this.released || resolve(cacheDir) !== this.cacheDir) throw new Error("Managed provider cache ownership is not held.");
  }

  async release(): Promise<void> {
    if (this.released) return;
    this.released = true;
    try {
      const entry = await lstat(this.lockPath);
      if (!entry.isFile() || entry.isSymbolicLink() || entry.dev !== this.device || entry.ino !== this.inode) return;
      const owner = parseLockOwner(await readFile(this.lockPath, "utf8"));
      const current = await lstat(this.lockPath);
      if (owner?.token === this.token && current.dev === this.device && current.ino === this.inode) await unlink(this.lockPath);
    } catch {
      // A missing or replaced lock is not ours to release.
    }
  }
}

export async function acquireProviderCacheOwnership(cacheDir: string): Promise<ProviderCacheOwnership> {
  const normalized = resolve(cacheDir);
  await mkdir(normalized, { recursive: true, mode: 0o700 });
  const lockPath = join(normalized, PROVIDER_CACHE_OWNERSHIP_LOCK);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const token = randomUUID();
    try {
      const file = await open(lockPath, "wx", 0o600);
      try {
        await file.writeFile(JSON.stringify({ pid: process.pid, created_at: new Date().toISOString(), token }));
        await file.sync();
        const entry = await file.stat();
        return new ProviderCacheOwnership(OWNERSHIP_CONSTRUCTION, normalized, lockPath, token, entry.dev, entry.ino);
      } catch (error) {
        await file.close().catch(() => undefined);
        await unlink(lockPath).catch(() => undefined);
        throw error;
      } finally {
        await file.close().catch(() => undefined);
      }
    } catch (error) {
      if (!isAlreadyExists(error)) throw error;
      if (attempt === 0 && await removeDemonstrablyStaleLock(lockPath)) continue;
      throw new ProviderCacheOwnershipBusy();
    }
  }
  throw new ProviderCacheOwnershipBusy();
}

async function removeDemonstrablyStaleLock(lockPath: string): Promise<boolean> {
  try {
    const entry = await lstat(lockPath);
    if (!entry.isFile() || entry.isSymbolicLink() || entry.size > MAX_LOCK_BYTES) return false;
    const original = await readFile(lockPath, "utf8");
    const owner = parseLockOwner(original);
    if (owner ? processIsAlive(owner.pid) : Date.now() - entry.mtimeMs <= INVALID_LOCK_STALE_MS) return false;
    const current = await lstat(lockPath);
    if (current.dev !== entry.dev || current.ino !== entry.ino || current.mtimeMs !== entry.mtimeMs ||
        await readFile(lockPath, "utf8") !== original) return false;
    await unlink(lockPath);
    return true;
  } catch {
    return false;
  }
}

function parseLockOwner(value: string): LockOwner | null {
  try {
    const parsed = JSON.parse(value) as Partial<LockOwner>;
    return Number.isInteger(parsed.pid) && Number(parsed.pid) > 0 && typeof parsed.token === "string" && parsed.token.length > 0 && parsed.token.length <= 200
      ? { pid: Number(parsed.pid), token: parsed.token } : null;
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

function isAlreadyExists(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "EEXIST");
}
