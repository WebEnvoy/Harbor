# Implementation Contract

## Implementation Scope

- `packages/runtime-api/src/viewer-control.ts` owns the in-process Viewer/control/Core/App facts model for this slice.
- `packages/runtime-api/src/index.ts` wires the facts model into Runtime Session creation, close, public readback methods, and exported types/constants.
- `packages/runtime-api/src/index.test.ts` verifies facts shape, handoff readback, Core/App consistency, endpoint exclusion, and closed-session status.
- `packages/runtime-api/src/smoke.ts` emits fixture/local smoke readback for viewer/control, Core runtime, and App status facts.

## Consumer Contract

- Core consumes `getCoreRuntimeFacts` as citable refs and runtime facts only; it still owns admission, Run Record, task outcome, unknown outcome, and reconciliation.
- App consumes `getAppRuntimeStatusFixture` for Browser/status display only; it still owns product UI, authorization prompts, and user intent.
- Harbor owns Runtime Session, viewer/control facts, ref provenance, and unavailable classifications.

## Exclusion Contract

- No raw CDP/VNC/WebSocket endpoints enter public facts.
- No real viewer transport, hosted browser, remote console, account/secret custody, provider marketplace, or Core/App repository changes enter this PR.
- No detailed handoff pause/lock state machine is implemented in this slice.
