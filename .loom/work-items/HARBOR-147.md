# HARBOR-147

## Static Facts

- Item ID: HARBOR-147
- Goal: Protect Stage 6 private capture and no-submit boundaries for redacted preview export consumers.
- Scope: Covers Harbor #147/#148/#149/#150 under FR #146; excludes true submit, Browser console, hosted browser, real accounts/profiles/pages, raw evidence export, Core envelopes, and App UI.
- Execution Path: work/harbor-147-no-submit-private-boundary
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-147.md
- Review Entry: .loom/reviews/HARBOR-147.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; git diff --check
- Closing Condition: PR merged, #147/#148/#149/#150/#146 closeout evidence posted, milestone #10 closed with open_issues=0, and current pointer returns to no_active_item.

## Covered Work Items

- #147 record no-submit guard facts.
- #148 mark raw material private boundary.
- #149 provide redacted preview export fixture.
- #150 validate private/raw material exclusion from shared evidence.

## Associated Artifacts

- packages/runtime-api/src/index.ts
- packages/runtime-api/src/index.test.ts
- packages/runtime-api/src/smoke.ts
- .loom/specs/HARBOR-147/**
