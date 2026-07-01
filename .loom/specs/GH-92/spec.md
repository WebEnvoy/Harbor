# Spec

## Goal

Deliver the first Harbor page-scene refs slice for FR #86 without expanding into raw evidence archives or Viewer/handoff behavior.

## Required Behavior

- A Runtime Session can produce a low-noise `snapshot_ref` with title, URL, capture time, source trace, and page summary or equivalent context.
- Snapshot capture can produce an optional `refmap_ref` with indexed element refs or source snippets that are safe for Core/App to cite.
- Evidence refs record evidence type, Harbor ownership, source binding, provenance, redaction state, retention state, storage scope, and access state.
- Unavailable page-scene reads return stable failure inputs including missing, stale, expired, capture denied, source unavailable, and selector unstable classifications where applicable.
- Core-facing readback returns refs and page summary only, not raw DOM, raw HAR, cookies, tokens, raw CDP/VNC/ws endpoints, screenshots, video, profile paths, or provider secrets.
- Runtime facts mark snapshot/evidence availability after capture and keep evidence metadata readable after the Runtime Session closes.

## Issue Coverage

| Issue | Coverage |
|---|---|
| #86 | First consumable Snapshot/RefMap/Evidence refs slice for Core/App integration. |
| #92 | `captureSnapshot` creates a low-noise snapshot record. |
| #93 | Optional RefMap records expose indexed element refs. |
| #94 | Evidence records include type, source binding, provenance, redaction, retention, storage scope, and access state. |
| #95 | Missing, stale, capture denied, expired, source unavailable, and selector unstable classes are stable API values. |
| #96 | `getCoreSceneReference` returns refs and summary without Harbor-private raw现场. |

## Non-Goals

- Do not implement persistent SQLite evidence storage, raw DOM/HAR archive, screenshots/video, production payload capture, hosted browser, anti-detection success claims, account/secret handling, complete remote console, Viewer/handoff/Core-App owner facts, or cross-repo Core/App changes.
- Do not make a real local browser mandatory for default tests.
- Do not expose provider-specific launch flags, raw CDP/VNC/ws endpoints, cookies, tokens, profile paths, credentials, or provider secrets as public page-scene facts.

## Suite Applicability

- Suite path: minimal
- Full suite artifacts not_applicable: rationale: this PR implements a narrow local Runtime API vertical slice inside `packages/runtime-api` and reuses ADR 0004, ADR 0007, and ADR 0008 as the accepted Stage 2 contract baseline; it does not add OpenAPI schema, SQLite schema, cross-repo Core/App consumer changes, production evidence capture, provider marketplace/installers, real account state, or remote browser support. Consumer boundary: suite validate, review, PR gate, merge-ready, and closeout consume the GH-92 spec/plan, task carrier, evidence map, build evidence, focused tests, smoke output, PR metadata, and hosted checks. Recheck condition: require full suite artifacts if the PR adds public OpenAPI/SDK schema, persistent storage schema, raw artifact capture, Core/App repository changes, real account data, provider marketplace/installers, remote browser support, viewer/handoff ownership, or cross-repo contract changes.
- Rationale: This Work Item completes a small in-process reference model and runnable smoke over the GH-88 runtime skeleton.
- Consumer boundary: `pnpm typecheck`, `pnpm test`, `pnpm smoke:runtime`, optional local-browser `pnpm smoke:runtime:local`, Loom suite/carrier/evidence/build checks, PR metadata readback, and hosted checks are sufficient for this slice.
- Recheck condition: Require a broader suite if this PR adds persistent storage, public schema/SDK/OpenAPI artifacts, raw capture artifacts, cross-repo consumers, real account state, remote browser support, or Viewer/handoff scope.
