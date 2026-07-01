# Spec

## Goal

Deliver the first Harbor Viewer, handoff, Core runtime facts, and App status fixture slice for FR #87 without expanding into a real hosted viewer, remote console, account custody, or cross-repo Core/App implementation.

## Required Behavior

- A Runtime Session exposes an opaque `viewer_ref` with availability, access mode, transport, access boundary, created time, and expiry time.
- Viewer facts can be unavailable or unsupported without failing the Runtime Session, and raw VNC/CDP/WebSocket endpoints are not exposed as public facts.
- Control facts express the current owner, previous owner, handoff reason, takeover availability, and takeover unavailable reason.
- The API can record a minimal handoff event without implementing a full handoff state machine, pause/lock policy, or task outcome reconciliation.
- Core-facing readback returns citable Runtime Session fields, viewer ref state, control owner state, current error, and ref anchors.
- App-facing fixture returns stable browser status, viewer display state, and control status from the same Harbor facts consumed by Core.
- Closing a Runtime Session marks viewer/control facts unavailable or expired while keeping the fixture readable.

## Issue Coverage

| Issue | Coverage |
|---|---|
| #87 | First consumable Viewer/handoff/Core-App facts slice for the milestone. |
| #97 | Runtime API exposes `viewer_ref`, availability, access mode, transport, expiry, and ref-only access boundary. |
| #98 | Runtime API records control owner, previous owner, handoff reason, and takeover availability facts. |
| #99 | `getCoreRuntimeFacts` returns Core-admission/run-record citable fields without raw runtime endpoints. |
| #100 | `getAppRuntimeStatusFixture` returns a stable App-facing Browser/status fixture from the same facts. |

## Non-Goals

- Do not implement hosted browser, real VNC/noVNC transport, public raw CDP/VNC/WebSocket endpoints, full remote console, multi-user collaboration, account/secret custody, provider marketplace, anti-detection success claims, task outcome/reconciliation, or Core/App repository changes.
- Do not define the full handoff pause/lock state machine blocked by PD-0010.
- Do not decide the future Viewer MVP transport choice blocked by PD-0012.
- Do not make a real local browser mandatory for default tests.

## Suite Applicability

- Suite path: minimal
- Full suite artifacts not_applicable: rationale: this PR implements a narrow local Runtime API vertical slice inside `packages/runtime-api` and reuses ADR 0003, ADR 0007, GH-88 Runtime Session smoke, and GH-92 page-scene refs as the accepted contract baseline; it does not add OpenAPI schema, SQLite schema, real viewer transport, hosted browser, cross-repo Core/App consumers, production credentials, provider marketplace/installers, or a full handoff state machine. Consumer boundary: suite validate, review, PR gate, merge-ready, and closeout consume the GH-97 spec/plan, task carrier, evidence map, build evidence, focused tests, smoke output, PR metadata, and hosted checks. Recheck condition: require full suite artifacts if the PR adds public OpenAPI/SDK schema, persistent storage schema, real viewer transport, hosted browser, raw endpoint exposure, Core/App repository changes, real account data, provider marketplace/installers, or detailed handoff state machine behavior.
- Rationale: This Work Item completes a small in-process facts/readback fixture over the GH-88/GH-92 runtime skeleton.
- Consumer boundary: `pnpm typecheck`, `pnpm test`, `pnpm smoke:runtime`, optional local-browser `pnpm smoke:runtime:local`, Loom suite/carrier/evidence/build checks, PR metadata readback, and hosted checks are sufficient for this slice.
- Recheck condition: Require a broader suite if this PR adds persistent storage, public schema/SDK/OpenAPI artifacts, raw viewer/control endpoints, cross-repo consumers, real account state, remote browser support, or complete handoff state machine behavior.
