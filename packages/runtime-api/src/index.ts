import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  HARBOR_EVIDENCE_STATUS_FIXTURE_SCHEMA,
  HARBOR_PAGE_SCENE_REFS_SCHEMA,
  PageSceneStore,
  type CaptureSnapshotInput,
  type CoreSceneReference,
  type EvidenceRecord,
  type EvidenceFreshnessState,
  type EvidenceStatusDisplayState,
  type EvidenceStatusEntry,
  type EvidenceStatusFixture,
  type PageSceneUnavailable,
  type RefMapRecord,
  type SnapshotCaptureResult,
  type SnapshotRecord
} from "./page-scene.js";
import { opaqueRef } from "./refs.js";
import {
  appRuntimeStatusFixture,
  coreRuntimeFacts,
  HARBOR_APP_RUNTIME_STATUS_FIXTURE_SCHEMA,
  HARBOR_CORE_RUNTIME_FACTS_SCHEMA,
  HARBOR_VIEWER_CONTROL_FACTS_SCHEMA,
  ViewerControlStore,
  type AppRuntimeStatusFixture,
  type CoreRuntimeFacts,
  type ControlOwner,
  type RecordHandoffInput,
  type ViewerControlFacts,
  type ViewerControlUnavailable
} from "./viewer-control.js";

export { HARBOR_EVIDENCE_STATUS_FIXTURE_SCHEMA, HARBOR_PAGE_SCENE_REFS_SCHEMA } from "./page-scene.js";
export {
  HARBOR_APP_RUNTIME_STATUS_FIXTURE_SCHEMA,
  HARBOR_CORE_RUNTIME_FACTS_SCHEMA,
  HARBOR_VIEWER_CONTROL_FACTS_SCHEMA
} from "./viewer-control.js";
export type {
  CaptureFailureClass,
  CaptureMethod,
  CaptureSnapshotInput,
  CoreSceneReference,
  EvidenceAccessState,
  EvidenceCapturePolicy,
  EvidenceRecord,
  EvidenceFreshnessState,
  EvidenceStatusDisplayState,
  EvidenceStatusEntry,
  EvidenceStatusFixture,
  EvidenceType,
  PageSceneUnavailable,
  RedactionState,
  RefMapElementInput,
  RefMapElementRef,
  RefMapRecord,
  RetentionState,
  SnapshotCaptureResult,
  SnapshotRecord,
  SourceTrace,
  StorageScope
} from "./page-scene.js";
export type {
  AppBrowserStatus,
  AppRuntimeStatusFixture,
  ControlOwner,
  ControlOwnerFacts,
  CoreRuntimeFacts,
  HandoffReason,
  InputCapability,
  RecordHandoffInput,
  TakeoverUnavailableReason,
  ViewerAccessMode,
  ViewerAvailability,
  ViewerControlFacts,
  ViewerControlFailureClass,
  ViewerControlUnavailable,
  ViewerRefFacts,
  ViewerTransport
} from "./viewer-control.js";

export const HARBOR_RUNTIME_FACTS_SCHEMA = "harbor-runtime-facts/v0";
export const HARBOR_VALIDATION_RUNTIME_FACTS_SCHEMA = "harbor-validation-runtime-facts/v0";

export type AvailabilityState = "available" | "unavailable" | "policy_denied" | "unsupported";
export type FactSource = "configured" | "observed" | "provider_claim" | "validation_evidence";
export type LifecycleState = "starting" | "active" | "idle" | "locked" | "disconnected" | "expired" | "failed" | "closed";
export type ProviderMode = "local_dedicated_profile";
export type RuntimeErrorCode =
  | "provider_unavailable"
  | "launch_failed"
  | "cdp_unavailable"
  | "profile_locked"
  | "session_lost"
  | "capture_denied"
  | "unsupported";

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
  viewer_ref?: string;
  control_owner: ControlOwner;
  current_error: RuntimeErrorFact | null;
  facts: RuntimeFact[];
}

export interface ValidationRuntimeFacts {
  schema_version: typeof HARBOR_VALIDATION_RUNTIME_FACTS_SCHEMA;
  runtime_session_ref: string;
  provider_ref: string;
  profile_ref: string;
  validation_refs: string[];
  runtime_ready: boolean;
  blocking_reasons: RuntimeErrorFact[];
  availability: RuntimeSessionFacts["availability"];
  unavailable: null;
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
  private readonly pageScenes = new PageSceneStore();
  private readonly viewerControls = new ViewerControlStore();

  constructor(private readonly launcher: LocalProviderLauncher = launchLocalDedicatedProvider) {}

  async createSession(input: CreateRuntimeSessionInput = {}): Promise<RuntimeSessionFacts> {
    const now = new Date().toISOString();
    const provider_ref = opaqueRef("provider");
    const profile_ref = opaqueRef("profile");
    const launch = await this.launcher({
      browser_path: input.browser_path ?? "",
      headless: input.headless ?? true,
      timeout_ms: input.timeout_ms ?? 5000,
      profile_ref,
      provider_ref
    });
    const runtime_session_ref = opaqueRef("session");
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
      control_owner: ready ? "system" : "none",
      current_error: ready ? null : launch.error,
      facts: [...baselineFacts, ...launch.facts]
    };
    const viewerControl = this.viewerControls.create(facts, now);
    facts.viewer_ref = viewerControl.viewer.viewer_ref;
    facts.facts.push(
      { key: "viewer.ref", source: "configured", value: viewerControl.viewer.viewer_ref },
      { key: "viewer.availability", source: "configured", value: viewerControl.viewer.availability },
      { key: "control.owner", source: "configured", value: viewerControl.control.owner }
    );
    this.sessions.set(runtime_session_ref, { facts, close: ready ? launch.close : undefined });
    return snapshot(facts);
  }

  getSession(runtime_session_ref: string): RuntimeSessionFacts | null {
    const facts = this.sessions.get(runtime_session_ref)?.facts;
    return facts ? snapshot(facts) : null;
  }

  captureSnapshot(runtime_session_ref: string, input: CaptureSnapshotInput = {}): SnapshotCaptureResult {
    const record = this.sessions.get(runtime_session_ref);
    const result = this.pageScenes.capture(record?.facts ?? null, input);
    if (record && result.status === "captured") {
      const captured_at = result.core_scene_ref.captured_at;
      record.facts.last_seen_at = captured_at;
      record.facts.availability.snapshot = "available";
      record.facts.availability.evidence = "available";
      record.facts.facts.push(
        { key: "snapshot.capture", source: "observed", value: "available", evidence_ref: result.evidence_refs[0] },
        { key: "evidence.capture", source: "validation_evidence", value: "refs_available", evidence_ref: result.evidence_refs[1] }
      );
    }
    return result;
  }

  getSnapshot(snapshot_ref: string): SnapshotRecord | PageSceneUnavailable {
    return this.pageScenes.getSnapshot(snapshot_ref, (runtime_session_ref) => this.isSessionReadable(runtime_session_ref));
  }

  getRefMap(refmap_ref: string): RefMapRecord | PageSceneUnavailable {
    return this.pageScenes.getRefMap(refmap_ref, (runtime_session_ref) => this.isSessionReadable(runtime_session_ref));
  }

  getEvidence(evidence_ref: string): EvidenceRecord | PageSceneUnavailable {
    return this.pageScenes.getEvidence(evidence_ref);
  }

  expireEvidence(evidence_ref: string): EvidenceRecord | PageSceneUnavailable {
    return this.pageScenes.expireEvidence(evidence_ref);
  }

  getCoreSceneReference(snapshot_ref: string): CoreSceneReference | PageSceneUnavailable {
    return this.pageScenes.getCoreSceneReference(snapshot_ref, (runtime_session_ref) => this.isSessionReadable(runtime_session_ref));
  }

  getEvidenceStatusFixture(snapshot_ref: string): EvidenceStatusFixture | PageSceneUnavailable {
    return this.pageScenes.getEvidenceStatusFixture(snapshot_ref, (runtime_session_ref) => this.isSessionReadable(runtime_session_ref));
  }

  getViewerControlFacts(runtime_session_ref: string): ViewerControlFacts | ViewerControlUnavailable {
    return this.viewerControls.get(runtime_session_ref);
  }

  recordHandoff(runtime_session_ref: string, input: RecordHandoffInput): ViewerControlFacts | ViewerControlUnavailable {
    const result = this.viewerControls.recordHandoff(runtime_session_ref, input);
    if (!("status" in result)) {
      const record = this.sessions.get(runtime_session_ref);
      if (record) {
        record.facts.control_owner = result.control.owner;
        record.facts.last_seen_at = result.control.updated_at;
        record.facts.facts.push(
          { key: "control.owner", source: "observed", value: result.control.owner },
          { key: "handoff.reason", source: "observed", value: result.control.handoff_reason ?? "none" },
          { key: "takeover.available", source: "observed", value: String(result.control.takeover.available) }
        );
      }
    }
    return result;
  }

  getCoreRuntimeFacts(runtime_session_ref: string): CoreRuntimeFacts | ViewerControlUnavailable {
    const record = this.sessions.get(runtime_session_ref);
    if (!record) {
      return { status: "unavailable", failure_class: "session_missing", message: "Runtime Session is missing.", retryable: true };
    }
    const viewerControl = this.viewerControls.get(runtime_session_ref);
    if ("status" in viewerControl) return viewerControl;
    return coreRuntimeFacts(record.facts, viewerControl);
  }

  getValidationRuntimeFacts(runtime_session_ref: string): ValidationRuntimeFacts | ViewerControlUnavailable {
    const record = this.sessions.get(runtime_session_ref);
    if (!record) {
      return { status: "unavailable", failure_class: "session_missing", message: "Runtime Session is missing.", retryable: true };
    }
    return {
      schema_version: HARBOR_VALIDATION_RUNTIME_FACTS_SCHEMA,
      runtime_session_ref,
      provider_ref: record.facts.provider_ref,
      profile_ref: record.facts.profile_ref,
      validation_refs: record.facts.facts.flatMap((fact) => fact.evidence_ref ? [fact.evidence_ref] : []),
      runtime_ready: record.facts.lifecycle_state === "active" || record.facts.lifecycle_state === "idle",
      blocking_reasons: record.facts.current_error ? [record.facts.current_error] : [],
      availability: snapshot(record.facts.availability),
      unavailable: null
    };
  }

  getAppRuntimeStatusFixture(runtime_session_ref: string): AppRuntimeStatusFixture | ViewerControlUnavailable {
    const record = this.sessions.get(runtime_session_ref);
    if (!record) {
      return { status: "unavailable", failure_class: "session_missing", message: "Runtime Session is missing.", retryable: true };
    }
    const viewerControl = this.viewerControls.get(runtime_session_ref);
    if ("status" in viewerControl) return viewerControl;
    return appRuntimeStatusFixture(record.facts, viewerControl);
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
    record.facts.availability.viewer = "unavailable";
    record.facts.availability.snapshot = "unavailable";
    record.facts.control_owner = "none";
    this.viewerControls.markClosed(runtime_session_ref, now);
    return snapshot(record.facts);
  }

  private isSessionReadable(runtime_session_ref: string): boolean {
    const lifecycle = this.sessions.get(runtime_session_ref)?.facts.lifecycle_state;
    return lifecycle === "active" || lifecycle === "idle";
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
    const evidence_ref = opaqueRef("validation");
    return {
      status: "ready",
      cdp_ref: opaqueRef("cdp"),
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

export function createFixtureLauncher(status: "ready" | "unavailable" | "profile_locked" | "session_lost" = "ready"): LocalProviderLauncher {
  return async () => {
    if (status === "unavailable") return unavailable("provider_unavailable", "Fixture provider unavailable.");
    if (status === "profile_locked") return unavailable("profile_locked", "Fixture profile is locked by another local browser process.");
    if (status === "session_lost") return unavailable("session_lost", "Fixture Runtime Session was lost before validation could complete.");
    const evidence_ref = opaqueRef("validation");
    return {
      status: "ready",
      cdp_ref: opaqueRef("cdp"),
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

function snapshot<T>(value: T): T {
  return structuredClone(value);
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
