import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import {
  admitAllowlistedReadOperation,
  canonicalPinnedMirrorSha256,
  LODE_262_ALLOWLIST_PIN,
  LODE_268_DETAIL_PIN,
  ReadOperationObservationStore,
  validateDetailTruthPin,
  validatePinnedAllowlist
} from "./read-operation.js";
import { opaqueRef } from "./refs.js";
import { probeProviderSiteResource, readProbeExpression, shouldBlockReadOperationDocumentNavigation, summarizeBossJobDetailResponse, summarizeBossJobSearchResponse, validateBossSpaResourceProbe, validateReadOperationProbe } from "./local-provider-launcher.js";

test("pins the packaged Harbor admission mirror to Lode #262", () => {
  assert.equal(LODE_262_ALLOWLIST_PIN.repository, "WebEnvoy/Lode");
  assert.equal(LODE_262_ALLOWLIST_PIN.commit, "e36a4a7");
  assert.equal(LODE_262_ALLOWLIST_PIN.asset_path, "registry/runtime-consumption-allowlist.json");
  assert.equal(LODE_262_ALLOWLIST_PIN.asset_sha256, "5aa6be8bd416bbd19f73dcfab995f62f769849923f2aa2e995da974b0f329184");
  assert.equal(canonicalPinnedMirrorSha256(), LODE_262_ALLOWLIST_PIN.mirror_payload_sha256);
  assert.equal(validatePinnedAllowlist(), null);
  assert.equal(validatePinnedAllowlist({ entries: [] }), "allowlist_pin_invalid");
});

test("pins detail admission and completion to merged Lode #268 truth", () => {
  assert.equal(LODE_268_DETAIL_PIN.merge_commit, "66d79b4e600565a00515b1c801e84291edc7b0c1");
  assert.equal(LODE_268_DETAIL_PIN.asset_path, "registry/detail-runtime-consumption.json");
  assert.equal(LODE_268_DETAIL_PIN.asset_sha256, "dca2761b7feb09a0ab86f7202e153da3c97b21a75299af6adaf64eade319deef");
  assert.equal(LODE_268_DETAIL_PIN.truth_id, "lode.xhs-boss.detail-read.runtime-consumption");
  assert.equal(validateDetailTruthPin(), null);
  const boss = admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_read_job_detail", detail_ref: opaqueRef("detail_ref") });
  if (typeof boss === "string") throw new Error("Corrected BOSS detail truth was rejected.");
  assert.equal(boss.entry.package_ref, "lode://site-capability/boss/read-job-detail@0.1.1");
  assert.equal(boss.entry.lock_ref, "lode://lock/site-capability/boss/read-job-detail@0.1.1");
  assert.equal(boss.entry.version, "0.1.1");
  assert.deepEqual(boss.entry.required_source_ref_kinds, ["wapi_job_detail_summary", "dom_snapshot_summary"]);
  assert.deepEqual(boss.entry.required_evidence_ref_kinds, ["snapshot_ref"]);
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

  const noteDetail = admitAllowlistedReadOperation({ site_id: "xiaohongshu", operation_id: "xhs_read_note_detail", detail_ref: opaqueRef("detail_ref") });
  assert.equal(typeof noteDetail === "string", false);
  const jobDetail = admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_read_job_detail", detail_ref: opaqueRef("detail_ref") });
  assert.equal(typeof jobDetail === "string", false);
  assert.equal(admitAllowlistedReadOperation({ site_id: "boss", operation_id: "boss_read_job_detail", detail_ref: opaqueRef("detail_ref"), url: "https://www.zhipin.com/job_detail/forged.html" }), "invalid_request");
  assert.equal(admitAllowlistedReadOperation({ site_id: "xiaohongshu", operation_id: "xhs_read_note_detail", query: "forged-id" }), "invalid_request");
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
    vue_owned: true,
    job_card_count: 1,
    job_cards_valid: true,
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
    pinia_ready: true,
    detail_urls: []
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
  const document = bossSpaDocument();
  assert.deepEqual(evaluate(document, location), {
    origin: location.origin,
    pathname: location.pathname,
    search: location.search,
    ready: true,
    rendered_surface: true,
    vue_owned: true,
    job_card_count: 1,
    job_cards_valid: true,
    login_like: false,
    challenge_like: false
  });
  assert.equal(evaluate(bossSpaDocument({ text: `${"公开职位 ".repeat(400)}访问异常，请完成安全验证` }), location).challenge_like, true);
  assert.equal(evaluate(bossSpaDocument({ loginOverlay: true }), location).login_like, true);
  assert.equal(evaluate(bossSpaDocument({ challengeOverlay: true }), location).challenge_like, true);
  assert.equal(evaluate(bossSpaDocument({ vueOwned: false }), location).rendered_surface, false);
  assert.equal(evaluate(bossSpaDocument({ fakeVueState: true }), location).rendered_surface, false);
  assert.equal(evaluate(bossSpaDocument({ mountedSubtreeOwned: false }), location).rendered_surface, false);
  assert.equal(evaluate(bossSpaDocument({ rootOwnsList: false }), location).rendered_surface, false);
  assert.equal(evaluate(bossSpaDocument({ cards: [] }), location).rendered_surface, false);
  assert.equal(evaluate(bossSpaDocument({ validCard: false }), location).rendered_surface, false);
  assert.equal(JSON.stringify(evaluate(bossSpaDocument({ text: "private-marker" }), location)).includes("private-marker"), false);
});

test("observes XHS detail Vue and note Pinia readiness without returning store contents", () => {
  const evaluate = new Function("window", "document", "location", `return ${readProbeExpression("xiaohongshu", "", undefined, "xhs_read_note_detail")}`);
  const piniaNote = {
    note_id: "0123456789abcdef01234567",
    title: "公开标题",
    body_summary: "公开正文摘要",
    author: { display_name: "公开作者", author_id: "author_123" },
    interaction_metrics: { likes: "10", comments: "2", collects: "3", shares: "1" },
    private: "must-not-return"
  };
  const pinia = { _s: new Map([["noteDetail", { $state: { currentNote: piniaNote } }]]) };
  const app = { __vue_app__: { config: { globalProperties: { $pinia: pinia } } } };
  const document = {
    readyState: "complete",
    body: { innerText: "公开笔记详情" },
    querySelector: (selector: string) => {
      if (selector === "#app") return app;
      if (selector.includes("captcha") || selector.includes("login")) return null;
      if (selector.includes("user/profile")) return { getAttribute: () => "/user/profile/author_123" };
      if (selector.includes("like")) return { textContent: "10" };
      if (selector.includes("comment")) return { textContent: "2" };
      if (selector.includes("collect")) return { textContent: "3" };
      if (selector.includes("share")) return { textContent: "1" };
      if (selector.includes("note-title") || selector.includes(".title")) return { textContent: "公开标题" };
      if (selector.includes("detail-desc") || selector.includes("note-desc") || selector.includes("note-content")) return { textContent: "公开正文摘要" };
      if (selector.includes("author")) return { textContent: "公开作者" };
      if (selector.includes("interaction-container")) return {};
      return null;
    }
  };
  const location = { origin: "https://www.xiaohongshu.com", pathname: "/explore/0123456789abcdef01234567", search: "?xsec_token=private" };
  const observed = evaluate({}, document, location);
  assert.equal(observed.vue_ready, true);
  assert.equal(observed.pinia_ready, true);
  assert.equal(observed.normalized.canonical_url, `${location.origin}${location.pathname}`);
  assert.equal(observed.normalized.note_id, "0123456789abcdef01234567");
  assert.equal(observed.normalized.author.author_id, "author_123");
  assert.deepEqual(observed.normalized.interaction_metrics, { likes: "10", comments: "2", collects: "3", shares: "1" });
  assert.equal(JSON.stringify(observed).includes("must-not-return"), false);
  assert.equal(JSON.stringify(observed).includes("xsec_token"), false);

  const withoutNoteStore = evaluate({ __PINIA__: { _s: new Map([["search", {}]]) } }, { ...document, querySelector: (selector: string) => selector === "#app" ? { __vue_app__: { config: { globalProperties: {} } } } : document.querySelector(selector) }, location);
  assert.equal(withoutNoteStore.vue_ready, true);
  assert.equal(withoutNoteStore.pinia_ready, false);

  const mismatchedStore = { _s: new Map([["noteDetail", { $state: { currentNote: { ...piniaNote, note_id: "fedcba987654321001234567" } } }]]) };
  const mismatchedApp = { __vue_app__: { config: { globalProperties: { $pinia: mismatchedStore } } } };
  const mismatched = evaluate({}, { ...document, querySelector: (selector: string) => selector === "#app" ? mismatchedApp : document.querySelector(selector) }, location);
  assert.equal(mismatched.pinia_ready, false);
  assert.equal(mismatched.normalized, undefined);

  const dummyStore = { _s: new Map([["noteDetail", { $state: { currentNote: { ...piniaNote, title: "注入标题" } } }]]) };
  const dummyApp = { __vue_app__: { config: { globalProperties: { $pinia: dummyStore } } } };
  const dummy = evaluate({}, { ...document, querySelector: (selector: string) => selector === "#app" ? dummyApp : document.querySelector(selector) }, location);
  assert.equal(dummy.pinia_ready, false);
  assert.equal(dummy.normalized, undefined);
});

test("detects late challenge and login overlays for both detail sites", () => {
  const lateChallenge = `${"公开内容".repeat(1000)}访问异常，请完成安全验证`;
  const lateLogin = `${"公开内容".repeat(1000)}扫码登录`;
  const xhsEvaluate = new Function("window", "document", "location", `return ${readProbeExpression("xiaohongshu", "", undefined, "xhs_read_note_detail")}`);
  const bossEvaluate = new Function("document", "location", `return ${readProbeExpression("boss", "", undefined, "boss_read_job_detail")}`);
  const document = { readyState: "complete", body: { innerText: lateChallenge }, querySelector: () => null };
  assert.equal(xhsEvaluate({}, document, { origin: "https://www.xiaohongshu.com", pathname: "/explore/0123456789abcdef01234567" }).challenge_like, true);
  assert.equal(bossEvaluate(document, { origin: "https://www.zhipin.com", pathname: "/job_detail/AbC_123.html" }).challenge_like, true);
  assert.equal(xhsEvaluate({}, { ...document, body: { innerText: lateLogin } }, { origin: "https://www.xiaohongshu.com", pathname: "/explore/0123456789abcdef01234567" }).login_like, true);
  assert.equal(bossEvaluate({ ...document, body: { innerText: lateLogin } }, { origin: "https://www.zhipin.com", pathname: "/job_detail/AbC_123.html" }).login_like, true);
  const overlayDocument = { ...document, body: { innerText: "公开详情" }, querySelector: (selector: string) => selector.includes("captcha") ? {} : null };
  assert.equal(xhsEvaluate({}, overlayDocument, { origin: "https://www.xiaohongshu.com", pathname: "/explore/0123456789abcdef01234567" }).challenge_like, true);
  assert.equal(bossEvaluate(overlayDocument, { origin: "https://www.zhipin.com", pathname: "/job_detail/AbC_123.html" }).challenge_like, true);
  const securityOverlayDocument = { ...document, body: { innerText: "公开详情" }, querySelector: (selector: string) => selector.includes("security-check") ? {} : null };
  assert.equal(bossEvaluate(securityOverlayDocument, { origin: "https://www.zhipin.com", pathname: "/job_detail/AbC_123.html" }).challenge_like, true);
  const qrLoginDocument = { ...document, body: { innerText: "公开详情" }, querySelector: (selector: string) => selector.includes("qrcode") ? {} : null };
  assert.equal(bossEvaluate(qrLoginDocument, { origin: "https://www.zhipin.com", pathname: "/job_detail/AbC_123.html" }).login_like, true);
});

test("bounds the entire BOSS site-resource probe when the CDP page list never responds", async () => {
  const server = createServer(() => undefined);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not expose a TCP port.");
  const startedAt = Date.now();
  try {
    const result = await probeProviderSiteResource(String(address.port), "https://www.zhipin.com/web/geek/job", {
      site_id: "boss",
      task_kind: "job_search"
    }, 50);
    assert.equal(result.status, "unknown");
    assert.equal("failure_class" in result ? result.failure_class : null, "provider_probe_unavailable");
    assert(Date.now() - startedAt < 500, "site-resource deadline should abort a never-responding /json/list request");
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

function bossSpaDocument(options: {
  text?: string;
  vueOwned?: boolean;
  fakeVueState?: boolean;
  mountedSubtreeOwned?: boolean;
  rootOwnsList?: boolean;
  cards?: unknown[];
  validCard?: boolean;
  loginOverlay?: boolean;
  challengeOverlay?: boolean;
} = {}) {
  const card = {
    querySelector(selector: string) {
      if (selector.includes("job-name")) return { textContent: options.validCard === false ? "" : "AI 产品经理" };
      if (selector.includes("company-name")) return { textContent: "示例科技" };
      if (selector.startsWith("a[")) return options.validCard === false ? null : { getAttribute: () => "/job_detail/example.html" };
      return null;
    }
  };
  const cards = (options.cards ?? [card]) as typeof card[];
  const list = {
    querySelectorAll: () => cards,
    contains: (candidate: unknown) => cards.includes(candidate as typeof card)
  };
  const mountedElement = {};
  const root: Record<string, any> = {
    querySelector: () => list,
    contains: (candidate: unknown) => (options.rootOwnsList !== false && candidate === list) || (options.mountedSubtreeOwned !== false && candidate === mountedElement)
  };
  if (options.vueOwned !== false) {
    const app: Record<string, any> = { version: "3", config: { globalProperties: {} }, _container: root };
    root.__vue_app__ = app;
    if (options.fakeVueState) {
      root.__vueParentComponent = { appContext: { app }, subTree: { el: mountedElement } };
    } else {
      const component = { appContext: { app }, vnode: { el: mountedElement }, subTree: { el: mountedElement } };
      app._instance = component;
      root._vnode = { component };
    }
  }
  return {
    readyState: "complete",
    body: { innerText: options.text ?? "公开职位列表" },
    querySelector(selector: string) {
      if (selector.includes("captcha") || selector.includes("security-check")) return options.challengeOverlay ? {} : null;
      if (selector.includes("login-dialog")) return options.loginOverlay ? {} : null;
      if (selector === "#wrap, #app") return root;
      return null;
    }
  };
}

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

test("completes XHS detail only with bounded public fields and all Lode source refs", () => {
  const admitted = admitAllowlistedReadOperation({ site_id: "xiaohongshu", operation_id: "xhs_read_note_detail", detail_ref: opaqueRef("detail_ref") });
  if (typeof admitted === "string") throw new Error("XHS detail admission unexpectedly failed.");
  const store = new ReadOperationObservationStore();
  const sources = ["pinia_store_summary", "network_summary"].map((kind) => ({ kind, ref: opaqueRef("source") }));
  const publicSummary = {
    schema_version: "harbor-read-operation-public-summary/v0" as const,
    operation_id: "xhs_read_note_detail" as const,
    result_kind: "xiaohongshu_note_detail_surface" as const,
    surface: "note_detail" as const,
    result_state: "operation_read_response_observed" as const,
    response_status: 200,
    normalized: {
      kind: "xiaohongshu_note_detail" as const,
      canonical_url: "https://www.xiaohongshu.com/explore/0123456789abcdef01234567",
      note_id: "0123456789abcdef01234567",
      title: "公开标题",
      summary: "公开摘要",
      body_summary: "公开正文摘要",
      author: { display_name: "公开作者", author_id: "author_123", profile_url: "https://www.xiaohongshu.com/user/profile/author_123" },
      interaction_metrics: { likes: "10", comments: "2", collects: "3", shares: "1" },
      source_citation: {
        kind: "xhs_note_detail_ref" as const,
        note_id: "0123456789abcdef01234567",
        url: "https://www.xiaohongshu.com/explore/0123456789abcdef01234567",
        field_sources: ["pinia_store_summary", "network_summary"]
      },
      source_status: "located" as const
    },
    source_signals: ["pinia_note_store_ready", "xhs_note_detail_document", "xhs_note_detail_rendered"]
  };
  const proof = store.capture({
    operation_ref: opaqueRef("read_operation"),
    runtime_session_ref: "session_xhs_detail",
    entry: admitted.entry,
    observed_origin: "https://www.xiaohongshu.com",
    observed_at: "2026-07-12T00:00:00.000Z",
    source_refs: sources,
    evidence_ref_kinds: [{ kind: "snapshot_ref", ref: opaqueRef("evidence") }],
    public_summary_source_ref: sources[0]!.ref,
    public_summary: publicSummary
  });
  if (typeof proof === "string") throw new Error(`XHS detail proof failed: ${proof}`);
  const completed = store.complete(admitted.entry, proof);
  if (typeof completed === "string") throw new Error(`XHS detail completion failed: ${completed}`);
  assert.equal("merge_commit" in completed.lode_pin && completed.lode_pin.merge_commit, LODE_268_DETAIL_PIN.merge_commit);
  assert.equal(completed.public_summary.normalized?.kind, "xiaohongshu_note_detail");
  assert.equal(completed.public_summary.normalized?.kind === "xiaohongshu_note_detail" && completed.public_summary.normalized.note_id, "0123456789abcdef01234567");
  assert.equal(completed.public_summary.normalized?.kind === "xiaohongshu_note_detail" && completed.public_summary.normalized.source_citation.kind, "xhs_note_detail_ref");
  assert.deepEqual(completed.source_refs.map((entry) => entry.kind), ["pinia_store_summary", "network_summary"]);
  assert.deepEqual(completed.evidence_ref_kinds.map((entry) => entry.kind), ["snapshot_ref"]);
  assert.deepEqual(store.get(proof.post_check_ref)?.post_check?.source_refs, proof.source_refs);
  assert.deepEqual(store.get(proof.post_check_ref)?.post_check?.evidence_refs, proof.evidence_refs);
  assert.equal(JSON.stringify(completed).includes("xsec_token"), false);
  assert.equal(store.complete(admitted.entry, {
    ...proof,
    public_summary: { ...proof.public_summary, normalized: { ...publicSummary.normalized, title: "篡改标题" } }
  }), "public_summary_missing");
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

test("validates both detail surfaces against the exact search-bound target", () => {
  const xhsInput = {
    site_id: "xiaohongshu" as const,
    operation_id: "xhs_read_note_detail" as const,
    detail_ref: opaqueRef("detail_ref"),
    target_url: "https://www.xiaohongshu.com/explore/0123456789abcdef01234567",
    expected_origin: "https://www.xiaohongshu.com"
  };
  const ready = {
    origin: "https://www.xiaohongshu.com",
    pathname: "/explore/0123456789abcdef01234567",
    ready: true,
    rendered_surface: true,
    vue_ready: true,
    pinia_ready: true,
    operation_response_status: 200,
    operation_response_url: xhsInput.target_url,
    normalized: {
      kind: "xiaohongshu_note_detail" as const,
      canonical_url: "https://www.xiaohongshu.com/explore/0123456789abcdef01234567",
      note_id: "0123456789abcdef01234567",
      title: "公开标题",
      summary: "公开摘要",
      body_summary: "公开正文摘要",
      author: { display_name: "公开作者", author_id: "author_123", profile_url: "https://www.xiaohongshu.com/user/profile/author_123" },
      interaction_metrics: { likes: "10", comments: "2", collects: "3", shares: "1" },
      source_status: "located" as const
    }
  };
  const xhsCompleted = validateReadOperationProbe(xhsInput, ready);
  assert.equal(xhsCompleted.status, "completed");
  if (xhsCompleted.status === "completed") assert.deepEqual(xhsCompleted.source_kinds, ["pinia_store_summary", "network_summary"]);
  if (xhsCompleted.status === "completed") assert.equal(xhsCompleted.public_summary.normalized?.canonical_url.includes("xsec"), false);
  assert.equal(failureClass(validateReadOperationProbe(xhsInput, { ...ready, pinia_ready: false })), "page_not_ready");
  assert.equal(failureClass(validateReadOperationProbe(xhsInput, { ...ready, vue_ready: false })), "page_not_ready");
  assert.equal(failureClass(validateReadOperationProbe(xhsInput, { ...ready, normalized: { ...ready.normalized, title: "" } })), "field_missing");
  assert.equal(failureClass(validateReadOperationProbe(xhsInput, { ...ready, pathname: "/explore/aaaaaaaaaaaaaaaaaaaaaaaa" })), "site_changed");
  assert.equal(failureClass(validateReadOperationProbe(xhsInput, { ...ready, rendered_surface: false })), "empty_result");
  assert.equal(failureClass(validateReadOperationProbe(xhsInput, { ...ready, operation_response_url: "https://evil.example/detail" })), "site_changed");
  assert.equal(failureClass(validateReadOperationProbe(xhsInput, { ...ready, login_like: true })), "not_logged_in");
  assert.equal(failureClass(validateReadOperationProbe(xhsInput, { ...ready, challenge_like: true })), "safety_challenge");

  const bossInput = {
    site_id: "boss" as const,
    operation_id: "boss_read_job_detail" as const,
    detail_ref: opaqueRef("detail_ref"),
    target_url: "https://www.zhipin.com/job_detail/AbC_123.html",
    expected_origin: "https://www.zhipin.com"
  };
  const bossDetailResponse = {
    status: "completed" as const,
    title: "AI 工程师",
    summary: "公开职位描述",
    description: "公开职位描述",
    job_status: "available",
    company_name: "公开公司",
    recruiter_name: "公开招聘者",
    recruiter_title: "招聘经理"
  };
  const readyBossDetail = {
    ...ready,
    origin: "https://www.zhipin.com",
    pathname: "/job_detail/AbC_123.html",
    operation_response_url: bossInput.target_url,
    boss_detail_response_status: 200,
    boss_detail_response_url: "https://www.zhipin.com/wapi/zpgeek/job/detail.json?securityId=AbC_123",
    boss_detail_response: bossDetailResponse,
    normalized: {
      kind: "boss_job_detail" as const,
      canonical_url: "https://www.zhipin.com/job_detail/AbC_123.html",
      title: "AI 工程师",
      summary: "公开职位描述",
      job: { title: "AI 工程师", description: "公开职位描述", status: "available" },
      company: { name: "公开公司" },
      recruiter: { name: "公开招聘者", title: "招聘经理" },
      source_status: "located" as const
    }
  };
  const bossCompleted = validateReadOperationProbe(bossInput, readyBossDetail);
  assert.equal(bossCompleted.status, "completed");
  if (bossCompleted.status === "completed") assert.deepEqual(bossCompleted.source_kinds, ["wapi_job_detail_summary", "dom_snapshot_summary"]);
  assert.equal(failureClass(validateReadOperationProbe(bossInput, { ...readyBossDetail, boss_detail_response: undefined, boss_detail_response_url: undefined })), "network_resource_unavailable");
  assert.equal(failureClass(validateReadOperationProbe(bossInput, { ...readyBossDetail, boss_detail_response_url: "https://www.zhipin.com/wapi/zpgeek/job/detail.json?securityId=Other" })), "network_resource_unavailable");
  assert.equal(failureClass(validateReadOperationProbe(bossInput, { ...readyBossDetail, boss_detail_response: { ...bossDetailResponse, title: "错误职位" } })), "site_changed");
  assert.equal(failureClass(validateReadOperationProbe(bossInput, { ...readyBossDetail, normalized: { ...readyBossDetail.normalized, company: { name: "" } } })), "field_missing");

  const longDescription = `负责真实浏览器任务与证据链路。${"持续改进可靠性与安全边界。".repeat(60)}`;
  const longWapi = summarizeBossJobDetailResponse(JSON.stringify({
    code: 0,
    zpData: {
      securityId: "AbC_123",
      jobInfo: { jobName: "AI 工程师", postDescription: longDescription, jobStatus: "available" },
      brandComInfo: { brandName: "公开公司" },
      bossInfo: { name: "公开招聘者", title: "招聘经理" }
    }
  }), "AbC_123");
  if (longWapi.status !== "completed") throw new Error("Long BOSS WAPI summary unexpectedly failed.");
  assert.equal(longWapi.summary.length, 500);
  assert.equal(longWapi.description.length > 500, true);
  const evaluateBossDetail = new Function("document", "location", `return ${readProbeExpression("boss", "", undefined, "boss_read_job_detail")}`);
  const domObservation = evaluateBossDetail({
    readyState: "complete",
    body: { innerText: longDescription },
    querySelector: (selector: string) => {
      if (selector.includes("captcha") || selector.includes("login")) return null;
      if (selector.includes(".job-name")) return { textContent: "AI 工程师" };
      if (selector.includes(".job-sec-text")) return { textContent: longDescription };
      if (selector.includes(".company-info")) return { textContent: "公开公司" };
      if (selector.includes(".boss-name")) return { textContent: "公开招聘者" };
      if (selector.includes(".boss-info-attr")) return { textContent: "招聘经理" };
      if (selector.includes(".job-detail-box")) return {};
      return null;
    }
  }, { origin: "https://www.zhipin.com", pathname: "/job_detail/AbC_123.html" });
  assert.equal(domObservation.normalized.summary.length, 500);
  assert.equal(domObservation.normalized.job.description, longDescription);
  const longReady = {
    ...readyBossDetail,
    boss_detail_response: longWapi,
    normalized: domObservation.normalized
  };
  assert.equal(validateReadOperationProbe(bossInput, longReady).status, "completed");
  assert.equal(failureClass(validateReadOperationProbe(bossInput, {
    ...longReady,
    normalized: { ...longReady.normalized, job: { ...longReady.normalized.job, description: `${longDescription}不一致` } }
  })), "site_changed");
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

test("summarizes only a target-bound BOSS detail WAPI response without raw identifiers", () => {
  const body = JSON.stringify({
    code: 0,
    zpData: {
      securityId: "AbC_123",
      encryptJobId: "private-job-id",
      jobInfo: { securityId: "AbC_123", jobName: "AI 工程师", postDescription: "公开职位描述", jobStatus: "available", salaryDesc: "20-30K", locationName: "上海" },
      brandComInfo: { brandName: "公开公司" },
      bossInfo: { name: "公开招聘者", title: "招聘经理" }
    }
  });
  const summary = summarizeBossJobDetailResponse(body, "AbC_123");
  assert.equal(summary.status, "completed");
  assert.equal(JSON.stringify(summary).includes("securityId"), false);
  assert.equal(JSON.stringify(summary).includes("encryptJobId"), false);
  assert.equal(JSON.stringify(summary).includes("private-job-id"), false);
  assert.equal(failureClass(summarizeBossJobDetailResponse(body, "Other_456")), "site_changed");
  assert.equal(failureClass(summarizeBossJobDetailResponse('{"code":0,"zpData":{}}', "AbC_123")), "site_changed");
});

function failureClass(result: { status: string; failure_class?: string }): string | undefined {
  return result.failure_class;
}
