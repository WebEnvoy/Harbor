# 0004. Snapshot, RefMap, and Evidence Capture

## Status

Proposed, 2026-06-29.

## Context

WebEnvoy needs low-noise browser context for agents, recoverable evidence for failures, and privacy boundaries for real accounts. Research converges on Snapshot/RefMap-style page observation, but the existing drafts also warn that Harbor must not define business result schemas or expose sensitive runtime material by default.

The boundary must let Harbor capture runtime evidence while Core owns Run Records and Lode owns site capability outputs.

## Decision

Harbor owns runtime capture primitives and evidence references tied to a Runtime Session. Core requests capture through an `evidence_policy` and stores Harbor refs in its Run Record. Lode outputs site business data through its own capability contracts.

Harbor may produce these refs:

- `snapshot_ref`: a page observation artifact such as DOM, AX tree, semantic text, simplified HTML, or provider-native snapshot metadata.
- `refmap_ref`: element references generated for a specific snapshot/page/frame generation, with locator fallbacks and expiry semantics.
- `screenshot_ref`: screenshot evidence when policy allows it.
- `network_summary_ref`: redacted request/response summary, not full bodies by default.
- `console_log_ref`: redacted console/error summary.
- `trace_ref`: browser trace, HAR, video, or replay artifact when explicitly enabled.
- `raw_payload_ref`: raw page or provider payload reference when policy allows local storage.
- `source_trace`: provenance linking observation, provider, session, page/frame, capture method, and time.
- `diagnostic_ref`: runtime health or failure diagnostic evidence.

Snapshot and RefMap are page observation and operation context. They are not normalized results, collection item schemas, comment schemas, dataset records, or public site business fields.

RefMap refs are scoped to the session, page/frame, snapshot generation, and navigation state. Harbor may resolve a ref while it is still valid, return a stale-ref error, or request a fresh snapshot. A RefMap does not guarantee a stable business locator across site versions.

Evidence capture is policy controlled. The default should be minimal and redacted:

- do not persist cookies, tokens, credentials, full storage, full DOM, full request/response bodies, full screenshots, video, HAR, or trace unless explicitly allowed.
- record redaction status, capture time, provider/session/profile refs, local/remote storage location, retention policy, and provenance.
- keep sensitive evidence local unless an explicit policy allows export.

Harbor Resource Trace should link acquire, release, invalidate, health, and failure events to evidence refs. Core may cite those refs, but it should not copy Harbor's full evidence store.

## Consequences

Harbor can support Snapshot/RefMap, screenshots, console/network summaries, traces, and diagnostics without taking over Core's Run Record or Lode's result schema.

Evidence cost and privacy risk remain visible through `evidence_policy` instead of being hidden in driver defaults.

RefMap becomes useful for action execution and authoring, while still being treated as ephemeral runtime context.

## Alternatives Considered

- Default-save full screenshots, DOM, HAR, trace, and video: rejected because real browser accounts often expose private data.
- Treat Snapshot or RefMap as a business result: rejected because page observation is not the same as a Lode capability output.
- Let each Core capability capture browser evidence directly: rejected for the Harbor boundary because capture, redaction, storage, and provider details are closest to the runtime session.
- Treat short-lived ring buffers as the Evidence Store: rejected because debugging buffers are not durable, redacted, or referenceable enough for Run Records.
- Define Core result envelope or Lode package schema here: rejected because this ADR only decides Harbor runtime boundaries.

## Research Evidence

- `docs/draft/evidence-store.md` says Harbor provides refs such as `raw_payload_ref`, `evidence_ref`, `snapshot_ref`, `network_summary_ref`, `screenshot_ref`, and `source_trace`, but not normalized results or site business schemas.
- `docs/draft/runtime-capability-facts.md` defines Snapshot, network summary, logs, screenshot, handoff, and evidence policy as session/evidence facts.
- `execution-space-and-context.md` shows multiple projects converging on snapshot/ref/index/uid models for low-noise page context and element references.
- `execution-space-and-context.md` rejects using snapshots, browser primitives, or Playwright locators as stable business result schemas.
- `evidence-and-observability.md` identifies screenshot, trace, HAR, video, console, and network capture as valuable evidence, but warns against default persistence of sensitive artifacts.
- `synthesis.md` accepts Snapshot/RefMap as a product direction while leaving the exact contract to Harbor/Core follow-up specs.

## Open Questions

- What is the first Snapshot/RefMap contract: AX-first, DOM-first, semantic text, or provider-native?
- Which evidence refs are mandatory for the first Harbor API version?
- What are the default retention and encryption rules for local evidence?
- When should Playwright trace/HAR/video be enabled, and who can request it?
- How should stale RefMap failures be represented so Core can retry or resnapshot safely?
