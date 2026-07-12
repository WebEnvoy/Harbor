# HARBOR-251

## Static Facts

- Item ID: HARBOR-251
- Goal: Make the pinned `boss_job_search` operation reachable by verifying the BOSS SPA through a safe pre-admission probe while deferring exact WAPI proof to the operation probe.
- Scope: BOSS `job_search` site-resource safe probe, refs-only fact mapping, directed runtime tests, and HARBOR-251 item-specific carriers.
- Execution Path: work/harbor-251-boss-resource-probe
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-251.md
- Review Entry: .loom/reviews/HARBOR-251.json
- Validation Entry: pnpm typecheck; targeted tests; pnpm test; git diff --check
- Closing Condition: Create and push a Draft PR covering the pre-admission correction; keep #251 open for merged App/Core live evidence.

## Host Binding

- GitHub Work Item: https://github.com/WebEnvoy/Harbor/issues/251
- Parent FR: https://github.com/WebEnvoy/Harbor/issues/218
- Consumed Allowlist: https://github.com/WebEnvoy/Lode/issues/262

## Ownership Constraints

- Do not edit App, Core, Lode, HARBOR-245 item-specific carriers, or parent FR truth.
- Reuse the existing read-operation, managed-session, authentication, and trusted-probe boundaries.
- Keep exact query/city-bound `network.wapi_zpgeek.available` unknown before execution; only the allowlisted read-operation may prove it.
- No real login, send, greet, submit, apply, save, bulk collection, risk-control bypass, or sensitive material access.

## Associated Artifacts

- `.loom/progress/HARBOR-251.md`
- `.loom/specs/HARBOR-251/spec.md`
- `.loom/specs/HARBOR-251/plan.md`
- `.loom/specs/HARBOR-251/implementation-contract.md`
- `.loom/specs/HARBOR-251/evidence-map.md`
- `.loom/specs/HARBOR-251/contracts.md`
- `.loom/specs/HARBOR-251/consistency-analysis.md`
- `.loom/specs/HARBOR-251/execution-breakdown.md`
- `.loom/specs/HARBOR-251/readiness-checklist.md`
- `.loom/specs/HARBOR-251/suite-index.md`
- `.loom/specs/HARBOR-251/task-carrier.md`
- `packages/runtime-api/src/read-operation.ts`
- `packages/runtime-api/src/site-runtime-facts.ts`
- `packages/runtime-api/src/local-provider-launcher.ts`
- `packages/runtime-api/src/read-operation.test.ts`
- `packages/runtime-api/src/server.test.ts`
- `packages/runtime-api/src/index.ts`
- `packages/runtime-api/src/runtime-session-types.ts`
