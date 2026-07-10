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

    const siteFacts = await getJson(`${running.url}/runtime/sessions/${session.runtime_session_ref}/site-resource-facts?site_id=xiaohongshu&task_kind=search_notes`);
    assert.equal(siteFacts.schema_version, "harbor-site-resource-facts/v0");
    assert.equal(siteFacts.runtime_session_ref, session.runtime_session_ref);
    assert.equal(siteFacts.site_id, "xiaohongshu");
    assert.equal(siteFacts.task_kind, "search_notes");
    assert.equal(siteFacts.resource_facts.some((fact: any) => fact.key === "runtime.execution_surface.available"), true);
    assert.equal(siteFacts.resource_facts.some((fact: any) => fact.key === "identity.user_logged_in.confirmed"), true);
    assert.equal(siteFacts.resource_facts.find((fact: any) => fact.key === "identity.user_logged_in.confirmed")?.state, "available");
    assert.equal(siteFacts.resource_facts.find((fact: any) => fact.key === "page.vue_app.ready")?.state, "available");
    assert.equal(siteFacts.resource_facts.find((fact: any) => fact.key === "page.pinia_store.ready")?.state, "available");
    assert.equal(siteFacts.evidence_refs.length > 0, true);
    assert.equal(siteFacts.public_boundary.raw_dom, "not_exposed");

    const siteEvidence = await getJson(`${running.url}/runtime/evidence/${siteFacts.evidence_refs[0]}`);
    assert.equal(siteEvidence.evidence_ref, siteFacts.evidence_refs[0]);
    assert.equal(siteEvidence.artifact?.raw_bytes ?? "not_exposed", "not_exposed");

    const writePrecheck = await postJson(`${running.url}/runtime/sessions/${session.runtime_session_ref}/write-precheck-facts`, {
      site_id: "xiaohongshu",
      title: "Spoofed title",
      url: "https://attacker.example/write-precheck",
      summary: "Spoofed summary",
      locator_hint: "body[data-spoofed=true]",
      target_label: "Publish note precheck",
      fields: [
        { label: "Title", input_kind: "text", required: true, sensitivity: "public", value_state: "present" },
        { label: "Body", input_kind: "textarea", required: true, sensitivity: "public", value_state: "present" }
      ]
    });
    assert.equal(writePrecheck.schema_version, "harbor-write-precheck-facts/v0");
    assert.equal(writePrecheck.submitted, false);
    assert.equal(writePrecheck.pre_write_guard.no_submit_guard, "active");
    assert.equal(writePrecheck.writable_target.provenance.source, "provided_context");
    assert.notEqual(writePrecheck.writable_target.locator_hint, "body[data-spoofed=true]");
    assert.equal(writePrecheck.privacy_boundary.raw_values, "not_exposed");
    const writeEvidence = await getJson(`${running.url}/runtime/evidence/${writePrecheck.writable_target.evidence_refs[0]}`);
    assert.equal(writeEvidence.provenance.source_locator.includes(session.runtime_session_ref), true);
    assert.equal(JSON.stringify(writeEvidence).includes("attacker.example"), false);

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

test("serves site resource facts failures without raw browser material", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const running = await startHarborRuntimeServer({ port: 0, runtime });
  try {
    const missingSession = await getJson(`${running.url}/runtime/sessions/session_missing/site-resource-facts?site_id=xiaohongshu&task_kind=search_notes`);
    assert.equal(missingSession.status, "unavailable");
    assert.equal(missingSession.failure_class, "session_missing");
    assert.equal(missingSession.public_boundary.raw_cdp_endpoint, "not_exposed");

    const session = await postJson(`${running.url}/runtime/identity-environment-sessions`, {
      identity_environment: {
        identity_environment_ref: "identity-env_challenge-test",
        execution_identity_ref: "execution-identity_challenge-test",
        profile_ref: "profile_challenge-test",
        site: {
          site_id: "boss",
          origin: "https://www.zhipin.com",
          display_name: "BOSS",
          account_ref: "account_challenge-test"
        },
        login_state: "manual_auth_required",
        storage_state: "present"
      },
      url: "https://www.zhipin.com/security/verify",
      control_owner: "agent",
      holder_ref: "server-test"
    });

    const unsupportedSite = await getJson(`${running.url}/runtime/sessions/${session.runtime_session_ref}/site-resource-facts?site_id=linkedin&task_kind=search_jobs`);
    assert.equal(unsupportedSite.status, "unavailable");
    assert.equal(unsupportedSite.failure_class, "unsupported_site");

    const unsupportedTask = await getJson(`${running.url}/runtime/sessions/${session.runtime_session_ref}/site-resource-facts?site_id=boss&task_kind=bulk_scrape`);
    assert.equal(unsupportedTask.status, "unavailable");
    assert.equal(unsupportedTask.failure_class, "unsupported_task_kind");

    const challengeFacts = await getJson(`${running.url}/runtime/sessions/${session.runtime_session_ref}/site-resource-facts?site_id=boss&task_kind=job_search`);
    const challenge = challengeFacts.resource_facts.find((fact: any) => fact.key === "safety.challenge.absent");
    assert.equal(challenge.state, "blocked");
    assert.equal(challenge.severity, "blocking");

    assert.equal(challengeFacts.public_boundary.raw_dom, "not_exposed");
    assert.equal(challengeFacts.public_boundary.raw_har, "not_exposed");
    const publicJson = JSON.stringify(challengeFacts);
    assert.equal(publicJson.includes("cookie"), false);
    assert.equal(publicJson.includes("token"), false);
    assert.equal(publicJson.includes("profile_path"), false);
    assert.equal(publicJson.includes("storage_state"), false);
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

test("records user-confirmed manual authentication for an active managed session and persists the public record", async () => {
  const persistence_path = join(mkdtempSync(join(tmpdir(), "harbor-manual-auth-")), "identity-environments.json");
  const first = await startHarborRuntimeServer({ port: 0, runtime: new HarborRuntime(createFixtureLauncher("ready"), { persistence_path }) });
  try {
    await postJson(`${first.url}/runtime/identity-environments`, {
      identity_environment_ref: "identity-env_manual-auth",
      execution_identity_ref: "execution-identity_manual-auth",
      profile_ref: "profile_manual-auth",
      profile_storage_ref: "profile-storage_manual-auth-sensitive",
      cookie_jar_ref: "cookie-jar_manual-auth-sensitive",
      site: {
        site_id: "boss",
        origin: "https://www.zhipin.com",
        display_name: "BOSS",
        account_ref: "account_manual-auth"
      },
      login_state: "manual_auth_required",
      manual_authentication_state: "required",
      storage_state: "present"
    });
    const session = await postJson(`${first.url}/runtime/identity-environment-sessions`, {
      identity_environment_ref: "identity-env_manual-auth",
      url: "https://example.test/manual-authentication",
      control_owner: "user"
    });

    const response = await fetch(`${first.url}/runtime/sessions/${session.runtime_session_ref}/manual-authentication-completed`, { method: "POST" });
    assert.equal(response.status, 200);
    const completed = await response.json();
    assert.equal(completed.identity_environment_ref, "identity-env_manual-auth");
    assert.equal(completed.status.login_state, "logged_in");
    assert.equal(completed.status.authentication_provenance, "user_confirmed_managed_session");
    assert.equal(completed.status.manual_authentication_state, "completed");
    assert.equal(completed.status.recovery_required, false);
    assert.equal(completed.public_boundary.raw_material, "not_exposed");
    const publicJson = JSON.stringify(completed);
    assert.equal(publicJson.includes("profile-storage_manual-auth-sensitive"), false);
    assert.equal(publicJson.includes("cookie-jar_manual-auth-sensitive"), false);
    assert.equal(completed.public_boundary.not_exposed.includes("password"), true);
    assert.equal(completed.public_boundary.not_exposed.includes("verification_code"), true);

    const readback = await getJson(`${first.url}/runtime/identity-environments/identity-env_manual-auth`);
    assert.equal(readback.status.login_state, "logged_in");
    assert.equal(readback.status.authentication_provenance, "user_confirmed_managed_session");
    assert.equal(readback.status.manual_authentication_state, "completed");
    assert.equal(readback.status.recovery_required, false);
  } finally {
    await first.close();
  }

  const second = await startHarborRuntimeServer({ port: 0, runtime: new HarborRuntime(createFixtureLauncher("ready"), { persistence_path }) });
  try {
    const persisted = await getJson(`${second.url}/runtime/identity-environments/identity-env_manual-auth`);
    assert.equal(persisted.status.login_state, "logged_in");
    assert.equal(persisted.status.authentication_provenance, "user_confirmed_managed_session");
    assert.equal(persisted.status.manual_authentication_state, "completed");
    assert.equal(persisted.status.recovery_required, false);
  } finally {
    await second.close();
  }
});

test("rejects missing, unmanaged, closed, and failed sessions without changing identity state", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const running = await startHarborRuntimeServer({ port: 0, runtime });
  try {
    await postJson(`${running.url}/runtime/identity-environments`, {
      identity_environment_ref: "identity-env_manual-auth-reject",
      execution_identity_ref: "execution-identity_manual-auth-reject",
      profile_ref: "profile_manual-auth-reject",
      site: {
        site_id: "boss",
        origin: "https://www.zhipin.com",
        display_name: "BOSS"
      },
      login_state: "manual_auth_required",
      manual_authentication_state: "required",
      storage_state: "present"
    });

    const missing = await fetch(`${running.url}/runtime/sessions/session_missing/manual-authentication-completed`, { method: "POST" });
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).failure_class, "session_missing");

    const unmanaged = await postJson(`${running.url}/runtime/identity-environment-sessions`, {
      identity_environment: {
        identity_environment_ref: "identity-env_inline-unmanaged",
        execution_identity_ref: "execution-identity_inline-unmanaged",
        profile_ref: "profile_inline-unmanaged",
        site: { site_id: "boss", origin: "https://www.zhipin.com", display_name: "BOSS" },
        login_state: "manual_auth_required",
        storage_state: "present"
      },
      url: "https://example.test/unmanaged",
      control_owner: "user"
    });
    const unmanagedResponse = await fetch(`${running.url}/runtime/sessions/${unmanaged.runtime_session_ref}/manual-authentication-completed`, { method: "POST" });
    assert.equal(unmanagedResponse.status, 409);
    assert.equal((await unmanagedResponse.json()).failure_class, "identity_environment_unmanaged");

    await postJson(`${running.url}/runtime/identity-environments`, {
      identity_environment_ref: "identity-env_manual-auth-agent",
      execution_identity_ref: "execution-identity_manual-auth-agent",
      profile_ref: "profile_manual-auth-agent",
      site: { site_id: "boss", origin: "https://www.zhipin.com", display_name: "BOSS" },
      login_state: "manual_auth_required",
      storage_state: "present"
    });
    const agentSession = await postJson(`${running.url}/runtime/identity-environment-sessions`, {
      identity_environment_ref: "identity-env_manual-auth-agent",
      url: "https://example.test/agent",
      control_owner: "agent"
    });
    const agentResponse = await fetch(`${running.url}/runtime/sessions/${agentSession.runtime_session_ref}/manual-authentication-completed`, { method: "POST" });
    assert.equal(agentResponse.status, 409);
    assert.equal((await agentResponse.json()).failure_class, "user_confirmation_required");

    const closed = await postJson(`${running.url}/runtime/identity-environment-sessions`, {
      identity_environment_ref: "identity-env_manual-auth-reject",
      url: "https://example.test/closed"
    });
    await postJson(`${running.url}/runtime/sessions/${closed.runtime_session_ref}/stop`, { control_owner: "agent" });
    const closedResponse = await fetch(`${running.url}/runtime/sessions/${closed.runtime_session_ref}/manual-authentication-completed`, { method: "POST" });
    assert.equal(closedResponse.status, 409);
    assert.equal((await closedResponse.json()).failure_class, "session_not_active");

    const failedRuntime = new HarborRuntime(createFixtureLauncher("unavailable"));
    failedRuntime.createLocalIdentityEnvironment({
      identity_environment_ref: "identity-env_failed",
      execution_identity_ref: "execution-identity_failed",
      profile_ref: "profile_failed",
      site: { site_id: "boss", origin: "https://www.zhipin.com", display_name: "BOSS" },
      login_state: "manual_auth_required",
      storage_state: "present"
    });
    const failedServer = await startHarborRuntimeServer({ port: 0, runtime: failedRuntime });
    try {
      const failed = await postJson(`${failedServer.url}/runtime/identity-environment-sessions`, {
        identity_environment_ref: "identity-env_failed",
        url: "https://example.test/failed"
      });
      assert.equal(failed.lifecycle_state, "failed");
      const failedResponse = await fetch(`${failedServer.url}/runtime/sessions/${failed.runtime_session_ref}/manual-authentication-completed`, { method: "POST" });
      assert.equal(failedResponse.status, 409);
      assert.equal((await failedResponse.json()).failure_class, "session_not_active");
      const failedReadback = await getJson(`${failedServer.url}/runtime/identity-environments/identity-env_failed`);
      assert.equal(failedReadback.status.login_state, "manual_auth_required");
    } finally {
      await failedServer.close();
    }

    const unchanged = await getJson(`${running.url}/runtime/identity-environments/identity-env_manual-auth-reject`);
    assert.equal(unchanged.status.login_state, "manual_auth_required");
    assert.equal(unchanged.status.manual_authentication_state, "required");
    assert.equal(unchanged.status.recovery_required, true);
  } finally {
    await running.close();
  }
});

test("does not reuse a profile session for a different identity and keeps authentication confirmation scoped", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const running = await startHarborRuntimeServer({ port: 0, runtime });
  try {
    for (const identity_environment_ref of ["identity-env_same-profile-a", "identity-env_same-profile-b"]) {
      await postJson(`${running.url}/runtime/identity-environments`, {
        identity_environment_ref,
        execution_identity_ref: `${identity_environment_ref}:execution`,
        profile_ref: "profile_same-profile",
        site: { site_id: "xiaohongshu", origin: "https://www.xiaohongshu.com", display_name: "小红书" },
        login_state: "manual_auth_required",
        storage_state: "present"
      });
    }
    const first = await postJson(`${running.url}/runtime/identity-environment-sessions`, {
      identity_environment_ref: "identity-env_same-profile-a",
      url: "https://example.test/a",
      control_owner: "user"
    });
    const second = await postJson(`${running.url}/runtime/identity-environment-sessions`, {
      identity_environment_ref: "identity-env_same-profile-b",
      url: "https://example.test/b",
      control_owner: "user"
    });
    assert.notEqual(first.runtime_session_ref, second.runtime_session_ref);

    const response = await fetch(`${running.url}/runtime/sessions/${second.runtime_session_ref}/manual-authentication-completed`, { method: "POST" });
    assert.equal(response.status, 200);
    const firstIdentity = await getJson(`${running.url}/runtime/identity-environments/identity-env_same-profile-a`);
    const secondIdentity = await getJson(`${running.url}/runtime/identity-environments/identity-env_same-profile-b`);
    assert.equal(firstIdentity.status.login_state, "manual_auth_required");
    assert.equal(secondIdentity.status.login_state, "logged_in");
  } finally {
    await running.close();
  }
});

test("does not publish a confirmed login state when identity persistence fails", async () => {
  let persistenceWrites = 0;
  const runtime = new HarborRuntime(createFixtureLauncher("ready"), {
    persist_records: () => {
      persistenceWrites += 1;
      if (persistenceWrites > 1) throw new Error("simulated persistence failure");
    }
  });
  const running = await startHarborRuntimeServer({ port: 0, runtime });
  try {
    await postJson(`${running.url}/runtime/identity-environments`, {
      identity_environment_ref: "identity-env_persist-failure",
      execution_identity_ref: "execution-identity_persist-failure",
      profile_ref: "profile_persist-failure",
      site: { site_id: "boss", origin: "https://www.zhipin.com", display_name: "BOSS" },
      login_state: "manual_auth_required",
      storage_state: "present"
    });
    const session = await postJson(`${running.url}/runtime/identity-environment-sessions`, {
      identity_environment_ref: "identity-env_persist-failure",
      url: "https://example.test/persist-failure",
      control_owner: "user"
    });
    const response = await fetch(`${running.url}/runtime/sessions/${session.runtime_session_ref}/manual-authentication-completed`, { method: "POST" });
    assert.equal(response.status, 500);
    const readback = await getJson(`${running.url}/runtime/identity-environments/identity-env_persist-failure`);
    assert.equal(readback.status.login_state, "manual_auth_required");
    assert.equal(readback.status.authentication_provenance, "unknown");
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
