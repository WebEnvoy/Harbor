# Implementation Contract

## Ownership

- May edit `packages/runtime-api/src/runtime-session-types.ts`, `packages/runtime-api/src/runtime-session.ts`, `packages/runtime-api/src/local-provider-launcher.ts`, `packages/runtime-api/src/identity-environment.ts`, `packages/runtime-api/src/identity-environment-manager.ts`, `packages/runtime-api/src/index.test.ts`, and HARBOR-219 Loom carriers.
- Must not edit App/Core/Lode, site task logic, raw browser profile material, real account/profile state, cookies, tokens, production page evidence, or hosted/remote browser behavior.

## Verification

- Required local checks: `pnpm typecheck`, `pnpm test`, `pnpm smoke:runtime:api`, detection-only provider readback, cross-repo App packaged runtime/readonly smoke where needed, `git diff --check`, Loom fact-chain/status, suite validate, and carrier/evidence validate.
- Live provider evidence is detection-only and must not launch a real browser, open a production page, or use a user profile without explicit user authorization.
