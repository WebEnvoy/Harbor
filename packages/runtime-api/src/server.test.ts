import assert from "node:assert/strict";
import test from "node:test";
import { createFixtureLauncher, HarborRuntime } from "./index.js";
import { startHarborRuntimeServer } from "./server.js";

test("serves readiness and provider facts as JSON", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const running = await startHarborRuntimeServer({ port: 0, runtime });
  try {
    const readiness = await getJson(`${running.url}/readiness`);
    assert.equal(readiness.status, "ready");
    assert.equal(readiness.safety_boundary.raw_credentials, "not_exposed");

    const providers = await getJson(`${running.url}/runtime/browser-providers`);
    assert.equal(providers.schema_version, "harbor-browser-provider-status/v0");
    assert.equal(providers.providers.length, 2);

    const alias = await getJson(`${running.url}/runtime/browser-provider-status`);
    assert.deepEqual(alias, providers);
  } finally {
    await running.close();
  }
});

test("serves identity, session, and evidence endpoint plumbing", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const running = await startHarborRuntimeServer({ port: 0, runtime });
  try {
    const emptyList = await getJson(`${running.url}/runtime/identity-environments`);
    assert.deepEqual(emptyList.identity_environments, []);

    const created = await postJson(`${running.url}/runtime/identity-environments`, {
      identity_environment_ref: "identity-env_server-test",
      execution_identity_ref: "execution-identity_server-test",
      profile_ref: "profile_server-test",
      profile_storage_ref: "profile-storage_server-test",
      site: {
        site_id: "xiaohongshu",
        origin: "https://www.xiaohongshu.com",
        display_name: "小红书",
        account_ref: "account_server-test"
      },
      login_state: "manual_auth_required",
      storage_state: "present",
      language: "zh-CN",
      timezone: "Asia/Shanghai",
      fingerprint_summary: "fixture-provider-claim"
    });
    assert.equal(created.identity_environment_ref, "identity-env_server-test");

    const session = await postJson(`${running.url}/runtime/identity-environment-sessions`, {
      identity_environment_ref: "identity-env_server-test",
      url: "https://example.test/runtime-api",
      control_owner: "agent",
      holder_ref: "server-test"
    });
    assert.equal(session.lifecycle_state, "active");

    const readback = await getJson(`${running.url}/runtime/sessions/${session.runtime_session_ref}`);
    assert.equal(readback.runtime_session_ref, session.runtime_session_ref);

    const snapshot = await postJson(`${running.url}/runtime/sessions/${session.runtime_session_ref}/snapshot`, {});
    assert.equal(snapshot.status, "captured");
    assert.equal(snapshot.evidence_refs.length > 0, true);

    const evidence = await getJson(`${running.url}/runtime/evidence/${snapshot.evidence_refs[0]}`);
    assert.equal(evidence.evidence_ref, snapshot.evidence_refs[0]);
    assert.equal(JSON.stringify(evidence).includes("cookie"), false);

    const stopped = await postJson(`${running.url}/runtime/sessions/${session.runtime_session_ref}/stop`, { control_owner: "agent" });
    assert.equal(stopped.lifecycle_state, "closed");

    const aliasReadback = await getJson(`${running.url}/runtime/identity-environment-sessions/${session.runtime_session_ref}`);
    assert.equal(aliasReadback.runtime_session_ref, session.runtime_session_ref);
  } finally {
    await running.close();
  }
});

test("returns JSON errors for bad routes and bad methods", async () => {
  const running = await startHarborRuntimeServer({ port: 0, runtime: new HarborRuntime(createFixtureLauncher("ready")) });
  try {
    const missing = await fetch(`${running.url}/missing`);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error, "not_found");

    const wrongMethod = await fetch(`${running.url}/runtime/sessions/session_missing/stop`);
    assert.equal(wrongMethod.status, 405);
    assert.equal((await wrongMethod.json()).error, "method_not_allowed");
  } finally {
    await running.close();
  }
});

async function getJson(url: string): Promise<any> {
  const response = await fetch(url);
  assert.equal(response.status, 200);
  return response.json();
}

async function postJson(url: string, body: unknown): Promise<any> {
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" }
  });
  assert.equal(response.status === 200 || response.status === 201, true);
  return response.json();
}
