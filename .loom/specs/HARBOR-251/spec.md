# HARBOR-251 Spec

## Scenarios

### S-001 BOSS Admission

Only the pinned Lode #262 `boss_job_search` read operation and canonical HTTPS BOSS job-search target are admitted.

### S-002 BOSS Probe

Completion requires the exact BOSS job-search page and exact query-bound successful WAPI response through the existing trusted local-provider probe.

### S-003 Refs-Only Failure Boundary

Origin/path/query drift, missing authentication or session authority, challenges, and missing refs return structured unavailable facts without external writes or sensitive output.

## Acceptance Criteria

- AC-001: the generated target is `https://www.zhipin.com/web/geek/job?query=<public query>&city=<city code>` and BOSS requests require a structured numeric `city_code`.
- AC-002: plural/other paths, non-HTTPS origins, cross-origin targets, cross-query/city targets, login walls, challenges, unready SPA surfaces, and non-exact WAPI responses fail closed.
- AC-003: completion requires WAPI HTTP 2xx, business `code === 0`, and a non-empty job object list; output remains a bounded public query/city/code/count summary plus refs only.
- AC-004: no XHS behavior or shared session/auth boundary is rewritten.

## Non-Goals

- Write precheck, parent FR closeout, Core/App closeout, automatic login, greetings, sends, submissions, applications, saves, batch collection, or sensitive material.
