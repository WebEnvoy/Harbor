import assert from "node:assert/strict";
import test from "node:test";
import { LocalIdentityEnvironmentManager } from "./identity-environment-manager.js";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

test("user confirmation clears only the authentication gate for a restricted Chrome identity", () => {
  const manager = new LocalIdentityEnvironmentManager();
  const created = manager.create({
    platform: "darwin",
    arch: "arm64",
    home_dir: "/Users/test",
    env: {},
    path_exists: (path) => path === chromePath,
    is_executable: (path) => path === chromePath,
    read_text: () => null,
    identity_environment_ref: "identity-env_chrome-manual-auth",
    execution_identity_ref: "execution-identity_chrome-manual-auth",
    profile_ref: "profile_chrome-manual-auth",
    site: {
      site_id: "xiaohongshu",
      origin: "https://www.xiaohongshu.com",
      display_name: "小红书"
    },
    login_state: "manual_auth_required",
    manual_authentication_state: "required",
    storage_state: "present",
    proxy_ref: "proxy-shanghai",
    region: "CN-SH",
    language: "zh-CN",
    timezone: "Asia/Shanghai",
    fingerprint_summary: "chrome_official_restricted_fallback"
  });
  assert.equal(created.status.readiness, "needs_auth");

  const completed = manager.completeManualAuthentication(created.identity_environment_ref);
  assert.ok(completed);
  assert.equal(completed.status.readiness, "ready");
  assert.equal(completed.status.login_state, "logged_in");
  assert.equal(completed.status.authentication_provenance, "user_confirmed_managed_session");
  assert.equal(completed.status.manual_authentication_state, "completed");
  assert.equal(completed.status.recovery_required, false);
  assert.equal(completed.status.blocking_reasons.includes("provider_conflict"), true);
  assert.equal(completed.status.blocking_reasons.includes("fingerprint_conflict"), true);
  assert.equal(completed.environment_summary.provider_id, "chrome_official");
});
