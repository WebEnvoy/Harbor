# HARBOR-142

## Static Facts

- Item ID: HARBOR-142
- Goal: Provide before-preview Snapshot/RefMap refs, target provenance, freshness states, and viewer/evidence status fixture for Stage 6 preview consumers.
- Scope: Covers Harbor #142/#143/#144/#145 under FR #141; excludes true submit, Browser console, hosted browser, raw evidence export, cookie/token/raw DOM/raw network/profile storage, Core envelopes, and App UI.
- Execution Path: work/harbor-142-preview-evidence
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-142.md
- Review Entry: .loom/reviews/HARBOR-142.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; git diff --check
- Closing Condition: PR merged, #142/#143/#144/#145/#141 closeout evidence posted, and current pointer remains no_active_item.

## Covered Work Items

- #142 generate before-preview Snapshot/RefMap refs.
- #143 record target state provenance.
- #144 express stale RefMap / page changed / evidence unavailable.
- #145 provide viewer/evidence status fixture.

## Associated Artifacts

- packages/runtime-api/src/index.ts
- packages/runtime-api/src/index.test.ts
- packages/runtime-api/src/smoke.ts
- .loom/specs/HARBOR-142/**
