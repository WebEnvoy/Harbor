import { opaqueRef } from "./refs.js";
import type { LocalProviderWritePrecheckProbeResult } from "./runtime-session-types.js";

export const HARBOR_VALIDATE_ONLY_WRITE_PRECHECK_SCHEMA = "harbor-validate-only-write-precheck/v0";
export const XHS_PUBLISH_PRECHECK_PIN = {
  package_ref: "lode://site-capability/xiaohongshu/publish-note-precheck@0.1.0",
  lock_ref: "lode://lock/site-capability/xiaohongshu/publish-note-precheck@0.1.1",
  version: "0.1.0",
  operation_id: "xhs_publish_note_precheck",
  operation_mode: "validate_only",
  origin: "https://creator.xiaohongshu.com",
  repository: "WebEnvoy/Lode",
  commit: "d18d79cbe280d93b3e855ca906e254bcb9eadf00",
  asset_path: "registry/validate-only-runtime-consumption.json",
  asset_sha256: "f03577c3290fc8c7b52ed8157b0411d66242f18acdf334200968901ee6121dcd"
} as const;

export type WritePrecheckFailureClass = "invalid_contract" | "login_required" | "page_changed" | "target_not_writable" | "safety_challenge" | "evidence_unavailable" | "fixture_runtime" | "provider_probe_unavailable" | "session_missing" | "session_not_ready" | "session_user_controlled";

export interface AdmittedWritePrecheck {
  url: string;
  target_ref: string;
  requested_fields?: readonly ("title" | "summary" | "canonical_url" | "source_status")[];
  include_source_refs?: boolean;
  proposed_input_summary?: string;
}

export type ValidateOnlyWritePrecheckResult =
  | {
      schema_version: typeof HARBOR_VALIDATE_ONLY_WRITE_PRECHECK_SCHEMA;
      status: "completed";
      runtime_session_ref: string;
      identity_ref: string;
      page_ref: string;
      merged_head_ref: string;
      operation_ref: string;
      result_ref: string;
      submitted_result_ref: string;
      observed_at: string;
      submitted: false;
      source_refs: readonly { kind: string; ref: string }[];
      evidence_ref_kinds: readonly { kind: string; ref: string }[];
      target_ref: string;
      classification: "partial_result";
      precheck_scope: "entrypoint_only";
      composition_state: "composition_not_initialized";
      entrypoint_observations: Extract<LocalProviderWritePrecheckProbeResult, { status: "completed" }>["entrypoint_observations"] & { user_confirmed_identity: true; challenge_absent: true };
      field_states: Extract<LocalProviderWritePrecheckProbeResult, { status: "completed" }>["field_states"];
      prohibited_actions_observed: Extract<LocalProviderWritePrecheckProbeResult, { status: "completed" }>["prohibited_actions_observed"];
      no_submit_guard: "active";
      post_check: { status: "passed"; reason: "validated_creator_entrypoint_without_submission"; source_refs: readonly { kind: string; ref: string }[]; evidence_refs: readonly { kind: string; ref: string }[]; post_check_ref: string; submitted: false; no_submit_guard: "active" };
      lode_pin: typeof XHS_PUBLISH_PRECHECK_PIN;
      public_boundary: { raw_dom: "not_exposed"; raw_har: "not_exposed"; screenshot_body: "not_exposed"; credentials: "not_exposed"; external_write_actions: "not_performed" };
    }
  | {
      schema_version: typeof HARBOR_VALIDATE_ONLY_WRITE_PRECHECK_SCHEMA;
      status: "unavailable";
      runtime_session_ref: string;
      failure_class: WritePrecheckFailureClass;
      retryable: boolean;
      submitted: false;
    };

export interface WritePrecheckObservationRecord {
  schema_version: "harbor-write-precheck-observation/v0";
  ref: string;
  evidence_ref: string;
  access_state: "available";
  kind: "source_observation" | "evidence" | "post_check" | "result" | "submitted_result" | "page";
  runtime_session_ref: string;
  identity_ref: string;
  observed_at: string;
  submitted: false;
  public_boundary: { raw_dom: "not_exposed"; screenshot_body: "not_exposed"; credentials: "not_exposed" };
}

export class WritePrecheckObservationStore {
  private readonly records = new Map<string, WritePrecheckObservationRecord>();

  record(result: Extract<ValidateOnlyWritePrecheckResult, { status: "completed" }>): void {
    const refs: (readonly [string, WritePrecheckObservationRecord["kind"]])[] = [
      [result.page_ref, "page"],
      [result.result_ref, "result"],
      [result.submitted_result_ref, "submitted_result"],
      [result.post_check.post_check_ref, "post_check"],
      ...result.source_refs.map(({ ref }) => [ref, "source_observation"] as const),
      ...result.evidence_ref_kinds.filter(({ kind }) => kind !== "post_check_ref").map(({ ref }) => [ref, "evidence"] as const)
    ];
    for (const [ref, kind] of refs) {
      this.records.set(ref, {
        schema_version: "harbor-write-precheck-observation/v0", ref, evidence_ref: ref, access_state: "available", kind,
        runtime_session_ref: result.runtime_session_ref, identity_ref: result.identity_ref,
        observed_at: result.observed_at, submitted: false,
        public_boundary: { raw_dom: "not_exposed", screenshot_body: "not_exposed", credentials: "not_exposed" }
      });
    }
    while (this.records.size > 256) this.records.delete(this.records.keys().next().value!);
  }

  get(ref: string): WritePrecheckObservationRecord | null {
    const record = this.records.get(ref);
    return record ? structuredClone(record) : null;
  }
}

const object = (value: unknown): Record<string, unknown> | undefined => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const bounded = (value: unknown, max: number): value is string => typeof value === "string" && value.length > 0 && value.length <= max && value.trim() === value && !/[\u0000-\u001f\u007f]/.test(value);
const safePublic = (value: unknown, max: number): value is string => bounded(value, max) && !/(cookie|token|xsec|password|credential|profile[_ -]?state|storage[_ -]?state|raw[_ -]?(dom|har)|screenshot[_ -]?body|production[_ -]?payload)/i.test(value);
const requestedFieldSet = new Set(["title", "summary", "canonical_url", "source_status"]);

export function admitXhsPublishPrecheck(value: unknown): AdmittedWritePrecheck | null {
  const input = object(value);
  if (!input || Object.keys(input).some((key) => !["url", "target_ref", "no_submit_guard", "requested_fields", "include_source_refs", "proposed_input_summary"].includes(key))) return null;
  if (!safePublic(input.target_ref, 200) || input.no_submit_guard !== "active") return null;
  const requestedFields = input.requested_fields;
  if (requestedFields !== undefined && (!Array.isArray(requestedFields) || requestedFields.length < 1 || requestedFields.length > 4 || new Set(requestedFields).size !== requestedFields.length || !requestedFields.every((field) => typeof field === "string" && requestedFieldSet.has(field)))) return null;
  if (input.include_source_refs !== undefined && typeof input.include_source_refs !== "boolean") return null;
  if (input.proposed_input_summary !== undefined && !safePublic(input.proposed_input_summary, 500)) return null;
  if (typeof input.url !== "string") return null;
  try {
    const url = new URL(input.url);
    if (url.origin !== XHS_PUBLISH_PRECHECK_PIN.origin || url.pathname !== "/publish/publish" || url.username || url.password || url.hash) return null;
    return {
      url: url.href,
      target_ref: input.target_ref,
      ...(requestedFields === undefined ? {} : { requested_fields: requestedFields as AdmittedWritePrecheck["requested_fields"] }),
      ...(input.include_source_refs === undefined ? {} : { include_source_refs: input.include_source_refs }),
      ...(input.proposed_input_summary === undefined ? {} : { proposed_input_summary: input.proposed_input_summary as string })
    };
  } catch { return null; }
}

export function unavailableWritePrecheck(runtime_session_ref: string, failure_class: WritePrecheckFailureClass, retryable = true): ValidateOnlyWritePrecheckResult {
  return { schema_version: HARBOR_VALIDATE_ONLY_WRITE_PRECHECK_SCHEMA, status: "unavailable", runtime_session_ref, failure_class, retryable, submitted: false };
}

export function completeWritePrecheck(runtime_session_ref: string, identity_ref: string, probe: Extract<LocalProviderWritePrecheckProbeResult, { status: "completed" }>): Extract<ValidateOnlyWritePrecheckResult, { status: "completed" }> {
  const postCheckRef = opaqueRef("post_check");
  const resultRef = opaqueRef("write_precheck_result");
  const submittedResultRef = opaqueRef("submitted_result");
  const postCheckEvidence = probe.evidence_ref_kinds.filter((entry) => entry.kind === "snapshot_ref");
  return {
    schema_version: HARBOR_VALIDATE_ONLY_WRITE_PRECHECK_SCHEMA, status: "completed", runtime_session_ref,
    identity_ref, page_ref: opaqueRef("page"), merged_head_ref: XHS_PUBLISH_PRECHECK_PIN.commit,
    operation_ref: opaqueRef("write_precheck"), result_ref: resultRef, submitted_result_ref: submittedResultRef, observed_at: probe.observed_at, submitted: false,
    source_refs: probe.source_refs, evidence_ref_kinds: [...probe.evidence_ref_kinds, { kind: "post_check_ref", ref: postCheckRef }], target_ref: probe.target_ref,
    classification: probe.classification, precheck_scope: probe.precheck_scope, composition_state: probe.composition_state,
    entrypoint_observations: { ...probe.entrypoint_observations, user_confirmed_identity: true, challenge_absent: true },
    field_states: probe.field_states, prohibited_actions_observed: probe.prohibited_actions_observed, no_submit_guard: "active",
    post_check: { status: "passed", reason: "validated_creator_entrypoint_without_submission", source_refs: probe.source_refs, evidence_refs: postCheckEvidence, post_check_ref: postCheckRef, submitted: false, no_submit_guard: "active" },
    lode_pin: XHS_PUBLISH_PRECHECK_PIN,
    public_boundary: { raw_dom: "not_exposed", raw_har: "not_exposed", screenshot_body: "not_exposed", credentials: "not_exposed", external_write_actions: "not_performed" }
  };
}

export function validCompletedWritePrecheckProbe(probe: Extract<LocalProviderWritePrecheckProbeResult, { status: "completed" }>): boolean {
  const sourceKinds = probe.source_refs.map((ref) => ref.kind);
  const sourceRefs = probe.source_refs.map((ref) => ref.ref);
  return probe.observed_url.startsWith(`${XHS_PUBLISH_PRECHECK_PIN.origin}/publish/publish`) && Number.isFinite(Date.parse(probe.observed_at)) &&
    sourceKinds.join(",") === "creator_publish_page_summary,dom_snapshot_summary" && new Set(sourceRefs).size === 2 &&
    probe.evidence_ref_kinds.length === 1 && probe.evidence_ref_kinds[0]?.kind === "snapshot_ref" &&
    probe.classification === "partial_result" && probe.precheck_scope === "entrypoint_only" && probe.composition_state === "composition_not_initialized" &&
    Object.values(probe.entrypoint_observations).every((value) => value === true) &&
    Object.keys(probe.field_states).join(",") === "title_input,content_editor,publish_control" &&
    Object.values(probe.field_states).every((field) => field.availability === "unavailable" && field.observation === "not_observed") &&
    Object.values(probe.prohibited_actions_observed).every((observed) => observed === false) && bounded(probe.target_ref, 200);
}
