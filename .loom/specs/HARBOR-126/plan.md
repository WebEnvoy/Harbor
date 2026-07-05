# Plan

## Implementation Goal

- Add the Harbor facts App #135 and Core attribution can consume for evidence/viewer status without exposing private runtime material.

## Phases

### Phase 1

- Objective: Add evidence status fixture and runtime blocker facts.
- Deliverable: `page-scene.ts` and `index.ts` updates for evidence status, expiry, and profile/session blocker fixture launchers.
- Exit condition: TypeScript typecheck passes.

### Phase 2

- Objective: Prove App-safe behavior with tests and smoke.
- Deliverable: `index.test.ts` and `smoke.ts` coverage for redacted/private boundary, fresh/stale/expired status, and runtime blockers.
- Exit condition: test and runtime smoke pass.

## Validation

- `pnpm typecheck`
- `pnpm test`
- `pnpm smoke:runtime`
- `git diff --check`
- `loom suite validate --target . --item HARBOR-126 --json`
- `loom suite evidence validate --target . --item HARBOR-126 --json`
- `loom suite carrier validate --target . --item HARBOR-126 --json`
- `loom fact-chain --target . --json`
- `loom verify --target . --json`

## Dependencies

- App #135 consumes evidence/viewer refs and status.
- Core consumes runtime/evidence refs and blocking states for run attribution.
- Lode package/repair truth remains out of scope.

## Ready For Review

- [x] Scope and non-goals are explicit.
- [x] Runtime and evidence status outputs are refs-only.
- [x] No raw/private browser material is exposed.
