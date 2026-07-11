# Contracts

- Endpoint: existing `POST /runtime/sessions/{runtime_session_ref}/read-operations`.
- Search output addition: optional opaque `public_summary.detail_refs`.
- Detail input: `site_id`, `xhs_read_note_detail|boss_read_job_detail`, `detail_ref` only.
- Output: completed public summary and opaque source/evidence/post-check refs, or structured unavailable facts.
- Owners: Lode owns capability truth; Harbor owns session, target-ref, provider, and evidence facts; Core owns task/run/result truth.
