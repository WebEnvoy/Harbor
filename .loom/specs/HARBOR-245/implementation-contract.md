# Implementation Contract

## Boundary

- `POST /runtime/sessions/{runtime_session_ref}/read-operations` accepts only `site_id`, `operation_id`, a required public `query`, and optional public HTTPS `url`. The pinned operation schema derives the target and accepts a supplied URL only when its exact path and single public query parameter match that derivation; same-origin publish, chat, profile, or other paths are rejected.
- The package ships a pinned local mirror of Lode #262 at `WebEnvoy/Lode@e36a4a7`, origin path `registry/runtime-consumption-allowlist.json`, SHA-256 `5aa6be8bd416bbd19f73dcfab995f62f769849923f2aa2e995da974b0f329184`.
- Unknown operations, non-read entries, pin drift, non-HTTPS/cross-origin/disallowed-path target URLs, fixture launchers, unmanaged/unready/challenge/not-logged-in sessions, missing server-owned user confirmation, released controllers, unavailable probes, and incomplete refs/post-checks fail closed.
- A completed response requires a production local-provider probe to navigate and verify an operation-specific successful read response: Xiaohongshu search plus Pinia and its exact keyword-bound search response, or BOSS jobs plus the exact query-bound `/wapi/zpgeek/search/joblist.json` response. Generic resource timing, page URL/title, or snapshots alone are insufficient; no DOM, response body, Cookie, credential, or profile material is read or retained.
- Completion also requires provider-produced opaque source and evidence refs for every Lode-required kind. Harbor only binds the public summary to one observed source ref and creates its result/post-check records; it never labels that result summary as a snapshot or synthesizes missing source/evidence refs. The current local CDP probe observes only URL/status metadata and therefore returns structured `evidence_refs_missing` until a safe evidence provider is available.
- `user_held_session` is a server-owned handoff fact. Local HTTP session creation, lock/reuse, identity PATCH, and release input cannot establish it; only the server-owned verified handoff followed by the authenticated manual-authentication completion path can establish a read-operation confirmation.
- Responses expose only probe-bound public result summaries, operation/session refs, source/evidence/post-check refs, timestamps, and public status. They never expose credential, Cookie, token, CDP endpoint, raw profile, DOM/HAR/network body, or screenshot bytes.

## Non-Goals

- No Core run record, result normalization, site capability selection, provider ranking, automatic login, write action, or risk-control bypass.
- Fixture launchers may prove rejection and structured failure only; they cannot produce an operation success.
