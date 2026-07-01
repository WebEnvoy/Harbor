import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const HARBOR_RUNTIME_FACTS_SCHEMA = "harbor-runtime-facts/v0";

export type AvailabilityState = "available" | "unavailable" | "policy_denied" | "unsupported";
export type FactSource = "configured" | "observed" | "provider_claim" | "validation_evidence";
export type LifecycleState = "starting" | "active" | "idle" | "locked" | "disconnected" | "expired" | "failed" | "closed";
export type ProviderMode = "local_dedicated_profile";
export type RuntimeErrorCode = "provider_unavailable" | "launch_failed" | "cdp_unavailable" | "unsupported";

export interface RuntimeFact {
  key: string;
  source: FactSource;
  value: string;
  evidence_ref?: string;
}

export interface RuntimeErrorFact {
  code: RuntimeErrorCode;
  message: string;
  retryable: boolean;
}

export interface RuntimeSessionFacts {
  schema_version: typeof HARBOR_RUNTIME_FACTS_SCHEMA;
  runtime_session_ref: string;
  profile_ref: string;
  provider_ref: string;
  provider_mode: ProviderMode;
  lifecycle_state: LifecycleState;
  created_at: string;
  last_seen_at: string;
  closed_at?: string;
  availability: {
    cdp: AvailabilityState;
    viewer: AvailabilityState;
    snapshot: AvailabilityState;
    evidence: AvailabilityState;
  };
  cdp_ref?: string;
  current_error: RuntimeErrorFact | null;
  facts: RuntimeFact[];
}

export interface CreateRuntimeSessionInput {
  browser_path?: string;
  headless?: boolean;
  timeout_ms?: number;
}

export interface LocalProviderLaunchInput extends Required<CreateRuntimeSessionInput> {
  profile_ref: string;
  provider_ref: string;
}

export type LocalProviderLaunchResult =
  | { status: "ready"; cdp_ref: string; facts: RuntimeFact[]; close: () => Promise<void> }
  | { status: "unavailable"; error: RuntimeErrorFact; facts: RuntimeFact[] };

export type LocalProviderLauncher = (input: LocalProviderLaunchInput) => Promise<LocalProviderLaunchResult>;

interface SessionRecord {
  facts: RuntimeSessionFacts;
  close?: () => Promise<void>;
}

const baselineFacts: RuntimeFact[] = [
  { key: "provider.mode", source: "configured", value: "local_dedicated_profile" },
  { key: "provider.binary_boundary", source: "configured", value: "user_provided_browser" },
  { key: "provider.license_boundary", source: "configured", value: "user_provided_local_browser_license" },
  { key: "provider.anti_detection_success", source: "provider_claim", value: "not_claimed" }
];

export class HarborRuntime {
  private readonly sessions = new Map<string, SessionRecord>();

  constructor(private readonly launcher: LocalProviderLauncher = launchLocalDedicatedProvider) {}

  async createSession(input: CreateRuntimeSessionInput = {}): Promise<RuntimeSessionFacts> {
    const now = new Date().toISOString();
    const provider_ref = ref("provider");
    const profile_ref = ref("profile");
    const launch = await this.launcher({
      browser_path: input.browser_path ?? "",
      headless: input.headless ?? true,
      timeout_ms: input.timeout_ms ?? 5000,
      profile_ref,
      provider_ref
    });
    const runtime_session_ref = ref("session");
    const ready = launch.status === "ready";
    const facts: RuntimeSessionFacts = {
      schema_version: HARBOR_RUNTIME_FACTS_SCHEMA,
      runtime_session_ref,
      profile_ref,
      provider_ref,
      provider_mode: "local_dedicated_profile",
      lifecycle_state: ready ? "active" : "failed",
      created_at: now,
      last_seen_at: now,
      availability: {
        cdp: ready ? "available" : "unavailable",
        viewer: "unsupported",
        snapshot: "unavailable",
        evidence: "unavailable"
      },
      cdp_ref: ready ? launch.cdp_ref : undefined,
      current_error: ready ? null : launch.error,
      facts: [...baselineFacts, ...launch.facts]
    };
    this.sessions.set(runtime_session_ref, { facts, close: ready ? launch.close : undefined });
    return snapshot(facts);
  }

  getSession(runtime_session_ref: string): RuntimeSessionFacts | null {
    const facts = this.sessions.get(runtime_session_ref)?.facts;
    return facts ? snapshot(facts) : null;
  }

  async closeSession(runtime_session_ref: string): Promise<RuntimeSessionFacts | null> {
    const record = this.sessions.get(runtime_session_ref);
    if (!record) return null;
    await record.close?.();
    const now = new Date().toISOString();
    record.facts.lifecycle_state = "closed";
    record.facts.closed_at = now;
    record.facts.last_seen_at = now;
    record.facts.availability.cdp = "unavailable";
    return snapshot(record.facts);
  }
}

export async function launchLocalDedicatedProvider(input: LocalProviderLaunchInput): Promise<LocalProviderLaunchResult> {
  const browserPath = input.browser_path || findBrowserPath();
  if (!browserPath) {
    return unavailable("provider_unavailable", "No local browser executable found. Set HARBOR_BROWSER_PATH to run the local smoke.");
  }
  const profileDir = await mkdtemp(join(tmpdir(), "harbor-profile-"));
  const args = [
    "--remote-debugging-port=0",
    `--user-data-dir=${profileDir}`,
    "--no-default-browser-check",
    "--no-first-run",
    ...(input.headless ? ["--headless=new"] : []),
    "about:blank"
  ];
  const child = spawn(browserPath, args, { stdio: "ignore" });
  try {
    const port = await waitForDevtoolsPort(profileDir, input.timeout_ms);
    const version = await fetchVersion(port);
    const evidence_ref = ref("validation");
    return {
      status: "ready",
      cdp_ref: ref("cdp"),
      facts: [
        { key: "browser.launch", source: "observed", value: "ready", evidence_ref },
        { key: "cdp.version", source: "validation_evidence", value: `${version.Browser} ${version["Protocol-Version"]}`, evidence_ref }
      ],
      close: () => closeBrowser(child, profileDir)
    };
  } catch (error) {
    await closeBrowser(child, profileDir);
    return unavailable("launch_failed", error instanceof Error ? error.message : "Browser launch failed.");
  }
}

export function createFixtureLauncher(status: "ready" | "unavailable" = "ready"): LocalProviderLauncher {
  return async () => {
    if (status === "unavailable") return unavailable("provider_unavailable", "Fixture provider unavailable.");
    const evidence_ref = ref("validation");
    return {
      status: "ready",
      cdp_ref: ref("cdp"),
      facts: [
        { key: "browser.launch", source: "observed", value: "ready", evidence_ref },
        { key: "cdp.version", source: "validation_evidence", value: "FixtureBrowser 1.0", evidence_ref }
      ],
      close: async () => {}
    };
  };
}

function unavailable(code: RuntimeErrorCode, message: string): LocalProviderLaunchResult {
  return {
    status: "unavailable",
    error: { code, message, retryable: code !== "unsupported" },
    facts: [{ key: "browser.launch", source: "observed", value: code }]
  };
}

function findBrowserPath(): string {
  const candidates = [
    process.env.HARBOR_BROWSER_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ].filter((candidate): candidate is string => Boolean(candidate));
  return candidates.find((candidate) => existsSync(candidate)) ?? "";
}

async function waitForDevtoolsPort(profileDir: string, timeoutMs: number): Promise<string> {
  const portFile = join(profileDir, "DevToolsActivePort");
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const [port] = (await readFile(portFile, "utf8")).trim().split("\n");
      if (port) return port;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error("Timed out waiting for local browser CDP readiness.");
}

async function fetchVersion(port: string): Promise<Record<string, string>> {
  const response = await fetch(`http://127.0.0.1:${port}/json/version`);
  if (!response.ok) throw new Error(`CDP readiness probe failed: ${response.status}`);
  return (await response.json()) as Record<string, string>;
}

async function closeBrowser(child: ChildProcess, profileDir: string): Promise<void> {
  if (!hasExited(child)) child.kill("SIGTERM");
  await waitForExit(child, 1000);
  if (!hasExited(child)) child.kill("SIGKILL");
  await waitForExit(child, 500);
  await rm(profileDir, { force: true, maxRetries: 10, recursive: true, retryDelay: 100 });
}

function ref(kind: string): string {
  return `${kind}_${randomUUID()}`;
}

function snapshot(facts: RuntimeSessionFacts): RuntimeSessionFacts {
  return structuredClone(facts);
}

async function waitForExit(child: ChildProcess, timeoutMs: number): Promise<void> {
  if (hasExited(child)) return;
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function hasExited(child: ChildProcess): boolean {
  return child.exitCode !== null || child.signalCode !== null;
}
