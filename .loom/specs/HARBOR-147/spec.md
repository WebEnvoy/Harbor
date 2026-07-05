# Spec: Stage 6 No-Submit And Private Preview Boundary

## Story Readiness

- User value: Core/App can consume preview refs and status while knowing no submit occurred and private browser material stayed local.
- Success experience: Harbor exposes no-submit guard facts, process-local capture boundary, a redacted preview export fixture, and tests proving shared artifacts omit private/raw material.
- Failure states: session missing, preview evidence unavailable, stale/page changed evidence, no-submit guard missing, redacted export unavailable, or forbidden material detected in shared output.
- Sensitive data boundary: Harbor may hold local runtime/private capture internally, but shared fixtures expose only refs, redacted summaries, and status; no cookie, token, raw DOM, raw network, profile storage, raw input value, real account, or production payload leaves Harbor.
- Non-goals: true submit, complete Browser console, hosted browser, real accounts/profiles/production pages, raw evidence export, Core preview Result Envelope, and App UI.

## Scenarios

- Runtime API returns redacted preview export with no-submit guard active.
- Shared export includes refs/status/page summary only and keeps local capture private.
- Tests assert forbidden private/raw material is absent from exported fixture JSON.

## Suite Path

- Suite path: minimal
- full-path-artifacts not_applicable rationale: bounded Runtime API fixture/test/smoke slice; consumer boundary: Core/App consume refs/status/no-submit facts only; recheck condition: switch to full suite when adding persistent capture storage, hosted browser, raw export/delete consent, or real profile/account capture.
