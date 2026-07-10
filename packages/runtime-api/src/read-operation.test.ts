import assert from "node:assert/strict";
import test from "node:test";
import {
  admitAllowlistedReadOperation,
  LODE_262_ALLOWLIST_PIN,
  ReadOperationObservationStore
} from "./read-operation.js";
import { validateReadOperationProbe } from "./local-provider-launcher.js";

test("pins the packaged Harbor admission mirror to Lode #262", () => {
  assert.equal(LODE_262_ALLOWLIST_PIN.repository, "WebEnvoy/Lode");
  assert.equal(LODE_262_ALLOWLIST_PIN.commit, "e36a4a7");
  assert.equal(LODE_262_ALLOWLIST_PIN.asset_path, "registry/runtime-consumption-allowlist.json");
  assert.equal(LODE_262_ALLOWLIST_PIN.asset_sha256, "5aa6be8bd416bbd19f73dcfab995f62f769849923f2aa2e995da974b0f329184");
});

test("admits only the two pinned read-only operation identities", () => {
  const xiaohongshu = admitAllowlistedReadOperation({
    site_id: "xiaohongshu",
    operation_id: "xhs_search_notes",
    query: "AI tools"
  });
  assert.equal(typeof xiaohongshu === "string", false);
  if (typeof xiaohongshu === "string") throw new Error("Pinned Xiaohongshu operation was unexpectedly rejected.");
  assert.equal(xiaohongshu.entry.operation_mode, "read");
  assert.equal(xiaohongshu.entry.lock_ref, "lode://lock/site-capability/xiaohongshu/search-notes@0.1.0");
  assert.equal(new URL(xiaohongshu.target_url).origin, "https://www.xiaohongshu.com");

  assert.equal(admitAllowlistedReadOperation({ site_id: "xiaohongshu", operation_id: "xhs_publish_note" }), "invalid_request");
  assert.equal(admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_job_search", operation_mode: "write" }), "invalid_request");
});

test("fails closed for invalid target URLs and cross-origin requests", () => {
  assert.equal(
    admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_job_search", url: "http://www.zhipin.com/web/geek/jobs" }),
    "target_url_invalid"
  );
  assert.equal(
    admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_job_search", url: "https://www.zhipin.com.evil.test/web/geek/jobs" }),
    "target_origin_not_allowed"
  );
});

test("does not construct post-check provenance from missing or arbitrary source labels", () => {
  const admitted = admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_job_search" });
  if (typeof admitted === "string") throw new Error("Pinned BOSS operation was unexpectedly rejected.");
  const store = new ReadOperationObservationStore();
  assert.equal(store.capture({
    operation_ref: "read_operation_test",
    runtime_session_ref: "session_test",
    entry: admitted.entry,
    observed_origin: "https://www.zhipin.com",
    observed_at: "2026-07-11T00:00:00.000Z",
    snapshot_ref: "snapshot_test",
    evidence_refs: ["evidence_test"],
    checked_signal_kinds: ["attacker_label"]
  }), "source_refs_missing");

  const proof = store.capture({
    operation_ref: "read_operation_bound",
    runtime_session_ref: "session_bound",
    entry: admitted.entry,
    observed_origin: "https://www.zhipin.com",
    observed_at: "2026-07-11T00:00:01.000Z",
    snapshot_ref: "snapshot_bound",
    evidence_refs: ["evidence_bound"],
    checked_signal_kinds: ["network_summary"]
  });
  if (typeof proof === "string") throw new Error("Bound observation was unexpectedly rejected.");
  const source = proof.source_refs[0]!;
  const networkEvidence = proof.evidence_ref_kinds.find((ref) => ref.kind === "network_summary_ref")!;
  assert.notEqual(source.ref, proof.post_check_ref);
  assert.notEqual(networkEvidence.ref, proof.post_check_ref);
  const postCheck = store.get(proof.post_check_ref);
  assert.deepEqual(postCheck?.post_check?.source_refs, proof.source_refs);
  assert.deepEqual(postCheck?.post_check?.evidence_refs, proof.evidence_refs);
  const forged = { ...proof, source_refs: [{ kind: "attacker_label", ref: source.ref }] };
  assert.equal(store.complete(admitted.entry, forged), "post_check_missing");
});

test("fails closed when the live probe lacks an operation-specific surface or required signal", () => {
  const xhsInput = {
    site_id: "xiaohongshu" as const,
    operation_id: "xhs_search_notes" as const,
    target_url: "https://www.xiaohongshu.com/search_result?keyword=AI",
    expected_origin: "https://www.xiaohongshu.com"
  };
  const readyXhs = {
    origin: "https://www.xiaohongshu.com",
    pathname: "/search_result",
    ready: true,
    rendered_surface: true,
    pinia_ready: true,
    same_origin_fetch_ready: true
  };
  assert.equal(validateReadOperationProbe(xhsInput, { ...readyXhs, pathname: "/settings" }).status, "unavailable");
  assert.equal(validateReadOperationProbe(xhsInput, { ...readyXhs, pinia_ready: false }).status, "unavailable");

  const bossInput = {
    site_id: "boss" as const,
    operation_id: "boss_job_search" as const,
    target_url: "https://www.zhipin.com/web/geek/jobs?query=AI",
    expected_origin: "https://www.zhipin.com"
  };
  const readyBoss = {
    origin: "https://www.zhipin.com",
    pathname: "/web/geek/jobs",
    ready: true,
    rendered_surface: true,
    wapi_zpgeek_ready: true
  };
  assert.equal(validateReadOperationProbe(bossInput, { ...readyBoss, pathname: "/web/geek/profile" }).status, "unavailable");
  assert.equal(validateReadOperationProbe(bossInput, { ...readyBoss, wapi_zpgeek_ready: false }).status, "unavailable");
});
