# Contracts

- Endpoint: `POST /runtime/sessions/{runtime_session_ref}/read-operations`.
- Input: `site_id`, `operation_id`, public `query`, and optional canonical HTTPS `url` only.
- Output: completed public summary and opaque refs, or structured unavailable facts.
- Owners: Lode owns capability truth; Harbor owns provider/session/evidence facts; Core owns task/run/result truth; App presents owner projections.
- Privacy: raw credentials, profile storage, Cookie/token, DOM/HAR/network body, CDP endpoint, and screenshot bytes are never exposed.
- Safety: no automatic login or external write action.
