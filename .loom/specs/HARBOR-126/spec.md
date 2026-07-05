# Spec

## Goal

- Expose App/Core consumable validation runtime facts and evidence status fixtures for Stage 5 read-only capability productization.
- Keep Harbor as runtime/session/evidence refs truth owner while avoiding cookie, token, raw DOM, raw network, profile storage, production payload, or private browser material exposure.

## Suite Path

- Suite path: minimal
- full-path-artifacts not_applicable rationale: this PR is a bounded Runtime API fixture/status slice with unit and smoke coverage; consumer boundary: Core/App consume refs, freshness, redaction, retention, and unavailable states only; recheck condition: switch to full suite when adding real evidence store persistence, hosted browser, provider adapter changes, external capture, deletion/export consent flows, or Browser management UI.

## Scenarios

- Scenario 1: Given a validation runtime fixture, when provider/profile/session setup fails, then Harbor returns structured blocking reasons.
- Scenario 2: Given a captured page scene, when App asks for evidence status, then Harbor returns snapshot/refmap/evidence refs with redaction, retention, provenance, and freshness without raw payloads.
- Scenario 3: Given evidence expires or the source session closes, when App/Core reads status, then Harbor reports expired or stale blocking states.

## Boundaries

- In scope: runtime blocker codes, evidence status fixture, retention/freshness status, redacted/private boundary, fixture smoke, unit tests.
- Out of scope: complete Browser management console, hosted browser, persistent evidence store, real production page capture, user consent export/delete flows, Core run truth, Lode package truth, App UI state, Stage 6 write-precheck.

## Acceptance Criteria

- [x] Runtime API reports provider/profile/session blockers as structured facts.
- [x] Snapshot, RefMap, and Evidence refs remain opaque refs and summaries only.
- [x] Evidence status fixture exposes freshness, redaction, retention, provenance, and privacy boundary.
- [x] Tests and smoke prove fresh, expired, stale, and unavailable states.
- [x] Public JSON does not include raw DOM, raw HAR/network, cookies, tokens, profile paths, or storage state.
