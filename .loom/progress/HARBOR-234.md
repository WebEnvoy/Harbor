# HARBOR-234 Progress

## Dynamic Facts

- Item ID: HARBOR-234
- Current Checkpoint: admission
- Current Stop: Formal worktree and GitHub Work Item are bound. Implementation has not started. The dependency correction added Harbor #234 as a hard upstream for App #265 and Core #243 because Harbor lacks site-level resource facts and write-precheck facts.
- Next Step: Implement Harbor runtime API facts projections and focused tests, then run Harbor validation and build readiness.
- Blockers: None for local implementation. Live App E2E remains blocked until Core consumes this API and the user authorizes any real account/profile/production page action.
- Latest Validation Summary: 2026-07-09T09:35Z UTC admission readback: Harbor main `0c48d269cef5c7114e026faf458c2c5ebe0378e2`, `loom verify --target . --json` passed, `loom fact-chain --target . --json` passed with `no_active_item`, and GitHub Harbor #234 is open, parented by #218, blocking App #265 and Core #243. No product code changed yet in this worktree.
- Recovery Boundary: Revert branch `work/harbor-234-site-runtime-facts`. No App/Core/Lode code changes, real account/profile/Cookie/production page action, submit, publish, send, save, hosted browser, marketplace, bulk collection, or risk-bypass claim may occur in this batch.
- Current Lane: Harbor #234 site-level runtime facts and write-precheck facts.

## Execution Ledger

- Ledger Binding: recovery_entry
- Plan Locator: .loom/specs/HARBOR-234/plan.md
- Acceptance Locator: .loom/specs/HARBOR-234/spec.md
- Validation Evidence Locator: .loom/specs/HARBOR-234/evidence-map.md
- Handoff Notes Locator: .loom/specs/HARBOR-234/task-carrier.md
- Evidence Freshness: current

## Runtime Evidence

- Run Entry: pending
- Logs Entry: .loom/progress/HARBOR-234.md
- Diagnostics Entry: .loom/specs/HARBOR-234/consistency-analysis.md
- Verification Entry: loom verify --target . --json
- Lane Entry: HARBOR-234
