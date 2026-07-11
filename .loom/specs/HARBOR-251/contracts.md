# Contracts

- Endpoint: existing `POST /runtime/sessions/{runtime_session_ref}/read-operations`.
- Input: `site_id=boss`, `operation_id=boss_job_search`, public `query`, required numeric `city_code`, and optional exact canonical HTTPS URL.
- Output: bounded public query/city/business-code/job-count summary and opaque refs, or structured unavailable facts; raw WAPI bodies and job rows are never retained or returned.
- Owners: Lode owns allowlist capability truth; Harbor owns runtime/session/probe/evidence facts; Core owns run/result truth.
