import { opaqueRef } from "./refs.js";
import type { AllowlistedReadOperationId, AllowlistedReadOperationSite, LocalProviderReadProbeDetailTarget } from "./runtime-session-types.js";

export type DetailReadFailureClass = "detail_ref_invalid" | "detail_ref_missing" | "detail_ref_expired" | "detail_ref_consumed" | "detail_ref_binding_mismatch";

interface DetailReadTargetRecord {
  detail_ref: string;
  runtime_session_ref: string;
  site_id: AllowlistedReadOperationSite;
  detail_operation_id: "xhs_read_note_detail" | "boss_read_job_detail";
  canonical_url: string;
  expires_at: number;
  consumed: boolean;
}

const DETAIL_REF_TTL_MS = 10 * 60 * 1000;

export class DetailReadTargetStore {
  private readonly records = new Map<string, DetailReadTargetRecord>();
  private readonly consumedRefs = new Set<string>();
  private readonly expiredRefs = new Set<string>();

  register(input: {
    runtime_session_ref: string;
    site_id: AllowlistedReadOperationSite;
    search_operation_id: "xhs_search_notes" | "boss_job_search";
    targets: readonly LocalProviderReadProbeDetailTarget[];
    now?: number;
  }): string[] {
    const detail_operation_id = input.search_operation_id === "xhs_search_notes" ? "xhs_read_note_detail" : "boss_read_job_detail";
    const refs: string[] = [];
    for (const target of input.targets.slice(0, 15)) {
      if (!isCanonicalDetailUrl(input.site_id, target.canonical_url)) continue;
      const detail_ref = opaqueRef("detail");
      this.records.set(detail_ref, {
        detail_ref,
        runtime_session_ref: input.runtime_session_ref,
        site_id: input.site_id,
        detail_operation_id,
        canonical_url: target.canonical_url,
        expires_at: (input.now ?? Date.now()) + DETAIL_REF_TTL_MS,
        consumed: false
      });
      const expiry = setTimeout(() => {
        if (this.records.delete(detail_ref)) this.expiredRefs.add(detail_ref);
      }, DETAIL_REF_TTL_MS);
      expiry.unref();
      refs.push(detail_ref);
    }
    return refs;
  }

  consume(input: {
    detail_ref: string;
    runtime_session_ref: string;
    site_id: AllowlistedReadOperationSite;
    operation_id: AllowlistedReadOperationId;
    now?: number;
  }): DetailReadTargetRecord | DetailReadFailureClass {
    if (!/^detail_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.detail_ref)) return "detail_ref_invalid";
    if (this.consumedRefs.has(input.detail_ref)) return "detail_ref_consumed";
    if (this.expiredRefs.has(input.detail_ref)) return "detail_ref_expired";
    const record = this.records.get(input.detail_ref);
    if (!record) return "detail_ref_missing";
    if (record.expires_at <= (input.now ?? Date.now())) {
      this.records.delete(input.detail_ref);
      this.expiredRefs.add(input.detail_ref);
      return "detail_ref_expired";
    }
    if (record.runtime_session_ref !== input.runtime_session_ref || record.site_id !== input.site_id || record.detail_operation_id !== input.operation_id) return "detail_ref_binding_mismatch";
    this.records.delete(input.detail_ref);
    this.consumedRefs.add(input.detail_ref);
    return { ...record, consumed: true };
  }
}

export function isCanonicalDetailUrl(siteId: AllowlistedReadOperationSite, value: string): boolean {
  let url: URL;
  try { url = new URL(value); } catch { return false; }
  if (url.protocol !== "https:" || url.username || url.password || url.hash) return false;
  if (siteId === "xiaohongshu") {
    return url.origin === "https://www.xiaohongshu.com" && /^\/explore\/[a-f0-9]{24}$/i.test(url.pathname) &&
      [...url.searchParams.keys()].every((key) => key === "xsec_token" || key === "xsec_source") &&
      url.searchParams.getAll("xsec_token").length <= 1 && url.searchParams.getAll("xsec_source").length <= 1;
  }
  return url.origin === "https://www.zhipin.com" && /^\/job_detail\/[A-Za-z0-9_-]+\.html$/.test(url.pathname) && !url.search;
}
