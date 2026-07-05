# Spec: Stage 6 Writable Target Runtime Facts

## Story Readiness

- User value: a caller can see which target would be affected and which fields are present before any write is submitted.
- Success experience: Core receives refs-only target, form/input state, sensitive-field export policy, and no-submit guard facts.
- Failure states: runtime unavailable, session missing, target stale, page changed, evidence unavailable, or sensitive field not exportable.
- Sensitive data boundary: no cookie, token, raw DOM, raw network, profile storage, raw input value, real account, or production page material leaves Harbor.
- Non-goals: real submit, complete Browser console, hosted browser, true profile capture, and App UI.

## Scenarios

- Runtime API returns writable target refs and form/input state for a fixture session.
- Sensitive fields are marked redacted or never-export and raw values are absent.
- No-submit guard facts identify blocked submit-like events for Core.

## Suite Path

- Suite path: minimal
- full-path-artifacts not_applicable rationale: bounded Stage 6 Runtime API fixture and smoke slice; consumer boundary: Core consumes refs/status facts only; recheck condition: switch to full suite when adding persistent capture storage, hosted browser, preview evidence lifecycle, export/delete consent, or real profile/account capture.
