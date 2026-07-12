import assert from "node:assert/strict";
import test from "node:test";
import { validateXhsWritePrecheckObservation, validWritePrecheckFreshness, writePrecheckProbeExpression } from "./local-provider-launcher.js";
import { admitXhsPublishPrecheck, completeWritePrecheck, validCompletedWritePrecheckProbe, WritePrecheckObservationStore, XHS_PUBLISH_PRECHECK_PIN } from "./write-precheck-operation.js";
import { RuntimeSessionStore } from "./runtime-session.js";
import { ViewerControlStore } from "./viewer-control.js";
import { createFixtureLauncher } from "./local-provider-launcher.js";

const request = {
  url: "https://creator.xiaohongshu.com/publish/publish?from=menu_left&target=image",
  target_ref: "writable-target:xiaohongshu/creator-publish-note",
  no_submit_guard: "active",
  requested_fields: ["title", "summary", "canonical_url", "source_status"],
  include_source_refs: true,
  proposed_input_summary: "校验创作中心发布页和内容编辑目标，不保存、不上传、不发布。"
};

test("admits the exact Lode input schema and rejects forbidden draft/business data", () => {
  assert.deepEqual(admitXhsPublishPrecheck(request), { url: request.url, target_ref: request.target_ref, requested_fields: request.requested_fields, include_source_refs: true, proposed_input_summary: request.proposed_input_summary });
  for (const changed of [
    { ...request, package_ref: XHS_PUBLISH_PRECHECK_PIN.package_ref },
    { ...request, lock_ref: XHS_PUBLISH_PRECHECK_PIN.lock_ref },
    { ...request, operation_id: XHS_PUBLISH_PRECHECK_PIN.operation_id },
    { ...request, operation_mode: "validate_only" },
    { ...request, url: "https://www.xiaohongshu.com/publish/publish" },
    { ...request, url: "https://creator.xiaohongshu.com.evil.test/publish/publish" },
    { ...request, no_submit_guard: "inactive" },
    { ...request, requested_fields: ["title", "title"] },
    { ...request, requested_fields: ["body"] },
    { ...request, draft: { title: "forbidden", body: "forbidden" } },
    { ...request, proposed_input_summary: "production_payload token=x" }
  ]) assert.equal(admitXhsPublishPrecheck(changed), null);
});

test("validates the creator entrypoint without initializing composition or executing a write", () => {
  const admitted = admitXhsPublishPrecheck(request)!;
  const input = { target_url: admitted.url, expected_origin: XHS_PUBLISH_PRECHECK_PIN.origin, target_ref: admitted.target_ref } as const;
  const observation = {
    url: admitted.url, origin: XHS_PUBLISH_PRECHECK_PIN.origin, pathname: "/publish/publish",
    creator_app_owned: true, creator_root_count: 1, upload_image_tab_active: true, upload_image_entry_visible: true, text_image_entry_visible: true
  };
  const result = validateXhsWritePrecheckObservation(input, observation);
  assert.equal(result.status, "completed");
  if (result.status !== "completed") throw new Error("valid creator fields rejected");
  assert.equal(validCompletedWritePrecheckProbe(result), true);
  assert.equal(validCompletedWritePrecheckProbe({ ...result, evidence_ref_kinds: [] }), false);
  const completed = completeWritePrecheck("session_test", "identity_test", result);
  assert.equal(completed.status, "completed");
  if (completed.status !== "completed") throw new Error("completion rejected");
  assert.equal(completed.submitted, false);
  assert.equal(completed.identity_ref, "identity_test");
  assert.match(completed.page_ref, /^page_/);
  assert.equal(completed.merged_head_ref, XHS_PUBLISH_PRECHECK_PIN.commit);
  assert.equal(completed.post_check.submitted, false);
  assert.equal(completed.classification, "partial_result");
  assert.equal(completed.precheck_scope, "entrypoint_only");
  assert.equal(completed.composition_state, "composition_not_initialized");
  assert.deepEqual(completed.field_states, {
    title_input: { availability: "unavailable", observation: "not_observed" },
    content_editor: { availability: "unavailable", observation: "not_observed" },
    publish_control: { availability: "unavailable", observation: "not_observed" }
  });
  assert.deepEqual(completed.prohibited_actions_observed, { upload: false, generate: false, save: false, publish: false });
  assert.deepEqual(completed.post_check.source_refs, completed.source_refs);
  assert.deepEqual(completed.post_check.evidence_refs.map((ref) => ref.kind), ["snapshot_ref"]);
  assert.equal(completed.public_boundary.external_write_actions, "not_performed");
  assert.deepEqual(completed.source_refs.map((ref) => ref.kind), ["creator_publish_page_summary", "dom_snapshot_summary"]);
  assert.deepEqual(completed.evidence_ref_kinds.map((ref) => ref.kind), ["snapshot_ref", "post_check_ref"]);
  assert.equal(completed.target_ref, request.target_ref);
  assert.equal(completed.no_submit_guard, "active");
  assert.equal(validWritePrecheckFreshness(input, observation, observation, 1000, 2000), true);
  assert.equal(validWritePrecheckFreshness(input, observation, { ...observation, url: `${request.url}#drift` }, 1000, 2000), false);
  assert.equal(validWritePrecheckFreshness(input, observation, observation, 1000, 3001), false);
  const observations = new WritePrecheckObservationStore();
  observations.record(completed);
  for (const ref of [completed.page_ref, completed.result_ref, completed.submitted_result_ref, completed.post_check.post_check_ref, ...completed.source_refs.map(({ ref }) => ref), ...completed.post_check.evidence_refs.map(({ ref }) => ref)]) {
    const record = observations.get(ref);
    assert.equal(record?.runtime_session_ref, "session_test");
    assert.equal(record?.identity_ref, "identity_test");
    assert.equal(record?.submitted, false);
  }
  const expression = writePrecheckProbeExpression();
  assert.equal(/\.click\s*\(|\.value\s*=|dispatchEvent|execCommand/.test(expression), false);
  assert.match(expression, /aria-hidden/);
  assert.match(expression, /aria-disabled/);
  assert.match(expression, /data-decoy/);
  assert.match(expression, /\.decoy/);
  assert.match(expression, /#web\.publish-vue-container/);
  assert.match(expression, /\.creator-tab\.active/);
  assert.match(expression, /上传图片/);
  assert.match(expression, /文字配图/);
  assert.match(expression, /Number\(s\.opacity\) >= 0\.01/);
  assert.match(expression, /s\.zIndex !== '-1'/);
});

test("keeps fixture launchers in a non-real test namespace", async () => {
  const sessions = new RuntimeSessionStore(new ViewerControlStore(), createFixtureLauncher("ready"));
  const session = await sessions.createSession({ url: request.url, control_owner: "core_task" });
  const result = await sessions.probeWritePrecheck(session.runtime_session_ref, { target_url: request.url, expected_origin: XHS_PUBLISH_PRECHECK_PIN.origin, target_ref: request.target_ref });
  assert.deepEqual(result, { status: "unavailable", failure_class: "fixture_runtime", message: "Fixture launchers cannot validate a real write-precheck page.", retryable: false });
});

test("fails closed for login, challenge, page drift, and incomplete creator entrypoint observations", () => {
  const input = { target_url: request.url, expected_origin: XHS_PUBLISH_PRECHECK_PIN.origin, target_ref: request.target_ref } as const;
  const base = { url: request.url, origin: XHS_PUBLISH_PRECHECK_PIN.origin, pathname: "/publish/publish", creator_app_owned: true, creator_root_count: 1, upload_image_tab_active: true, upload_image_entry_visible: true, text_image_entry_visible: true };
  assert.equal(validateXhsWritePrecheckObservation(input, { ...base, login_like: true }).status, "unavailable");
  assert.equal(validateXhsWritePrecheckObservation(input, { ...base, challenge_like: true }).status, "unavailable");
  assert.equal(validateXhsWritePrecheckObservation(input, { ...base, url: `${request.url}#changed` }).status, "unavailable");
  assert.equal(validateXhsWritePrecheckObservation(input, { ...base, creator_root_count: 0 }).status, "unavailable");
  assert.equal(validateXhsWritePrecheckObservation(input, { ...base, creator_root_count: 2 }).status, "unavailable");
  assert.equal(validateXhsWritePrecheckObservation(input, { ...base, upload_image_tab_active: false }).status, "unavailable");
  assert.equal(validateXhsWritePrecheckObservation(input, { ...base, upload_image_entry_visible: false }).status, "unavailable");
  assert.equal(validateXhsWritePrecheckObservation(input, { ...base, text_image_entry_visible: false }).status, "unavailable");
  assert.equal(validateXhsWritePrecheckObservation(input, { ...base, creator_app_owned: false }).status, "unavailable");
  assert.equal(validateXhsWritePrecheckObservation(input, undefined).status, "unavailable");
});
