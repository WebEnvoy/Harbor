import assert from "node:assert/strict";
import { access, lstat, mkdir, mkdtemp, readFile, rename, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { InstallCloakBrowserReleaseInput } from "./cloakbrowser-release.js";
import {
  acquireProviderCacheOwnership,
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
