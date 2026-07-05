import { createFixtureLauncher, HarborRuntime } from "./index.js";

const useLocalProvider = process.argv.includes("--local");
const runtime = new HarborRuntime(useLocalProvider ? undefined : createFixtureLauncher("ready"));
const session = await runtime.createSession();
const capture = session.lifecycle_state === "active"
  ? runtime.captureSnapshot(session.runtime_session_ref, {
      title: useLocalProvider ? "Local runtime smoke" : "Fixture runtime smoke",
      url: "about:blank",
      summary: "Runtime Session can produce low-noise snapshot, refmap, and evidence refs.",
      capture_method: useLocalProvider ? "provided_context" : "fixture",
      source_locator: useLocalProvider ? "local://about-blank" : "fixture://runtime-smoke",
      elements: [{ label: "Runtime smoke page", role: "document" }]
    })
  : null;
const readback = runtime.getSession(session.runtime_session_ref);
const viewerControl = runtime.getViewerControlFacts(session.runtime_session_ref);
const handoff = runtime.recordHandoff(session.runtime_session_ref, {
  control_owner: "user",
  handoff_reason: "viewer_only"
});
const coreRuntime = runtime.getCoreRuntimeFacts(session.runtime_session_ref);
const validationRuntime = runtime.getValidationRuntimeFacts(session.runtime_session_ref);
const writePrecheck = runtime.getWritePrecheckFacts(session.runtime_session_ref);
const appStatus = runtime.getAppRuntimeStatusFixture(session.runtime_session_ref);
const scene = capture?.status === "captured" ? runtime.getCoreSceneReference(capture.snapshot_ref) : capture;
const evidenceStatus = capture?.status === "captured" ? runtime.getEvidenceStatusFixture(capture.snapshot_ref) : capture;
const previewEvidence = runtime.capturePreviewEvidence(session.runtime_session_ref);
const redactedPreviewExport = "status" in previewEvidence ? previewEvidence : runtime.getRedactedPreviewExportFixture(previewEvidence.before_preview.snapshot_ref);
const closed = await runtime.closeSession(session.runtime_session_ref);
const staleEvidenceStatus = capture?.status === "captured" ? runtime.getEvidenceStatusFixture(capture.snapshot_ref) : capture;

console.log(JSON.stringify({
  mode: useLocalProvider ? "local" : "fixture",
  session,
  capture,
  scene,
  previewEvidence,
  readback,
  viewerControl,
  handoff,
  coreRuntime,
  validationRuntime,
  writePrecheck,
  redactedPreviewExport,
  appStatus,
  evidenceStatus,
  staleEvidenceStatus,
  closed
}, null, 2));

if (
  !readback ||
  !closed ||
  !capture ||
  capture.status !== "captured" ||
  "status" in viewerControl ||
  "status" in handoff ||
  "status" in coreRuntime ||
  "status" in validationRuntime ||
  "status" in writePrecheck ||
  "status" in appStatus ||
  !evidenceStatus ||
  "status" in evidenceStatus ||
  "status" in previewEvidence ||
  "status" in redactedPreviewExport ||
  !staleEvidenceStatus ||
  "status" in staleEvidenceStatus ||
  staleEvidenceStatus.scene_status.display_state !== "stale"
) {
  process.exitCode = 1;
}
