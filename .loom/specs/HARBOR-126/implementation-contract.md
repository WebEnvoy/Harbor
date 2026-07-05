# Implementation Contract

## Ownership

- Harbor owns Runtime Session facts, viewer refs, Snapshot/RefMap/Evidence refs, provenance, freshness, retention, redaction, and unavailable states.
- Core owns run admission, run record, result envelope, and failure attribution truth.
- App owns UI state and display; it consumes Harbor refs/status only.
- Lode owns package, lifecycle, repair draft, and capability metadata truth.

## Required Behavior

- Evidence status fixture returns refs and summaries only.
- Freshness states distinguish fresh, stale, expired, and missing.
- Retention states distinguish ephemeral, retained, and expired.
- Runtime validation blockers distinguish provider unavailable, profile locked, session lost, and capture denied.
- Smoke and tests must fail if public status JSON contains raw DOM, raw HAR/network, cookies, tokens, profile paths, or storage state.

## Forbidden Behavior

- No hosted browser or production page interaction.
- No raw DOM, raw network/HAR, screenshot/video body, cookies, tokens, profile storage, CDP endpoint, or private local path exposure.
- No Core run/result truth, Lode package truth, App UI persistence, or Stage 6 write-side behavior.
