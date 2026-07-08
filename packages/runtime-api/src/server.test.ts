import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createFixtureLauncher, HarborRuntime } from "./index.js";
import { startHarborRuntimeServer } from "./server.js";

test("serves readiness and provider facts as JSON", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const running = await startHarborRuntimeServer({ port: 0, runtime });
  try {
    for (const path of ["/health", "/ready", "/readiness", "/runtime/health"]) {
      const readiness = await getJson(`${running.url}${path}`);
      assert.equal(readiness.status, "ready");
      assert.equal(readiness.safety_boundary.raw_credentials, "not_exposed");
    }

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
    assert.equal(created.public_boundary.raw_material, "not_exposed");
    assert.equal(created.refs.profile_storage_ref.startsWith("profile_storage_ref_"), true);

    const identityReadback = await getJson(`${running.url}/runtime/identity-environments/identity-env_server-test`);
    assert.equal(identityReadback.identity_environment_ref, "identity-env_server-test");
    assert.equal(identityReadback.environment_summary.language, "zh-CN");
    assert.equal(JSON.stringify(identityReadback).includes("profile-storage_server-test"), false);

    const updatedIdentity = await patchJson(`${running.url}/runtime/identity-environments/identity-env_server-test`, {
      login_state: "logged_in",
      storage_state: "present"
    });
    assert.equal(["ready", "needs_auth", "blocked", "unknown"].includes(updatedIdentity.status.readiness), true);
    assert.equal(updatedIdentity.status.login_state, "logged_in");

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

    const deletedIdentity = await deleteJson(`${running.url}/runtime/identity-environments/identity-env_server-test`);
    assert.equal(deletedIdentity.identity_environment_ref, "identity-env_server-test");

    const missingIdentity = await fetch(`${running.url}/runtime/identity-environments/identity-env_server-test`);
    assert.equal(missingIdentity.status, 404);
    assert.equal((await missingIdentity.json()).failure_class, "identity_environment_missing");

    const nestedIdentityPath = await fetch(`${running.url}/runtime/identity-environments/identity-env_server-test/extra`);
    assert.equal(nestedIdentityPath.status, 404);
  } finally {
    await running.close();
  }
});

test("returns structured failure when identity environment session has no identity input", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const running = await startHarborRuntimeServer({ port: 0, runtime });
  try {
    const response = await fetch(`${running.url}/runtime/identity-environment-sessions`, {
      method: "POST",
      body: JSON.stringify({
        url: "https://example.test/runtime-api",
        control_owner: "agent"
      }),
      headers: { "content-type": "application/json" }
    });
    assert.equal(response.status, 400);
    const failure = await response.json();
    assert.equal(failure.status, "unavailable");
    assert.equal(failure.failure_class, "identity_environment_required");
    assert.equal(failure.retryable, true);
    assert.equal(failure.public_boundary.raw_material, "not_exposed");
  } finally {
    await running.close();
  }
});

test("persists identity environment public records for the local runtime API", async () => {
  const persistence_path = join(mkdtempSync(join(tmpdir(), "harbor-identity-")), "identity-environments.json");
  const first = await startHarborRuntimeServer({ port: 0, runtime: new HarborRuntime(createFixtureLauncher("ready"), { persistence_path }) });
  try {
    await postJson(`${first.url}/runtime/identity-environments`, {
      identity_environment_ref: "identity-env_persisted",
      execution_identity_ref: "execution-identity_persisted",
      profile_ref: "profile_persisted",
      profile_storage_ref: "profile-storage_persisted",
      site: {
        site_id: "boss",
        origin: "https://www.zhipin.com",
        display_name: "BOSS",
        account_ref: "account_persisted"
      },
      login_state: "manual_auth_required",
      storage_state: "present",
      region: "CN",
      language: "zh-CN",
      timezone: "Asia/Shanghai",
      fingerprint_summary: "provider_claim:persisted"
    });
  } finally {
    await first.close();
  }

  const second = await startHarborRuntimeServer({ port: 0, runtime: new HarborRuntime(createFixtureLauncher("ready"), { persistence_path }) });
  try {
    const record = await getJson(`${second.url}/runtime/identity-environments/identity-env_persisted`);
    assert.equal(record.site.site_id, "boss");
    assert.equal(record.environment_summary.region, "CN");
    assert.equal(record.public_boundary.raw_material, "not_exposed");
    assert.equal(JSON.stringify(record).includes("profile-storage_persisted"), false);
  } finally {
    await second.close();
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

async function patchJson(url: string, body: unknown): Promise<any> {
  const response = await fetch(url, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" }
  });
  assert.equal(response.status, 200);
  return response.json();
}

async function deleteJson(url: string): Promise<any> {
  const response = await fetch(url, { method: "DELETE" });
  assert.equal(response.status, 200);
  return response.json();
}
