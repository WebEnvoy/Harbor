# Current Status

## Derived Fact Chain View

- Item ID: HARBOR-234
- Goal: Add Harbor Runtime API projections for site-level resource facts and write-precheck facts so Core can satisfy Lode Xiaohongshu/BOSS resource requirements without receiving raw browser material.
- Scope: Covers Harbor #234 under parent Harbor #218. Ownership is limited to Harbor runtime API facts projection code, focused tests, and HARBOR-234 item-specific Loom carriers. The implementation may expose session-scoped facts endpoints and write-precheck facts endpoints that return public/redacted status, refs, failure classes, and guard state only.
- Execution Path: work/harbor-234-site-runtime-facts
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-234.md
- Review Entry: .loom/reviews/HARBOR-234.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; git diff --check; loom fact-chain --target . --json; loom verify --target . --json; loom suite validate --target . --item HARBOR-234 --json; loom suite carrier validate --target . --item HARBOR-234 --json
- Closing Condition: PR ready with current-head review and hosted checks for Harbor #234. Issue closeout requires merge commit, PR/head SHA, validation commands, sample facts payload evidence, and explicit boundary that no live account/profile/production page action occurred in this PR.
- Current Checkpoint: closed_out
- Current Stop: PR #235 merged HARBOR-234 into `main` and Harbor #234 is closed with post-merge evidence. This closeout retires the active pointer only; App #265 and Core #243 remain downstream until Core consumes these facts and App E2E is implemented.
- Next Step: Continue the real runtime product loop from Core #243 and App #265; do not treat Harbor #234 as final App/Core live E2E evidence.
- Blockers: None
- Latest Validation Summary: 2026-07-09T10:55Z UTC post-merge closeout: PR #235 head `44a1af59800a5b09e7c42100100e8fd0eb555936` merged to `main` as `90f3fca7f394985c5b85253d722a45178fe2bd6a`; Harbor #234 closed at 2026-07-09T10:54:45Z. Pre-merge validation passed `pnpm typecheck`, `pnpm test` (32/32), `pnpm smoke:runtime` in fixture mode, `git diff --check`, `loom suite evidence validate --target . --item HARBOR-234 --json`, `loom spec-review --target . --item HARBOR-234 --json`, `loom build --target . --item HARBOR-234 --build-evidence .loom/specs/HARBOR-234/build-evidence.json --json`, `loom fact-chain --target . --item HARBOR-234 --json`, `loom resume --target . --item HARBOR-234 --json`, and `loom pr gate --target . 235 --head-sha 44a1af59800a5b09e7c42100100e8fd0eb555936 --full-output --json`. Hosted required checks passed on GitHub Actions run `29013016057`: `py-compile`, `demo-bootstrap`, `repo-local-cli`, `loom-check`, and `loom-pr-merge-gate`. This closeout does not claim App/Core live E2E or real Xiaohongshu/BOSS account/profile/production page evidence.
- Recovery Boundary: Revert PR #235 or this closeout carrier sync. No App/Core/Lode code changes, real account/profile/Cookie/production page action, submit, publish, send, save, hosted browser, marketplace, bulk collection, or risk-bypass claim occurred in this batch.
- Current Lane: Harbor #234 site-level runtime facts and write-precheck facts.

## Runtime Evidence

- Run Entry: PR #235, merge commit `90f3fca7f394985c5b85253d722a45178fe2bd6a`, hosted run `29013016057`, and 2026-07-09T10:55Z `loom closeout run --target . --item HARBOR-234 --issue 234 --pr 235 --pr-role implementation_pr --branch main --owner WebEnvoy --repo Harbor --apply --json` reconciliation sync. The closeout command closed GitHub issue #234 but returned block because the existing recovery checkpoint was still `merge`; this carrier sync records terminal state explicitly.
- Logs Entry: .loom/progress/HARBOR-234.md
- Diagnostics Entry: .loom/specs/HARBOR-234/consistency-analysis.md
- Verification Entry: loom verify --target . --json
- Lane Entry: HARBOR-234

## Sources

- Static Truth: .loom/work-items/HARBOR-234.md
- Dynamic Truth: .loom/progress/HARBOR-234.md
- Locator Truth: .loom/bootstrap/init-result.json
- Fact Chain CLI: loom fact-chain --target . --item HARBOR-234 --json
