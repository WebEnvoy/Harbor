import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createIdentityConsistencyFacts, type IdentityConsistencyFacts, type ObservedIdentityEnvironmentFacts } from "./identity-consistency.js";
import {
  assertNoSensitiveMaterialInput,
  createLocalIdentityEnvironmentFacts,
  HARBOR_LOCAL_IDENTITY_ENVIRONMENT_SCHEMA,
  type BrowserStorageState,
  type LocalIdentityEnvironmentFacts,
  type LocalIdentityEnvironmentInput,
  type LoginState,
  type ManualAuthenticationState
} from "./identity-environment.js";

export const HARBOR_LOCAL_IDENTITY_ENVIRONMENT_STORE_SCHEMA = "harbor-local-identity-environment-store/v0";

export type ManagedSiteId = "xiaohongshu" | "boss" | string;
export type LocalIdentityEnvironmentOperation = "created" | "imported" | "updated";
export type LocalIdentityEnvironmentReadiness = "ready" | "needs_auth" | "blocked" | "unknown";

export interface LocalIdentityEnvironmentManagerOptions {
  persistence_path?: string;
  persist_records?: (records: StoredLocalIdentityEnvironmentRecord[]) => void;
}

export interface ManagedLocalIdentityEnvironmentInput extends LocalIdentityEnvironmentInput {
  site: LocalIdentityEnvironmentInput["site"] & { site_id: ManagedSiteId };
  observed_environment?: ObservedIdentityEnvironmentFacts;
  imported_from?: string;
  cookie_jar_ref?: string;
  browser_storage_ref?: string;
}

export interface LocalIdentityEnvironmentStateUpdate {
  login_state?: LoginState;
  login_state_reason?: string;
  storage_state?: BrowserStorageState;
  manual_authentication_state?: ManualAuthenticationState;
  observed_environment?: ObservedIdentityEnvironmentFacts;
  profile_storage_ref?: string;
  cookie_jar_ref?: string;
  browser_storage_ref?: string;
}

export interface StoredLocalIdentityEnvironmentRecord {
  schema_version: typeof HARBOR_LOCAL_IDENTITY_ENVIRONMENT_STORE_SCHEMA;
  operation: LocalIdentityEnvironmentOperation;
  created_at: string;
  updated_at: string;
  identity_environment: LocalIdentityEnvironmentFacts;
  consistency: IdentityConsistencyFacts;
  local_material_refs: {
    profile_storage_ref: string;
    cookie_jar_ref: string | null;
    browser_storage_ref: string | null;
    credential_ref: string | null;
    keychain_ref: string | null;
    local_secret_ref: string | null;
  };
  imported_from: string | null;
  user_confirmed_session_ref: string | null;
}

export interface LocalIdentityEnvironmentPublicRecord {
  schema_version: typeof HARBOR_LOCAL_IDENTITY_ENVIRONMENT_STORE_SCHEMA;
  identity_environment_ref: string;
  created_at: string;
  updated_at: string;
  operation: LocalIdentityEnvironmentOperation;
  site: {
    site_id: string;
    origin: string;
    display_name: string;
    account_ref: string | null;
  };
  status: {
    readiness: LocalIdentityEnvironmentReadiness;
    login_state: LoginState;
    authentication_provenance: "unknown" | "user_confirmed_managed_session";
    browser_storage_state: BrowserStorageState;
    manual_authentication_state: ManualAuthenticationState;
    recovery_required: boolean;
    blocking_reasons: string[];
  };
  refs: {
    execution_identity_ref: string;
    profile_ref: string;
    profile_storage_ref: string;
    cookie_jar_ref: string | null;
    browser_storage_ref: string | null;
    credential_ref: string | null;
    keychain_ref: string | null;
    local_secret_ref: string | null;
    proxy_ref: string | null;
  };
  environment_summary: {
    provider_id: string | null;
    proxy_state: "configured" | "missing" | "unknown";
    region: string | null;
    language: string | null;
    timezone: string | null;
    browser_family: string;
    fingerprint_summary: string;
  };
  public_boundary: {
    output: "status_and_redacted_refs_only";
    raw_material: "not_exposed";
    not_exposed: readonly ["password", "verification_code", "cookie_value", "storage_value", "session_token", "raw_profile_data"];
  };
  risk_boundary: LocalIdentityEnvironmentFacts["risk_boundary"];
}

export class LocalIdentityEnvironmentManager {
  private readonly records = new Map<string, StoredLocalIdentityEnvironmentRecord>();

  constructor(private readonly options: LocalIdentityEnvironmentManagerOptions = {}) {
    this.load();
  }

  create(input: ManagedLocalIdentityEnvironmentInput): LocalIdentityEnvironmentPublicRecord {
    return this.upsert(input, "created");
  }

  importIdentityEnvironment(input: ManagedLocalIdentityEnvironmentInput): LocalIdentityEnvironmentPublicRecord {
    return this.upsert(input, "imported");
  }

  update(identity_environment_ref: string, input: LocalIdentityEnvironmentStateUpdate): LocalIdentityEnvironmentPublicRecord | null {
    assertNoSensitiveMaterialInput(input);
    if (input.login_state_reason === USER_CONFIRMED_MANAGED_SESSION_REASON) {
      throw new Error("Reserved authentication provenance can only be set by a managed session confirmation.");
    }
    return this.updateRecord(identity_environment_ref, input);
  }

  completeManualAuthentication(identity_environment_ref: string, runtime_session_ref: string): LocalIdentityEnvironmentPublicRecord | null {
    return this.updateRecord(identity_environment_ref, {
      login_state: "logged_in",
      manual_authentication_state: "completed",
      login_state_reason: USER_CONFIRMED_MANAGED_SESSION_REASON
    }, runtime_session_ref);
  }

  private updateRecord(
    identity_environment_ref: string,
    input: LocalIdentityEnvironmentStateUpdate,
    user_confirmed_session_ref: string | null = null
  ): LocalIdentityEnvironmentPublicRecord | null {
    assertNoSensitiveMaterialInput(input);
    const current = this.records.get(identity_environment_ref);
    if (!current) return null;
    const facts = snapshot(current.identity_environment);
    const loginState = input.login_state ?? facts.login_state.state;
    const storageState = input.storage_state ?? facts.browser_storage.state;
    facts.login_state = {
      ...facts.login_state,
      state: loginState,
      reason: input.login_state_reason ?? facts.login_state.reason,
      recovery_required: loginState === "logged_out" || loginState === "expired" || loginState === "unknown" || loginState === "manual_auth_required",
      manual_authentication_state: input.manual_authentication_state ?? facts.login_state.manual_authentication_state
    };
    facts.browser_storage = {
      ...facts.browser_storage,
      profile_storage_ref: redactedRequiredRef("profile_storage", input.profile_storage_ref ?? current.local_material_refs.profile_storage_ref),
      state: storageState,
      cookies_session_state: storageState,
      local_storage_state: storageState,
      indexeddb_state: storageState
    };
    const record: StoredLocalIdentityEnvironmentRecord = {
      ...current,
      operation: "updated",
      updated_at: new Date().toISOString(),
      identity_environment: facts,
      consistency: createIdentityConsistencyFacts({
        identity_environment: facts,
        observed_environment: input.observed_environment,
        risk_events: facts.login_state.recovery_required ? ["login_missing"] : []
      }),
      local_material_refs: {
        ...current.local_material_refs,
        profile_storage_ref: input.profile_storage_ref ?? current.local_material_refs.profile_storage_ref,
        cookie_jar_ref: input.cookie_jar_ref ?? current.local_material_refs.cookie_jar_ref,
        browser_storage_ref: input.browser_storage_ref ?? current.local_material_refs.browser_storage_ref
      },
      user_confirmed_session_ref
    };
    const nextRecords = new Map(this.records);
    nextRecords.set(identity_environment_ref, record);
    this.persist(nextRecords);
    this.records.set(identity_environment_ref, record);
    return publicRecord(record);
  }

  get(identity_environment_ref: string): LocalIdentityEnvironmentPublicRecord | null {
    const record = this.records.get(identity_environment_ref);
    return record ? publicRecord(record) : null;
  }

  list(): LocalIdentityEnvironmentPublicRecord[] {
    return Array.from(this.records.values()).map(publicRecord);
  }

  getFacts(identity_environment_ref: string): LocalIdentityEnvironmentFacts | null {
    const record = this.records.get(identity_environment_ref);
    return record ? internalSessionFacts(record) : null;
  }

  hasUserConfirmedManagedSession(identity_environment_ref: string, runtime_session_ref: string): boolean {
    const record = this.records.get(identity_environment_ref);
    const login = record?.identity_environment.login_state;
    return record?.user_confirmed_session_ref === runtime_session_ref &&
      login?.state === "logged_in" &&
      login.reason === USER_CONFIRMED_MANAGED_SESSION_REASON &&
      login.manual_authentication_state === "completed" &&
      !login.recovery_required;
  }

  delete(identity_environment_ref: string): LocalIdentityEnvironmentPublicRecord | null {
    const record = this.records.get(identity_environment_ref);
    if (!record) return null;
    this.records.delete(identity_environment_ref);
    this.persist();
    return publicRecord(record);
  }

  private upsert(input: ManagedLocalIdentityEnvironmentInput, operation: LocalIdentityEnvironmentOperation, created_at = new Date().toISOString()): LocalIdentityEnvironmentPublicRecord {
    assertNoSensitiveMaterialInput(input);
    const facts = createLocalIdentityEnvironmentFacts(input);
    const consistency = createIdentityConsistencyFacts({
      identity_environment: facts,
      observed_environment: input.observed_environment,
      risk_events: facts.login_state.recovery_required ? ["login_missing"] : []
    });
    const now = new Date().toISOString();
    const record: StoredLocalIdentityEnvironmentRecord = {
      schema_version: HARBOR_LOCAL_IDENTITY_ENVIRONMENT_STORE_SCHEMA,
      operation,
      created_at,
      updated_at: now,
      identity_environment: facts,
      consistency,
      local_material_refs: {
        profile_storage_ref: input.profile_storage_ref ?? `${facts.profile_ref}:storage`,
        cookie_jar_ref: input.cookie_jar_ref ?? null,
        browser_storage_ref: input.browser_storage_ref ?? null,
        credential_ref: facts.credential_recovery.credential_ref,
        keychain_ref: facts.credential_recovery.keychain_ref,
        local_secret_ref: facts.credential_recovery.local_secret_ref
      },
      imported_from: input.imported_from ?? null,
      user_confirmed_session_ref: null
    };
    this.records.set(facts.identity_environment_ref, record);
    this.persist();
    return publicRecord(record);
  }

  private load(): void {
    const path = this.options.persistence_path;
    if (!path || !existsSync(path)) return;
    const parsed = JSON.parse(readFileSync(path, "utf8")) as { records?: StoredLocalIdentityEnvironmentRecord[] };
    for (const record of parsed.records ?? []) {
      if (record.schema_version === HARBOR_LOCAL_IDENTITY_ENVIRONMENT_STORE_SCHEMA && record.identity_environment.schema_version === HARBOR_LOCAL_IDENTITY_ENVIRONMENT_SCHEMA) {
        this.records.set(record.identity_environment.identity_environment_ref, {
          ...record,
          user_confirmed_session_ref: record.user_confirmed_session_ref ?? null
        });
      }
    }
  }

  private persist(records = this.records): void {
    if (this.options.persist_records) {
      this.options.persist_records(Array.from(records.values()));
      return;
    }
    const path = this.options.persistence_path;
    if (!path) return;
    mkdirSync(dirname(path), { recursive: true });
    const tmpPath = `${path}.tmp`;
    writeFileSync(tmpPath, JSON.stringify({ schema_version: HARBOR_LOCAL_IDENTITY_ENVIRONMENT_STORE_SCHEMA, records: Array.from(records.values()) }, null, 2));
    renameSync(tmpPath, path);
  }
}

function internalSessionFacts(record: StoredLocalIdentityEnvironmentRecord): LocalIdentityEnvironmentFacts {
  const facts = snapshot(record.identity_environment);
  facts.browser_storage = {
    ...facts.browser_storage,
    profile_storage_ref: record.local_material_refs.profile_storage_ref
  };
  return facts;
}

function publicRecord(record: StoredLocalIdentityEnvironmentRecord): LocalIdentityEnvironmentPublicRecord {
  const facts = record.identity_environment;
  return {
    schema_version: HARBOR_LOCAL_IDENTITY_ENVIRONMENT_STORE_SCHEMA,
    identity_environment_ref: facts.identity_environment_ref,
    created_at: record.created_at,
    updated_at: record.updated_at,
    operation: record.operation,
    site: {
      site_id: facts.site_binding.site_id,
      origin: facts.site_binding.origin,
      display_name: facts.site_binding.display_name,
      account_ref: facts.site_binding.account_ref
    },
    status: {
      readiness: readiness(facts, record.consistency),
      login_state: facts.login_state.state,
      authentication_provenance: facts.login_state.reason === USER_CONFIRMED_MANAGED_SESSION_REASON ? "user_confirmed_managed_session" : "unknown",
      browser_storage_state: facts.browser_storage.state,
      manual_authentication_state: facts.login_state.manual_authentication_state,
      recovery_required: facts.login_state.recovery_required,
      blocking_reasons: record.consistency.readiness.blocking_reasons
    },
    refs: {
      execution_identity_ref: facts.execution_identity_ref,
      profile_ref: facts.profile_ref,
      profile_storage_ref: redactedRequiredRef("profile_storage", facts.browser_storage.profile_storage_ref),
      cookie_jar_ref: redactedRef("cookie_jar", record.local_material_refs.cookie_jar_ref),
      browser_storage_ref: redactedRef("browser_storage", record.local_material_refs.browser_storage_ref),
      credential_ref: redactedRef("credential", facts.credential_recovery.credential_ref),
      keychain_ref: redactedRef("keychain", facts.credential_recovery.keychain_ref),
      local_secret_ref: redactedRef("local_secret", facts.credential_recovery.local_secret_ref),
      proxy_ref: redactedRef("proxy", facts.environment.proxy.proxy_ref)
    },
    environment_summary: {
      provider_id: facts.provider_binding.selected_provider_id,
      proxy_state: facts.environment.proxy.state,
      region: facts.environment.region,
      language: facts.environment.language,
      timezone: facts.environment.timezone,
      browser_family: facts.environment.browser_family,
      fingerprint_summary: facts.environment.fingerprint_summary
    },
    public_boundary: {
      output: "status_and_redacted_refs_only",
      raw_material: "not_exposed",
      not_exposed: ["password", "verification_code", "cookie_value", "storage_value", "session_token", "raw_profile_data"]
    },
    risk_boundary: facts.risk_boundary
  };
}

const USER_CONFIRMED_MANAGED_SESSION_REASON = "user_confirmed_managed_session";

function readiness(facts: LocalIdentityEnvironmentFacts, consistency: IdentityConsistencyFacts): LocalIdentityEnvironmentReadiness {
  if (facts.login_state.recovery_required) return "needs_auth";
  if (consistency.readiness.state === "blocked") return "blocked";
  // A user-confirmed login resolves the authentication gate, not provider limitations.
  if (facts.login_state.reason === USER_CONFIRMED_MANAGED_SESSION_REASON && facts.login_state.manual_authentication_state === "completed") return "ready";
  return consistency.readiness.state === "ready" ? "ready" : "unknown";
}

function redactedRef(kind: string, value: string | null | undefined): string | null {
  if (!value) return null;
  return `${kind}_ref_${createHash("sha256").update(value).digest("hex").slice(0, 12)}`;
}

function redactedRequiredRef(kind: string, value: string): string {
  return redactedRef(kind, value)!;
}

function snapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
