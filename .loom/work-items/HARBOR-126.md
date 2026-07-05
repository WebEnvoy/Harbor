# HARBOR-126

## Static Facts

- Item ID: HARBOR-126
- Goal: Provide Stage 5 validation runtime and App-safe viewer/evidence status fixtures.
- Scope: Batch covers Harbor #118, #119, #123, #124, #125, #126, and #127 through Runtime API validation facts, snapshot/refmap/evidence refs, private/redacted boundaries, evidence freshness/retention states, and smoke coverage.
- Execution Path: stage5/validation-evidence-status-fixtures
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-126.md
- Review Entry: .loom/reviews/HARBOR-126.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; git diff --check
- Closing Condition: App/Core can consume Harbor refs and status fixtures without raw DOM, raw network, cookies, tokens, profile storage, or private local browser material.

## Covered Work Items

- #118 validation runtime facts fixture.
- #119 capturable Snapshot, RefMap, and Evidence refs.
- #123 private capture and redacted export smoke.
- #124 stale RefMap, page changed, evidence unavailable states.
- #125 evidence retention policy v0.
- #126 App-displayable viewer/evidence status fixture.
- #127 evidence provenance and freshness smoke.

## Associated Artifacts

- `.loom/work-items/HARBOR-126.md`
- `.loom/progress/HARBOR-126.md`
- `.loom/reviews/HARBOR-126.json`
- `.loom/specs/HARBOR-126/spec.md`
- `.loom/specs/HARBOR-126/plan.md`
- `.loom/specs/HARBOR-126/implementation-contract.md`
- `.loom/specs/HARBOR-126/evidence-map.md`
- `.loom/specs/HARBOR-126/task-carrier.md`
- `.loom/status/current.md`
- `packages/runtime-api/src/page-scene.ts`
- `packages/runtime-api/src/index.ts`
- `packages/runtime-api/src/index.test.ts`
- `packages/runtime-api/src/smoke.ts`
