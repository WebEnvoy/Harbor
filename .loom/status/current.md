# Current Status

## Derived Fact Chain View

- Item ID: GH-37
- Goal: Docs-only 收敛 Stage 2 Runtime Session lifecycle v0 合同，并覆盖 GH-37/GH-38/GH-39 对 session ref、status/error/lease、continuity/unavailable 的要求。
- Scope: 仅更新 `docs/adr/0005-runtime-session-lifecycle-v0.md` 和 GH-37 item-specific Loom carrier。
- Execution Path: docs-only/governance
- Workspace Entry: .
- Recovery Entry: .loom/progress/GH-37.md
- Review Entry: .loom/reviews/GH-37.json
- Validation Entry: `git diff --check`; low-cost repo/Loom checks available in this worktree; hosted checks after PR creation
- Closing Condition: Ready PR to `main` exists for GH-37 docs-only contract; do not merge PR or close GH-36/GH-37/GH-38/GH-39 in this lane.
- Current Checkpoint: review_recorded
- Current Stop: Runtime Session lifecycle v0 contract, GH-37 carrier, validation, and review artifacts recorded; PR creation pending.
- Next Step: Push branch and open a Ready PR to `main`.
- Blockers: None recorded.
- Latest Validation Summary: On head b7470c414b15d78c9e589b156dab85af96ac43a0, `git diff --check` passed; no Python files are tracked; `loom doctor`, `loom verify`, `loom fact-chain`, and `loom suite validate --item GH-37` passed with absolute target.
- Recovery Boundary: Continue from this worktree and branch; do not use `INIT-0001`; do not merge or close issues.
- Current Lane: Harbor Stage 2 Runtime Session docs-only contract

## Runtime Evidence

- Run Entry: not_applicable
- Logs Entry: not_applicable
- Diagnostics Entry: not_applicable
- Verification Entry: loom verify --target . --json
- Lane Entry: not_applicable

## Sources

- Static Truth: .loom/work-items/GH-37.md
- Dynamic Truth: .loom/progress/GH-37.md
- Locator Truth: .loom/bootstrap/init-result.json
- Fact Chain CLI: loom fact-chain --target . --json
