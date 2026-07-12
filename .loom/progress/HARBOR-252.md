# HARBOR-252 Progress

## Dynamic Facts

- Item ID: HARBOR-252
- Current Checkpoint: merge
- Current Stop: Integrated product head `d9948a50bede0e394869850679c30166484f94cc` passed full validation and independent merge-result review after incorporating the merged HARBOR-251 pre-admission baseline.
- Next Step: Consume hosted merge gate and perform controlled merge; keep #252 open until merged Core/App live XHS and BOSS detail E2E produces refs.
- Blockers: None recorded.
- Recovery Boundary: No real browser/profile/page action; no Cookie/token/raw profile/DOM/HAR/network body persistence; no publish/send/apply/greet/save/submit; no bulk collection or risk-control bypass.
- Current Lane: Harbor #252 detail read operations.
- Latest Validation Summary: 2026-07-12T06:47Z: At integrated product head `d9948a50bede0e394869850679c30166484f94cc`, `pnpm test` passed 78/78, `pnpm typecheck`, `pnpm build`, `git diff --check`, and `git diff --cached --check` passed. Independent merge-result review returned ALLOW after confirming HARBOR-251 Vue ownership, abort/deadline, WAPI-deferred pre-admission and HARBOR-252 XHS/BOSS detail target/probe/result paths are both preserved. BOSS detail now inherits security-check and QR-login overlay detection with regression coverage. Lode merge `66d79b4e600565a00515b1c801e84291edc7b0c1` and registry digest `dca2761b7feb09a0ab86f7202e153da3c97b21a75299af6adaf64eade319deef` remain pinned. No production-page action or external write occurred in this merge lane.

## Execution Ledger

- Ledger Binding: recovery_entry
- Plan Locator: .loom/specs/HARBOR-252/plan.md
- Acceptance Locator: .loom/specs/HARBOR-252/implementation-contract.md
- Validation Evidence Locator: .loom/specs/HARBOR-252/evidence-map.md
- Handoff Notes Locator: .loom/specs/HARBOR-252/task-carrier.md
- Evidence Freshness: current
