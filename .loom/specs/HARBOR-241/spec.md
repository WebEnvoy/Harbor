# Spec

## Suite Decision

- Suite path: full
- Reason: this changes the Harbor Runtime API and persistent identity state that App and Core consume.

## User Story

After completing a manual login in a Harbor-managed browser window, a user can explicitly confirm completion in App. Harbor records that user-confirmed fact against the active managed session's identity environment and returns only a redacted public summary.

## Scenarios

1. An active managed identity session receives `POST /runtime/sessions/{session_ref}/manual-authentication-completed`.
   - Harbor updates the linked identity to `login_state=logged_in`, `manual_authentication_state=completed`, and `recovery_required=false`.
   - The response contains only the public identity record and a `user_confirmed_managed_session` reason.

2. The session is missing, closed, failed, or has no linked managed identity environment.
   - The endpoint fails closed with a structured unavailable result.
   - No identity environment is changed.

3. A later `GET /runtime/identity-environments/{identity_ref}` returns the persisted completed state.
   - Raw cookies, credentials, verification codes, profile storage, DOM, and page payloads are never read or returned.

4. App refreshes Harbor's returned public identity fact.
   - App may only render the owner response; it must not infer `logged_in` from browser visibility, title, URL, or a local toggle.

## Acceptance

- The intent is session-bound and only succeeds for a live managed identity session.
- Persistence uses the existing identity manager atomically.
- Tests cover success, persistence, missing/closed/unmanaged rejection, and public redaction.
- Real validation records the current session and identity refs, operation boundary, and no prohibited actions.

## Non-goals

- No automatic login detection, Cookie or DOM inspection, credential storage, site scraping, task execution, write-precheck, submit, publish, send, risk-control bypass, hosted browser, marketplace, or bulk collection.
