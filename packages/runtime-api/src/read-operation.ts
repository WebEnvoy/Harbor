import { opaqueRef } from "./refs.js";
import type { AllowlistedReadOperationId, AllowlistedReadOperationSite } from "./runtime-session-types.js";

export const HARBOR_ALLOWLISTED_READ_OPERATION_SCHEMA = "harbor-allowlisted-read-operation/v0";

export const LODE_262_ALLOWLIST_PIN = {
  repository: "WebEnvoy/Lode",
  commit: "e36a4a7",
  asset_path: "registry/runtime-consumption-allowlist.json",
  asset_sha256: "5aa6be8bd416bbd19f73dcfab995f62f769849923f2aa2e995da974b0f329184",
  allowlist_id: "lode.xhs-boss.read.runtime-consumption",
  allowlist_version: "0.1.0",
  asset_owner: "Lode",
  consumer: {
    repository: "WebEnvoy/Harbor",
    issue: "#245",
    purpose: "allowlisted one-shot read-only operation admission"
  }
} as const;

export type ReadOperationFailureClass =
  | "invalid_request"
  | "operation_not_allowlisted"
  | "allowlist_pin_invalid"
  | "target_url_invalid"
  | "target_origin_not_allowed"
  | "session_missing"
  | "session_unmanaged"
  | "session_not_ready"
  | "session_user_controlled"
  | "not_logged_in"
  | "safety_challenge"
  | "fixture_runtime"
  | "provider_probe_unavailable"
  | "origin_drift"
  | "page_not_ready"
  | "network_resource_unavailable"
  | "source_refs_missing"
  | "evidence_refs_missing"
  | "post_check_missing";

export interface AllowlistedReadOperationRequest {
  site_id: AllowlistedReadOperationSite;
  operation_id: AllowlistedReadOperationId;
  query?: string;
  url?: string;
}

export interface PinnedReadOperation {
  site_id: AllowlistedReadOperationSite;
  operation_id: AllowlistedReadOperationId;
  package_ref: string;
  lock_ref: string;
  version: "0.1.0";
  operation_mode: "read";
  lifecycle: "proposed";
  allowed_origin: string;
  resource_requirement_id: string;
  required_harbor_fact_keys: readonly string[];
  failure_mapping_id: string;
  required_failure_classes: readonly string[];
  required_source_ref_kinds: readonly string[];
  required_evidence_ref_kinds: readonly string[];
  post_check_id: string;
  required_post_check_fields: readonly ["status", "reason", "source_refs", "evidence_refs"];
}

export interface AdmittedReadOperation {
  status: "admitted";
  request: AllowlistedReadOperationRequest;
  entry: PinnedReadOperation;
  target_url: string;
}

export interface ReadOperationUnavailable {
  schema_version: typeof HARBOR_ALLOWLISTED_READ_OPERATION_SCHEMA;
  status: "unavailable";
  failure_class: ReadOperationFailureClass;
  runtime_session_ref: string;
  site_id?: string;
  operation_id?: string;
  retryable: boolean;
  public_boundary: ReadOperationPublicBoundary;
}

export interface CompletedReadOperation {
  schema_version: typeof HARBOR_ALLOWLISTED_READ_OPERATION_SCHEMA;
  status: "completed";
  operation_ref: string;
  runtime_session_ref: string;
  site_id: AllowlistedReadOperationSite;
  operation_id: AllowlistedReadOperationId;
  operation_mode: "read";
  observed_at: string;
  source_refs: ReadOperationRef[];
  evidence_refs: string[];
  evidence_ref_kinds: ReadOperationRef[];
  post_check: {
    post_check_ref: string;
    status: "passed";
    reason: "managed_provider_read_probe_completed";
  };
  lode_pin: typeof LODE_262_ALLOWLIST_PIN;
  public_boundary: ReadOperationPublicBoundary;
}

export interface ReadOperationRef {
  kind: string;
  ref: string;
}

export interface ReadOperationObservationRecord {
  schema_version: "harbor-read-operation-observation/v0";
  record_type: "source_observation" | "operation_evidence" | "post_check";
  ref: string;
  operation_ref: string;
  runtime_session_ref: string;
  site_id: AllowlistedReadOperationSite;
  operation_id: AllowlistedReadOperationId;
  origin: string;
  observed_at: string;
  source_kind?: string;
  evidence_kind?: string;
  post_check?: {
    status: "passed";
    reason: "managed_provider_read_probe_completed";
    required_fields: readonly ["status", "reason", "source_refs", "evidence_refs"];
    source_refs: ReadOperationRef[];
    evidence_refs: string[];
  };
  public_boundary: ReadOperationPublicBoundary;
}

export interface OperationProbeEvidence {
  operation_ref: string;
  runtime_session_ref: string;
  site_id: AllowlistedReadOperationSite;
  operation_id: AllowlistedReadOperationId;
  origin: string;
  observed_at: string;
  source_refs: ReadOperationRef[];
  evidence_refs: string[];
  evidence_ref_kinds: ReadOperationRef[];
  post_check_ref: string;
}

export interface ReadOperationPublicBoundary {
  output: "public_summary_and_refs_only";
  raw_credentials: "not_exposed";
  raw_profile_storage: "not_exposed";
  raw_cdp_endpoint: "not_exposed";
  raw_dom: "not_exposed";
  raw_har: "not_exposed";
  raw_network_bodies: "not_exposed";
  screenshot_body: "not_exposed";
  external_write_actions: "not_performed";
}

const PUBLIC_BOUNDARY: ReadOperationPublicBoundary = {
  output: "public_summary_and_refs_only",
  raw_credentials: "not_exposed",
  raw_profile_storage: "not_exposed",
  raw_cdp_endpoint: "not_exposed",
  raw_dom: "not_exposed",
  raw_har: "not_exposed",
  raw_network_bodies: "not_exposed",
  screenshot_body: "not_exposed",
  external_write_actions: "not_performed"
};

// This is a packaged, subset mirror of Lode #262. Its pin records the immutable
// Lode asset identity; it intentionally has no registry fetch or runtime execution.
const PINNED_READ_OPERATIONS: readonly PinnedReadOperation[] = [
  {
    site_id: "xiaohongshu",
    operation_id: "xhs_search_notes",
    package_ref: "lode://site-capability/xiaohongshu/search-notes@0.1.0",
    lock_ref: "lode://lock/site-capability/xiaohongshu/search-notes@0.1.0",
    version: "0.1.0",
    operation_mode: "read",
    lifecycle: "proposed",
    allowed_origin: "https://www.xiaohongshu.com",
    resource_requirement_id: "xiaohongshu.search-notes.resources",
    required_harbor_fact_keys: [
      "runtime.execution_surface.available",
      "runtime.origin.www_xiaohongshu_com.available",
      "identity.user_logged_in.confirmed",
      "page.vue_app.ready",
      "page.pinia_store.ready",
      "source.refs.available",
      "evidence.snapshot_ref.available",
      "safety.challenge.absent"
    ],
    failure_mapping_id: "xiaohongshu.search-notes.failure-mapping",
    required_failure_classes: [
      "invalid_contract",
      "resource_unavailable",
      "site_changed",
      "empty_result",
      "not_logged_in",
      "login_expired",
      "page_not_ready",
      "signed_ref_missing",
      "safety_challenge",
      "field_missing",
      "network_resource_unavailable"
    ],
    required_source_ref_kinds: ["pinia_store_summary", "network_summary", "dom_snapshot_summary"],
    required_evidence_ref_kinds: ["snapshot_ref", "post_check_ref"],
    post_check_id: "xiaohongshu.search-notes.post-check",
    required_post_check_fields: ["status", "reason", "source_refs", "evidence_refs"]
  },
  {
    site_id: "boss",
    operation_id: "boss_job_search",
    package_ref: "lode://site-capability/boss/job-search@0.1.0",
    lock_ref: "lode://lock/site-capability/boss/job-search@0.1.0",
    version: "0.1.0",
    operation_mode: "read",
    lifecycle: "proposed",
    allowed_origin: "https://www.zhipin.com",
    resource_requirement_id: "boss.job-search.resources",
    required_harbor_fact_keys: [
      "runtime.execution_surface.available",
      "runtime.origin.www_zhipin_com.available",
      "identity.boss_geek_logged_in.confirmed",
      "page.boss_spa.ready",
      "network.wapi_zpgeek.available",
      "source.refs.available",
      "evidence.snapshot_ref.available",
      "safety.challenge.absent"
    ],
    failure_mapping_id: "boss.job-search.failure-mapping",
    required_failure_classes: [
      "invalid_contract",
      "resource_unavailable",
      "site_changed",
      "empty_result",
      "not_logged_in",
      "identity_insufficient",
      "captcha_required",
      "page_not_ready",
      "input_missing_security_id",
      "query_missing",
      "city_unresolved",
      "pagination_limited",
      "job_expired",
      "permission_denied",
      "field_missing",
      "network_resource_unavailable"
    ],
    required_source_ref_kinds: ["network_summary"],
    required_evidence_ref_kinds: ["snapshot_ref", "network_summary_ref", "post_check_ref"],
    post_check_id: "boss.job-search.post-check",
    required_post_check_fields: ["status", "reason", "source_refs", "evidence_refs"]
  }
];

export function admitAllowlistedReadOperation(input: unknown): AdmittedReadOperation | ReadOperationFailureClass {
  const pinFailure = validatePinnedAllowlist();
  if (pinFailure) return pinFailure;
  const request = parseRequest(input);
  if (typeof request === "string") return request;
  const entry = PINNED_READ_OPERATIONS.find((candidate) => candidate.site_id === request.site_id && candidate.operation_id === request.operation_id);
  if (!entry) return "operation_not_allowlisted";
  if (entry.operation_mode !== "read" || entry.lifecycle !== "proposed") return "allowlist_pin_invalid";
  const target = resolveTargetUrl(request, entry);
  if (typeof target === "string") return target;
  return { status: "admitted", request, entry, target_url: target.target_url };
}

export function readOperationUnavailable(
  runtime_session_ref: string,
  failure_class: ReadOperationFailureClass,
  options: { site_id?: string; operation_id?: string; retryable?: boolean } = {}
): ReadOperationUnavailable {
  return {
    schema_version: HARBOR_ALLOWLISTED_READ_OPERATION_SCHEMA,
    status: "unavailable",
    failure_class,
    runtime_session_ref,
    site_id: options.site_id,
    operation_id: options.operation_id,
    retryable: options.retryable ?? retryableFailure(failure_class),
    public_boundary: PUBLIC_BOUNDARY
  };
}

function completeReadOperation(
  entry: PinnedReadOperation,
  proof: OperationProbeEvidence
): CompletedReadOperation | ReadOperationFailureClass {
  if (!proof.post_check_ref) return "post_check_missing";
  if (proof.evidence_refs.length === 0 || proof.evidence_refs.some((ref) => !ref)) return "evidence_refs_missing";
  if (!entry.required_source_ref_kinds.every((kind) => proof.source_refs.some((ref) => ref.kind === kind && ref.ref))) return "source_refs_missing";
  if (!entry.required_evidence_ref_kinds.every((kind) => proof.evidence_ref_kinds.some((ref) => ref.kind === kind && ref.ref))) return "evidence_refs_missing";
  return {
    schema_version: HARBOR_ALLOWLISTED_READ_OPERATION_SCHEMA,
    status: "completed",
    operation_ref: proof.operation_ref,
    runtime_session_ref: proof.runtime_session_ref,
    site_id: proof.site_id,
    operation_id: proof.operation_id,
    operation_mode: "read",
    observed_at: proof.observed_at,
    source_refs: proof.source_refs,
    evidence_refs: proof.evidence_refs,
    evidence_ref_kinds: proof.evidence_ref_kinds,
    post_check: {
      post_check_ref: proof.post_check_ref,
      status: "passed",
      reason: "managed_provider_read_probe_completed"
    },
    lode_pin: LODE_262_ALLOWLIST_PIN,
    public_boundary: PUBLIC_BOUNDARY
  };
}

export class ReadOperationObservationStore {
  private readonly records = new Map<string, ReadOperationObservationRecord>();

  capture(input: {
    operation_ref: string;
    runtime_session_ref: string;
    entry: PinnedReadOperation;
    observed_origin: string;
    observed_at: string;
    checked_signal_kinds: readonly string[];
    snapshot_ref?: string;
    evidence_refs: readonly string[];
  }): OperationProbeEvidence | ReadOperationFailureClass {
    if (input.observed_origin !== input.entry.allowed_origin) return "origin_drift";
    if (!input.snapshot_ref || input.evidence_refs.length === 0 || input.evidence_refs.some((ref) => !ref)) return "evidence_refs_missing";
    const checked = new Set(input.checked_signal_kinds);
    if (!input.entry.required_source_ref_kinds.every((kind) => checked.has(kind))) return "source_refs_missing";
    if (checked.size !== input.checked_signal_kinds.length || [...checked].some((kind) => !input.entry.required_source_ref_kinds.includes(kind))) return "source_refs_missing";

    const source_refs = input.entry.required_source_ref_kinds.map((kind) => {
      const ref = opaqueRef("source");
      this.records.set(ref, observationRecord(input, "source_observation", ref, { source_kind: kind }));
      return { kind, ref };
    });
    const evidence_refs = [...input.evidence_refs];
    const evidence_ref_kinds: ReadOperationRef[] = [{ kind: "snapshot_ref", ref: input.snapshot_ref }];
    if (input.entry.required_evidence_ref_kinds.includes("network_summary_ref")) {
      const source = source_refs.find((ref) => ref.kind === "network_summary");
      if (!source) return "source_refs_missing";
      const ref = opaqueRef("evidence");
      this.records.set(ref, observationRecord(input, "operation_evidence", ref, {
        evidence_kind: "network_summary_ref",
        source_kind: source.kind
      }));
      evidence_refs.push(ref);
      evidence_ref_kinds.push({ kind: "network_summary_ref", ref });
    }
    const post_check_ref = opaqueRef("post_check");
    const postCheck = observationRecord(input, "post_check", post_check_ref, {
      post_check: {
        status: "passed",
        reason: "managed_provider_read_probe_completed",
        required_fields: input.entry.required_post_check_fields,
        source_refs,
        evidence_refs
      }
    });
    this.records.set(post_check_ref, postCheck);
    evidence_ref_kinds.push({ kind: "post_check_ref", ref: post_check_ref });
    if (!input.entry.required_evidence_ref_kinds.every((kind) => evidence_ref_kinds.some((ref) => ref.kind === kind))) return "evidence_refs_missing";
    return {
      operation_ref: input.operation_ref,
      runtime_session_ref: input.runtime_session_ref,
      site_id: input.entry.site_id,
      operation_id: input.entry.operation_id,
      origin: input.observed_origin,
      observed_at: input.observed_at,
      source_refs,
      evidence_refs,
      evidence_ref_kinds,
      post_check_ref
    };
  }

  get(ref: string): ReadOperationObservationRecord | null {
    const record = this.records.get(ref);
    return record ? structuredClone(record) : null;
  }

  complete(entry: PinnedReadOperation, proof: OperationProbeEvidence): CompletedReadOperation | ReadOperationFailureClass {
    if (
      proof.site_id !== entry.site_id ||
      proof.operation_id !== entry.operation_id ||
      proof.origin !== entry.allowed_origin
    ) return "source_refs_missing";
    const postCheck = this.records.get(proof.post_check_ref);
    if (
      !postCheck ||
      postCheck.record_type !== "post_check" ||
      !postCheck.post_check ||
      !sameBinding(postCheck, proof) ||
      !sameRefs(postCheck.post_check.source_refs, proof.source_refs) ||
      !sameStrings(postCheck.post_check.evidence_refs, proof.evidence_refs)
    ) return "post_check_missing";
    for (const source of proof.source_refs) {
      const record = this.records.get(source.ref);
      if (!record || record.record_type !== "source_observation" || record.source_kind !== source.kind || !sameBinding(record, proof)) {
        return "source_refs_missing";
      }
    }
    for (const evidence of proof.evidence_ref_kinds.filter((ref) => ref.kind !== "snapshot_ref")) {
      const record = this.records.get(evidence.ref);
      if (evidence.kind === "post_check_ref") {
        if (evidence.ref !== proof.post_check_ref) return "post_check_missing";
      } else if (!record || record.record_type !== "operation_evidence" || record.evidence_kind !== evidence.kind || !sameBinding(record, proof)) {
        return "evidence_refs_missing";
      }
    }
    return completeReadOperation(entry, proof);
  }
}

function sameBinding(record: ReadOperationObservationRecord, proof: OperationProbeEvidence): boolean {
  return record.operation_ref === proof.operation_ref &&
    record.runtime_session_ref === proof.runtime_session_ref &&
    record.site_id === proof.site_id &&
    record.operation_id === proof.operation_id &&
    record.origin === proof.origin &&
    record.observed_at === proof.observed_at;
}

function sameRefs(left: readonly ReadOperationRef[], right: readonly ReadOperationRef[]): boolean {
  return left.length === right.length && left.every((entry, index) => entry.kind === right[index]?.kind && entry.ref === right[index]?.ref);
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((entry, index) => entry === right[index]);
}

function observationRecord(
  input: {
    operation_ref: string;
    runtime_session_ref: string;
    entry: PinnedReadOperation;
    observed_origin: string;
    observed_at: string;
  },
  record_type: ReadOperationObservationRecord["record_type"],
  ref: string,
  detail: Pick<ReadOperationObservationRecord, "source_kind" | "evidence_kind" | "post_check">
): ReadOperationObservationRecord {
  return {
    schema_version: "harbor-read-operation-observation/v0",
    record_type,
    ref,
    operation_ref: input.operation_ref,
    runtime_session_ref: input.runtime_session_ref,
    site_id: input.entry.site_id,
    operation_id: input.entry.operation_id,
    origin: input.observed_origin,
    observed_at: input.observed_at,
    ...detail,
    public_boundary: PUBLIC_BOUNDARY
  };
}

function parseRequest(input: unknown): AllowlistedReadOperationRequest | ReadOperationFailureClass {
  if (!isRecord(input)) return "invalid_request";
  const allowedKeys = new Set(["site_id", "operation_id", "query", "url"]);
  if (Object.keys(input).some((key) => !allowedKeys.has(key))) return "invalid_request";
  if (!isSiteId(input.site_id) || !isOperationId(input.operation_id)) return "invalid_request";
  if (input.query !== undefined && (!isPublicText(input.query) || input.query.length > 256)) return "invalid_request";
  if (input.url !== undefined && (!isPublicText(input.url) || input.url.length > 2048)) return "invalid_request";
  return {
    site_id: input.site_id,
    operation_id: input.operation_id,
    query: input.query,
    url: input.url
  };
}

function resolveTargetUrl(
  request: AllowlistedReadOperationRequest,
  entry: PinnedReadOperation
): { target_url: string } | ReadOperationFailureClass {
  if (request.url) {
    let url: URL;
    try {
      url = new URL(request.url);
    } catch {
      return "target_url_invalid";
    }
    if (url.protocol !== "https:" || url.username || url.password) return "target_url_invalid";
    if (url.origin !== entry.allowed_origin) return "target_origin_not_allowed";
    return { target_url: url.toString() };
  }
  if (entry.site_id === "xiaohongshu") {
    return { target_url: request.query
      ? `${entry.allowed_origin}/search_result?keyword=${encodeURIComponent(request.query)}`
      : `${entry.allowed_origin}/explore` };
  }
  return { target_url: request.query
    ? `${entry.allowed_origin}/web/geek/jobs?query=${encodeURIComponent(request.query)}`
    : `${entry.allowed_origin}/web/geek/jobs` };
}

function validatePinnedAllowlist(): ReadOperationFailureClass | null {
  if (
    LODE_262_ALLOWLIST_PIN.repository !== "WebEnvoy/Lode" ||
    LODE_262_ALLOWLIST_PIN.commit !== "e36a4a7" ||
    LODE_262_ALLOWLIST_PIN.asset_path !== "registry/runtime-consumption-allowlist.json" ||
    LODE_262_ALLOWLIST_PIN.asset_sha256.length !== 64 ||
    PINNED_READ_OPERATIONS.length !== 2
  ) return "allowlist_pin_invalid";
  for (const entry of PINNED_READ_OPERATIONS) {
    if (
      entry.operation_mode !== "read" ||
      entry.lifecycle !== "proposed" ||
      !entry.package_ref ||
      !entry.lock_ref ||
      !entry.resource_requirement_id ||
      !entry.failure_mapping_id ||
      !entry.post_check_id ||
      entry.required_harbor_fact_keys.length === 0 ||
      entry.required_failure_classes.length === 0 ||
      entry.required_source_ref_kinds.length === 0 ||
      entry.required_evidence_ref_kinds.length === 0 ||
      entry.required_post_check_fields.length !== 4 ||
      !isPinnedHttpsOrigin(entry.allowed_origin)
    ) return "allowlist_pin_invalid";
  }
  return null;
}

function retryableFailure(failure: ReadOperationFailureClass): boolean {
  return ![
    "invalid_request",
    "operation_not_allowlisted",
    "allowlist_pin_invalid",
    "target_url_invalid",
    "target_origin_not_allowed",
    "fixture_runtime",
    "origin_drift",
    "safety_challenge"
  ].includes(failure);
}

function isPinnedHttpsOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.pathname === "/" && !url.search && !url.hash && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPublicText(value: unknown): value is string {
  return typeof value === "string" && value.trim() === value && value.length > 0 && !/[\u0000-\u001f\u007f]/.test(value);
}

function isSiteId(value: unknown): value is AllowlistedReadOperationSite {
  return value === "xiaohongshu" || value === "boss";
}

function isOperationId(value: unknown): value is AllowlistedReadOperationId {
  return value === "xhs_search_notes" || value === "boss_job_search";
}
