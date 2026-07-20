import { execFile } from "node:child_process";
import { createHash, createPublicKey, randomUUID, verify as verifySignature } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, chmod, mkdir, open, readdir, rename, rm, stat } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";
import { promisify } from "node:util";
import { extract as extractTar } from "tar";

export const CLOAKBROWSER_FREE_VERSIONS: Record<string, string> = {
  "linux-x64": "146.0.7680.177.5",
  "linux-arm64": "146.0.7680.177.3",
  "darwin-arm64": "145.0.7632.109.2",
  "darwin-x64": "145.0.7632.109.2",
  "windows-x64": "146.0.7680.177.5"
};

const CLOAKBROWSER_SIGNING_KEYS = ["MKFKwIhUcKWq5xTuNA0Ovg99njcDEcEJvmWYYhApvaU="];
const PRIMARY_RELEASE_BASE = "https://cloakbrowser.dev";
const FALLBACK_RELEASE_BASE = "https://github.com/CloakHQ/cloakbrowser/releases/download";
const GITHUB_RELEASES_API = "https://api.github.com/repos/CloakHQ/cloakbrowser/releases?per_page=10";
const VERSION_PATTERN = /^[0-9]+(?:\.[0-9]+){3,4}$/;
const execFileAsync = promisify(execFile);

export type CloakBrowserReleasePhase = "downloading" | "verifying";

export interface CloakBrowserReleaseProgress {
  phase: CloakBrowserReleasePhase;
  downloaded_bytes: number;
  total_bytes: number | null;
}

export interface InstallCloakBrowserReleaseInput {
  version: string;
  platform: NodeJS.Platform;
  arch: string;
  destination_dir: string;
  signal: AbortSignal;
  on_progress: (progress: CloakBrowserReleaseProgress) => void;
  fetch_impl?: typeof fetch;
  primary_release_base?: string;
  fallback_release_base?: string;
  signing_public_keys?: string[];
}

export interface InstalledCloakBrowserRelease {
  binary_path: string;
  integrity: "ed25519_sha256";
  source: "official_release";
}

export class CloakBrowserReleaseError extends Error {
  constructor(
    readonly code: "download_failed" | "integrity_check_failed" | "install_failed" | "unsupported_platform",
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "CloakBrowserReleaseError";
  }
}

export function cloakBrowserPlatformTag(platform: NodeJS.Platform, arch: string): string | null {
  if (platform === "linux" && arch === "x64") return "linux-x64";
  if (platform === "linux" && arch === "arm64") return "linux-arm64";
  if (platform === "darwin" && arch === "arm64") return "darwin-arm64";
  if (platform === "darwin" && arch === "x64") return "darwin-x64";
  if (platform === "win32" && arch === "x64") return "windows-x64";
  return null;
}

export function cloakBrowserBinaryPath(platform: NodeJS.Platform, cacheDir: string, version: string): string {
  const dir = join(cacheDir, `chromium-${version}`);
  if (platform === "darwin") return join(dir, "Chromium.app", "Contents", "MacOS", "Chromium");
  if (platform === "win32") return join(dir, "chrome.exe");
  return join(dir, "chrome");
}

export function defaultCloakBrowserVersion(platform: NodeJS.Platform, arch: string): string | null {
  const tag = cloakBrowserPlatformTag(platform, arch);
  return tag ? CLOAKBROWSER_FREE_VERSIONS[tag] ?? null : null;
}

export function isCloakBrowserVersion(value: string): boolean {
  return VERSION_PATTERN.test(value);
}

export async function installCloakBrowserRelease(input: InstallCloakBrowserReleaseInput): Promise<InstalledCloakBrowserRelease> {
  const tag = cloakBrowserPlatformTag(input.platform, input.arch);
  if (!tag) throw new CloakBrowserReleaseError("unsupported_platform", "No managed CloakBrowser release exists for this OS and architecture.");
  if (!isCloakBrowserVersion(input.version)) throw new CloakBrowserReleaseError("install_failed", "The requested CloakBrowser version is invalid.");

  const archiveName = `cloakbrowser-${tag}${input.platform === "win32" ? ".zip" : ".tar.gz"}`;
  const primaryBase = input.primary_release_base ?? PRIMARY_RELEASE_BASE;
  const fallbackBase = input.fallback_release_base ?? FALLBACK_RELEASE_BASE;
  const releasePath = `chromium-v${input.version}`;
  const archivePath = join(dirname(input.destination_dir), `.harbor-download-${randomUUID()}${input.platform === "win32" ? ".zip" : ".tar.gz"}`);
  const fetchImpl = input.fetch_impl ?? fetch;

  try {
    await downloadWithFallback(
      [`${primaryBase}/${releasePath}/${archiveName}`, `${fallbackBase}/${releasePath}/${archiveName}`],
      archivePath,
      fetchImpl,
      input.signal,
      input.on_progress
    );
    const manifest = await fetchSignedManifest([`${primaryBase}/${releasePath}`, `${fallbackBase}/${releasePath}`], fetchImpl, input.signal);
    if (!manifest) throw new CloakBrowserReleaseError("integrity_check_failed", "The signed CloakBrowser release manifest is unavailable.");
    input.on_progress({ phase: "verifying", downloaded_bytes: 0, total_bytes: null });
    await verifyCloakBrowserRelease(
      archivePath,
      archiveName,
      input.version,
      manifest.manifest,
      manifest.signature,
      input.signing_public_keys ?? CLOAKBROWSER_SIGNING_KEYS,
      input.signal
    );
    await extractRelease(archivePath, input.destination_dir, input.platform);
    const binaryPath = cloakBrowserBinaryPath(input.platform, dirname(input.destination_dir), input.version)
      .replace(join(dirname(input.destination_dir), `chromium-${input.version}`), input.destination_dir);
    await makeExecutable(binaryPath, input.platform);
    return { binary_path: binaryPath, integrity: "ed25519_sha256", source: "official_release" };
  } finally {
    await rm(archivePath, { force: true });
  }
}

export async function latestCloakBrowserVersion(
  platform: NodeJS.Platform,
  arch: string,
  fetchImpl: typeof fetch = fetch
): Promise<string | null> {
  const tag = cloakBrowserPlatformTag(platform, arch);
  if (!tag) return null;
  const archiveName = `cloakbrowser-${tag}${platform === "win32" ? ".zip" : ".tar.gz"}`;
  try {
    const response = await fetchImpl(GITHUB_RELEASES_API, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return null;
    const releases = await response.json() as Array<{ tag_name?: string; draft?: boolean; assets?: Array<{ name?: string }> }>;
    for (const release of releases) {
      const version = release.tag_name?.replace(/^chromium-v/, "") ?? "";
      if (!release.draft && isCloakBrowserVersion(version) && release.assets?.some((asset) => asset.name === archiveName)) return version;
    }
  } catch {}
  return null;
}

export async function verifyCloakBrowserRelease(
  archivePath: string,
  archiveName: string,
  version: string,
  manifest: Uint8Array,
  signatureText: Uint8Array,
  publicKeys: string[],
  signal: AbortSignal
): Promise<void> {
  assertNotAborted(signal);
  verifyManifestSignature(manifest, signatureText, publicKeys);
  const text = new TextDecoder().decode(manifest);
  if (text.split("\n").find((line) => line.startsWith("version="))?.slice(8).trim() !== version) {
    throw new CloakBrowserReleaseError("integrity_check_failed", "The signed CloakBrowser manifest does not match the requested version.");
  }
  const expected = parseChecksums(text).get(archiveName);
  if (!expected) throw new CloakBrowserReleaseError("integrity_check_failed", "The signed CloakBrowser manifest does not contain this platform archive.");
  const actual = await sha256File(archivePath, signal);
  if (actual !== expected) throw new CloakBrowserReleaseError("integrity_check_failed", "The CloakBrowser archive checksum does not match its signed manifest.");
}

function verifyManifestSignature(manifest: Uint8Array, signatureText: Uint8Array, publicKeys: string[]): void {
  const text = new TextDecoder().decode(signatureText).trim();
  const signature = Buffer.from(text, "base64");
  if (signature.toString("base64") !== text) throw new CloakBrowserReleaseError("integrity_check_failed", "The CloakBrowser manifest signature is malformed.");
  for (const encodedKey of publicKeys) {
    try {
      const key = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: Buffer.from(encodedKey, "base64").toString("base64url") }, format: "jwk" });
      if (verifySignature(null, manifest, key, signature)) return;
    } catch {}
  }
  throw new CloakBrowserReleaseError("integrity_check_failed", "The CloakBrowser manifest signature could not be authenticated.");
}

function parseChecksums(manifest: string): Map<string, string> {
  const checksums = new Map<string, string>();
  for (const line of manifest.split("\n")) {
    const match = line.trim().match(/^([a-f0-9]{64})\s+\*?(.+)$/i);
    if (match) checksums.set(match[2]!, match[1]!.toLowerCase());
  }
  return checksums;
}

async function downloadWithFallback(
  urls: string[],
  destination: string,
  fetchImpl: typeof fetch,
  signal: AbortSignal,
  onProgress: (progress: CloakBrowserReleaseProgress) => void
): Promise<void> {
  let lastError: unknown;
  for (const url of urls) {
    try {
      await downloadFile(url, destination, fetchImpl, signal, onProgress);
      return;
    } catch (error) {
      if (signal.aborted) throw error;
      lastError = error;
      await rm(destination, { force: true });
    }
  }
  throw new CloakBrowserReleaseError("download_failed", "The official CloakBrowser release could not be downloaded.", { cause: lastError });
}

async function downloadFile(
  url: string,
  destination: string,
  fetchImpl: typeof fetch,
  signal: AbortSignal,
  onProgress: (progress: CloakBrowserReleaseProgress) => void
): Promise<void> {
  const response = await fetchImpl(url, { redirect: "follow", signal: AbortSignal.any([signal, AbortSignal.timeout(600_000)]) });
  if (!response.ok || !response.body) throw new Error(`Download failed with HTTP ${response.status}.`);
  const total = Number(response.headers.get("content-length")) || null;
  const file = await open(destination, "w", 0o600);
  let downloaded = 0;
  try {
    for await (const chunk of response.body) {
      assertNotAborted(signal);
      const bytes = Buffer.from(chunk);
      await file.write(bytes);
      downloaded += bytes.length;
      onProgress({ phase: "downloading", downloaded_bytes: downloaded, total_bytes: total });
    }
  } finally {
    await file.close();
  }
}

async function fetchSignedManifest(
  bases: string[],
  fetchImpl: typeof fetch,
  signal: AbortSignal
): Promise<{ manifest: Uint8Array; signature: Uint8Array } | null> {
  for (const base of bases) {
    try {
      const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(10_000)]);
      const [manifest, signature] = await Promise.all([
        fetchImpl(`${base}/SHA256SUMS`, { redirect: "follow", signal: requestSignal }),
        fetchImpl(`${base}/SHA256SUMS.sig`, { redirect: "follow", signal: requestSignal })
      ]);
      if (manifest.ok && signature.ok) {
        return {
          manifest: new Uint8Array(await manifest.arrayBuffer()),
          signature: new Uint8Array(await signature.arrayBuffer())
        };
      }
    } catch (error) {
      if (signal.aborted) throw error;
    }
  }
  return null;
}

async function sha256File(filePath: string, signal: AbortSignal): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) {
    assertNotAborted(signal);
    hash.update(chunk);
  }
  return hash.digest("hex");
}

async function extractRelease(archivePath: string, destination: string, platform: NodeJS.Platform): Promise<void> {
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  try {
    if (platform === "win32") await extractZip(archivePath, destination);
    else await extractTar({
      file: archivePath,
      cwd: destination,
      filter: (entryPath, entry) => safeArchivePath(entryPath) && (!("linkpath" in entry) || !entry.linkpath || safeArchivePath(entry.linkpath))
    });
    await flattenSingleDirectory(destination);
  } catch (error) {
    throw new CloakBrowserReleaseError("install_failed", "The verified CloakBrowser archive could not be installed.", { cause: error });
  }
}

async function extractZip(archivePath: string, destination: string): Promise<void> {
  const script = [
    "Add-Type -AssemblyName System.IO.Compression.FileSystem",
    "$root=[IO.Path]::GetFullPath($env:CB_DEST + [IO.Path]::DirectorySeparatorChar)",
    "$zip=[IO.Compression.ZipFile]::OpenRead($env:CB_ARCHIVE)",
    "try { foreach($entry in $zip.Entries) { $target=[IO.Path]::GetFullPath([IO.Path]::Combine($root,$entry.FullName)); if(-not $target.StartsWith($root,[StringComparison]::OrdinalIgnoreCase)){throw 'unsafe archive path'} }; [IO.Compression.ZipFile]::ExtractToDirectory($env:CB_ARCHIVE,$env:CB_DEST) } finally { $zip.Dispose() }"
  ].join("; ");
  await execFileAsync("powershell", ["-NoProfile", "-Command", script], {
    timeout: 120_000,
    env: { ...process.env, CB_ARCHIVE: archivePath, CB_DEST: destination }
  });
}

function safeArchivePath(entryPath: string): boolean {
  const normalized = entryPath.replaceAll("\\", "/");
  return !isAbsolute(normalized) && !normalized.split("/").includes("..");
}

async function flattenSingleDirectory(destination: string): Promise<void> {
  const entries = await readdir(destination);
  if (entries.length !== 1 || entries[0]!.endsWith(".app")) return;
  const child = join(destination, entries[0]!);
  if (!(await stat(child)).isDirectory()) return;
  for (const entry of await readdir(child)) await rename(join(child, entry), join(destination, entry));
  await rm(child, { recursive: true });
}

async function makeExecutable(binaryPath: string, platform: NodeJS.Platform): Promise<void> {
  try {
    if (platform !== "win32") await chmod(binaryPath, 0o755);
    await access(binaryPath);
  } catch (error) {
    throw new CloakBrowserReleaseError("install_failed", "The installed CloakBrowser executable is missing.", { cause: error });
  }
}

function assertNotAborted(signal: AbortSignal): void {
  if (signal.aborted) throw signal.reason ?? new DOMException("The operation was aborted.", "AbortError");
}
