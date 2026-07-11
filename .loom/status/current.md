# Current Status

## Derived Fact Chain View

- Item ID: HARBOR-252
- Goal: Add one-shot Xiaohongshu note-detail and BOSS job-detail read operations that consume only opaque refs minted from a same-session real search result.
- Scope: Harbor detail target registry, Runtime API operation admission, local-provider detail probe, focused tests, and HARBOR-252 item-specific carriers.
- Execution Path: work/harbor-252-detail-read-operations
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-252.md
- Review Entry: .loom/reviews/HARBOR-252.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm build; git diff --check
- Closing Condition: Ready implementation PR only. Keep #252 open until merged-head Core/App live detail E2E produces refs.
- Current Checkpoint: implementation
- Current Stop: Detail implementation, focused/full tests, and fact-chain/suite validation pass; current-head review and PR creation remain.
- Next Step: Complete current-head review, push, and create a scoped ready PR. Do not merge or close #252.
- Blockers: None recorded.
- Latest Validation Summary: 2026-07-12 on `work/harbor-252-detail-read-operations`: `pnpm typecheck`, `pnpm test` (67/67), `pnpm build`, and `git diff --check` passed. `loom doctor`, `loom verify`, suite/carrier validation, and HARBOR-252 fact-chain passed after exclusive pointer transfer. `pnpm smoke:runtime:api` remains baseline-blocked at `manual_auth_authorization_unavailable` because its direct logged-in fixture lacks server-owned authentication provenance; no production page/profile/account action occurred.
- Recovery Boundary: No real browser/profile/page action; no Cookie/token/raw profile/DOM/HAR/network body persistence; no publish/send/apply/greet/save/submit; no bulk collection or risk-control bypass.
- Current Lane: Harbor #252 detail read operations.

## Runtime Evidence

- Run Entry: Contract and directed probe tests only; no production site action is performed in this implementation lane.
- Logs Entry: pnpm build; directed node tests; pnpm typecheck; pnpm test; git diff --check.
- Diagnostics Entry: packages/runtime-api/src/detail-read-target.ts; packages/runtime-api/src/read-operation.ts; packages/runtime-api/src/local-provider-launcher.ts; packages/runtime-api/src/server.test.ts
- Verification Entry: .loom/progress/HARBOR-252.md
- Lane Entry: HARBOR-252

## Sources

- Static Truth: .loom/work-items/HARBOR-252.md
- Dynamic Truth: .loom/progress/HARBOR-252.md
- Locator Truth: .loom/bootstrap/init-result.json
- Fact Chain CLI: loom fact-chain --target . --item HARBOR-252 --json
