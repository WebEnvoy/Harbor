# Contracts

- Endpoint: existing `POST /runtime/sessions/{runtime_session_ref}/read-operations`.
- Input: `site_id=boss`, `operation_id=boss_job_search`, public `query`, and optional exact canonical HTTPS URL.
- Output: existing completed public summary and opaque refs, or structured unavailable facts.
- Owners: Lode owns allowlist capability truth; Harbor owns runtime/session/probe/evidence facts; Core owns run/result truth.
