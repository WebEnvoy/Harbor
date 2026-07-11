# Implementation Contract

## Boundary

- Consume the existing immutable Lode #262 pin and only `boss_job_search` on `https://www.zhipin.com`.
- Require structured `city_code`; use `/web/geek/job` as the canonical public search surface and bind both page and `/wapi/zpgeek/search/joblist.json` URLs to the exact query and city.
- Read at most 512 KiB from only the exact WAPI response, immediately reduce it to business code and job count, require `code === 0` plus a non-empty object list, and discard the raw body.
- Bind the public query/city/code/count summary to the real `network_summary` source and make `network_summary_ref` point back to that source without exposing job rows or raw response material.
- Detect final page query/city drift, login walls, safety challenges, and missing SPA/result surfaces before completion.
- Reuse the existing managed-session authentication, control-lock, trusted-probe, temporary-target cleanup, and post-probe authority checks.
- Return only public summaries and opaque session/source/evidence/post-check refs, or structured unavailable facts.

## Non-Goals

- No XHS rewrite, Core run ownership, App projection, login automation, external writes, batch collection, raw DOM/HAR/network bodies, screenshot bytes, reusable CDP endpoints, credentials, Cookie, token, profile material, or risk-control bypass.
