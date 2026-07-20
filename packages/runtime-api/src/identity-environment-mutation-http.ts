import type { IncomingMessage, ServerResponse } from "node:http";
import type {
  IdentityEnvironmentConfigurationUpdate,
  IdentityEnvironmentMutationRequest,
  IdentityEnvironmentMutationResult,
  ManagedLocalIdentityEnvironmentInput
} from "./index.js";
import type { ManualAuthenticationAuthorizer } from "./manual-authentication-authorization.js";

export function authorizeIdentityEnvironmentMutationRequest(
  authorizer: ManualAuthenticationAuthorizer,
  request: IncomingMessage,
  response: ServerResponse
): boolean {
  const authorization = authorizer.authorize(request);
  if (!authorization.authorized) {
    writeJson(response, authorization.status_code, { failure_class: authorization.failure_class });
    return false;
  }
  if (headerValues(request, "origin").length > 0) {
    writeJson(response, 403, { failure_class: "browser_origin_not_allowed" });
    return false;
  }
  const contentTypes = headerValues(request, "content-type");
  if (contentTypes.length !== 1 || !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(contentTypes[0])) {
    writeJson(response, 415, { failure_class: "json_content_type_required" });
    return false;
  }
  return true;
}

export function identityEnvironmentMutationStatusCode(result: IdentityEnvironmentMutationResult): number {
  if (result.status === "completed") {
    return result.operation === "create" || result.operation === "import" || result.operation.startsWith("copy_") ? 201 : 200;
  }
  if (result.status === "repair_required") return 409;
  if (result.failure?.code === "identity_environment_missing") return 404;
  if ([
    "active_session",
    "duplicate_identity",
    "duplicate_import",
    "idempotency_conflict",
    "profile_locked",
    "profile_storage_exists",
    "source_in_use",
    "target_in_use"
  ].includes(result.failure?.code ?? "")) return 409;
  return 422;
}

export function isIdentityEnvironmentMutationRequest(value: unknown): value is IdentityEnvironmentMutationRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  if (typeof input.idempotency_key !== "string" || !input.idempotency_key.trim() || typeof input.operation !== "string") return false;
  if (["create", "import"].includes(input.operation)) {
    return onlyKeys(input, ["operation", "idempotency_key", "identity_environment"]) &&
      isIdentityEnvironmentMutationInput(input.identity_environment, input.operation as "create" | "import");
  }
  if (!["edit", "copy_full", "copy_environment", "remove", "delete"].includes(input.operation)) return false;
  if (!nonEmptyString(input.identity_environment_ref)) return false;
  if (input.operation === "edit") {
    return onlyKeys(input, ["operation", "idempotency_key", "identity_environment_ref", "configuration"]) &&
      isIdentityEnvironmentConfiguration(input.configuration);
  }
  if (input.operation.startsWith("copy_")) {
    return onlyKeys(input, ["operation", "idempotency_key", "identity_environment_ref"]);
  }
  if (input.operation === "remove") {
    return onlyKeys(input, ["operation", "idempotency_key", "identity_environment_ref"]);
  }
  return onlyKeys(input, ["operation", "idempotency_key", "identity_environment_ref", "confirmation"]) &&
    input.confirmation === "delete_local_data";
}

export function isIdentityEnvironmentConfiguration(value: unknown): value is IdentityEnvironmentConfigurationUpdate {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  const keys = ["provider_id", "proxy_ref", "proxy_label", "geoip_mode", "region", "language", "timezone", "viewport", "hardware_concurrency", "device_memory_gb", "gpu_profile", "interaction_preset", "fingerprint_strategy"];
  if (!keys.some((key) => Object.hasOwn(input, key)) || !Object.keys(input).every((key) => keys.includes(key))) return false;
  for (const key of ["region", "language", "timezone", "viewport", "gpu_profile"]) {
    if (!optionalString(input[key])) return false;
  }
  return optionalNullableString(input.proxy_ref) && optionalNullableString(input.proxy_label) &&
    optionalNumber(input.hardware_concurrency) && optionalNumber(input.device_memory_gb) &&
    optionalEnum(input.provider_id, ["cloakbrowser", "chrome_official"]) &&
    optionalEnum(input.geoip_mode, ["proxy", "system", "disabled"]) &&
    optionalEnum(input.interaction_preset, ["default", "humanized"]) &&
    optionalEnum(input.fingerprint_strategy, ["provider_default", "stable"]);
}

export function legacyIdentityEnvironmentCreateMutation(
  value: unknown,
  request: IncomingMessage
): IdentityEnvironmentMutationRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (isIdentityEnvironmentMutationRequest(value)) {
    return value.operation === "create" || value.operation === "import" ? value : null;
  }
  const input = value as ManagedLocalIdentityEnvironmentInput & { operation?: "create" | "import" };
  const idempotencyKey = legacyIdempotencyKey(request);
  if (!idempotencyKey || !isIdentityEnvironmentInput(input)) return null;
  const operation = input.operation ?? "create";
  if (operation !== "create" && operation !== "import") return null;
  const {
    operation: _operation,
    identity_environment_ref: _identityRef,
    execution_identity_ref: _executionRef,
    profile_ref: _profileRef,
    cookie_jar_ref: _cookieRef,
    browser_storage_ref: _browserStorageRef,
    credential_ref: _credentialRef,
    keychain_ref: _keychainRef,
    local_secret_ref: _localSecretRef,
    profile_storage_ref,
    ...businessInput
  } = input;
  if (operation === "import") {
    return nonEmptyString(profile_storage_ref)
      ? { operation, idempotency_key: idempotencyKey, identity_environment: { ...businessInput, import_source_ref: profile_storage_ref } }
      : null;
  }
  return { operation, idempotency_key: idempotencyKey, identity_environment: businessInput };
}

export function legacyIdentityEnvironmentDeleteMutation(
  identityEnvironmentRef: string,
  value: unknown,
  request: IncomingMessage
): IdentityEnvironmentMutationRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const idempotencyKey = legacyIdempotencyKey(request);
  if (!idempotencyKey) return null;
  if (input.operation === "remove" && Object.keys(input).length === 1) {
    return { operation: "remove", idempotency_key: idempotencyKey, identity_environment_ref: identityEnvironmentRef };
  }
  if (input.operation === "delete" && input.confirmation === "delete_local_data" && Object.keys(input).every((key) => key === "operation" || key === "confirmation")) {
    return { operation: "delete", idempotency_key: idempotencyKey, identity_environment_ref: identityEnvironmentRef, confirmation: "delete_local_data" };
  }
  return null;
}

export function legacyIdentityEnvironmentIdempotencyKey(request: IncomingMessage): string | null {
  return legacyIdempotencyKey(request);
}

function isIdentityEnvironmentInput(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  if (!input.site || typeof input.site !== "object" || Array.isArray(input.site)) return false;
  const site = input.site as Record<string, unknown>;
  if (!nonEmptyString(site.site_id) || !isHttpOrigin(site.origin) ||
    !optionalString(site.display_name) || !optionalString(site.account_identifier) || !optionalRef(site.account_ref)) return false;
  for (const key of [
    "login_state_reason", "profile_storage_ref", "import_source_ref", "proxy_ref", "proxy_label", "region", "language", "timezone",
    "browser_family", "user_agent_summary", "viewport", "gpu_profile", "fingerprint_summary", "credential_ref",
    "keychain_ref", "local_secret_ref", "imported_from", "cookie_jar_ref", "browser_storage_ref"
  ]) {
    if (!optionalString(input[key])) return false;
  }
  return optionalRef(input.identity_environment_ref) && optionalRef(input.execution_identity_ref) && optionalRef(input.profile_ref) &&
    optionalNumber(input.hardware_concurrency) && optionalNumber(input.device_memory_gb) &&
    optionalEnum(input.login_state, ["logged_in", "logged_out", "expired", "unknown", "manual_auth_required"]) &&
    optionalEnum(input.storage_state, ["present", "missing", "cleared", "unknown"]) &&
    optionalEnum(input.geoip_mode, ["proxy", "system", "disabled"]) &&
    optionalEnum(input.interaction_preset, ["default", "humanized"]) &&
    optionalEnum(input.fingerprint_strategy, ["provider_default", "stable"]) &&
    optionalEnum(input.login_method, ["manual", "qr", "sso", "password_manager", "unknown"]) &&
    optionalEnum(input.manual_authentication_state, ["not_required", "required", "in_progress", "completed", "failed"]) &&
    optionalEnum(input.requested_provider_id, ["cloakbrowser", "chrome_official"]) &&
    optionalStringArray(input.human_verification, ["manual_login", "qr_scan", "two_factor", "captcha", "login_expired"]);
}

function isIdentityEnvironmentMutationInput(value: unknown, operation: "create" | "import"): boolean {
  if (!isIdentityEnvironmentInput(value)) return false;
  const input = value as Record<string, unknown>;
  const harborOwned = [
    "identity_environment_ref",
    "execution_identity_ref",
    "profile_ref",
    "cookie_jar_ref",
    "browser_storage_ref",
    "credential_ref",
    "keychain_ref",
    "local_secret_ref",
    "imported_from"
  ];
  if (harborOwned.some((key) => Object.hasOwn(input, key))) return false;
  if (operation === "create") {
    return !Object.hasOwn(input, "profile_storage_ref") && !Object.hasOwn(input, "import_source_ref");
  }
  return !Object.hasOwn(input, "profile_storage_ref") && nonEmptyString(input.import_source_ref);
}

function legacyIdempotencyKey(request: IncomingMessage): string | null {
  const values = headerValues(request, "idempotency-key");
  return values.length === 1 && nonEmptyString(values[0]) && values[0].length <= 200 ? values[0] : null;
}

function headerValues(request: IncomingMessage, name: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < request.rawHeaders.length; index += 2) {
    if (request.rawHeaders[index].toLowerCase() === name) values.push(request.rawHeaders[index + 1]);
  }
  return values;
}

function isHttpOrigin(value: unknown): value is string {
  if (!nonEmptyString(value)) return false;
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.origin === value;
  } catch {
    return false;
  }
}

function nonEmptyString(value: unknown): value is string { return typeof value === "string" && Boolean(value.trim()); }
function optionalString(value: unknown): boolean { return value === undefined || typeof value === "string"; }
function optionalNullableString(value: unknown): boolean { return value === undefined || value === null || typeof value === "string"; }
function optionalRef(value: unknown): boolean { return value === undefined || nonEmptyString(value); }
function optionalNumber(value: unknown): boolean { return value === undefined || typeof value === "number" && Number.isFinite(value); }
function optionalEnum(value: unknown, allowed: string[]): boolean { return value === undefined || typeof value === "string" && allowed.includes(value); }
function optionalStringArray(value: unknown, allowed: string[]): boolean {
  return value === undefined || Array.isArray(value) && value.every((item) => typeof item === "string" && allowed.includes(item));
}
function onlyKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function writeJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(body));
}
