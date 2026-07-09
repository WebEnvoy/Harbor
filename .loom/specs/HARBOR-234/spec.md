# Spec

## Suite Decision

- Suite path: full
- Path decision: Harbor runtime API, evidence boundary, write-precheck facts, and cross-repo Core/Lode/App contract consumption are touched.

## Scenarios

1. S-001 Core asks Harbor for site resource facts for a missing session.
   - Response is structured unavailable JSON.
   - Failure class identifies `session_missing`.
   - No raw browser material is exposed.

2. S-002 Core asks Harbor for site resource facts for an active session and a supported site/task.
   - Response includes schema version, runtime session ref, site id, task kind, generated time, page URL/title/origin when available, and resource facts required by Lode packages.
   - Facts include readiness/challenge/network/app-store style keys for Xiaohongshu and BOSS where Harbor can safely report public/redacted state.
   - Evidence refs are refs-only and access state can be checked through existing evidence endpoint.

3. S-003 Core asks Harbor for site resource facts for an unsupported site or task kind.
   - Response is structured unavailable JSON with `unsupported_site` or `unsupported_task_kind`.
   - The caller can treat it as an admission failure without process crashes.

4. S-004 Core asks Harbor for write-precheck facts.
   - Response includes `submitted: false`, an active no-submit guard, target page/action refs, public/redacted form/page state, and evidence refs or structured unavailable state.
   - The API never performs publish/send/submit/save.

5. S-005 App/Core can discover these endpoints from readiness.
   - Readiness endpoint lists the facts endpoints.
   - Safety boundary explicitly says raw credentials, raw profile storage, raw DOM/HAR/network bodies, raw CDP endpoints, and external write actions are not exposed/performed.

## Acceptance

- The server uses Node stdlib HTTP and existing Harbor runtime/session/evidence objects; no new dependency.
- Tests cover missing session, unsupported site/task, ready facts, challenge/failure facts, write-precheck no-submit guard, and evidence ref readback.
- PR body and closeout clearly state fixture/local-safe validation boundaries and do not claim live Xiaohongshu/BOSS account evidence.

## Non-goals

- No hosted browser service.
- No new browser provider launcher or provider ranking.
- No Lode package execution loop.
- No Core task runner or App UI change.
- No real account login, production site automation, submit, publish, send, save, or risk-control bypass.
