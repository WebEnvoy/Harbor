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
const appStatus = runtime.getAppRuntimeStatusFixture(session.runtime_session_ref);
const scene = capture?.status === "captured" ? runtime.getCoreSceneReference(capture.snapshot_ref) : capture;
const closed = await runtime.closeSession(session.runtime_session_ref);

console.log(JSON.stringify({
  mode: useLocalProvider ? "local" : "fixture",
  session,
  capture,
  scene,
  readback,
  viewerControl,
  handoff,
  coreRuntime,
  appStatus,
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
  "status" in appStatus
) {
  process.exitCode = 1;
}
