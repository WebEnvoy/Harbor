import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  bindIdentityEnvironmentDefaultProvider,
  createFixtureLauncher,
  DEFAULT_IDENTITY_SITE_URLS,
  detectBrowserProviders,
  diagnoseBrowserProviderFailure,
  HarborRuntime,
  launchLocalDedicatedProvider,
  type LocalProviderLauncher,
  type LocalProviderLaunchInput
} from "./index.js";
import { classifyLaunchFailure } from "./provider-management.js";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const cloakPath = "/Users/test/.cloakbrowser/chromium-145.0.7632.109.2/Chromium.app/Contents/MacOS/Chromium";

function providerFixture(paths: Record<string, { executable?: boolean; text?: string }>) {
  return {
    platform: "darwin" as const,
    arch: "arm64",
    home_dir: "/Users/test",
    env: {},
    path_exists: (path: string) => path in paths,
    is_executable: (path: string) => paths[path]?.executable ?? false,
    read_text: (path: string) => paths[path]?.text ?? null
  };
}

function capturingLauncher(launches: LocalProviderLaunchInput[]): LocalProviderLauncher {
  return async (input) => {
    launches.push({ ...input });
    return {
      status: "ready",
      cdp_ref: "cdp_test",
      viewer_entry: input.headless
        ? {
            availability: "unsupported",
            access_mode: "none",
            transport: "not_applicable",
            input_capabilities: [],
            unavailable_reason: "unsupported"
          }
        : {
            availability: "available",
            access_mode: "interactive",
            transport: "local_window",
            input_capabilities: ["keyboard_mouse"]
          },
      page: {
        current_url: input.url,
        title: "Captured launcher page",
        status: "ready",
        facts: [{ key: "page.status", source: "observed", value: "ready" }]
      },
      facts: [{ key: "profile.storage_ref.received", source: "configured", value: input.profile_storage_ref ? "present" : "missing" }],
      openUrl: async (url) => ({
        current_url: url,
        title: "Captured launcher page",
        status: "ready",
        facts: [{ key: "page.status", source: "observed", value: "ready" }]
      }),
      captureScreenshot: async () => ({
        screenshot_ref: "screenshot_test",
        mime_type: "image/png",
        byte_length: 1,
        sha256: "00",
        captured_at: new Date().toISOString(),
        facts: []
      }),
      close: async () => {}
    };
  };
}

function writeFakeBrowserExecutable(dir: string): string {
  const browserPath = join(dir, "fake-browser.mjs");
  writeFileSync(browserPath, `#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { join } from "node:path";

const userDataArg = process.argv.find((arg) => arg.startsWith("--user-data-dir="));
const profileDir = userDataArg?.slice("--user-data-dir=".length);
const requestedUrl = process.argv.findLast((arg) => !arg.startsWith("--")) ?? "about:blank";
if (!profileDir) process.exit(2);
mkdirSync(profileDir, { recursive: true });
if (process.env.HARBOR_FAKE_BROWSER_MARKER) writeFileSync(process.env.HARBOR_FAKE_BROWSER_MARKER, profileDir);
const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  response.setHeader("content-type", "application/json");
  if (url.pathname === "/json/version") {
    response.end(JSON.stringify({ Browser: "FakeBrowser/1.0", "Protocol-Version": "1.3" }));
    return;
  }
  if (url.pathname === "/json/list") {
    response.end(JSON.stringify([{ type: "page", url: requestedUrl, title: "Fake page" }]));
    return;
  }
  if (url.pathname === "/json/new") {
    response.end(JSON.stringify({ type: "page", url: decodeURIComponent(url.search.slice(1)), title: "Fake page" }));
    return;
  }
  response.statusCode = 404;
  response.end(JSON.stringify({ error: "not_found" }));
});
server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  if (!address || typeof address === "string") process.exit(3);
  writeFileSync(join(profileDir, "DevToolsActivePort"), String(address.port) + "\\n/devtools/browser/fake\\n");
});
process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
setInterval(() => {}, 10000);
`);
  chmodSync(browserPath, 0o700);
  return browserPath;
}

test("creates, reads, and closes a runtime session", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const session = await runtime.createSession();

  assert.equal(session.lifecycle_state, "active");
  assert.equal(session.availability.cdp, "available");
  assert.equal(session.availability.viewer, "unsupported");
  assert.equal(session.control_owner, "system");
  assert.match(session.viewer_ref ?? "", /^viewer_/);
  assert.equal(runtime.getSession(session.runtime_session_ref)?.runtime_session_ref, session.runtime_session_ref);

  const closed = await runtime.closeSession(session.runtime_session_ref);
  assert.equal(closed?.lifecycle_state, "closed");
  assert.equal(closed?.availability.cdp, "unavailable");
  assert.equal(closed?.availability.viewer, "unavailable");
  assert.equal(closed?.control_owner, "none");

  const closedStatus = runtime.getAppRuntimeStatusFixture(session.runtime_session_ref);
  assert.equal("status" in closedStatus, false);
  if ("status" in closedStatus) throw new Error("closed app fixture should be readable");
  assert.equal(closedStatus.browser_status, "closed");
  assert.equal(closedStatus.viewer_status.display_state, "expired");
  assert.equal(closedStatus.control_status.owner, "none");
});

test("reports provider unavailability as structured runtime facts", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("unavailable"));
  const session = await runtime.createSession();

  assert.equal(session.lifecycle_state, "failed");
  assert.equal(session.current_error?.code, "provider_unavailable");
  assert.equal(session.availability.cdp, "unavailable");
});

test("detects only CloakBrowser and official Chrome provider status", () => {
  const catalog = detectBrowserProviders(providerFixture({
    [cloakPath]: { executable: true },
    [chromePath]: { executable: true },
    "/Applications/Google Chrome.app/Contents/Info.plist": {
      text: "<plist><dict><key>CFBundleShortVersionString</key><string>125.0.1</string></dict></plist>"
    },
    "/Applications/Chromium.app/Contents/MacOS/Chromium": { executable: true }
  }));

  assert.deepEqual(catalog.providers.map((provider) => provider.provider_id), ["cloakbrowser", "chrome_official"]);
  assert.equal(catalog.providers.some((provider) => provider.display_name === "Chromium"), false);
  assert.equal(catalog.excluded_providers.some((provider) => provider.provider === "chromium"), true);
  assert.equal(catalog.excluded_providers.some((provider) => provider.provider === "donut_browser"), true);

  const cloak = catalog.providers[0]!;
  const chrome = catalog.providers[1]!;
  assert.equal(cloak.role, "primary");
  assert.equal(cloak.default_for_identity_environment, true);
  assert.equal(cloak.install.status, "installed");
  assert.equal(cloak.install.version, "145.0.7632.109.2");
  assert.equal(chrome.role, "restricted_fallback");
  assert.equal(chrome.install.version, "125.0.1");
  assert.equal(chrome.capabilities.find((capability) => capability.key === "native_fingerprint_control")?.state, "unsupported");
});

test("binds identity environments to CloakBrowser by default and warns on Chrome fallback", () => {
  const cloakDefault = bindIdentityEnvironmentDefaultProvider(providerFixture({
    [cloakPath]: { executable: true },
    [chromePath]: { executable: true }
  }));
  assert.equal(cloakDefault.selected_provider_id, "cloakbrowser");
  assert.equal(cloakDefault.selection_reason, "cloakbrowser_default");
  assert.equal(cloakDefault.requires_user_notice, false);

  const chromeFallback = bindIdentityEnvironmentDefaultProvider(providerFixture({
    [chromePath]: { executable: true }
  }));
  assert.equal(chromeFallback.selected_provider_id, "chrome_official");
  assert.equal(chromeFallback.selection_reason, "chrome_restricted_fallback");
  assert.equal(chromeFallback.requires_user_notice, true);
  assert.equal(chromeFallback.warnings.some((warning) => warning.includes("受限后备")), true);

  const unavailableRequested = bindIdentityEnvironmentDefaultProvider({
    ...providerFixture({ [chromePath]: { executable: true } }),
    requested_provider_id: "cloakbrowser"
  });
  assert.equal(unavailableRequested.selected_provider_id, null);
  assert.equal(unavailableRequested.selection_reason, "requested_provider_unavailable");
});

test("explains provider install and launch failure diagnostics", () => {
  const invalidPath = detectBrowserProviders({
    ...providerFixture({}),
    env: { HARBOR_CLOAKBROWSER_PATH: "/missing/cloak" }
  }).providers[0]!;
  assert.equal(invalidPath.install.status, "path_invalid");
  assert.equal(invalidPath.diagnostics[0]?.failure_class, "path_invalid");

  const proxy = diagnoseBrowserProviderFailure({
    provider_id: "cloakbrowser",
    failure_class: "proxy_unavailable",
    message: "Proxy auth failed."
  });
  assert.equal(proxy.failure_class, "proxy_unavailable");
  assert.equal(proxy.app_summary.includes("代理"), true);

  const args = diagnoseBrowserProviderFailure({
    provider_id: "chrome_official",
    failure_class: "launch_args_incompatible"
  });
  assert.equal(args.suggested_action.includes("启动参数"), true);

  assert.equal(classifyLaunchFailure(new Error("fetch failed")), "cdp_unavailable");
});

test("returns local identity environment facts without protected material", () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const facts = runtime.getLocalIdentityEnvironmentFacts({
    ...providerFixture({ [cloakPath]: { executable: true } }),
    identity_environment_ref: "identity-env_xhs-alice",
    execution_identity_ref: "execution-identity_xhs-alice",
    profile_ref: "profile_xhs-alice",
    profile_storage_ref: "profile-storage_xhs-alice",
    site: {
      site_id: "xiaohongshu",
      origin: "https://www.xiaohongshu.com",
      display_name: "小红书",
      account_identifier: "alice@example.test",
      account_ref: "account_xhs-alice"
    },
    login_state: "expired",
    login_state_reason: "last observed session expired",
    storage_state: "present",
    proxy_ref: "proxy_tokyo-home",
    proxy_label: "Tokyo residential",
    region: "JP",
    language: "zh-CN",
    timezone: "Asia/Tokyo",
    browser_family: "cloakbrowser",
    user_agent_summary: "CloakBrowser Chromium 145",
    viewport: "1280x900",
    fingerprint_summary: "provider_claim_ref:fingerprint_xhs-alice",
    credential_ref: "credential_xhs-alice",
    keychain_ref: "keychain://harbor/xhs-alice",
    local_secret_ref: "local-secret_xhs-alice",
    login_method: "qr",
    human_verification: ["qr_scan", "two_factor", "captcha", "login_expired"]
  });

  assert.equal(facts.schema_version, "harbor-local-identity-environment/v0");
  assert.equal(facts.identity_environment_ref, "identity-env_xhs-alice");
  assert.equal(facts.site_binding.site_id, "xiaohongshu");
  assert.equal(facts.login_state.state, "expired");
  assert.equal(facts.login_state.recovery_required, true);
  assert.equal(facts.login_state.manual_authentication_state, "required");
  assert.deepEqual(facts.login_state.human_verification, ["qr_scan", "two_factor", "captcha", "login_expired"]);
  assert.equal(facts.browser_storage.cookies_session_state, "present");
  assert.equal(facts.browser_storage.profile_storage_ref.startsWith("profile_storage_ref_"), true);
  assert.equal(facts.browser_storage.cleanup_rule, "delete_profile_storage_and_refs");
  assert.equal(facts.environment.proxy.state, "configured");
  assert.equal(facts.environment.region, "JP");
  assert.equal(facts.environment.language, "zh-CN");
  assert.equal(facts.environment.timezone, "Asia/Tokyo");
  assert.equal(facts.provider_binding.selected_provider_id, "cloakbrowser");
  assert.equal(facts.credential_recovery.login_method, "qr");
  assert.equal(facts.credential_recovery.keychain_ref, "keychain://harbor/xhs-alice");
  assert.deepEqual(facts.credential_recovery.forbidden_plaintext, ["password", "verification_code", "cookie", "session_token"]);
  assert.equal(facts.import_export_delete.default_export, "safe_summary_only");
  assert.equal(facts.import_export_delete.full_export, "explicit_user_action_required");
  assert.equal(facts.import_export_delete.local_encryption, "required_for_protected_material");
  assert.equal(facts.import_export_delete.residual_check, "profile_storage_credentials_and_refs");
  assert.equal(facts.consumer_boundary.app, "public_summary_refs_and_recovery_state_only");
  assert.equal(facts.consumer_boundary.core, "admission_facts_refs_and_blocking_reasons_only");
  assert.equal(facts.consumer_boundary.lode, "site_requirement_matching_refs_only");
  assert.equal(facts.risk_boundary.target_site_bypass, "not_claimed");
  assert.equal(facts.sensitive_material_boundary.some((boundary) => boundary.class === "never_export_material"), true);

  const publicJson = JSON.stringify(facts);
  assert.equal(publicJson.includes("plain-secret-value"), false);
  assert.equal(publicJson.includes("sms-code-123456"), false);
  assert.equal(publicJson.includes("session-token-value"), false);
  assert.equal(publicJson.includes("cookie-value"), false);
  assert.equal(publicJson.includes("storage-value"), false);
  assert.equal(publicJson.includes("profile-storage_xhs-alice"), false);
  assert.equal(publicJson.includes("proxy-password"), false);
});

test("manages local xhs and boss identity environments with redacted public output", async () => {
  const dir = mkdtempSync(join(tmpdir(), "harbor-identity-env-"));
  const persistence_path = join(dir, "identity-environments.json");
  try {
    const runtime = new HarborRuntime(createFixtureLauncher("ready"), { persistence_path });
    const xhs = runtime.createLocalIdentityEnvironment({
      ...providerFixture({ [cloakPath]: { executable: true } }),
      identity_environment_ref: "identity-env_xhs-managed",
      execution_identity_ref: "execution-identity_xhs-managed",
      profile_ref: "profile_xhs-managed",
      profile_storage_ref: "profile-storage_xhs-managed",
      cookie_jar_ref: "cookie-jar_xhs-managed",
      browser_storage_ref: "browser-storage_xhs-managed",
      site: {
        site_id: "xiaohongshu",
        origin: "https://www.xiaohongshu.com",
        display_name: "小红书",
        account_identifier: "alice@example.test",
        account_ref: "account_xhs-managed"
      },
      login_state: "manual_auth_required",
      storage_state: "present",
      proxy_ref: "proxy_tokyo-managed",
      region: "JP",
      language: "zh-CN",
      timezone: "Asia/Tokyo",
      fingerprint_summary: "provider_claim_ref:fingerprint_xhs-managed",
      credential_ref: "credential_xhs-managed",
      keychain_ref: "keychain://harbor/xhs-managed",
      local_secret_ref: "local-secret_xhs-managed",
      login_method: "qr",
      human_verification: ["qr_scan", "captcha"]
    });
    const boss = runtime.importLocalIdentityEnvironment({
      ...providerFixture({ [chromePath]: { executable: true } }),
      identity_environment_ref: "identity-env_boss-managed",
      execution_identity_ref: "execution-identity_boss-managed",
      profile_ref: "profile_boss-managed",
      profile_storage_ref: "profile-storage_boss-managed",
      browser_storage_ref: "browser-storage_boss-managed",
      imported_from: "manual_profile_import",
      site: {
        site_id: "boss",
        origin: "https://www.zhipin.com",
        display_name: "BOSS 直聘",
        account_ref: "account_boss-managed"
      },
      login_state: "logged_in",
      storage_state: "present",
      proxy_ref: "proxy_shanghai-managed",
      region: "CN",
      language: "zh-CN",
      timezone: "Asia/Shanghai",
      fingerprint_summary: "provider_claim_ref:fingerprint_boss-managed"
    });

    assert.equal(xhs.site.site_id, "xiaohongshu");
    assert.equal(xhs.status.readiness, "needs_auth");
    assert.equal(xhs.refs.profile_storage_ref.startsWith("profile_storage_ref_"), true);
    assert.notEqual(xhs.refs.profile_storage_ref, "profile-storage_xhs-managed");
    assert.equal(boss.site.site_id, "boss");
    assert.equal(runtime.listLocalIdentityEnvironments().length, 2);

    const updated = runtime.updateLocalIdentityEnvironment("identity-env_xhs-managed", {
      login_state: "logged_in",
      storage_state: "present",
      manual_authentication_state: "completed",
      observed_environment: {
        proxy_ref: "proxy_tokyo-managed",
        region: "JP",
        language: "zh-CN",
        timezone: "Asia/Tokyo",
        login_state: "logged_in"
      }
    });
    assert.equal(updated?.status.login_state, "logged_in");
    assert.equal(updated?.status.manual_authentication_state, "completed");

    const session = await runtime.openManagedIdentityEnvironmentSession({
      identity_environment_ref: "identity-env_xhs-managed",
      url: "https://www.xiaohongshu.com/explore",
      control_owner: "agent"
    });
    assert.equal("status" in session, false);
    if ("status" in session) throw new Error("managed identity environment session should open");
    assert.equal(session.identity_environment_ref, "identity-env_xhs-managed");
    assert.equal(session.profile_ref, "profile_xhs-managed");

    const defaultBossSession = await runtime.openManagedDefaultSiteSession({
      identity_environment_ref: "identity-env_boss-managed",
      control_owner: "agent"
    });
    assert.equal("status" in defaultBossSession, false);
    if ("status" in defaultBossSession) throw new Error("default BOSS session should open");
    assert.equal(defaultBossSession.current_page.requested_url, DEFAULT_IDENTITY_SITE_URLS.boss);
    assert.equal(defaultBossSession.current_page.current_url, DEFAULT_IDENTITY_SITE_URLS.boss);

    assert.throws(() => runtime.createLocalIdentityEnvironment({
      identity_environment_ref: "identity-env_rejected",
      site: { site_id: "xiaohongshu", origin: "https://www.xiaohongshu.com" },
      password: "plain-secret-value",
      cookie_value: "cookie-value",
      session_token: "session-token-value",
      raw_storage: { localStorage: "storage-value" }
    } as Parameters<HarborRuntime["createLocalIdentityEnvironment"]>[0]), /Sensitive local identity material/);

    const publicJson = JSON.stringify(runtime.listLocalIdentityEnvironments());
    const persistedJson = readFileSync(persistence_path, "utf8");
    for (const material of [
      "plain-secret-value",
      "cookie-value",
      "session-token-value",
      "storage-value",
      "keychain://harbor/xhs-managed",
      "profile-storage_xhs-managed",
      "profile-storage_boss-managed",
      "browser-storage_xhs-managed",
      "browser-storage_boss-managed"
    ]) {
      assert.equal(publicJson.includes(material), false);
    }
    for (const material of ["plain-secret-value", "cookie-value", "session-token-value", "storage-value"]) {
      assert.equal(persistedJson.includes(material), false);
    }
    assert.equal(publicJson.includes("cookie_value"), true);
    assert.equal(publicJson.includes("raw_profile_data"), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("opens managed user sessions with persistent profile storage refs and visible viewer facts", async () => {
  const launches: LocalProviderLaunchInput[] = [];
  const runtime = new HarborRuntime(capturingLauncher(launches));
  runtime.createLocalIdentityEnvironment({
    ...providerFixture({ [chromePath]: { executable: true } }),
    identity_environment_ref: "identity-env_xhs-persistent",
    execution_identity_ref: "execution-identity_xhs-persistent",
    profile_ref: "profile_xhs-persistent",
    profile_storage_ref: "profile-storage_xhs-persistent",
    site: {
      site_id: "xiaohongshu",
      origin: "https://www.xiaohongshu.com",
      display_name: "小红书",
      account_ref: "account_xhs-persistent"
    },
    login_state: "logged_in",
    storage_state: "present"
  });

  const session = await runtime.openManagedIdentityEnvironmentSession({
    identity_environment_ref: "identity-env_xhs-persistent",
    url: "https://www.xiaohongshu.com/explore",
    control_owner: "user"
  });

  assert.equal("status" in session, false);
  if ("status" in session) throw new Error("managed user session should open");
  assert.equal(launches.length, 1);
  assert.equal(launches[0]?.profile_storage_ref, "profile-storage_xhs-persistent");
  assert.equal(launches[0]?.headless, false);
  assert.equal(session.identity_environment_ref, "identity-env_xhs-persistent");
  assert.equal(session.profile_ref, "profile_xhs-persistent");
  assert.equal(session.control_owner, "user");
  assert.equal(session.availability.viewer, "available");
  assert.equal(session.viewer_entry?.transport, "local_window");

  const publicJson = JSON.stringify(session);
  assert.equal(publicJson.includes("profile-storage_xhs-persistent"), false);
  assert.equal(publicJson.includes("raw_profile_data"), false);
  assert.equal(publicJson.includes("webSocketDebuggerUrl"), false);
});

test("local provider maps profile storage refs to stable private directories without exposing the ref", async () => {
  const dir = mkdtempSync(join(tmpdir(), "harbor-profile-storage-root-"));
  const previousRoot = process.env.HARBOR_PROFILE_STORAGE_ROOT;
  process.env.HARBOR_PROFILE_STORAGE_ROOT = dir;
  try {
    const profileStorageRef = "profile-storage_local-provider-test";
    const storageId = createHash("sha256").update(profileStorageRef).digest("hex").slice(0, 32);
    const storagePath = join(dir, storageId);
    mkdirSync(storagePath, { recursive: true, mode: 0o777 });
    chmodSync(storagePath, 0o777);
    const result = await launchLocalDedicatedProvider({
      browser_path: process.execPath,
      headless: true,
      timeout_ms: 25,
      url: "about:blank",
      profile_ref: "profile_local-provider-test",
      profile_storage_ref: profileStorageRef,
      provider_ref: "provider_local-provider-test"
    });
    assert.equal(existsSync(storagePath), true);
    assert.equal(statSync(storagePath).mode & 0o777, 0o700);
    assert.equal(JSON.stringify(result).includes(profileStorageRef), false);
    assert.equal(result.facts.some((fact) => fact.key === "profile.storage_scope" && fact.value === "persistent_ref"), true);
  } finally {
    if (previousRoot === undefined) delete process.env.HARBOR_PROFILE_STORAGE_ROOT;
    else process.env.HARBOR_PROFILE_STORAGE_ROOT = previousRoot;
    rmSync(dir, { recursive: true, force: true });
  }
});

test("local provider preserves persistent profile dirs and removes ephemeral dirs after successful close", async () => {
  const dir = mkdtempSync(join(tmpdir(), "harbor-fake-browser-"));
  const previousRoot = process.env.HARBOR_PROFILE_STORAGE_ROOT;
  const previousMarker = process.env.HARBOR_FAKE_BROWSER_MARKER;
  const browserPath = writeFakeBrowserExecutable(dir);
  process.env.HARBOR_PROFILE_STORAGE_ROOT = join(dir, "profiles");
  try {
    const persistentMarker = join(dir, "persistent-profile.txt");
    process.env.HARBOR_FAKE_BROWSER_MARKER = persistentMarker;
    const persistent = await launchLocalDedicatedProvider({
      browser_path: browserPath,
      headless: true,
      timeout_ms: 1000,
      url: "about:blank",
      profile_ref: "profile_persistent-close-test",
      profile_storage_ref: "profile-storage_persistent-close-test",
      provider_ref: "provider_fake"
    });
    assert.equal(persistent.status, "ready");
    if (persistent.status !== "ready") throw new Error("persistent fake browser should be ready");
    const persistentDir = readFileSync(persistentMarker, "utf8");
    await persistent.close();
    assert.equal(existsSync(persistentDir), true);

    const ephemeralMarker = join(dir, "ephemeral-profile.txt");
    process.env.HARBOR_FAKE_BROWSER_MARKER = ephemeralMarker;
    const ephemeral = await launchLocalDedicatedProvider({
      browser_path: browserPath,
      headless: true,
      timeout_ms: 1000,
      url: "about:blank",
      profile_ref: "profile_ephemeral-close-test",
      provider_ref: "provider_fake"
    });
    assert.equal(ephemeral.status, "ready");
    if (ephemeral.status !== "ready") throw new Error("ephemeral fake browser should be ready");
    const ephemeralDir = readFileSync(ephemeralMarker, "utf8");
    await ephemeral.close();
    assert.equal(existsSync(ephemeralDir), false);
  } finally {
    if (previousRoot === undefined) delete process.env.HARBOR_PROFILE_STORAGE_ROOT;
    else process.env.HARBOR_PROFILE_STORAGE_ROOT = previousRoot;
    if (previousMarker === undefined) delete process.env.HARBOR_FAKE_BROWSER_MARKER;
    else process.env.HARBOR_FAKE_BROWSER_MARKER = previousMarker;
    rmSync(dir, { recursive: true, force: true });
  }
});

test("opens an identity environment session with page and controller facts", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const session = await runtime.openIdentityEnvironmentSession({
    identity_environment: {
      ...providerFixture({ [cloakPath]: { executable: true } }),
      identity_environment_ref: "identity-env_xhs-open",
      execution_identity_ref: "execution-identity_xhs-open",
      profile_ref: "profile_xhs-open",
      site: {
        site_id: "xiaohongshu",
        origin: "https://www.xiaohongshu.com",
        display_name: "小红书"
      },
      login_state: "logged_in",
      storage_state: "present"
    },
    url: "https://www.xiaohongshu.com/explore",
    control_owner: "agent",
    holder_ref: "agent_run_1"
  });

  assert.equal("status" in session, false);
  if ("status" in session) throw new Error("identity environment session should open");
  assert.equal(session.identity_environment_ref, "identity-env_xhs-open");
  assert.equal(session.execution_identity_ref, "execution-identity_xhs-open");
  assert.equal(session.profile_ref, "profile_xhs-open");
  assert.equal(session.current_page.requested_url, "https://www.xiaohongshu.com/explore");
  assert.equal(session.current_page.current_url, "https://www.xiaohongshu.com/explore");
  assert.equal(session.current_page.title, "Fixture page for https://www.xiaohongshu.com/explore");
  assert.equal(session.current_page.status, "ready");
  assert.equal(session.control_owner, "agent");
  assert.equal(session.control_lock.owner, "agent");
  assert.equal(session.control_lock.holder_ref, "agent_run_1");
  assert.equal(session.facts.some((fact) => fact.key === "lifecycle.reference.donut_browser"), true);

  const publicJson = JSON.stringify(session);
  assert.equal(publicJson.includes("webSocketDebuggerUrl"), false);
  assert.equal(publicJson.includes("cookie"), false);
  assert.equal(publicJson.includes("token"), false);
});

test("reuses, locks, releases, and stops identity environment sessions", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const identity_environment = runtime.getLocalIdentityEnvironmentFacts({
    ...providerFixture({ [cloakPath]: { executable: true } }),
    identity_environment_ref: "identity-env_boss",
    execution_identity_ref: "execution-identity_boss",
    profile_ref: "profile_boss",
    site: {
      site_id: "boss",
      origin: "https://www.zhipin.com",
      display_name: "BOSS 直聘"
    },
    login_state: "logged_in",
    storage_state: "present"
  });
  const opened = await runtime.openIdentityEnvironmentSession({
    identity_environment,
    url: "https://www.zhipin.com",
    control_owner: "agent"
  });
  assert.equal("status" in opened, false);
  if ("status" in opened) throw new Error("initial session should open");

  const reused = await runtime.openIdentityEnvironmentSession({
    identity_environment,
    url: "https://www.zhipin.com/web/geek/job",
    control_owner: "agent"
  });
  assert.equal("status" in reused, false);
  if ("status" in reused) throw new Error("session should be reused by same controller");
  assert.equal(reused.runtime_session_ref, opened.runtime_session_ref);
  assert.equal(reused.current_page.current_url, "https://www.zhipin.com/web/geek/job");

  const locked = runtime.lockSession(opened.runtime_session_ref, { control_owner: "user", holder_ref: "manual_user" });
  assert.equal("status" in locked, true);
  if (!("status" in locked)) throw new Error("different controller should not take held session");
  assert.equal(locked.failure_class, "session_locked");

  const released = runtime.releaseSession(opened.runtime_session_ref, { control_owner: "agent" });
  assert.equal("status" in released, false);
  if ("status" in released) throw new Error("owner should release session");
  assert.equal(released.lifecycle_state, "idle");
  assert.equal(released.control_owner, "none");
  assert.equal(released.control_lock.state, "released");

  const userLocked = runtime.lockSession(opened.runtime_session_ref, { control_owner: "user", holder_ref: "manual_user" });
  assert.equal("status" in userLocked, false);
  if ("status" in userLocked) throw new Error("released session should be lockable by user");
  assert.equal(userLocked.lifecycle_state, "locked");
  assert.equal(userLocked.control_owner, "user");

  const conflict = await runtime.openIdentityEnvironmentSession({
    identity_environment,
    url: "https://www.zhipin.com/web/geek/job",
    control_owner: "core_task"
  });
  assert.equal("status" in conflict, true);
  if (!("status" in conflict)) throw new Error("core_task should not take user lock");
  assert.equal(conflict.current_error.code, "session_locked");

  const stopped = await runtime.stopSession(opened.runtime_session_ref, { control_owner: "user" });
  assert.equal("status" in stopped, false);
  if ("status" in stopped) throw new Error("user should stop locked session");
  assert.equal(stopped.lifecycle_state, "closed");
  assert.equal(stopped.control_lock.state, "closed");
});

test("returns structured failure for invalid target URLs", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const result = await runtime.openIdentityEnvironmentSession({
    identity_environment: {
      site: {
        site_id: "xhs",
        origin: "https://www.xiaohongshu.com"
      }
    },
    url: "javascript:alert(1)"
  });

  assert.equal("status" in result, true);
  if (!("status" in result)) throw new Error("invalid URL should not launch");
  assert.equal(result.failure_class, "url_unreachable");
  assert.equal(result.current_error.code, "url_unreachable");
  assert.equal(result.retryable, false);
});

test("reports profile and session blockers as structured validation runtime facts", async () => {
  const locked = await new HarborRuntime(createFixtureLauncher("profile_locked")).createSession();
  assert.equal(locked.lifecycle_state, "failed");
  assert.equal(locked.current_error?.code, "profile_locked");
  assert.equal(locked.current_error?.retryable, true);
  const lockedFacts = new HarborRuntime(createFixtureLauncher("profile_locked"));
  const lockedSession = await lockedFacts.createSession();
  const validation = lockedFacts.getValidationRuntimeFacts(lockedSession.runtime_session_ref);
  assert.equal("status" in validation, false);
  if ("status" in validation) throw new Error("validation facts should be readable");
  assert.equal(validation.runtime_ready, false);
  assert.equal(validation.blocking_reasons[0]?.code, "profile_locked");
  assert.equal(validation.validation_refs.length, 0);

  const lost = await new HarborRuntime(createFixtureLauncher("session_lost")).createSession();
  assert.equal(lost.lifecycle_state, "failed");
  assert.equal(lost.current_error?.code, "session_lost");
  assert.equal(lost.availability.snapshot, "unavailable");
});

test("separates configured, observed, provider claim, and validation evidence facts", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const session = await runtime.createSession();
  const sources = new Set(session.facts.map((fact) => fact.source));
  const validation = runtime.getValidationRuntimeFacts(session.runtime_session_ref);

  assert.equal(sources.has("configured"), true);
  assert.equal(sources.has("observed"), true);
  assert.equal(sources.has("provider_claim"), true);
  assert.equal(sources.has("validation_evidence"), true);
  assert.equal("status" in validation, false);
  if ("status" in validation) throw new Error("validation facts should be readable");
  assert.equal(validation.runtime_ready, true);
  assert.equal(validation.validation_refs.length > 0, true);
});

test("does not expose raw CDP endpoints in public session facts", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const session = await runtime.createSession();
  const publicJson = JSON.stringify(session);

  assert.equal(publicJson.includes("ws://"), false);
  assert.equal(publicJson.includes("webSocketDebuggerUrl"), false);
  assert.match(session.cdp_ref ?? "", /^cdp_/);
});

test("reports viewer ref, control owner, and handoff facts", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const session = await runtime.createSession();

  const viewer = runtime.getViewerControlFacts(session.runtime_session_ref);
  assert.equal("status" in viewer, false);
  if ("status" in viewer) throw new Error("viewer facts should be readable");
  assert.match(viewer.viewer.viewer_ref, /^viewer_/);
  assert.equal(viewer.viewer.viewer_url, null);
  assert.equal(viewer.viewer.availability, "unsupported");
  assert.equal(viewer.viewer.access_mode, "none");
  assert.equal(viewer.control.owner, "system");
  assert.equal(viewer.control.takeover.available, false);
  assert.equal(viewer.control.takeover.unavailable_reason, "viewer_unavailable");

  const handoff = runtime.recordHandoff(session.runtime_session_ref, {
    control_owner: "user",
    handoff_reason: "login_required"
  });
  assert.equal("status" in handoff, false);
  if ("status" in handoff) throw new Error("handoff facts should be readable");
  assert.equal(handoff.control.owner, "user");
  assert.equal(handoff.control.previous_owner, "system");
  assert.equal(handoff.control.handoff_reason, "login_required");
  assert.equal(handoff.control.takeover.available, false);
  assert.equal(handoff.control.takeover.unavailable_reason, "already_user_controlled");
  assert.equal(runtime.getSession(session.runtime_session_ref)?.control_owner, "user");
});

test("returns a Harbor-mediated local viewer entry without raw endpoints", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const session = await runtime.createSession({ headless: false, control_owner: "core_task" });

  assert.equal(session.availability.viewer, "available");
  const viewer = runtime.getViewerControlFacts(session.runtime_session_ref);
  assert.equal("status" in viewer, false);
  if ("status" in viewer) throw new Error("local viewer facts should be readable");
  assert.equal(viewer.viewer.availability, "available");
  assert.equal(viewer.viewer.transport, "local_window");
  assert.equal(viewer.viewer.access_mode, "interactive");
  assert.deepEqual(viewer.viewer.input_capabilities, ["keyboard_mouse"]);
  assert.equal(viewer.viewer.viewer_url, null);
  assert.equal(viewer.control.owner, "core_task");
  assert.equal(viewer.privacy_boundary.raw_cdp_endpoint, "not_exposed");
  assert.equal(viewer.privacy_boundary.raw_vnc_endpoint, "not_exposed");
  assert.equal(viewer.privacy_boundary.full_profile_storage, "not_exposed");

  const publicJson = JSON.stringify({ session, viewer });
  assert.equal(publicJson.includes("ws://"), false);
  assert.equal(publicJson.includes("vnc://"), false);
  assert.equal(publicJson.includes("webSocketDebuggerUrl"), false);
  assert.equal(publicJson.includes("cookie"), false);
  assert.equal(publicJson.includes("token"), false);
});

test("returns Core runtime facts and App status fixture from the same Harbor facts", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const session = await runtime.createSession();
  runtime.recordHandoff(session.runtime_session_ref, {
    control_owner: "user",
    handoff_reason: "policy_requires_user"
  });

  const core = runtime.getCoreRuntimeFacts(session.runtime_session_ref);
  assert.equal("status" in core, false);
  if ("status" in core) throw new Error("core facts should be readable");
  assert.equal(core.runtime_session_ref, session.runtime_session_ref);
  assert.equal(core.viewer.viewer_ref, session.viewer_ref);
  assert.equal(core.viewer.availability, "unsupported");
  assert.equal(core.control.owner, "user");
  assert.equal(core.control.handoff_reason, "policy_requires_user");
  assert.equal(core.fact_refs.session, session.runtime_session_ref);

  const app = runtime.getAppRuntimeStatusFixture(session.runtime_session_ref);
  assert.equal("status" in app, false);
  if ("status" in app) throw new Error("app fixture should be readable");
  assert.equal(app.runtime_session_ref, session.runtime_session_ref);
  assert.equal(app.browser_status, "ready");
  assert.equal(app.viewer_status.viewer_ref, core.viewer.viewer_ref);
  assert.equal(app.viewer_status.display_state, core.viewer.availability);
  assert.equal(app.control_status.owner, core.control.owner);
  assert.equal(app.control_status.handoff_reason, core.control.handoff_reason);

  const publicJson = JSON.stringify({ core, app });
  assert.equal(publicJson.includes("ws://"), false);
  assert.equal(publicJson.includes("vnc://"), false);
  assert.equal(publicJson.includes("webSocketDebuggerUrl"), false);
  assert.equal(publicJson.includes("raw_cdp"), false);
  assert.equal(publicJson.includes("cookie"), false);
  assert.equal(publicJson.includes("token"), false);
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
  assert.match(capture.core_scene_ref.screenshot_ref ?? "", /^screenshot_/);
  assert.match(capture.core_scene_ref.page_ref, /^page_/);
  assert.match(capture.core_scene_ref.frame_ref, /^frame_/);
  assert.equal(capture.core_scene_ref.page_summary.summary, "Inbox with two visible messages.");
  assert.equal(capture.core_scene_ref.evidence_refs.length, 4);

  const snapshot = runtime.getSnapshot(capture.snapshot_ref);
  assert.equal("snapshot_ref" in snapshot, true);
  if (!("snapshot_ref" in snapshot)) throw new Error("snapshot should be readable");
  assert.equal(snapshot.page.title, "Inbox");
  assert.equal(snapshot.redaction_state, "redacted");

  const refmap = runtime.getRefMap(capture.refmap_ref ?? "");
  assert.equal("refmap_ref" in refmap, true);
  if (!("refmap_ref" in refmap)) throw new Error("refmap should be readable");
  assert.match(refmap.element_refs[0]?.element_ref ?? "", /^element_/);
  assert.match(refmap.element_refs[0]?.source_evidence_ref ?? "", /^evidence_/);
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
  assert.equal(coreJson.includes("video"), false);
  assert.equal(coreJson.includes("cookie"), false);
  assert.equal(coreJson.includes("token"), false);
  assert.equal(coreJson.includes("profile_path"), false);
  assert.equal(coreJson.includes("webSocketDebuggerUrl"), false);
});

test("captures live page screenshot refs and artifact facts without raw screenshot bytes", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const session = await runtime.openIdentityEnvironmentSession({
    identity_environment: {
      site: {
        site_id: "xiaohongshu",
        origin: "https://www.xiaohongshu.com",
        display_name: "小红书"
      },
      login_state: "logged_in",
      storage_state: "present"
    },
    url: DEFAULT_IDENTITY_SITE_URLS.xiaohongshu,
    control_owner: "agent"
  });
  assert.equal("status" in session, false);
  if ("status" in session) throw new Error("identity environment session should open");

  const capture = await runtime.captureLiveSnapshot(session.runtime_session_ref, {
    elements: [{ label: "Default page", role: "document" }]
  });
  assert.equal(capture.status, "captured");
  if (capture.status !== "captured") throw new Error("live capture should be available");
  assert.equal(capture.core_scene_ref.page_summary.url, DEFAULT_IDENTITY_SITE_URLS.xiaohongshu);
  assert.match(capture.core_scene_ref.screenshot_ref ?? "", /^screenshot_/);

  const screenshotEvidence = capture.evidence_refs
    .map((ref) => runtime.getEvidence(ref))
    .find((record) => !("status" in record) && record.evidence_type === "screenshot");
  assert.ok(screenshotEvidence);
  if (!screenshotEvidence || "status" in screenshotEvidence) throw new Error("screenshot evidence should be readable");
  assert.equal(screenshotEvidence.artifact?.mime_type, "image/png");
  assert.equal((screenshotEvidence.artifact?.byte_length ?? 0) > 0, true);
  assert.match(screenshotEvidence.artifact?.sha256 ?? "", /^[a-f0-9]{64}$/);
  assert.equal(screenshotEvidence.artifact?.raw_bytes, "not_exposed");

  const publicJson = JSON.stringify(capture);
  assert.equal(publicJson.includes("data:image/png"), false);
  assert.equal(publicJson.includes("webSocketDebuggerUrl"), false);
  assert.equal(publicJson.includes("cookie"), false);
  assert.equal(publicJson.includes("token"), false);
});

test("captures live page refs without screenshot evidence when screenshot capture fails", async () => {
  const fixtureLauncher = createFixtureLauncher("ready");
  const runtime = new HarborRuntime(async (input) => {
    const launch = await fixtureLauncher(input);
    if (launch.status !== "ready") return launch;
    return {
      ...launch,
      captureScreenshot: async () => ({
        code: "cdp_unavailable" as const,
        message: "Fixture screenshot capture failed.",
        retryable: true
      })
    };
  });
  const session = await runtime.openIdentityEnvironmentSession({
    identity_environment: {
      site: {
        site_id: "xiaohongshu",
        origin: "https://www.xiaohongshu.com",
        display_name: "小红书"
      },
      login_state: "logged_in",
      storage_state: "present"
    },
    url: DEFAULT_IDENTITY_SITE_URLS.xiaohongshu,
    control_owner: "agent"
  });
  assert.equal("status" in session, false);
  if ("status" in session) throw new Error("identity environment session should open");

  const capture = await runtime.captureLiveSnapshot(session.runtime_session_ref, {
    elements: [{ label: "Default page", role: "document" }]
  });
  assert.equal(capture.status, "captured");
  if (capture.status !== "captured") throw new Error("live capture should still be available");
  assert.equal(capture.core_scene_ref.screenshot_ref, undefined);
  assert.match(capture.core_scene_ref.source_trace_ref, /^source_trace_/);
  assert.match(capture.core_scene_ref.page_ref, /^page_/);
  assert.match(capture.core_scene_ref.frame_ref, /^frame_/);
  assert.match(capture.refmap_ref ?? "", /^refmap_/);
  assert.equal(capture.evidence_refs.length, 3);
  assert.equal(capture.evidence_refs.map((ref) => runtime.getEvidence(ref)).some((record) => !("status" in record) && record.evidence_type === "screenshot"), false);
  assert.equal(capture.evidence_refs.map((ref) => runtime.getEvidence(ref)).some((record) => !("status" in record) && record.evidence_type === "source_trace"), true);
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

test("returns App-safe evidence status fixture without private raw material", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const session = await runtime.createSession();
  const capture = runtime.captureSnapshot(session.runtime_session_ref, {
    title: "Fixture inbox",
    url: "https://example.test/inbox",
    summary: "Redacted fixture summary for status display.",
    capture_method: "fixture",
    source_locator: "fixture://status/inbox",
    elements: [{ label: "Message row", role: "row" }],
    evidence_policy: {
      redaction_state: "redacted",
      retention_state: "retained"
    }
  });

  assert.equal(capture.status, "captured");
  if (capture.status !== "captured") throw new Error("capture should be available");

  const status = runtime.getEvidenceStatusFixture(capture.snapshot_ref);
  assert.equal("status" in status, false);
  if ("status" in status) throw new Error("evidence status should be readable");
  assert.equal(status.scene_status.display_state, "available");
  assert.equal(status.scene_status.freshness_state, "fresh");
  assert.equal(status.privacy_boundary.access_boundary, "harbor_refs_only");
  assert.equal(status.privacy_boundary.raw_material, "not_exposed");
  assert.equal(status.privacy_boundary.private_capture_store, "process_memory_only");
  assert.equal(status.privacy_boundary.redacted_export_boundary, "redacted_fixture_refs_only");
  assert.equal(status.privacy_boundary.export_consent, "granted");
  assert.equal(status.privacy_boundary.retention_policy, "ephemeral_by_default");
  assert.equal(status.privacy_boundary.deletion_policy, "expire_or_drop_ref");
  assert.equal(status.evidence_status.length, 4);
  assert.equal(status.evidence_status.every((entry) => entry.display_state === "redacted"), true);
  assert.equal(status.evidence_status.every((entry) => entry.retention_state === "retained"), true);

  const expired = runtime.expireEvidence(capture.evidence_refs[0] ?? "");
  assert.equal("evidence_ref" in expired, true);
  const afterExpire = runtime.getEvidenceStatusFixture(capture.snapshot_ref);
  assert.equal("status" in afterExpire, false);
  if ("status" in afterExpire) throw new Error("expired status should be readable");
  assert.equal(afterExpire.evidence_status.some((entry) => entry.display_state === "expired"), true);

  await runtime.closeSession(session.runtime_session_ref);
  const stale = runtime.getEvidenceStatusFixture(capture.snapshot_ref);
  assert.equal("status" in stale, false);
  if ("status" in stale) throw new Error("stale status should be readable");
  assert.equal(stale.scene_status.display_state, "stale");
  assert.equal(stale.scene_status.blocking_reason, "snapshot_stale");
  assert.equal(stale.evidence_status.some((entry) => entry.display_state === "stale"), true);

  const publicJson = JSON.stringify(stale);
  assert.equal(publicJson.includes("raw_dom"), false);
  assert.equal(publicJson.includes("raw_har"), false);
  assert.equal(publicJson.includes("cookie"), false);
  assert.equal(publicJson.includes("token"), false);
  assert.equal(publicJson.includes("profile_path"), false);
  assert.equal(publicJson.includes("storage_state"), false);
});

test("returns write-precheck target and form facts without raw private material", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const session = await runtime.createSession();
  const facts = runtime.getWritePrecheckFacts(session.runtime_session_ref, {
    title: "Spoofed direct title",
    url: "https://attacker.example/direct-write-precheck",
    summary: "Spoofed direct summary",
    locator_hint: "body[data-direct-spoofed=true]",
    target_label: "Fixture contact form",
    fields: [
      { label: "Email", input_kind: "email", required: true, sensitivity: "sensitive", export_policy: "redacted", value_state: "redacted" },
      { label: "Message", input_kind: "textarea", required: true, sensitivity: "public", export_policy: "safe_summary", value_state: "present" },
      { label: "Password", input_kind: "password", required: false, sensitivity: "secret", export_policy: "never_export", value_state: "unavailable" }
    ]
  });

  assert.equal("status" in facts, false);
  if ("status" in facts) throw new Error("write-precheck facts should be readable");
  assert.equal(facts.schema_version, "harbor-write-precheck-facts/v0");
  assert.equal(facts.submitted, false);
  assert.match(facts.writable_target.target_ref, /^writable-target_/);
  assert.match(facts.writable_target.snapshot_ref, /^snapshot_/);
  assert.equal(facts.writable_target.role, "form");
  assert.notEqual(facts.writable_target.locator_hint, "body[data-direct-spoofed=true]");
  assert.equal(facts.writable_target.provenance.source, "provided_context");
  assert.equal(facts.form_state.fields.length, 3);
  assert.equal(facts.form_state.fields[0]?.sensitivity, "sensitive");
  assert.equal(facts.form_state.fields[0]?.export_policy, "redacted");
  assert.equal(facts.form_state.fields[2]?.export_policy, "never_export");
  assert.equal(facts.pre_write_guard.no_submit_guard, "active");
  assert.deepEqual(facts.pre_write_guard.blocked_events, ["submit", "publish", "send", "delete", "pay"]);
  assert.equal(facts.pre_write_guard.enforcement, "facts_only_no_real_submit");
  assert.equal(facts.privacy_boundary.raw_values, "not_exposed");
  const directEvidence = runtime.getEvidence(facts.writable_target.evidence_refs[0] ?? "");
  assert.equal("status" in directEvidence, false);
  if ("status" in directEvidence) throw new Error("direct write-precheck evidence should be readable");
  const sourceLocator = directEvidence.provenance.source_locator;
  assert.equal(typeof sourceLocator, "string");
  if (!sourceLocator) throw new Error("direct write-precheck evidence should include a source locator");
  assert.equal(sourceLocator.includes(session.runtime_session_ref), true);

  const publicJson = JSON.stringify(facts);
  assert.equal(publicJson.includes("attacker.example"), false);
  assert.equal(JSON.stringify(directEvidence).includes("attacker.example"), false);
  assert.equal(publicJson.includes("raw_dom"), false);
  assert.equal(publicJson.includes("raw_har"), false);
  assert.equal(publicJson.includes("cookie"), false);
  assert.equal(publicJson.includes("token"), false);
  assert.equal(publicJson.includes("profile_path"), false);
  assert.equal(publicJson.includes("storage_state"), false);
  assert.equal(publicJson.includes("secret-value"), false);
});

test("returns preview evidence refs, provenance, and freshness states", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const session = await runtime.createSession();
  const preview = runtime.capturePreviewEvidence(session.runtime_session_ref, {
    url: "https://example.test/write-precheck",
    current_url: "https://example.test/write-precheck"
  });

  assert.equal("status" in preview, false);
  if ("status" in preview) throw new Error("preview evidence should be readable");
  assert.equal(preview.schema_version, "harbor-preview-evidence-status-fixture/v0");
  assert.match(preview.before_preview.snapshot_ref, /^snapshot_/);
  assert.match(preview.before_preview.refmap_ref ?? "", /^refmap_/);
  assert.equal(preview.target_state_provenance.captured_url, "https://example.test/write-precheck");
  assert.equal(preview.target_state_provenance.current_url, "https://example.test/write-precheck");
  assert.equal(preview.freshness.state, "available");
  assert.equal(preview.viewer_evidence_status.evidence_status.length, 4);

  const changed = runtime.getPreviewEvidenceStatusFixture(preview.before_preview.snapshot_ref, "https://example.test/changed");
  assert.equal("status" in changed, false);
  if ("status" in changed) throw new Error("changed preview evidence should be readable");
  assert.equal(changed.freshness.state, "page_changed");
  assert.equal(changed.freshness.blocking_reason, "page_changed");

  runtime.expireEvidence(preview.before_preview.evidence_refs[0] ?? "");
  const unavailable = runtime.getPreviewEvidenceStatusFixture(preview.before_preview.snapshot_ref);
  assert.equal("status" in unavailable, false);
  if ("status" in unavailable) throw new Error("expired preview evidence should be readable");
  assert.equal(unavailable.freshness.state, "evidence_unavailable");

  const publicJson = JSON.stringify(unavailable);
  assert.equal(publicJson.includes("raw_dom"), false);
  assert.equal(publicJson.includes("raw_har"), false);
  assert.equal(publicJson.includes("cookie"), false);
  assert.equal(publicJson.includes("token"), false);
  assert.equal(publicJson.includes("profile_path"), false);
  assert.equal(publicJson.includes("storage_state"), false);
});

test("returns redacted preview export fixture with no-submit and private boundary", async () => {
  const runtime = new HarborRuntime(createFixtureLauncher("ready"));
  const session = await runtime.createSession();
  const preview = runtime.capturePreviewEvidence(session.runtime_session_ref, {
    url: "https://example.test/write-precheck",
    current_url: "https://example.test/write-precheck"
  });

  assert.equal("status" in preview, false);
  if ("status" in preview) throw new Error("preview evidence should be readable");
  const redacted = runtime.getRedactedPreviewExportFixture(preview.before_preview.snapshot_ref);

  assert.equal("status" in redacted, false);
  if ("status" in redacted) throw new Error("redacted preview export should be readable");
  assert.equal(redacted.schema_version, "harbor-redacted-preview-export-fixture/v0");
  assert.equal(redacted.preview_state, "available");
  assert.match(redacted.before_preview_refs.snapshot_ref, /^snapshot_/);
  assert.equal(redacted.no_submit_guard.status, "active");
  assert.deepEqual(redacted.no_submit_guard.blocked_events, ["submit", "publish", "send", "delete", "pay"]);
  assert.equal(redacted.private_boundary.local_capture_store, "process_memory_only");
  assert.equal(redacted.private_boundary.restricted_material, "not_exported");
  assert.equal(redacted.private_boundary.export_boundary, "redacted_preview_refs_only");
  assert.equal(redacted.redacted_export.evidence_status.every((entry) => entry.display_state === "redacted"), true);

  const publicJson = JSON.stringify(redacted);
  assert.equal(publicJson.includes("raw_dom"), false);
  assert.equal(publicJson.includes("raw_har"), false);
  assert.equal(publicJson.includes("raw_network"), false);
  assert.equal(publicJson.includes("cookie"), false);
  assert.equal(publicJson.includes("token"), false);
  assert.equal(publicJson.includes("profile_path"), false);
  assert.equal(publicJson.includes("storage_state"), false);
  assert.equal(publicJson.includes("secret-value"), false);
});
