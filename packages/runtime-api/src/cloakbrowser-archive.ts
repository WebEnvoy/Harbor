import { execFile } from "node:child_process";
import { createReadStream } from "node:fs";
import { mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import { extract as extractTar, Parser } from "tar";

const execFileAsync = promisify(execFile);
const SAFE_TAR_TYPES = new Set(["File", "OldFile", "ContiguousFile", "Directory", "GNUDumpDir"]);

export interface CloakBrowserArchiveLimits {
  max_entries: number;
  max_expanded_bytes: number;
}

export interface ExtractCloakBrowserArchiveInput {
  archive_path: string;
  destination_dir: string;
  platform: NodeJS.Platform;
  signal: AbortSignal;
  limits: CloakBrowserArchiveLimits;
}

export async function extractCloakBrowserArchive(input: ExtractCloakBrowserArchiveInput): Promise<void> {
  assertNotAborted(input.signal);
  await rm(input.destination_dir, { recursive: true, force: true });
  await mkdir(input.destination_dir, { recursive: true });
  try {
    if (input.platform === "win32") await extractZip(input);
    else await extractTarArchive(input);
    assertNotAborted(input.signal);
    await flattenSingleDirectory(input.destination_dir);
    assertNotAborted(input.signal);
  } catch (error) {
    await rm(input.destination_dir, { recursive: true, force: true });
    if (input.signal.aborted) throw input.signal.reason ?? error;
    throw error;
  }
}

async function extractTarArchive(input: ExtractCloakBrowserArchiveInput): Promise<void> {
  let entries = 0;
  let expandedBytes = 0;
  const archiveBytes = (await stat(input.archive_path)).size;
  const parser = new Parser({
    strict: true,
    maxDecompressionRatio: Math.max(
      1,
      (input.limits.max_expanded_bytes + input.limits.max_entries * 1024 + 10_240) / Math.max(1, archiveBytes)
    ),
    filter: (entryPath, entry) => {
      const rejectEntry = (cause: Error): false => {
        parser.abort(cause);
        return false;
      };
      if (input.signal.aborted) return rejectEntry(input.signal.reason instanceof Error ? input.signal.reason : new DOMException("The operation was aborted.", "AbortError"));
      entries += 1;
      if (entries > input.limits.max_entries) return rejectEntry(new Error("Archive entry limit exceeded."));
      if (!("type" in entry) || !safeArchivePath(entryPath) || !SAFE_TAR_TYPES.has(entry.type)) return rejectEntry(new Error("Unsafe archive entry rejected."));
      const size = Number(entry.size);
      if (!Number.isSafeInteger(size) || size < 0) return rejectEntry(new Error("Invalid archive entry size."));
      expandedBytes += size;
      if (expandedBytes > input.limits.max_expanded_bytes) return rejectEntry(new Error("Archive expanded-byte limit exceeded."));
      return true;
    }
  });
  parser.on("meta", () => {
    entries += 1;
    if (entries > input.limits.max_entries) parser.abort(new Error("Archive entry limit exceeded."));
  });
  await runTarPreflight(input.archive_path, parser, input.signal);
  assertNotAborted(input.signal);
  let extractionEntries = 0;
  let extractionBytes = 0;
  let extractionViolation: Error | null = null;
  const unpack = extractTar({
    cwd: input.destination_dir,
    strict: true,
    preservePaths: false,
    unlink: true,
    maxDecompressionRatio: Math.max(
      1,
      (input.limits.max_expanded_bytes + input.limits.max_entries * 1024 + 10_240) / Math.max(1, archiveBytes)
    ),
    filter: (entryPath, entry) => {
      if (extractionViolation) return false;
      extractionEntries += 1;
      const size = Number(entry.size);
      if (extractionEntries > input.limits.max_entries) extractionViolation = new Error("Archive entry limit exceeded during extraction.");
      else if (!("type" in entry) || !safeArchivePath(entryPath) || !SAFE_TAR_TYPES.has(entry.type)) extractionViolation = new Error("Unsafe archive entry rejected during extraction.");
      else if (!Number.isSafeInteger(size) || size < 0) extractionViolation = new Error("Invalid archive entry size during extraction.");
      else if ((extractionBytes += size) > input.limits.max_expanded_bytes) extractionViolation = new Error("Archive expanded-byte limit exceeded during extraction.");
      return !extractionViolation;
    }
  });
  await pipeline(createReadStream(input.archive_path), unpack, { signal: input.signal });
  if (extractionViolation) throw extractionViolation;
}

async function runTarPreflight(archivePath: string, parser: Parser, signal: AbortSignal): Promise<void> {
  const source = createReadStream(archivePath);
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      signal.removeEventListener("abort", abort);
      source.removeListener("error", fail);
      parser.removeListener("error", fail);
      parser.removeListener("abort", fail);
      parser.removeListener("end", complete);
    };
    const fail = (cause: unknown) => {
      if (settled) return;
      settled = true;
      source.destroy();
      cleanup();
      reject(cause instanceof Error ? cause : new Error(String(cause)));
    };
    const complete = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const abort = () => fail(signal.reason ?? new DOMException("The operation was aborted.", "AbortError"));
    source.once("error", fail);
    parser.once("error", fail);
    parser.once("abort", fail);
    parser.once("end", complete);
    parser.on("entry", (entry) => entry.resume());
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) return abort();
    void (async () => {
      try {
        for await (const chunk of source) {
          if (settled) return;
          parser.write(chunk);
        }
        if (!settled) parser.end();
      } catch (error) {
        fail(error);
      }
    })();
  });
}

async function extractZip(input: ExtractCloakBrowserArchiveInput): Promise<void> {
  const script = [
    "Add-Type -AssemblyName System.IO.Compression.FileSystem",
    "$root=[IO.Path]::GetFullPath($env:CB_DEST + [IO.Path]::DirectorySeparatorChar)",
    "$zip=[IO.Compression.ZipFile]::OpenRead($env:CB_ARCHIVE)",
    "$count=0; $expanded=[Int64]0",
    "try { foreach($entry in $zip.Entries) {",
    "$count++; if($count -gt [Int32]$env:CB_MAX_ENTRIES){throw 'archive entry limit exceeded'}",
    "$expanded += $entry.Length; if($expanded -gt [Int64]$env:CB_MAX_EXPANDED){throw 'archive expanded-byte limit exceeded'}",
    "$target=[IO.Path]::GetFullPath([IO.Path]::Combine($root,$entry.FullName))",
    "if(-not $target.StartsWith($root,[StringComparison]::OrdinalIgnoreCase)){throw 'unsafe archive path'}",
    "$unixType=($entry.ExternalAttributes -shr 16) -band 0xF000",
    "if($unixType -eq 0xA000 -or $unixType -eq 0x1000){throw 'archive links are not allowed'}",
    "}; [IO.Compression.ZipFile]::ExtractToDirectory($env:CB_ARCHIVE,$env:CB_DEST) } finally { $zip.Dispose() }"
  ].join("; ");
  await execFileAsync("powershell", ["-NoProfile", "-Command", script], {
    timeout: 120_000,
    signal: input.signal,
    env: {
      ...process.env,
      CB_ARCHIVE: input.archive_path,
      CB_DEST: input.destination_dir,
      CB_MAX_ENTRIES: String(input.limits.max_entries),
      CB_MAX_EXPANDED: String(input.limits.max_expanded_bytes)
    }
  });
}

function safeArchivePath(entryPath: string): boolean {
  const normalized = entryPath.replaceAll("\\", "/");
  return normalized.length > 0 && !isAbsolute(normalized) && !/^[A-Za-z]:/.test(normalized) &&
    !normalized.split("/").includes("..");
}

async function flattenSingleDirectory(destination: string): Promise<void> {
  const entries = await readdir(destination);
  if (entries.length !== 1 || entries[0]!.endsWith(".app")) return;
  const child = join(destination, entries[0]!);
  if (!(await stat(child)).isDirectory()) return;
  for (const entry of await readdir(child)) await rename(join(child, entry), join(destination, entry));
  await rm(child, { recursive: true });
}

function assertNotAborted(signal: AbortSignal): void {
  if (signal.aborted) throw signal.reason ?? new DOMException("The operation was aborted.", "AbortError");
}
