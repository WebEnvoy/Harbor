# Plan

## Implementation

- Add the minimal TypeScript project entry using root `package.json` and `tsconfig.json`.
- Add `packages/runtime-api/src/index.ts` with `HarborRuntime.createSession`, `getSession`, and `closeSession`.
- Add local dedicated provider readiness through a user-provided local browser/CDP path, plus fixture mode for deterministic CI checks.
- Add a smoke CLI that prints session, readback, and close facts.
- Add focused tests for lifecycle, structured unavailable state, fact-source separation, and raw CDP endpoint exclusion.
- Add GH-88 Loom carriers and bind the current fact-chain to GH-88.

## Validation

- `pnpm install`
- `pnpm typecheck`
- `pnpm test`
- `pnpm smoke:runtime`
- `pnpm smoke:runtime:local`
- `git diff --check`
- `jq empty .loom/specs/GH-88/build-evidence.json`
- `loom suite validate --target . --item GH-88 --json`
- `loom suite carrier validate --target . --item GH-88 --json`
- `loom build --target . --item GH-88 --build-evidence .loom/specs/GH-88/build-evidence.json --json`

## PR Ready

- Push `work/GH-88-runtime-session-smoke`.
- Create a PR against `main`.
- Use GH-88 as the primary Loom Work Item and reference #85/#89/#90/#91 as covered issues.
- Do not merge or close issues before hosted gate and closeout evidence.
