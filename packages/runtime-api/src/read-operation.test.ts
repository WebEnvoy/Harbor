import assert from "node:assert/strict";
import test from "node:test";
import {
  admitAllowlistedReadOperation,
  canonicalPinnedMirrorSha256,
  LODE_262_ALLOWLIST_PIN,
  ReadOperationObservationStore,
  validatePinnedAllowlist
} from "./read-operation.js";
import { opaqueRef } from "./refs.js";
import { validateReadOperationProbe } from "./local-provider-launcher.js";

test("pins the packaged Harbor admission mirror to Lode #262", () => {
  assert.equal(LODE_262_ALLOWLIST_PIN.repository, "WebEnvoy/Lode");
  assert.equal(LODE_262_ALLOWLIST_PIN.commit, "e36a4a7");
  assert.equal(LODE_262_ALLOWLIST_PIN.asset_path, "registry/runtime-consumption-allowlist.json");
  assert.equal(LODE_262_ALLOWLIST_PIN.asset_sha256, "5aa6be8bd416bbd19f73dcfab995f62f769849923f2aa2e995da974b0f329184");
  assert.equal(canonicalPinnedMirrorSha256(), LODE_262_ALLOWLIST_PIN.mirror_payload_sha256);
  assert.equal(validatePinnedAllowlist(), null);
  assert.equal(validatePinnedAllowlist({ entries: [] }), "allowlist_pin_invalid");
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

  assert.equal(admitAllowlistedReadOperation({ site_id: "xiaohongshu", operation_id: "xhs_publish_note", query: "AI tools" }), "invalid_request");
  assert.equal(admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_job_search", query: "AI tools", operation_mode: "write" }), "invalid_request");
});

test("fails closed for invalid target URLs and cross-origin requests", () => {
  assert.equal(
    admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_job_search", query: "AI tools", url: "http://www.zhipin.com/web/geek/jobs" }),
    "target_url_invalid"
  );
  assert.equal(
    admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_job_search", query: "AI tools", url: "https://www.zhipin.com.evil.test/web/geek/jobs" }),
    "target_origin_not_allowed"
  );
  for (const path of ["/publish", "/chat", "/profile"]) {
    assert.equal(
      admitAllowlistedReadOperation({ site_id: "xiaohongshu", operation_id: "xhs_search_notes", query: "AI tools", url: `https://www.xiaohongshu.com${path}` }),
      "target_path_not_allowlisted"
    );
  }
  assert.equal(
    admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_job_search", query: "AI tools", url: "https://www.zhipin.com/web/geek/profile" }),
    "target_path_not_allowlisted"
  );
});

test("does not construct post-check provenance from missing or arbitrary source labels", () => {
  const admitted = admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_job_search", query: "AI tools" });
  if (typeof admitted === "string") throw new Error("Pinned BOSS operation was unexpectedly rejected.");
  const store = new ReadOperationObservationStore();
  const observedSource = { kind: "network_summary", ref: opaqueRef("source") };
  const observedEvidence = [
    { kind: "snapshot_ref", ref: opaqueRef("evidence") },
    { kind: "network_summary_ref", ref: opaqueRef("evidence") }
  ];
  assert.equal(store.capture({
    operation_ref: "read_operation_test",
    runtime_session_ref: "session_test",
    entry: admitted.entry,
    observed_origin: "https://www.zhipin.com",
    observed_at: "2026-07-11T00:00:00.000Z",
    source_refs: [{ kind: "attacker_label", ref: opaqueRef("source") }],
    evidence_ref_kinds: [{ kind: "snapshot_ref", ref: opaqueRef("evidence") }],
    public_summary_source_ref: opaqueRef("source"),
    public_summary: {
      schema_version: "harbor-read-operation-public-summary/v0",
      operation_id: "boss_job_search",
      result_kind: "boss_job_search_surface",
      surface: "web_geek_jobs",
      result_state: "operation_read_response_observed",
      response_status: 200,
      source_signals: ["boss_wapi_zpgeek_read_network"]
    }
  }), "source_refs_missing");

  const proof = store.capture({
    operation_ref: "read_operation_bound",
    runtime_session_ref: "session_bound",
    entry: admitted.entry,
    observed_origin: "https://www.zhipin.com",
    observed_at: "2026-07-11T00:00:01.000Z",
    source_refs: [observedSource],
    evidence_ref_kinds: observedEvidence,
    public_summary_source_ref: observedSource.ref,
    public_summary: {
      schema_version: "harbor-read-operation-public-summary/v0",
      operation_id: "boss_job_search",
      result_kind: "boss_job_search_surface",
      surface: "web_geek_jobs",
      result_state: "operation_read_response_observed",
      response_status: 200,
      source_signals: ["boss_wapi_zpgeek_read_network"]
    }
  });
  if (typeof proof === "string") throw new Error("Bound observation was unexpectedly rejected.");
  const source = proof.source_refs[0]!;
  const networkEvidence = proof.evidence_ref_kinds.find((ref) => ref.kind === "network_summary_ref")!;
  assert.notEqual(source.ref, proof.post_check_ref);
  assert.notEqual(networkEvidence.ref, proof.post_check_ref);
  assert.notEqual(proof.public_summary_ref, proof.post_check_ref);
  assert.notEqual(proof.public_summary_ref, source.ref);
  assert.equal(store.get(proof.public_summary_ref)?.summary_source_ref, source.ref);
  const postCheck = store.get(proof.post_check_ref);
  assert.deepEqual(postCheck?.post_check?.source_refs, proof.source_refs);
  assert.deepEqual(postCheck?.post_check?.evidence_refs, proof.evidence_refs);
  const forged = { ...proof, source_refs: [{ kind: "attacker_label", ref: source.ref }] };
  assert.equal(store.complete(admitted.entry, forged), "post_check_missing");
  assert.equal(store.complete(admitted.entry, { ...proof, public_summary_source_ref: opaqueRef("source") }), "public_summary_missing");
  assert.equal(store.complete(admitted.entry, { ...proof, public_summary: { ...proof.public_summary, response_status: 201 } }), "public_summary_missing");
});

test("fails closed when the live probe lacks an operation-specific surface or required signal", () => {
  const xhsInput = {
    site_id: "xiaohongshu" as const,
    operation_id: "xhs_search_notes" as const,
    query: "AI",
    target_url: "https://www.xiaohongshu.com/search_result?keyword=AI",
    expected_origin: "https://www.xiaohongshu.com"
  };
  const readyXhs = {
    origin: "https://www.xiaohongshu.com",
    pathname: "/search_result",
    ready: true,
    pinia_ready: true,
    operation_response_status: 200,
    operation_response_url: "https://www.xiaohongshu.com/api/sns/web/v1/search/notes?keyword=AI"
  };
  assert.equal(validateReadOperationProbe(xhsInput, { ...readyXhs, pathname: "/settings" }).status, "unavailable");
  assert.equal(validateReadOperationProbe(xhsInput, { ...readyXhs, pinia_ready: false }).status, "unavailable");
  assert.equal(validateReadOperationProbe(xhsInput, { ...readyXhs, operation_response_status: undefined }).status, "unavailable");

  const bossInput = {
    site_id: "boss" as const,
    operation_id: "boss_job_search" as const,
    query: "AI",
    target_url: "https://www.zhipin.com/web/geek/jobs?query=AI",
    expected_origin: "https://www.zhipin.com"
  };
  const readyBoss = {
    origin: "https://www.zhipin.com",
    pathname: "/web/geek/jobs",
    ready: true,
    operation_response_status: 200,
    operation_response_url: "https://www.zhipin.com/wapi/zpgeek/search/joblist.json?query=AI"
  };
  assert.equal(validateReadOperationProbe(bossInput, { ...readyBoss, pathname: "/web/geek/profile" }).status, "unavailable");
  assert.equal(validateReadOperationProbe(bossInput, { ...readyBoss, operation_response_status: 500 }).status, "unavailable");
  assert.equal(validateReadOperationProbe(bossInput, { ...readyBoss, operation_response_url: "https://www.zhipin.com/wapi/zpgeek/search/joblist.json?query=other" }).status, "unavailable");
  assert.equal(validateReadOperationProbe(bossInput, { ...readyBoss, operation_response_url: "https://www.zhipin.com/wapi/zpgeek/other?query=AI" }).status, "unavailable");
  assert.equal(validateReadOperationProbe(xhsInput, { ...readyXhs, operation_response_url: "https://www.xiaohongshu.com/api/sns/web/v1/search/notes?keyword=other" }).status, "unavailable");
  for (const [input, ready, url] of [
    [xhsInput, readyXhs, "https://www.xiaohongshu.com/api/sns/web/v1/search/notes?keyword=AI&extra=1"],
    [xhsInput, readyXhs, "https://www.xiaohongshu.com/api/sns/web/v1/search/notes?keyword=AI#fragment"],
    [xhsInput, readyXhs, "https://www.xiaohongshu.com/api/sns/web/v1/search/notes?keyword=AI#"],
    [xhsInput, readyXhs, "https://www.xiaohongshu.com/api/sns/web/v1/search/notes?keyword=AI&keyword=AI"],
    [xhsInput, readyXhs, "https://www.xiaohongshu.com/api/sns/web/v1/search/notes?keyword=AI&"],
    [xhsInput, readyXhs, "https://www.xiaohongshu.com/api/sns/web/v1/search/notes?keyword=AI&&"],
    [xhsInput, readyXhs, "https://www.xiaohongshu.com/api/sns/web/v1/search/notes"],
    [bossInput, readyBoss, "https://www.zhipin.com/wapi/zpgeek/search/joblist.json?query=AI&extra=1"],
    [bossInput, readyBoss, "https://www.zhipin.com/wapi/zpgeek/search/joblist.json?query=AI#fragment"],
    [bossInput, readyBoss, "https://www.zhipin.com/wapi/zpgeek/search/joblist.json?query=AI#"],
    [bossInput, readyBoss, "https://www.zhipin.com/wapi/zpgeek/search/joblist.json?query=AI&query=AI"],
    [bossInput, readyBoss, "https://www.zhipin.com/wapi/zpgeek/search/joblist.json?query=AI&"],
    [bossInput, readyBoss, "https://www.zhipin.com/wapi/zpgeek/search/joblist.json?query=AI&&"],
    [bossInput, readyBoss, "https://www.zhipin.com/wapi/zpgeek/search/joblist.json"]
  ] as const) {
    assert.equal(validateReadOperationProbe(input, { ...ready, operation_response_url: url }).status, "unavailable");
  }
});
