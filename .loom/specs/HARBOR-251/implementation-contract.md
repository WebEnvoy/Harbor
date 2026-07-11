# Implementation Contract

## Boundary

- Consume the existing immutable Lode #262 pin and only `boss_job_search` on `https://www.zhipin.com`.
- Use `/web/geek/job` as the canonical public search surface and require the exact query-bound `/wapi/zpgeek/search/joblist.json` response.
- Reuse the existing managed-session authentication, control-lock, trusted-probe, temporary-target cleanup, and post-probe authority checks.
- Return only public summaries and opaque session/source/evidence/post-check refs, or structured unavailable facts.

## Non-Goals

- No XHS rewrite, Core run ownership, App projection, login automation, external writes, batch collection, raw DOM/HAR/network bodies, screenshot bytes, reusable CDP endpoints, credentials, Cookie, token, profile material, or risk-control bypass.
