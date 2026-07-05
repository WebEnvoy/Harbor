# Spec: Stage 6 Preview Evidence Refs And Freshness

## Story Readiness

- User value: a caller can open refs for the before-preview scene and know whether the target/evidence is still valid before any approval or submit path.
- Success experience: Core/App can consume Snapshot/RefMap refs, target state provenance, stale/page changed/evidence unavailable states, and viewer/evidence status fixture without raw material.
- Failure states: snapshot missing, stale RefMap, page changed, evidence unavailable, policy denied, or runtime session unavailable.
- Sensitive data boundary: Harbor returns refs, redacted summaries, provenance, and status only; no cookie, token, raw DOM, raw network, profile storage, raw input value, real account, or production payload leaves Harbor.
- Non-goals: true submit, complete Browser console, hosted browser, raw evidence export, Core preview Result Envelope, and App UI.

## Scenarios

- Runtime API captures before-preview Snapshot/RefMap refs for a fixture session.
- The status fixture reports available, page_changed, and evidence_unavailable without raw material.
- Viewer/evidence status remains refs-only and redacted.

## Suite Path

- Suite path: minimal
- full-path-artifacts not_applicable rationale: bounded Stage 6 Runtime API fixture and smoke slice; consumer boundary: Core/App consume refs/status facts only; recheck condition: switch to full suite when adding persistent capture storage, hosted browser, raw export/delete consent, or real profile/account capture.
