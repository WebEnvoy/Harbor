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
- Current Checkpoint: merge
- Current Stop: Product head `5b4aa2ed056fc07553a0367a4c5e2e258dbc1119` passed all targeted/full validation and independent current-head code/spec review against merged Lode truth.
- Next Step: Consume hosted merge gate and perform controlled merge; keep #252 open until merged Core/App live XHS and BOSS detail E2E produces refs.
- Blockers: None recorded.
- Latest Validation Summary: 2026-07-12T06:12Z: At head `5b4aa2ed056fc07553a0367a4c5e2e258dbc1119`, 38 targeted and 73 full tests, `pnpm typecheck`, `pnpm build`, and `git diff --check` passed. Independent review confirmed exact Lode source/evidence kinds, XHS current-note Pinia/DOM agreement, full challenge detection, bounded session-cleared tombstones, target-bound BOSS detail WAPI plus DOM agreement, 500-character summary and 4000-character description bounds, opaque detail refs, and sensitive-material exclusion. Lode merge `66d79b4e600565a00515b1c801e84291edc7b0c1` and registry digest `dca2761b7feb09a0ab86f7202e153da3c97b21a75299af6adaf64eade319deef` were verified. No production-page action or external write occurred.
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
