import assert from "node:assert/strict";
import test from "node:test";
import { createFixtureLauncher, HarborRuntime } from "./index.js";

test("creates, reads, and closes a runtime session", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const session = await runtime.createSession();

  assert.equal(session.lifecycle_state, "active");
  assert.equal(session.availability.cdp, "available");
  assert.equal(runtime.getSession(session.runtime_session_ref)?.runtime_session_ref, session.runtime_session_ref);

  const closed = await runtime.closeSession(session.runtime_session_ref);
  assert.equal(closed?.lifecycle_state, "closed");
  assert.equal(closed?.availability.cdp, "unavailable");
});

test("reports provider unavailability as structured runtime facts", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("unavailable"));
  const session = await runtime.createSession();

  assert.equal(session.lifecycle_state, "failed");
  assert.equal(session.current_error?.code, "provider_unavailable");
  assert.equal(session.availability.cdp, "unavailable");
});

test("separates configured, observed, provider claim, and validation evidence facts", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const session = await runtime.createSession();
  const sources = new Set(session.facts.map((fact) => fact.source));

  assert.equal(sources.has("configured"), true);
  assert.equal(sources.has("observed"), true);
  assert.equal(sources.has("provider_claim"), true);
  assert.equal(sources.has("validation_evidence"), true);
});

test("does not expose raw CDP endpoints in public session facts", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const session = await runtime.createSession();
  const publicJson = JSON.stringify(session);

  assert.equal(publicJson.includes("ws://"), false);
  assert.equal(publicJson.includes("webSocketDebuggerUrl"), false);
  assert.match(session.cdp_ref ?? "", /^cdp_/);
});

test("captures snapshot, refmap, and evidence refs without raw page payloads", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const session = await runtime.createSession();
  const capture = runtime.captureSnapshot(session.runtime_session_ref, {
    title: "Inbox",
    url: "https://example.test/inbox",
    summary: "Inbox with two visible messages.",
    source_locator: "fixture://inbox",
    elements: [
      { label: "Open first message", role: "button", locator_hint: "text=Open first message" },
      { label: "Archive", role: "button" }
    ]
  });

  assert.equal(capture.status, "captured");
  if (capture.status !== "captured") throw new Error("capture should be available");
  assert.match(capture.snapshot_ref, /^snapshot_/);
  assert.match(capture.refmap_ref ?? "", /^refmap_/);
  assert.equal(capture.core_scene_ref.page_summary.summary, "Inbox with two visible messages.");
  assert.equal(capture.core_scene_ref.evidence_refs.length, 3);

  const snapshot = runtime.getSnapshot(capture.snapshot_ref);
  assert.equal("snapshot_ref" in snapshot, true);
  if (!("snapshot_ref" in snapshot)) throw new Error("snapshot should be readable");
  assert.equal(snapshot.page.title, "Inbox");
  assert.equal(snapshot.redaction_state, "redacted");

  const refmap = runtime.getRefMap(capture.refmap_ref ?? "");
  assert.equal("refmap_ref" in refmap, true);
  if (!("refmap_ref" in refmap)) throw new Error("refmap should be readable");
  assert.match(refmap.element_refs[0]?.element_ref ?? "", /^element_/);
  assert.equal(refmap.element_refs[0]?.label, "Open first message");

  const evidence = runtime.getEvidence(capture.evidence_refs[0] ?? "");
  assert.equal("evidence_ref" in evidence, true);
  if (!("evidence_ref" in evidence)) throw new Error("evidence should be readable");
  assert.equal(evidence.owner, "harbor");
  assert.equal(evidence.storage_scope, "process_memory");
  assert.equal(evidence.provenance.source_locator, "fixture://inbox");

  const coreJson = JSON.stringify(capture.core_scene_ref);
  assert.equal(coreJson.includes("raw_dom"), false);
  assert.equal(coreJson.includes("raw_har"), false);
  assert.equal(coreJson.includes("screenshot"), false);
  assert.equal(coreJson.includes("video"), false);
  assert.equal(coreJson.includes("cookie"), false);
  assert.equal(coreJson.includes("token"), false);
  assert.equal(coreJson.includes("profile_path"), false);
  assert.equal(coreJson.includes("webSocketDebuggerUrl"), false);
});

test("returns structured unavailable states for denied, missing, and stale refs", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const session = await runtime.createSession();

  const denied = runtime.captureSnapshot(session.runtime_session_ref, {
    evidence_policy: { capture: "deny" }
  });
  assert.equal(denied.status, "unavailable");
  assert.equal(denied.failure_class, "capture_denied");
  assert.equal(denied.retryable, false);

  const missing = runtime.getSnapshot("snapshot_missing");
  assert.equal("status" in missing, true);
  if (!("status" in missing)) throw new Error("missing snapshot should be unavailable");
  assert.equal(missing.failure_class, "snapshot_missing");

  const captured = runtime.captureSnapshot(session.runtime_session_ref, {
    title: "Transient page",
    summary: "A page that will become stale."
  });
  assert.equal(captured.status, "captured");
  if (captured.status !== "captured") throw new Error("capture should be available");
  await runtime.closeSession(session.runtime_session_ref);

  const stale = runtime.getCoreSceneReference(captured.snapshot_ref);
  assert.equal("status" in stale, true);
  if (!("status" in stale)) throw new Error("closed session snapshot should be stale");
  assert.equal(stale.failure_class, "snapshot_stale");
  assert.equal(stale.retryable, true);

  const closedCapture = runtime.captureSnapshot(session.runtime_session_ref);
  assert.equal(closedCapture.status, "unavailable");
  assert.equal(closedCapture.failure_class, "source_unavailable");
});
