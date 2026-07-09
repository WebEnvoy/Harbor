# Execution Breakdown

## Units

1. Runtime facts model: `packages/runtime-api/src/site-runtime-facts.ts`.
2. Runtime integration: `packages/runtime-api/src/index.ts` exposes site resource facts and write-precheck facts.
3. HTTP API: `packages/runtime-api/src/server.ts` exposes session-scoped facts endpoints and readiness discovery.
4. Validation: `packages/runtime-api/src/server.test.ts`, `packages/runtime-api/src/index.test.ts`, and `packages/runtime-api/src/smoke.ts`.

## Evidence Boundary

- Validation is fixture/local-safe and does not access real accounts, browser profiles, production pages, or external visible actions.
- Live App/Core E2E remains downstream of Core #243 and App #265, and requires explicit user authorization before real site/profile use.
