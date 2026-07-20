import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { access, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, symlink, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { InstallCloakBrowserReleaseInput } from "./cloakbrowser-release.js";
import {
  acquireProviderCacheOwnership,
  ProviderCacheOwnershipBusy,
  PROVIDER_CACHE_OWNERSHIP_DIRECTORY,
  PROVIDER_CACHE_OWNERSHIP_STALE_MS,
  PROVIDER_CACHE_OWNERSHIP_LOCK
} from "./managed-provider-cache-ownership.js";
import {
  PROVIDER_EXCHANGE_JOURNAL,
  providerExchangeJournal,
  writeProviderExchangeJournal
} from "./managed-provider-exchange.js";
import { ManagedProviderLifecycle } from "./managed-provider-lifecycle.js";

const version = "146.0.7680.177.5";

test("cache ownership rejects a concurrent lifecycle mutation", async () => {
  const cacheDir = await emptyCache();
  let firstEntered!: () => void;
  const entered = new Promise<void>((resolve) => { firstEntered = resolve; });
  const blockingInstaller = (enteredCallback?: () => void) => async (input: InstallCloakBrowserReleaseInput) => {
    enteredCallback?.();
    if (input.signal.aborted) throw input.signal.reason;
    await new Promise<never>((_resolve, reject) => input.signal.addEventListener("abort", () => reject(input.signal.reason), { once: true }));
    throw new Error("unreachable");
  };
  const first = lifecycle(cacheDir, blockingInstaller(firstEntered));
  const second = lifecycle(cacheDir, blockingInstaller());
  try {
    await first.recheck();
    await second.recheck();
    assert.equal((await first.start({ operation: "install", version })).accepted, true);
    await entered;
    const concurrent = await second.start({ operation: "install", version });
    assert.equal(concurrent.accepted, false);
    assert.equal(concurrent.error?.code, "busy");
  } finally {
    await first.cancel();
    await second.cancel();
    await first.close();
    await second.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});

test("prepared recovery removes a newly published target when staging is already moved", async () => {
  const cacheDir = await emptyCache();
  const target = join(cacheDir, `chromium-${version}`);
  const staging = join(cacheDir, ".harbor-staging-crash-window");
  const backup = join(cacheDir, ".harbor-backup-crash-window");
  await mkdir(staging);
  await writeFile(join(staging, "chrome"), "uncommitted");
  const journal = providerExchangeJournal("crash-window", version, target, staging, backup, "latest_version_linux-x64", null);
  await writeJournal(cacheDir, journal);
  await rename(staging, target);
  const managed = new ManagedProviderLifecycle({ cache_dir: cacheDir, env: {}, platform: "linux", arch: "x64" });
  try {
    assert.equal((await managed.recheck()).state, "missing");
    await assert.rejects(access(target));
    await assert.rejects(access(join(cacheDir, PROVIDER_EXCHANGE_JOURNAL)));
  } finally {
    await managed.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});

test("startup recovers a dead owner and scavenges only fixed-prefix inactive artifacts", async () => {
  const cacheDir = await emptyCache();
  const lock = join(cacheDir, PROVIDER_CACHE_OWNERSHIP_LOCK);
  const download = join(cacheDir, ".harbor-download-11111111-1111-4111-8111-111111111111.tar.gz");
  const staging = join(cacheDir, ".harbor-staging-provider_operation_22222222-2222-4222-8222-222222222222");
  const linkedDownload = join(cacheDir, ".harbor-download-33333333-3333-4333-8333-333333333333.zip");
  const unrelated = join(cacheDir, "user-owned-file");
  await writeFile(lock, JSON.stringify({ pid: 99_999_999, token: "dead-owner" }));
  await writeFile(download, "partial archive");
  await mkdir(staging);
  await writeFile(join(staging, "chrome"), "partial unpack");
  await writeFile(unrelated, "keep");
  await symlink(unrelated, linkedDownload);
  const managed = new ManagedProviderLifecycle({ cache_dir: cacheDir, env: {}, platform: "linux", arch: "x64" });
  try {
    await managed.recheck();
    await assert.rejects(access(download));
    await assert.rejects(access(staging));
    assert.equal(await readFile(unrelated, "utf8"), "keep");
    assert.equal((await lstat(linkedDownload)).isSymbolicLink(), true);
    await assert.rejects(access(lock));
  } finally {
    await managed.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});

test("a fresh malformed ownership lock is not stolen", async () => {
  const cacheDir = await emptyCache();
  const lock = join(cacheDir, PROVIDER_CACHE_OWNERSHIP_LOCK);
  const download = join(cacheDir, ".harbor-download-44444444-4444-4444-8444-444444444444.zip");
  await writeFile(lock, "");
  await writeFile(download, "partial archive");
  const managed = new ManagedProviderLifecycle({ cache_dir: cacheDir, env: {}, platform: "linux", arch: "x64" });
  try {
    await managed.recheck();
    await access(download);
    await rm(lock);
    await managed.recheck();
    await assert.rejects(access(download));
  } finally {
    await managed.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});

test("500 deterministic dual stale reclaimers never both acquire ownership", async () => {
  const cacheDir = await emptyCache();
  const claimsDir = join(cacheDir, PROVIDER_CACHE_OWNERSHIP_DIRECTORY);
  await mkdir(claimsDir);
  let dualOwnership = 0;
  try {
    for (let round = 0; round < 500; round += 1) {
      await writeStaleClaim(claimsDir, 90_000_000 + round);
      const ready = barrier(2);
      const published = barrier(2);
      const options = {
        on_ready_to_publish: ready.arrive,
        on_claim_published: published.arrive
      };
      const attempts = [acquireProviderCacheOwnership(cacheDir, options), acquireProviderCacheOwnership(cacheDir, options)];
      await ready.reached;
      ready.release();
      await published.reached;
      published.release();
      const settled = await Promise.allSettled(attempts);
      const owners = settled.flatMap((entry) => entry.status === "fulfilled" ? [entry.value] : []);
      if (owners.length > 1) dualOwnership += 1;
      assert.equal(owners.length <= 1, true, `round ${round} returned multiple owners`);
      for (const owner of owners) await owner.release();
      if (owners.length === 0) {
        const retry = await acquireProviderCacheOwnership(cacheDir);
        await retry.release();
      }
    }
    assert.equal(dualOwnership, 0);
  } finally {
    await rm(cacheDir, { recursive: true, force: true });
  }
});

test("an unrelated reused PID blocks only while its lease is fresh", async () => {
  const cacheDir = await emptyCache();
  const claimsDir = join(cacheDir, PROVIDER_CACHE_OWNERSHIP_DIRECTORY);
  await mkdir(claimsDir);
  const claim = await writeClaim(claimsDir, process.pid);
  try {
    await assert.rejects(acquireProviderCacheOwnership(cacheDir), ProviderCacheOwnershipBusy);
    const stale = new Date(Date.now() - PROVIDER_CACHE_OWNERSHIP_STALE_MS - 1_000);
    await utimes(claim, stale, stale);
    const recovered = await acquireProviderCacheOwnership(cacheDir);
    await recovered.assert(cacheDir);
    await recovered.release();
  } finally {
    await rm(cacheDir, { recursive: true, force: true });
  }
});

test("ownership assert rejects a replaced actual claim without deleting its replacement", async () => {
  const cacheDir = await emptyCache();
  const ownership = await acquireProviderCacheOwnership(cacheDir);
  const claimsDir = join(cacheDir, PROVIDER_CACHE_OWNERSHIP_DIRECTORY);
  const name = (await readdir(claimsDir)).find((entry) => entry.endsWith(".lock"));
  assert.ok(name);
  const claim = join(claimsDir, name);
  const moved = `${claim}.moved`;
  try {
    await rename(claim, moved);
    await writeFile(claim, "replacement");
    await assert.rejects(ownership.assert(cacheDir), /not held/);
    await ownership.release();
    assert.equal(await readFile(claim, "utf8"), "replacement");
  } finally {
    await ownership.release();
    await rm(cacheDir, { recursive: true, force: true });
  }
});

function lifecycle(cacheDir: string, installRelease: (input: InstallCloakBrowserReleaseInput) => Promise<never>): ManagedProviderLifecycle {
  return new ManagedProviderLifecycle({
    cache_dir: cacheDir,
    env: {},
    platform: "linux",
    arch: "x64",
    install_release: installRelease,
    verify_launch: async (_path, expected) => ({ browser_version: expected })
  });
}

async function writeJournal(cacheDir: string, journal: ReturnType<typeof providerExchangeJournal>): Promise<void> {
  const ownership = await acquireProviderCacheOwnership(cacheDir);
  try { await writeProviderExchangeJournal(cacheDir, journal, ownership); } finally { await ownership.release(); }
}

function emptyCache(): Promise<string> {
  return mkdtemp(join(tmpdir(), "harbor-provider-ownership-"));
}

async function writeStaleClaim(claimsDir: string, pid: number): Promise<string> {
  const path = await writeClaim(claimsDir, pid);
  const stale = new Date(Date.now() - PROVIDER_CACHE_OWNERSHIP_STALE_MS - 1_000);
  await utimes(path, stale, stale);
  return path;
}

async function writeClaim(claimsDir: string, pid: number): Promise<string> {
  const token = randomUUID();
  const path = join(claimsDir, `claim-${token}.lock`);
  await writeFile(path, JSON.stringify({
    schema_version: "harbor-provider-cache-ownership/v1",
    pid,
    process_started_at: "2000-01-01T00:00:00.000Z",
    created_at: "2000-01-01T00:00:00.000Z",
    token
  }));
  return path;
}

function barrier(participants: number): { reached: Promise<void>; arrive: () => Promise<void>; release: () => void } {
  let arrived = 0;
  let reached!: () => void;
  let release!: () => void;
  const reachedPromise = new Promise<void>((resolve) => { reached = resolve; });
  const released = new Promise<void>((resolve) => { release = resolve; });
  return {
    reached: reachedPromise,
    arrive: async () => {
      arrived += 1;
      if (arrived === participants) reached();
      await released;
    },
    release
  };
}
