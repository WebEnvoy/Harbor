# Execution Breakdown

## U-001 Screenshot Failure Evidence Guard

- Covered issue: Harbor #212.
- Files: `packages/runtime-api/src/index.ts`, `packages/runtime-api/src/index.test.ts`.
- Validation: typecheck, test, fixture runtime smoke, diff check, Loom suite checks.

## U-002 PR Metadata

- PR body must list Harbor #212 as anchor.
- PR body must explicitly exclude #209/#210/#211/#208/#218 parent closeout, App/Core/Lode work, live browser launch, production pages, and write actions.
