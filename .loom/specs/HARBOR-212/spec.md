# Spec

## Suite Decision

- Suite path: full
- Path decision: Harbor evidence refs and screenshot availability semantics are touched.

## Scenarios

1. S-001 Live screenshot capture succeeds.
   - Harbor captures page refs, source trace refs, and screenshot refs.
   - Raw screenshot bytes remain unexposed.

2. S-002 Live screenshot capture fails with a structured runtime error.
   - Harbor still captures page refs and source trace refs when the page/session facts are readable.
   - Harbor does not create `screenshot_ref`.
   - Harbor does not create screenshot-type evidence.
   - Failure does not get misrepresented as successful screenshot evidence.

3. S-003 Snapshot refs remain refs-only.
   - Evidence readback does not include raw Cookie, token, profile storage, DOM, HAR, network body, or raw screenshot bytes.

## Acceptance

- `HarborRuntime.captureLiveSnapshot` denies screenshot evidence when the underlying capture returns an error object.
- Unit tests cover the failure path with a fixture launcher.
- The PR does not run real browser/profile/production page actions.

## Non-goals

- No new browser driver logic.
- No hosted browser service.
- No Core task runner, Lode execution, App UI, real account login, production site automation, or write action.
