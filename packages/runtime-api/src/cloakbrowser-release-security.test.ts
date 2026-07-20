import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { create as createTar } from "tar";
import { extractCloakBrowserArchive } from "./cloakbrowser-archive.js";
import { installCloakBrowserRelease } from "./cloakbrowser-release.js";

const version = "146.0.7680.177.5";

test("release requests reject arbitrary hosts and HTTPS downgrade redirects", async () => {
  const root = await mkdtemp(join(tmpdir(), "harbor-release-redirect-"));
  let fetchCalls = 0;
  const fetchImpl = (async () => {
    fetchCalls += 1;
    return new Response(null, { status: 302, headers: { location: "http://cloakbrowser.dev/downgrade" } });
  }) as typeof fetch;
  try {
    await assert.rejects(installCloakBrowserRelease({
      version,
      platform: "linux",
      arch: "x64",
      destination_dir: join(root, "staging"),
      signal: new AbortController().signal,
      on_progress: () => undefined,
      fetch_impl: fetchImpl
    }), /could not be downloaded/);
    assert.equal(fetchCalls, 2);

    fetchCalls = 0;
    await assert.rejects(installCloakBrowserRelease({
      version,
      platform: "linux",
      arch: "x64",
      destination_dir: join(root, "staging-2"),
      signal: new AbortController().signal,
      on_progress: () => undefined,
      fetch_impl: fetchImpl,
      primary_release_base: "https://untrusted.example",
      fallback_release_base: "https://untrusted.example"
    }), /could not be downloaded/);
    assert.equal(fetchCalls, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("archive, manifest, and signature downloads enforce independent byte limits", async () => {
  const root = await mkdtemp(join(tmpdir(), "harbor-release-bytes-"));
  try {
    await assert.rejects(runBoundedInstall(root, (url) => {
      if (url.endsWith(".tar.gz")) return bytesResponse(11);
      return bytesResponse(1);
    }, { max_archive_bytes: 10 }), /could not be downloaded/);

    await assert.rejects(runBoundedInstall(root, (url) => {
      if (url.endsWith("SHA256SUMS")) return bytesResponse(11);
      return bytesResponse(1);
    }, { max_manifest_bytes: 10 }), /manifest is unavailable/);

    await assert.rejects(runBoundedInstall(root, (url) => {
      if (url.endsWith("SHA256SUMS.sig")) return bytesResponse(11);
      return bytesResponse(1);
    }, { max_signature_bytes: 10 }), /manifest is unavailable/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("tar extraction rejects entry count, expanded bytes, and links", async () => {
  const root = await mkdtemp(join(tmpdir(), "harbor-release-archive-"));
  const source = join(root, "source");
  await mkdir(source);
  await writeFile(join(source, "one"), "1234");
  await writeFile(join(source, "two"), "5678");
  await symlink("one", join(source, "link"));
  const regularArchive = join(root, "regular.tar.gz");
  const linkArchive = join(root, "link.tar.gz");
  await createTar({ gzip: true, file: regularArchive, cwd: source }, ["one", "two"]);
  await createTar({ gzip: true, file: linkArchive, cwd: source }, ["link"]);
  try {
    await assert.rejects(extractCloakBrowserArchive({
      archive_path: regularArchive,
      destination_dir: join(root, "entries"),
      platform: "linux",
      signal: new AbortController().signal,
      limits: { max_entries: 1, max_expanded_bytes: 100 }
    }), /entry limit/);
    await assert.rejects(extractCloakBrowserArchive({
      archive_path: regularArchive,
      destination_dir: join(root, "expanded"),
      platform: "linux",
      signal: new AbortController().signal,
      limits: { max_entries: 10, max_expanded_bytes: 7 }
    }), /expanded-byte limit/);
    await assert.rejects(extractCloakBrowserArchive({
      archive_path: linkArchive,
      destination_dir: join(root, "links"),
      platform: "linux",
      signal: new AbortController().signal,
      limits: { max_entries: 10, max_expanded_bytes: 100 }
    }), /Unsafe archive entry/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("tar extraction observes cancellation and removes partial staging", async () => {
  const root = await mkdtemp(join(tmpdir(), "harbor-release-cancel-"));
  const source = join(root, "source");
  const destination = join(root, "destination");
  await mkdir(source);
  for (let index = 0; index < 1_000; index += 1) await writeFile(join(source, `file-${index}`), "x".repeat(1024));
  const archive = join(root, "many.tar.gz");
  await createTar({ gzip: true, file: archive, cwd: source }, ["."]);
  const controller = new AbortController();
  const extraction = extractCloakBrowserArchive({
    archive_path: archive,
    destination_dir: destination,
    platform: "linux",
    signal: controller.signal,
    limits: { max_entries: 2_000, max_expanded_bytes: 2_000_000 }
  });
  setTimeout(() => controller.abort(new DOMException("cancelled", "AbortError")), 1);
  try {
    await assert.rejects(extraction, /cancelled|aborted/i);
    await assert.rejects((await import("node:fs/promises")).access(destination));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function runBoundedInstall(
  root: string,
  responseFor: (url: string) => Response,
  limits: { max_archive_bytes?: number; max_manifest_bytes?: number; max_signature_bytes?: number }
): Promise<unknown> {
  const fetchImpl = (async (input) => responseFor(String(input))) as typeof fetch;
  return installCloakBrowserRelease({
    version,
    platform: "linux",
    arch: "x64",
    destination_dir: join(root, `staging-${++fixtureSequence}`),
    signal: new AbortController().signal,
    on_progress: () => undefined,
    fetch_impl: fetchImpl,
    release_limits: limits
  });
}

function bytesResponse(length: number): Response {
  return new Response(Buffer.alloc(length), { status: 200, headers: { "content-length": String(length) } });
}

let fixtureSequence = 0;
