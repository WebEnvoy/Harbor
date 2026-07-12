# HARBOR-252 Progress

## Dynamic Facts

- Item ID: HARBOR-252
- Current Checkpoint: implementation
- Current Stop: PR #255 product head `f64f42def37e628621b3a951bd06da3f3818530f` implements bounded public summaries, XHS public note_id, and BOSS opaque detail_ref; PR is Draft because the final Lode detail truth is not merged.
- Next Step: Wait for Lode #268 correction PR #271 to merge, then update the exact merge commit/registry digest, rerun validation, and perform current-head code/spec review. Do not merge or close #252.
- Blockers: Lode #268 correction PR #271 is Draft; prior merge `35a0af90b919979b673feeae721add6212c9687f` and digest `34e579d...` are partial evidence only and cannot approve Harbor merge.
- Recovery Boundary: No real browser/profile/page action; no Cookie/token/raw profile/DOM/HAR/network body persistence; no publish/send/apply/greet/save/submit; no bulk collection or risk-control bypass.
- Current Lane: Harbor #252 detail read operations.
- Latest Validation Summary: 2026-07-12 at product head `f64f42def37e628621b3a951bd06da3f3818530f`: `pnpm typecheck`, `pnpm test` (70/70), `pnpm build`, and `git diff --check` passed. XHS Vue/Pinia readiness, public note_id without xsec token, BOSS opaque detail_ref without securityId/encryptJobId, bounded normalized summaries, target deletion, probe-failure replay rejection, and refs-only responses are covered. Final Lode pin validation remains pending PR #271 merge. No production page/profile/account action occurred.

## Execution Ledger

- Ledger Binding: recovery_entry
- Plan Locator: .loom/specs/HARBOR-252/plan.md
- Acceptance Locator: .loom/specs/HARBOR-252/implementation-contract.md
- Validation Evidence Locator: .loom/specs/HARBOR-252/evidence-map.md
- Handoff Notes Locator: .loom/specs/HARBOR-252/task-carrier.md
- Evidence Freshness: current
