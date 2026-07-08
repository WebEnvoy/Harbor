# Implementation Contract

## Ownership

- Main controller owns `.loom/work-items/HARBOR-212.md`, `.loom/progress/HARBOR-212.md`, `.loom/specs/HARBOR-212/**`, PR metadata, GitHub closeout, review, merge, and issue state.
- Worker may edit only `packages/runtime-api/src/index.ts` and `packages/runtime-api/src/index.test.ts`.
- No lane may edit shared `.loom/status/current.md` for this PR.

## Forbidden Targets

- App/Core/Lode repositories.
- Provider launch internals outside the screenshot evidence failure guard.
- Real account/profile/Cookie material.
- Production page actions.
- Raw screenshot bytes, raw DOM, raw HAR, or network body storage.
- GitHub issue/PR writes by subagents.

## Verification

- Required local checks: `pnpm typecheck`, `pnpm test`, `pnpm smoke:runtime`, `git diff --check`, Loom verify/fact-chain, suite validate, carrier validate, evidence validate.
- `pnpm smoke:runtime:local` is excluded unless the controller first records explicit allowed and prohibited real-browser actions.
