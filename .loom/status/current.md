# Current Status

## Derived Fact Chain View

- Item ID: GH-62
- Goal: 盘点 `docs/draft/*.md` 归宿，收口 Harbor docs-only draft lifecycle，使 accepted runtime/session/provider/page/evidence 合同不再在 draft 中保留双份 truth。
- Scope: 仅更新 `docs/draft/**`、`docs/contracts/README.md` 和 GH-62 item-specific Loom carrier。
- Execution Path: docs-only/governance
- Workspace Entry: .
- Recovery Entry: .loom/progress/GH-62.md
- Review Entry: .loom/reviews/GH-62.json
- Validation Entry: `git diff --check`; JSON validation; `loom fact-chain`; `loom suite validate`; `loom suite carrier validate`.
- Closing Condition: PR ready for GH-62 with no merge and no issue closeout.
- Current Checkpoint: merge
- Current Stop: PR #65 is open; draft absorption review is refreshed for head a94d586e937cc72ee5e75382a1a3da34809ca4bd and local validation passed.
- Next Step: Run hosted merge gate, then merge and perform post-merge issue closeout.
- Blockers: None recorded.
- Latest Validation Summary: At head a94d586e937cc72ee5e75382a1a3da34809ca4bd, git diff --check passed; .loom/**/*.json passed jq validation; loom fact-chain --target /Volumes/2T/.codex/worktrees/docs-draft-closeout/Harbor --item GH-62 --json passed; loom suite validate --target /Volumes/2T/.codex/worktrees/docs-draft-closeout/Harbor --item GH-62 --json passed; loom suite carrier validate --target /Volumes/2T/.codex/worktrees/docs-draft-closeout/Harbor --item GH-62 --json passed after adding the formal docs/README.md directory semantics entry.
- Recovery Boundary: Docs-only draft closeout. Do not merge, close issues, alter runtime/provider code, or create `docs/guides/`.
- Current Lane: docs-draft-closeout

## Runtime Evidence

- Run Entry: not_applicable
- Logs Entry: not_applicable
- Diagnostics Entry: not_applicable
- Verification Entry: .loom/specs/GH-62/build-evidence.json
- Lane Entry: harbor

## Sources

- Static Truth: .loom/work-items/GH-62.md
- Dynamic Truth: .loom/progress/GH-62.md
- Locator Truth: .loom/bootstrap/init-result.json
- Fact Chain CLI: loom fact-chain --target . --json
