# HARBOR-245 Progress

## Dynamic Facts

- Item ID: HARBOR-245
- Current Checkpoint: independent-review P1 repair verified
- Current Stop: Implementation and local verification are complete; do not create a PR until Loom #2026/#2015 is merged.
- Next Step: Rebase/read back the repaired merge-gate surface, then create the Harbor #245 PR without changing scope.
- Blockers: PR creation and shared-current carrier update are intentionally deferred until Loom #2026/#2015 is merged.
- Recovery Boundary: No automatic login, no production browser/profile action, no Cookie/password/token/CAPTCHA/raw profile/DOM/HAR/screenshot bytes, no submit/publish/send/save, no risk-control bypass, hosted browser, marketplace, or bulk collection.
- Current Lane: Harbor #245 allowlisted one-shot read-operation implementation.

## Execution Ledger

- Ledger Binding: recovery_entry
- Plan Locator: .loom/specs/HARBOR-245/plan.md
- Acceptance Locator: .loom/specs/HARBOR-245/implementation-contract.md
- Validation Evidence Locator: .loom/specs/HARBOR-245/evidence-map.md
- Latest Validation Summary: 2026-07-11 local worktree validation: `pnpm typecheck`; `pnpm test` (53 passed); `pnpm smoke:runtime:api` (fixture-only, no real account/profile/page); and `git diff --check` passed. Focused tests reject caller-created user control before authenticated manual-auth completion, PATCH/release bypass, fabricated source/evidence refs and summary-source binding, and BOSS/XHS responses with the wrong operation path or query; the minimal local-provider success fixture supplies distinct observed opaque source/evidence refs, while the real URL/status-only CDP probe fails closed as `evidence_refs_missing`.
- Evidence Freshness: current local implementation evidence; merged-head live evidence remains required.
