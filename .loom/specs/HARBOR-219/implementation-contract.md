# Implementation Contract

## Ownership

- May edit `packages/runtime-api/src/server.ts`, `packages/runtime-api/src/runtime-server.ts`, `packages/runtime-api/src/server.test.ts`, `package.json`, and HARBOR-219 Loom carriers.
- Must not edit App/Core/Lode, provider launch internals, site task logic, or real account/profile material.

## Verification

- Required local checks: `pnpm typecheck`, `pnpm test`, `pnpm smoke:runtime`, HTTP readiness/provider readback, `git diff --check`, Loom verify/fact-chain, suite validate, carrier validate.
- Live provider evidence is detection-only and must not open a production page or user profile.
