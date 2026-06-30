# Spec

## Goal

Define the docs-only Runtime Session lifecycle v0 contract for Harbor Stage 2.

## Scope

- In scope: session ref, owner, lifecycle status, lease, error/unavailable classification, continuity, retry, takeover, recovery boundaries, and research absorption decisions for GH-36/GH-37/GH-38/GH-39.
- Out of scope: runtime/provider code, browser skeleton, API schema, database schema, hosted runtime, issue closeout, and merge.

## Required Behavior

- The authoritative contract lives in a Harbor repo document, not only in issue comments.
- `runtime_session_ref` remains opaque and excludes secrets/raw endpoints.
- Harbor owns runtime session facts; Core owns task/run outcome; App owns user-facing approval/viewer intent.
- Unavailable classifications distinguish retryable, expired, locked/takeover, unsupported, policy denied, and recovery-required cases.
- Research locators from the issue body are explicitly classified as absorbed, trimmed reuse, reference-only, or rejected.

## Suite Path

- Suite path: minimal
- Full suite artifacts not_applicable: rationale: this PR changes docs and item-specific Loom carrier only; consumer boundary: downstream repos consume the ADR contract text and PR metadata, not executable schema/runtime artifacts; recheck condition: require stronger validation when implementation code, API schema, generated artifacts, workflow logic, or real runtime evidence is added.
