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
- Current Checkpoint: build
- Current Stop: Harbor runtime API now exposes site-level resource facts and write-precheck facts for fixture/local-safe sessions. Implementation covers session-scoped facts projection, HTTP endpoints, readiness discovery, tests, smoke output, and session-bound write-precheck evidence provenance. The dependency correction still holds: App #265 and Core #243 remain downstream until Core consumes these facts and App E2E is implemented.
- Next Step: Finish review/readiness, commit, push, open PR, run current-head review and merge gates for Harbor #234.
- Blockers: None for local implementation. Live App E2E remains blocked until Core consumes this API and the user authorizes any real account/profile/production page action.
- Latest Validation Summary: 2026-07-09T10:08Z UTC build validation on branch `work/harbor-234-site-runtime-facts`: `pnpm typecheck` passed, `pnpm test` passed with 32/32 tests, `pnpm smoke:runtime` passed in fixture mode, `git diff --check` passed, `loom verify --target . --json` passed, `loom suite validate --target . --item HARBOR-234 --json` passed, `loom suite evidence validate --target . --item HARBOR-234 --json` passed, and `loom suite carrier validate --target . --item HARBOR-234 --json` passed. Read-only review lane reported a major finding that HTTP write-precheck could accept caller-supplied page facts; it was fixed by routing HTTP through `getSessionWritePrecheckFacts` and adding regression assertions that spoofed URL/title/locator do not enter evidence provenance. A `loom build --target . --item HARBOR-234 --build-evidence .loom/specs/HARBOR-234/build-evidence.json --json` rerun on head `cc03e72feef57313b23703a4c434e83844a30abb` blocked because `.loom/bootstrap/init-result.json` still advertised idle fact-chain state and the delegation entry lacked `status: integrated`; this carrier sync updates those fields and requires a fresh build rerun before PR. This validation did not use real accounts, browser profiles, production pages, submit/publish/send/save actions, hosted browser, marketplace, bulk collection, or risk-control bypass.
- Recovery Boundary: Revert branch `work/harbor-234-site-runtime-facts`. No App/Core/Lode code changes, real account/profile/Cookie/production page action, submit, publish, send, save, hosted browser, marketplace, bulk collection, or risk-bypass claim may occur in this batch.
- Current Lane: Harbor #234 site-level runtime facts and write-precheck facts.

## Runtime Evidence

- Run Entry: 2026-07-09T10:08Z `pnpm typecheck`; `pnpm test`; `pnpm smoke:runtime`; `git diff --check`; `loom verify --target . --json`; `loom suite validate --target . --item HARBOR-234 --json`; `loom suite evidence validate --target . --item HARBOR-234 --json`; `loom suite carrier validate --target . --item HARBOR-234 --json`; `loom build --target . --item HARBOR-234 --build-evidence .loom/specs/HARBOR-234/build-evidence.json --json` pending rerun after carrier sync.
- Logs Entry: .loom/progress/HARBOR-234.md
- Diagnostics Entry: .loom/specs/HARBOR-234/consistency-analysis.md
- Verification Entry: loom verify --target . --json
- Lane Entry: HARBOR-234

## Sources

- Static Truth: .loom/work-items/HARBOR-234.md
- Dynamic Truth: .loom/progress/HARBOR-234.md
- Locator Truth: .loom/bootstrap/init-result.json
- Fact Chain CLI: loom fact-chain --target . --item HARBOR-234 --json
