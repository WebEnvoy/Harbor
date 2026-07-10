# Contracts

## Endpoint

- Method and path: `POST /runtime/sessions/{runtime_session_ref}/manual-authentication-completed`.
- Success: `200` and the existing redacted local identity environment public record.
- Missing session: `404`, `session_missing`.
- Inactive or unmanaged session: `409`, `session_not_active` or `identity_environment_unmanaged`.

## Provenance And Privacy

- The endpoint records the user's explicit confirmation only. It is not an automated browser, Cookie, DOM, URL, title, or site-response detector.
- Output and stored public facts retain the existing redaction boundary; no sensitive material is accepted or returned.
