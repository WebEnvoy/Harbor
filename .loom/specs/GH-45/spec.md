# Spec

## Goal

Define the docs-only Page scene reference facts v0 contract for Harbor Stage 2.

## Scope

- In scope: `snapshot_ref`、`refmap_ref`、`source_trace`、`evidence_ref`、capture source choice、stale/missing/capture_denied/source_unavailable/selector_unstable classification、evidence type/redaction/retention、viewer ref/access/input capability、control owner、handoff/takeover reason、Harbor/Core/App/Lode consumption boundary, and research absorption decisions for GH-44 through GH-53.
- Out of scope: runtime/provider/browser/viewer code, API schema, storage schema, browser smoke, live runtime evidence, App UI, issue closeout, and merge.

## Required Behavior

- The authoritative contract lives in a Harbor repo ADR, not only in issue comments.
- Public refs are opaque and exclude secrets, raw endpoints, raw profile paths, cookies, tokens, full storage, full DOM, and unredacted raw evidence.
- Harbor owns runtime-bound refs, source binding, redaction/retention metadata, viewer/control facts, and failure classification.
- Core owns admission, Run Record, task outcome, unknown outcome, and reconciliation.
- App owns user-facing authorization, viewer display, handoff/takeover UI, and feedback.
- Lode owns capability schema and can consume authoring/runtime requirements without storing Harbor private state.
- Research locators from the issue bodies are explicitly classified as absorbed, trimmed reuse, reference-only, or rejected.

## Suite Path

- Suite path: minimal
- Full suite artifacts not_applicable: rationale: this PR changes docs and item-specific Loom carrier only; consumer boundary: downstream repos consume the ADR contract text, issue refs, PR metadata, and Loom fact-chain, not executable schema/runtime artifacts; recheck condition: require stronger validation when implementation code, API schema, generated artifacts, workflow logic, provider adapter, browser smoke, storage schema, live viewer, or real runtime evidence is added.
