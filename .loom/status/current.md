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
- Current Checkpoint: merge
- Current Stop: Harbor runtime API now exposes site-level resource facts and write-precheck facts for fixture/local-safe sessions. Implementation covers session-scoped facts projection, HTTP endpoints, readiness discovery, tests, smoke output, session-bound HTTP write-precheck evidence provenance, and session-bound direct `HarborRuntime.getWritePrecheckFacts` provenance. Spec review and implementation review records are present for HARBOR-234. The dependency correction still holds: App #265 and Core #243 remain downstream until Core consumes these facts and App E2E is implemented.
- Next Step: Run PR metadata readback, PR gate, hosted checks, controlled merge, and post-merge closeout for Harbor #234.
- Blockers: None
- Latest Validation Summary: 2026-07-09T10:32Z UTC build validation on branch `work/harbor-234-site-runtime-facts` after direct runtime API spoofing fix: `pnpm typecheck` passed, `pnpm test` passed with 32/32 tests, `pnpm smoke:runtime` passed in fixture mode, and `git diff --check` passed. Earlier Loom checks passed for `loom verify --target . --json`, `loom fact-chain --target . --item HARBOR-234 --json`, `loom suite validate --target . --item HARBOR-234 --json`, `loom suite evidence validate --target . --item HARBOR-234 --json`, `loom suite carrier validate --target . --item HARBOR-234 --json`, and `loom build --target . --item HARBOR-234 --build-evidence .loom/specs/HARBOR-234/build-evidence.json --json`. Read-only review lanes reported and the main controller fixed two provenance findings: HTTP write-precheck accepted caller-supplied page facts, and public `HarborRuntime.getWritePrecheckFacts` accepted caller-supplied URL/title/summary/locator for direct consumers. Downstream App/Core E2E remains outside HARBOR-234 scope until Core consumes this API and the user authorizes any real account/profile/production page action. This validation did not use real accounts, browser profiles, production pages, submit/publish/send/save actions, hosted browser, marketplace, bulk collection, or risk-control bypass.
- Recovery Boundary: Revert branch `work/harbor-234-site-runtime-facts`. No App/Core/Lode code changes, real account/profile/Cookie/production page action, submit, publish, send, save, hosted browser, marketplace, bulk collection, or risk-bypass claim may occur in this batch.
- Current Lane: Harbor #234 site-level runtime facts and write-precheck facts.

## Runtime Evidence

- Run Entry: 2026-07-09T10:36Z `loom spec-review --target . --item HARBOR-234 --json`; `loom build --target . --item HARBOR-234 --build-evidence .loom/specs/HARBOR-234/build-evidence.json --json`; `loom review record --target . --item HARBOR-234 --decision allow --kind code_review --json`; prior validation passed `pnpm typecheck`, `pnpm test`, `pnpm smoke:runtime`, `git diff --check`, `loom verify --target . --json`, `loom fact-chain --target . --item HARBOR-234 --json`, `loom suite validate --target . --item HARBOR-234 --json`, `loom suite evidence validate --target . --item HARBOR-234 --json`, and `loom suite carrier validate --target . --item HARBOR-234 --json`.
- Logs Entry: .loom/progress/HARBOR-234.md
- Diagnostics Entry: .loom/specs/HARBOR-234/consistency-analysis.md
- Verification Entry: loom verify --target . --json
- Lane Entry: HARBOR-234

## Sources

- Static Truth: .loom/work-items/HARBOR-234.md
- Dynamic Truth: .loom/progress/HARBOR-234.md
- Locator Truth: .loom/bootstrap/init-result.json
- Fact Chain CLI: loom fact-chain --target . --item HARBOR-234 --json
