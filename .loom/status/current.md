# Current Status

## Derived Fact Chain View

- Item ID: HARBOR-252
- Goal: Align Xiaohongshu note-detail operation source/evidence completion proof exactly with merged Lode detail truth.
- Scope: XHS detail pinned ref requirements, capture/completion proof, focused contract regressions, and HARBOR-252 carriers.
- Execution Path: work/harbor-252-lode-detail-alignment
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-252.md
- Review Entry: .loom/reviews/HARBOR-252.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm build; git diff --check
- Closing Condition: Ready implementation PR only. Keep #252 open until merged-head Core/App live detail E2E produces refs.
- Current Checkpoint: review
- Current Stop: Product head `17146821603b1abbcb37b0349a9bb14053a2a9d1` passed full validation and independent final review with no findings.
- Next Step: Commit/push review and build carriers, create the HARBOR-252 corrective PR, and consume hosted gate.
- Blockers: None
- Latest Validation Summary: 2026-07-12T12:30Z at product head 17146821603b1abbcb37b0349a9bb14053a2a9d1: pnpm typecheck, pnpm build, targeted contract tests, pnpm test 85/85, and git diff --check passed. Independent final review returned ALLOW: XHS detail producer, capture, completion and post-check exactly bind Lode merge 66d79b4 source/evidence requirements; refs-only privacy and search/BOSS/auth/session behavior remain unchanged.
- Recovery Boundary: Revert only HARBOR-252 contract/test changes and carriers. Do not modify BOSS production, auth/session/profile, Core/Lode/App, or external runtime state.
- Current Lane: HARBOR-252 XHS detail Lode truth alignment.

## Runtime Evidence

- Run Entry: no production run in corrective implementation; merged packaged App live E2E required for closeout
- Logs Entry: typecheck/build; targeted contract tests; full 85/85; diff check
- Diagnostics Entry: packages/runtime-api/src/read-operation.ts; packages/runtime-api/src/read-operation.test.ts
- Verification Entry: .loom/specs/HARBOR-252/build-evidence.json
- Lane Entry: .loom/specs/HARBOR-252/plan.md

## Sources

- Static Truth: .loom/work-items/HARBOR-252.md
- Dynamic Truth: .loom/progress/HARBOR-252.md
- Locator Truth: .loom/bootstrap/init-result.json
- Fact Chain CLI: loom fact-chain --target . --item HARBOR-252 --json
