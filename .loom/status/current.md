# Current Status

## Derived Fact Chain View

- Item ID: HARBOR-234
- Goal: Add Harbor Runtime API projections for site-level resource facts and write-precheck facts so Core can satisfy Lode Xiaohongshu/BOSS resource requirements without receiving raw browser material.
- Scope: Covers Harbor #234 under parent Harbor #218. Ownership is limited to Harbor runtime API facts projection code, focused tests, and HARBOR-234 item-specific Loom carriers. The implementation may expose session-scoped facts endpoints and write-precheck facts endpoints that return public/redacted status, refs, failure classes, and guard state only.
- Execution Path: work/harbor-234-site-runtime-facts
- Workspace Entry: /Volumes/2T/dev/WebEnvoy/Harbor.worktrees/harbor-234-site-runtime-facts
- Recovery Entry: .loom/progress/HARBOR-234.md
- Review Entry: .loom/reviews/HARBOR-234.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; git diff --check; loom fact-chain --target . --json; loom verify --target . --json; loom suite validate --target . --item HARBOR-234 --json; loom suite carrier validate --target . --item HARBOR-234 --json
- Closing Condition: PR ready with current-head review and hosted checks for Harbor #234. Issue closeout requires merge commit, PR/head SHA, validation commands, sample facts payload evidence, and explicit boundary that no live account/profile/production page action occurred in this PR.
- Current Checkpoint: admission
- Current Stop: Formal worktree and GitHub Work Item are bound. Implementation has not started. The dependency correction added Harbor #234 as a hard upstream for App #265 and Core #243 because Harbor lacks site-level resource facts and write-precheck facts.
- Next Step: Implement Harbor runtime API facts projections and focused tests, then run Harbor validation and build readiness.
- Blockers: None for local implementation. Live App E2E remains blocked until Core consumes this API and the user authorizes any real account/profile/production page action.
- Latest Validation Summary: 2026-07-09T09:35Z UTC admission readback: Harbor main `0c48d269cef5c7114e026faf458c2c5ebe0378e2`, `loom verify --target . --json` passed, `loom fact-chain --target . --json` passed with `no_active_item`, and GitHub Harbor #234 is open, parented by #218, blocking App #265 and Core #243. No product code changed yet in this worktree.
- Recovery Boundary: Revert branch `work/harbor-234-site-runtime-facts`. No App/Core/Lode code changes, real account/profile/Cookie/production page action, submit, publish, send, save, hosted browser, marketplace, bulk collection, or risk-bypass claim may occur in this batch.
- Current Lane: Harbor #234 site-level runtime facts and write-precheck facts.

## Runtime Evidence

- Run Entry: pending
- Logs Entry: .loom/progress/HARBOR-234.md
- Diagnostics Entry: .loom/specs/HARBOR-234/consistency-analysis.md
- Verification Entry: loom verify --target . --json
- Lane Entry: HARBOR-234

## Sources

- Static Truth: .loom/work-items/HARBOR-234.md
- Dynamic Truth: .loom/progress/HARBOR-234.md
- Locator Truth: .loom/bootstrap/init-result.json
- Fact Chain CLI: loom fact-chain --target . --json
