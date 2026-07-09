# Current Status

## Derived Fact Chain View

- Item ID: HARBOR-219
- Goal: Repair the local Harbor Runtime HTTP API admission path so App/Core can start it from source without stale ignored build output and verify the API contract before real browser/session work.
- Scope: Covers Harbor #219 under parent Harbor #218, with ownership constrained to the runtime API start command, runtime server startup metadata, fixture-only API smoke, and HARBOR-219 carriers.
- Execution Path: work/harbor-234-runtime-admission-smoke
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-219.md
- Review Entry: .loom/reviews/HARBOR-219.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; pnpm smoke:runtime:api; git diff --check; loom fact-chain --target . --json; loom verify --target . --json; loom suite validate --target . --item HARBOR-219 --json; loom suite carrier validate --target . --item HARBOR-219 --json; loom suite evidence validate --target . --item HARBOR-219 --json
- Closing Condition: PR created and pushed for Harbor #219 with PR body listing covered and non-covered issues; no issue closeout in this worker batch.
- Current Checkpoint: implementation_validated
- Current Stop: Branch `work/harbor-234-runtime-admission-smoke` implements the HARBOR-219 runtime admission repair and has carrier-only PR-prep validation refreshed for the current worktree. Product code remains at implementation head `305d5dca784bd897fbdca1c4f15026036f0d6e84`; this refresh only updates Loom carrier/progress/spec/status metadata.
- Next Step: Main controller can create/update a PR for Harbor #219 after reading back the pushed branch head and refreshing current-head review/PR metadata. Do not close Harbor #219 in this worker batch and do not treat fixture smoke as live App/Core E2E evidence.
- Blockers: None
- Latest Validation Summary: 2026-07-09T14:14Z UTC Harbor #219 current-head review validation passed at head b3f55780efdd632466a8ca5cc02741223b2c15e6. `pnpm typecheck`, `pnpm smoke:runtime:api`, `git diff --check`, `loom suite carrier validate --target . --item HARBOR-219 --json`, and `loom suite evidence validate --target . --item HARBOR-219 --json` passed in the formal worktree. Subagent PR-prep validation also passed `jq empty`, `loom fact-chain --target . --item HARBOR-219 --json`, and `loom verify --target . --json`; earlier same-product-head validation passed `pnpm test`, `pnpm smoke:runtime`, and `pnpm smoke:runtime:api`. Runtime API smoke used fixture provider only and reported real_account=not_used, real_browser_profile=not_used, production_page=not_opened, external_write_actions=not_performed.
- Recovery Boundary: Revert this branch or carrier refresh; no App/Core/Lode code changes, real account/profile/Cookie/production page action, submit, publish, send, hosted browser, marketplace, bulk collection, or risk-bypass claim occurred.
- Current Lane: Harbor runtime API admission smoke for App/Core packaged consumer readiness.

## Runtime Evidence

- Run Entry: .loom/specs/HARBOR-219/build-evidence.json and fixture-only `pnpm smoke:runtime:api` reported by the worker branch.
- Logs Entry: .loom/progress/HARBOR-219.md
- Diagnostics Entry: .loom/specs/HARBOR-219/consistency-analysis.md
- Verification Entry: loom verify --target . --json
- Lane Entry: HARBOR-219

## Sources

- Static Truth: .loom/work-items/HARBOR-219.md
- Dynamic Truth: .loom/progress/HARBOR-219.md
- Locator Truth: .loom/bootstrap/init-result.json
- Fact Chain CLI: loom fact-chain --target . --item HARBOR-219 --json
