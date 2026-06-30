# Spec

## Goal

Complete Harbor docs-only draft closeout for milestone PR readiness.

## Scope

- Define minimal `docs/` directory semantics for `adr`, `contracts`, and `draft`.
- Update `docs/draft/README.md` with draft lifecycle rules and a full draft inventory table.
- Replace promoted draft specs with short pointers to accepted ADR/contracts truth.
- Keep pending drafts explicitly marked with owner, linked issue, and exit condition.
- Add a minimal contracts index without rewriting accepted ADR specs.

## Required Behavior

- `docs/draft/` material cannot be used as implementation basis.
- Accepted runtime/session/provider/page/evidence contracts are referenced from ADRs instead of duplicated in drafts.
- Draft inventory status values are limited to `promoted`, `pending`, `deferred`, and `removed`.
- Pending/deferred drafts must state owner, linked issue, and exit condition.
- No `docs/guides/` directory is created.

## Suite Path

- Suite path: minimal
- Full suite artifacts not_applicable: rationale: this PR changes docs and item-specific Loom carrier only; no code, schema, API, runtime, generated facts, fixture, provider, storage, or browser behavior changes.
- Consumer boundary: consumers use `docs/adr/`, `docs/contracts/README.md`, `docs/draft/README.md`, PR metadata, and the GH-62 Loom fact-chain.
- Recheck condition: enable stronger validation if the same PR or a later PR introduces code, schema, API, runtime behavior, generated facts, fixtures, provider behavior, storage behavior, or browser evidence changes.
