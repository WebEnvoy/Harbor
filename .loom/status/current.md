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
- Current Stop: PR #255 product head `f64f42def37e628621b3a951bd06da3f3818530f` implements bounded public summaries, XHS public note_id, and BOSS opaque detail_ref; PR is Draft because the final Lode detail truth is not merged.
- Next Step: Wait for Lode #268 correction PR #271 to merge, then update the exact merge commit/registry digest, rerun validation, and perform current-head code/spec review. Do not merge or close #252.
- Blockers: Lode #268 correction PR #271 is Draft; prior merge `35a0af90b919979b673feeae721add6212c9687f` and digest `34e579d...` are partial evidence only and cannot approve Harbor merge.
- Latest Validation Summary: 2026-07-12 at product head `f64f42def37e628621b3a951bd06da3f3818530f`: `pnpm typecheck`, `pnpm test` (70/70), `pnpm build`, and `git diff --check` passed. XHS Vue/Pinia readiness, public note_id without xsec token, BOSS opaque detail_ref without securityId/encryptJobId, bounded normalized summaries, target deletion, probe-failure replay rejection, and refs-only responses are covered. Final Lode pin validation remains pending PR #271 merge. No production page/profile/account action occurred.
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
