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
import { readProbeExpression, shouldBlockReadOperationDocumentNavigation, summarizeBossJobSearchResponse, validateBossSpaResourceProbe, validateReadOperationProbe } from "./local-provider-launcher.js";

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

  const boss = admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_job_search", query: "AI tools", city_code: "101010100" });
  assert.equal(typeof boss === "string", false);
  if (typeof boss === "string") throw new Error("Pinned BOSS operation was unexpectedly rejected.");
  assert.equal(boss.target_url, "https://www.zhipin.com/web/geek/job?query=AI+tools&city=101010100");
  assert.equal(admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_job_search", query: "AI tools" }), "city_unresolved");
  assert.equal(admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_job_search", query: "AI tools", city_code: "beijing" }), "city_unresolved");

  assert.equal(admitAllowlistedReadOperation({ site_id: "xiaohongshu", operation_id: "xhs_publish_note", query: "AI tools" }), "invalid_request");
  assert.equal(admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_job_search", query: "AI tools", operation_mode: "write" }), "invalid_request");
});

test("fails closed for invalid target URLs and cross-origin requests", () => {
  assert.equal(
    admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_job_search", query: "AI tools", city_code: "101010100", url: "http://www.zhipin.com/web/geek/jobs" }),
    "target_url_invalid"
  );
  assert.equal(
    admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_job_search", query: "AI tools", city_code: "101010100", url: "https://www.zhipin.com.evil.test/web/geek/jobs" }),
    "target_origin_not_allowed"
  );
  for (const path of ["/publish", "/chat", "/profile"]) {
    assert.equal(
      admitAllowlistedReadOperation({ site_id: "xiaohongshu", operation_id: "xhs_search_notes", query: "AI tools", url: `https://www.xiaohongshu.com${path}` }),
      "target_path_not_allowlisted"
    );
  }
  assert.equal(
    admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_job_search", query: "AI tools", city_code: "101010100", url: "https://www.zhipin.com/web/geek/profile" }),
    "target_path_not_allowlisted"
  );
  assert.equal(
    admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_job_search", query: "AI tools", city_code: "101010100", url: "https://www.zhipin.com/web/geek/jobs?query=AI+tools&city=101010100" }),
    "target_path_not_allowlisted"
  );
});

test("blocks cross-origin document redirects before navigation while allowing same-origin resources", () => {
  assert.equal(shouldBlockReadOperationDocumentNavigation("Document", "https://www.xiaohongshu.com/search_result?keyword=AI", "https://www.xiaohongshu.com"), false);
  assert.equal(shouldBlockReadOperationDocumentNavigation("Document", "https://evil.example/redirect", "https://www.xiaohongshu.com"), true);
  assert.equal(shouldBlockReadOperationDocumentNavigation("Document", "not a URL", "https://www.xiaohongshu.com"), true);
  assert.equal(shouldBlockReadOperationDocumentNavigation("Script", "https://cdn.example/app.js", "https://www.xiaohongshu.com"), false);
});

test("accepts only a rendered canonical BOSS SPA surface for pre-admission", () => {
  const ready = validateBossSpaResourceProbe({
    origin: "https://www.zhipin.com",
    pathname: "/web/geek/job",
    ready: true,
    rendered_surface: true,
    login_like: false,
    challenge_like: false
  });
  assert.equal(ready.status, "available");
  assert.equal("evidence_ref" in ready, true);

  const cases = [
    [{ origin: "https://www.zhipin.com", pathname: "/web/user/", ready: true, rendered_surface: false, login_like: true }, "blocked", "not_logged_in"],
    [{ origin: "https://www.zhipin.com", pathname: "/security/verify", ready: true, rendered_surface: false, challenge_like: true }, "blocked", "safety_challenge"],
    [{ origin: "null", pathname: "blank", ready: false, rendered_surface: false }, "unavailable", "page_not_ready"],
    [{ origin: "https://www.zhipin.com", pathname: "/web/geek/job", ready: true, rendered_surface: false }, "unavailable", "page_not_ready"],
    [undefined, "unknown", "provider_probe_unavailable"]
  ] as const;
  for (const [observation, status, failureClass] of cases) {
    const result = validateBossSpaResourceProbe(observation);
    assert.equal(result.status, status);
    assert.equal("failure_class" in result ? result.failure_class : null, failureClass);
  }
});

test("correlates the official Vue Pinia search store without exposing store contents", () => {
  const query = "AI \"tools\"; throw new Error('injected'); //\\nnext";
  const evaluate = new Function("window", "document", "location", `return ${readProbeExpression("xiaohongshu", query)}`);
  const pinia = {
    _s: new Map([["search", {
      searchValue: { value: query },
      feeds: { value: Array.from({ length: 22 }, () => ({})) },
      hasMore: { value: true },
      private: "not_returned"
    }]])
  };
  const result = evaluate({}, { querySelector: () => ({ __vue_app__: { config: { globalProperties: { $pinia: pinia } } } }) }, {
    origin: "https://www.xiaohongshu.com",
    pathname: "/search_result",
    search: `?keyword=${encodeURIComponent(query)}`
  });
  assert.deepEqual(result, {
    origin: "https://www.xiaohongshu.com",
    pathname: "/search_result",
    search: `?keyword=${encodeURIComponent(query)}`,
    ready: true,
    pinia_ready: true
  });
  assert.equal(JSON.stringify(result).includes("not_returned"), false);

  for (const candidate of [
    { _s: new Map() },
    { _s: new Map([["other", { searchValue: { value: query }, feeds: { value: [{}] } }]]) },
    { _s: new Map([["search", { searchValue: { value: "wrong query" }, feeds: { value: [{}] } }]]) },
    { _s: new Map([["search", { searchValue: { value: query } }]]) },
    { _s: {} },
    { private: "unrelated" }
  ]) {
    const negative = evaluate({ __PINIA__: candidate }, { querySelector: () => null }, {
      origin: "https://www.xiaohongshu.com",
      pathname: "/search_result",
      search: `?keyword=${encodeURIComponent(query)}`
    });
    assert.equal(negative.pinia_ready, false);
  }
});

test("observes BOSS SPA, login wall, and challenge state without returning page text", () => {
  const evaluate = new Function("document", "location", `return ${readProbeExpression("boss", "AI", "101010100")}`);
  const location = { origin: "https://www.zhipin.com", pathname: "/web/geek/job", search: "?query=AI&city=101010100" };
  const document = {
    readyState: "complete",
    body: { innerText: "公开职位列表" },
    querySelector: (selector: string) => selector.includes("#wrap") || selector.includes(".job-list-box") ? {} : null
  };
  assert.deepEqual(evaluate(document, location), {
    origin: location.origin,
    pathname: location.pathname,
    search: location.search,
    ready: true,
    rendered_surface: true,
    login_like: false,
    challenge_like: false
  });
  assert.equal(evaluate({ ...document, body: { innerText: "扫码登录" } }, location).login_like, true);
  assert.equal(evaluate({ ...document, body: { innerText: "访问异常，请完成安全验证" } }, location).challenge_like, true);
});

test("does not construct post-check provenance from missing or arbitrary source labels", () => {
  const admitted = admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_job_search", query: "AI tools", city_code: "101010100" });
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
      query: "AI tools",
      city_code: "101010100",
      business_code: 0,
      job_count: 2,
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
      query: "AI tools",
      city_code: "101010100",
      business_code: 0,
      job_count: 2,
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
  assert.equal(store.get(networkEvidence.ref)?.summary_source_ref, source.ref);
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
    search: "?keyword=AI",
    ready: true,
    pinia_ready: true,
    operation_response_status: 200,
    operation_response_url: "https://so.xiaohongshu.com/api/sns/web/v2/search/notes"
  };
  assert.equal(validateReadOperationProbe(xhsInput, { ...readyXhs, pathname: "/settings" }).status, "unavailable");
  assert.equal(validateReadOperationProbe(xhsInput, { ...readyXhs, search: "?keyword=other" }).status, "unavailable");
  assert.equal(validateReadOperationProbe(xhsInput, { ...readyXhs, search: "" }).status, "unavailable");
  assert.equal(validateReadOperationProbe(xhsInput, { ...readyXhs, search: "?keyword=AI&keyword=AI" }).status, "unavailable");
  assert.equal(validateReadOperationProbe(xhsInput, { ...readyXhs, pinia_ready: false }).status, "unavailable");
  assert.equal(validateReadOperationProbe(xhsInput, { ...readyXhs, operation_response_status: undefined }).status, "unavailable");

  const bossInput = {
    site_id: "boss" as const,
    operation_id: "boss_job_search" as const,
    query: "AI",
    city_code: "101010100",
    target_url: "https://www.zhipin.com/web/geek/job?query=AI&city=101010100",
    expected_origin: "https://www.zhipin.com"
  };
  const readyBoss = {
    origin: "https://www.zhipin.com",
    pathname: "/web/geek/job",
    search: "?query=AI&city=101010100",
    ready: true,
    rendered_surface: true,
    operation_response_status: 200,
    operation_response_url: "https://www.zhipin.com/wapi/zpgeek/search/joblist.json?query=AI&city=101010100",
    boss_response: { status: "completed" as const, business_code: 0 as const, job_count: 2 }
  };
  assert.equal(validateReadOperationProbe(bossInput, { ...readyBoss, pathname: "/web/geek/jobs" }).status, "unavailable");
  assert.equal(validateReadOperationProbe(bossInput, readyBoss).status, "completed");
  assert.equal(validateReadOperationProbe(bossInput, { ...readyBoss, operation_response_status: 500 }).status, "unavailable");
  assert.equal(validateReadOperationProbe(bossInput, { ...readyBoss, search: "?query=other&city=101010100" }).status, "unavailable");
  assert.equal(validateReadOperationProbe(bossInput, { ...readyBoss, search: "?query=AI&city=101010100&extra=1" }).status, "unavailable");
  assert.equal(failureClass(validateReadOperationProbe(bossInput, { ...readyBoss, search: "?query=AI&city=101020100" })), "city_unresolved");
  assert.equal(validateReadOperationProbe(bossInput, { ...readyBoss, operation_response_url: "https://www.zhipin.com/wapi/zpgeek/search/joblist.json?query=other&city=101010100" }).status, "unavailable");
  assert.equal(validateReadOperationProbe(bossInput, { ...readyBoss, operation_response_url: "https://www.zhipin.com/wapi/zpgeek/search/joblist.json?query=AI&city=101020100" }).status, "unavailable");
  assert.equal(failureClass(validateReadOperationProbe(bossInput, { ...readyBoss, login_like: true })), "not_logged_in");
  assert.equal(failureClass(validateReadOperationProbe(bossInput, { ...readyBoss, challenge_like: true })), "safety_challenge");
  assert.equal(failureClass(validateReadOperationProbe(bossInput, { ...readyBoss, rendered_surface: false })), "page_not_ready");
  assert.equal(validateReadOperationProbe(xhsInput, { ...readyXhs, operation_response_url: "https://so.xiaohongshu.com/api/sns/web/v2/search/notes?opaque=ignored" }).status, "completed");
  for (const [input, ready, url] of [
    [xhsInput, readyXhs, "https://www.xiaohongshu.com/api/sns/web/v1/search/notes?keyword=AI"],
    [xhsInput, readyXhs, "https://so.xiaohongshu.com/api/sns/web/v1/search/notes"],
    [xhsInput, readyXhs, "https://so.xiaohongshu.com/api/sns/web/v2/search/notes/extra"],
    [xhsInput, readyXhs, "https://so.xiaohongshu.com.evil.test/api/sns/web/v2/search/notes"],
    [xhsInput, readyXhs, "http://so.xiaohongshu.com/api/sns/web/v2/search/notes"],
    [bossInput, readyBoss, "https://www.zhipin.com/wapi/zpgeek/search/joblist.json?query=AI&city=101010100&extra=1"],
    [bossInput, readyBoss, "https://www.zhipin.com/wapi/zpgeek/search/joblist.json?query=AI&city=101010100#fragment"],
    [bossInput, readyBoss, "https://www.zhipin.com/wapi/zpgeek/search/joblist.json?query=AI&city=101010100#"],
    [bossInput, readyBoss, "https://www.zhipin.com/wapi/zpgeek/search/joblist.json?query=AI&city=101010100&query=AI"],
    [bossInput, readyBoss, "https://www.zhipin.com/wapi/zpgeek/search/joblist.json?query=AI&city=101010100&"],
    [bossInput, readyBoss, "https://www.zhipin.com/wapi/zpgeek/search/joblist.json?query=AI&city=101010100&&"],
    [bossInput, readyBoss, "https://www.zhipin.com/wapi/zpgeek/search/joblist.json"]
  ] as const) {
    assert.equal(validateReadOperationProbe(input, { ...ready, operation_response_url: url }).status, "unavailable");
  }
});

test("summarizes only a successful BOSS WAPI job list and fails closed for empty 2xx shells", () => {
  assert.deepEqual(summarizeBossJobSearchResponse('{"code":0,"zpData":{"jobList":[{},{}]}}'), {
    status: "completed",
    business_code: 0,
    job_count: 2
  });
  assert.equal(failureClass(summarizeBossJobSearchResponse('{"code":1,"zpData":{"jobList":[{}]}}')), "permission_denied");
  assert.equal(failureClass(summarizeBossJobSearchResponse('{"code":0,"zpData":{"jobList":[]}}')), "empty_result");
  assert.equal(failureClass(summarizeBossJobSearchResponse('{"code":0,"zpData":{"jobList":[null]}}')), "empty_result");
  assert.equal(failureClass(summarizeBossJobSearchResponse('{"code":0,"zpData":{}}')), "site_changed");
  assert.equal(JSON.stringify(summarizeBossJobSearchResponse('{"code":0,"zpData":{"jobList":[{"secret":"not returned"}]}}')).includes("secret"), false);
});

function failureClass(result: { status: string; failure_class?: string }): string | undefined {
  return result.failure_class;
}
