# Contracts

## Live Snapshot Evidence

- `captureLiveSnapshot(runtime_session_ref)` returns structured unavailable when the session is missing or unreadable.
- If the session is readable and screenshot capture succeeds, the returned scene may include `screenshot_ref` and screenshot evidence refs.
- If the session is readable and screenshot capture returns a structured failure, the returned scene must omit `screenshot_ref` and must not include screenshot-type evidence.
- Page refs, source trace refs, and element refs may still be produced from readable page facts.

## Boundary

- Evidence refs must not expose raw credentials, raw profile storage, raw CDP endpoints, raw screenshot bytes, raw DOM, HAR, tokens, cookies, or network bodies.
- This Work Item does not launch production site tasks or perform any external write action.
