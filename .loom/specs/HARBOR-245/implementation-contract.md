# Implementation Contract

## Boundary

- `POST /runtime/sessions/{runtime_session_ref}/read-operations` accepts only `site_id`, `operation_id`, optional public `query`, and optional public HTTPS `url`.
- The package ships a pinned local mirror of Lode #262 at `WebEnvoy/Lode@e36a4a7`, origin path `registry/runtime-consumption-allowlist.json`, SHA-256 `5aa6be8bd416bbd19f73dcfab995f62f769849923f2aa2e995da974b0f329184`.
- Unknown operations, non-read entries, pin drift, non-HTTPS/cross-origin target URLs, fixture launchers, unmanaged/unready/challenge/not-logged-in sessions, unavailable probes, and incomplete refs/post-checks fail closed.
- A completed response requires a production local-provider probe to navigate and evaluate an operation-specific read surface: Xiaohongshu search/note plus Pinia and same-origin fetch signals, or BOSS jobs plus a `/wapi/zpgeek/` fetch/XHR signal. Page URL/title/snapshot alone are insufficient.
- Harbor records distinct refs-only source observations and operation evidence bound to the operation/session/origin/time. The post-check stores and validates the exact source/evidence ref bindings required by the pinned Lode entry; arbitrary labels or reused post-check refs cannot satisfy it.
- Responses expose only operation/session refs, source/evidence/post-check refs, timestamps, and public status. They never expose credential, Cookie, token, CDP endpoint, raw profile, DOM/HAR/network body, or screenshot bytes.

## Non-Goals

- No Core run record, result normalization, site capability selection, provider ranking, automatic login, write action, or risk-control bypass.
- Fixture launchers may prove rejection and structured failure only; they cannot produce an operation success.
