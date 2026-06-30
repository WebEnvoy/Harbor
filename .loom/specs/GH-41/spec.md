# Spec

## Goal

Define the docs-only Provider、Profile 与 Identity facts v0 contract for Harbor Stage 2.

## Scope

- In scope: `provider_ref`、`profile_ref`、`execution_identity_ref`、provider/profile/identity facts ownership、fact source categories、observed fact vs provider claim、license/binary/secret/profile data boundaries、Core/Lode/App consumption boundaries、Runtime Session lifecycle v0 relationship, and research absorption decisions for GH-40/GH-41/GH-42/GH-43.
- Out of scope: runtime/provider code, browser skeleton, API schema, database schema, browser smoke, provider evaluation packet, GH-44/GH-48/GH-53, issue closeout, and merge.

## Required Behavior

- The authoritative contract lives in a Harbor repo ADR, not only in issue comments.
- Public refs are opaque and exclude secrets, raw endpoints, raw profile paths, cookies, tokens, and complete storage.
- Harbor owns provider/profile/identity facts; Core owns admission and task/run outcome; Lode owns resource requirements; App owns user-facing display/authorization/handoff intent.
- Provider claims are separate from observed/configured/validated facts and cannot satisfy Core/Lode requirements without validation evidence.
- License, binary, secret, and profile data boundaries are explicit and reject leaking sensitive material into Core/Lode/App contracts.
- The contract consumes ADR 0005 by binding Runtime Session refs to provider/profile/identity refs without expanding session lifecycle implementation.
- Research locators from the issue body are explicitly classified as absorbed, trimmed reuse, reference-only, or rejected.

## Suite Path

- Suite path: minimal
- Full suite artifacts not_applicable: rationale: this PR changes docs and item-specific Loom carrier only; consumer boundary: downstream repos consume the ADR contract text and PR metadata, not executable schema/runtime artifacts; recheck condition: require stronger validation when implementation code, API schema, generated artifacts, workflow logic, provider evaluation, browser smoke, or real runtime evidence is added.
