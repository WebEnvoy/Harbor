# Spec

## Goal

Deliver the first Harbor local Runtime Session smoke for milestone #8 without expanding into Snapshot/Evidence/Viewer implementation.

## Required Behavior

- The Runtime API exposes create/get/close or equivalent smoke entry for a Runtime Session.
- A deterministic smoke can create a Runtime Session and read back `runtime_session_ref`, `profile_ref`, `provider_ref`, lifecycle, availability, current error, and fact-source records.
- The first local provider baseline is `local_dedicated_profile` backed by a user-provided local browser executable and CDP readiness, with fixture mode for CI-safe checks.
- Provider facts distinguish configured values, observed facts, provider claims, validation evidence, structured unavailability, and `launch_failed`.
- Public session facts expose opaque refs such as `cdp_ref`, not raw CDP/VNC/WebSocket endpoints, cookies, tokens, profile paths, credentials, or provider secrets.

## Issue Coverage

| Issue | Coverage |
|---|---|
| #85 | First local Runtime Session smoke and minimum runtime facts readback. |
| #88 | Runtime API create/get/close skeleton and smoke command. |
| #89 | Local dedicated profile provider baseline and browser binary boundary. |
| #90 | Profile/session refs and active/failed/closed lifecycle facts. |
| #91 | Provider fact source separation and runtime error facts. |

## Non-Goals

- Do not implement Snapshot/RefMap/Evidence refs, Viewer/handoff/Core-App facts, hosted browser, provider marketplace, account/secret handling, complete Profile Browser, production payload capture, or remote control console.
- Do not make a real local browser mandatory for default tests.
- Do not expose raw CDP/VNC/ws endpoints in public facts.

## Suite Applicability

- Suite path: minimal
- Full suite artifacts not_applicable: rationale: this PR implements a narrow first runtime smoke slice with code and tests, but does not need `suite-index.md`, `research.md`, `contracts.md`, or `readiness-checklist.md` because ADR 0005-0008 already define the accepted contracts and the implementation does not change public schema beyond the local package API; consumer boundary: suite validate, review, PR gate, merge-ready, and closeout consume the GH-88 spec/plan, task carrier, build evidence, tests, smoke output, and PR metadata; recheck condition: require full suite artifacts if the PR adds public API/OpenAPI schema, SQLite schema, Snapshot/Evidence/Viewer implementation, provider marketplace/installers, real account state, remote browser support, or cross-repo contract changes.
- Rationale: This Work Item introduces the first code skeleton and runnable checks but remains a narrow vertical slice with one package and one runtime smoke path.
- Consumer boundary: `pnpm test`, `pnpm smoke:runtime`, optional `pnpm smoke:runtime:local`, Loom suite/carrier/build checks, PR metadata readback, and hosted checks are sufficient for this slice.
- Recheck condition: Require a broader suite if this PR adds Snapshot/Evidence/Viewer behavior, API/OpenAPI schema, SQLite schema, provider marketplace/installers, real account state, or remote browser support.
