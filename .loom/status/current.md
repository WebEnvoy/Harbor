# Current Status

## Derived Fact Chain View

- Item ID: HARBOR-219
- Goal: Keep Harbor #219 runtime API compatible with packaged App/Core readonly smoke by exposing FixtureBrowser-only site facts for local contract validation.
- Scope: Covers Harbor #219 under parent Harbor #218, with ownership constrained to runtime API site facts, fixture-only API smoke support, and HARBOR-219 carriers.
- Execution Path: work/harbor-218-fixture-site-facts
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-219.md
- Review Entry: .loom/reviews/HARBOR-219.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; pnpm smoke:runtime:api; git diff --check; loom fact-chain --target . --json; loom verify --target . --json; loom suite validate --target . --item HARBOR-219 --json; loom suite carrier validate --target . --item HARBOR-219 --json; loom suite evidence validate --target . --item HARBOR-219 --json
- Closing Condition: PR created and pushed for Harbor #219 with PR body listing covered and non-covered issues; no issue closeout in this worker batch.
- Current Checkpoint: merge
- Current Stop: Branch `work/harbor-218-fixture-site-facts` is open as PR #238 at head `8efd348d4999a67e9c4c72a9bf53533954644455`. It marks site facts available only when runtime facts identify `FixtureBrowser`, so the packaged App/Core readonly smoke can exercise owner-shaped refs under a fixture-only boundary. This does not close Harbor #218/#219 live E2E scope.
- Next Step: Rerun hosted `loom-pr-merge-gate` for PR #238 after this current-head review carrier sync, then controlled merge only if hosted checks are clean. Do not treat fixture smoke as live App/Core E2E evidence.
- Blockers: None
- Latest Validation Summary: 2026-07-09T17:18Z UTC local validation passed for PR #238 branch `work/harbor-218-fixture-site-facts` at head `8efd348d4999a67e9c4c72a9bf53533954644455`: `pnpm install --frozen-lockfile` was required because this worktree had no `node_modules`, then `pnpm test` and `git diff --check` passed. Cross-repo App smoke also passed from the App worktree with `WEBENVOY_CORE_RUNTIME_SOURCE_DIR=/Volumes/2T/dev/WebEnvoy/WebEnvoy.worktrees/core-244-harbor-site-facts-run WEBENVOY_HARBOR_RUNTIME_SOURCE_DIR=/Volumes/2T/dev/WebEnvoy/Harbor.worktrees/harbor-218-fixture-site-facts npm run smoke:packaged:readonly`. Scope: Harbor marks site facts available only when runtime facts identify `FixtureBrowser`, so this supports local packaged contract smoke only; no real Xiaohongshu/BOSS account, browser profile, Cookie, production page action, submit, publish, send, hosted browser, marketplace, bulk collection, full account cloud hosting, or risk-control bypass occurred.
- Recovery Boundary: Revert branch `work/harbor-218-fixture-site-facts`; no App/Core/Lode code changes, real account/profile/Cookie/production page action, submit, publish, send, hosted browser, marketplace, bulk collection, or risk-bypass claim occurred.
- Current Lane: Harbor #219 FixtureBrowser site facts current-head carrier sync for PR #238.

## Runtime Evidence

- Run Entry: fixture_local_contract_smoke_no_live_site
- Logs Entry: command output from `pnpm test`; App `smoke:packaged:readonly`
- Diagnostics Entry: packages/runtime-api/src/site-runtime-facts.ts; packages/runtime-api/src/server.test.ts
- Verification Entry: .loom/progress/HARBOR-219.md
- Lane Entry: HARBOR-219

## Sources

- Static Truth: .loom/work-items/HARBOR-219.md
- Dynamic Truth: .loom/progress/HARBOR-219.md
- Locator Truth: .loom/bootstrap/init-result.json
- Fact Chain CLI: loom fact-chain --target . --item HARBOR-219 --json
