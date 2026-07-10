# Implementation Contract

## Ownership

- May edit Harbor Runtime API routing, `HarborRuntime`, identity environment state handling, associated Runtime API tests, and HARBOR-241 Loom carriers.
- Must not edit App, Core, Lode, browser launcher behavior, real account/profile data, Cookie/token/password/verification-code material, raw DOM, HAR, screenshot bytes, or site automation logic.

## Boundary

- The endpoint records only a user-confirmed completion fact for the exact active managed session.
- `POST /runtime/sessions/{runtime_session_ref}/manual-authentication-completed` alone requires a startup-configured `HARBOR_MANUAL_AUTH_SUPERVISOR_TOKEN`: an unconfigured or invalid configuration fails closed with `manual_auth_authorization_unavailable`; missing, malformed, duplicate, or unequal credentials return `manual_auth_authorization_required` before any session lookup.
- The token is fixed-format base64url, compared with `timingSafeEqual`, accepted only through one `Authorization: Bearer` header, and never persisted, emitted, logged, or added to evidence. The completion request accepts no query parameters and requires an empty body.
- It does not inspect or claim proof from cookies, page content, URLs, titles, screenshots, or site responses.
- It does not submit, publish, send, or otherwise write to an external site.

## Verification

- Fixture tests cover all endpoint outcomes without any live account or production page.
- Live verification may call the local Harbor endpoint only after the user has manually authenticated in the selected managed browser session; it records only refs and public status.
