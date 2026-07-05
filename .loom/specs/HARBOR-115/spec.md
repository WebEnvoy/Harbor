# Spec

## Goal

- Expose validation runtime facts with provider/profile/session refs, validation refs, readiness, and structured blocking reasons.
- Expose private capture and redacted export policy facts without raw private material.

## Suite Path

- Suite path: minimal
- full-path-artifacts not_applicable rationale: bounded Stage 5 Harbor refs/status fixture slice; consumer boundary: Core/App consume refs and status facts only; recheck condition: switch to full suite for hosted browser, real profile, production page, raw capture storage, or external export.

## Scenarios

- Scenario 1: Given runtime validation succeeds, Core can read runtime_ready, provider/profile/session refs, and validation refs.
- Scenario 2: Given runtime validation fails, Core can read structured blocking reasons without raw runtime material.
- Scenario 3: Given App/Core read evidence status, Harbor exposes private capture store, redacted export, retention, export consent, and deletion policy facts.

## Boundaries

- In scope: Runtime API fixture facts, process-memory private capture markers, redacted fixture export boundary, retention/redaction/export consent/delete policy fields, tests, and smoke output.
- Out of scope: hosted browser, real account/profile, production page, Browser management console, raw DOM/network/profile storage, cookies, tokens, screenshots, video, and Stage 6 write behavior.

## Acceptance Criteria

- [x] Validation runtime facts include provider/profile/session refs and validation refs.
- [x] Runtime-not-satisfied states expose structured blocking reasons.
- [x] Evidence status fixture declares local private capture store and raw-not-exposed boundary.
- [x] Evidence status fixture declares redacted export boundary, retention policy, export consent, and delete policy.
- [x] Tests and smoke verify the facts without private raw material.
