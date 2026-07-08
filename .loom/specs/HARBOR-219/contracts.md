# Contracts

## Runtime API

- `GET /readiness` returns readiness and safety boundary facts.
- `GET /runtime/browser-providers` and `/runtime/browser-provider-status` return `HarborRuntime.getBrowserProviderStatus()`.
- `GET/POST /runtime/identity-environments` delegates to existing local identity environment manager methods.
- `POST /runtime/identity-environment-sessions` delegates to existing session open methods.
- `GET /runtime/sessions/{runtime_session_ref}` returns session facts or structured unavailable state.
- `POST /runtime/sessions/{runtime_session_ref}/{lock|release|stop|snapshot}` delegates to existing session/snapshot methods.
- `GET /runtime/evidence/{evidence_ref}` returns existing refs-only evidence records.

## Boundary

- Responses must not expose raw credentials, raw profile storage, raw CDP endpoints, raw screenshot bytes, raw DOM, HAR, tokens, or cookies.
- This Work Item does not launch production site tasks or perform any external write action.
