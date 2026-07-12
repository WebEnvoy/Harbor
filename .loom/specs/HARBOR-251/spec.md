# HARBOR-251 Spec

## Scenarios

### S-001 BOSS Admission

Only the pinned Lode #262 `boss_job_search` read operation and canonical HTTPS BOSS job-search target are admitted.

### S-002 BOSS Probe

Completion requires the exact BOSS job-search page and exact query-bound successful WAPI response through the existing trusted local-provider probe.

### S-002A BOSS Pre-Admission Probe

Before execution, Harbor may mark `page.boss_spa.ready` available only when a trusted CDP probe verifies the canonical origin/path, application root, rendered job-list surface, and absence of login/challenge state. `network.wapi_zpgeek.available` remains operation-deferred and unknown until the exact query/city-bound read response is observed.

### S-003 Refs-Only Failure Boundary

Origin/path/query drift, missing authentication or session authority, challenges, and missing refs return structured unavailable facts without external writes or sensitive output.

## Acceptance Criteria

- AC-001: the generated target is `https://www.zhipin.com/web/geek/job?query=<public query>&city=<city code>` and BOSS requests require a structured numeric `city_code`.
- AC-002: plural/other paths, non-HTTPS origins, cross-origin targets, cross-query/city targets, login walls, challenges, unready SPA surfaces, and non-exact WAPI responses fail closed.
- AC-003: completion requires WAPI HTTP 2xx, business `code === 0`, and a non-empty job object list; output remains a bounded public query/city/code/count summary plus refs only.
- AC-004: no XHS behavior or shared session/auth boundary is rewritten.
- AC-005: ready SPA passes; login, challenge, blank, unrendered, and unprobeable pages remain blocked, unavailable, or unknown without raw DOM/network/Cookie/token/profile output.

## Non-Goals

- Write precheck, parent FR closeout, Core/App closeout, automatic login, greetings, sends, submissions, applications, saves, batch collection, or sensitive material.
