# HARBOR-234 Progress

## Dynamic Facts

- Item ID: HARBOR-234
- Current Checkpoint: build
- Current Stop: Harbor runtime API now exposes site-level resource facts and write-precheck facts for fixture/local-safe sessions. Implementation covers session-scoped facts projection, HTTP endpoints, readiness discovery, tests, smoke output, and session-bound write-precheck evidence provenance. The dependency correction still holds: App #265 and Core #243 remain downstream until Core consumes these facts and App E2E is implemented.
- Next Step: Finish review/readiness, commit, push, open PR, run current-head review and merge gates for Harbor #234.
- Blockers: None
- Latest Validation Summary: 2026-07-09T10:23Z UTC build-readiness validation on branch `work/harbor-234-site-runtime-facts` at head `a87cbe3192bf639de8405c7fc3e114bd5d47ec43`: `loom suite validate --target . --item HARBOR-234 --json`, `loom suite evidence validate --target . --item HARBOR-234 --json`, and `loom suite carrier validate --target . --item HARBOR-234 --json` passed after the earlier full validation set (`pnpm typecheck`, `pnpm test` with 32/32 tests, `pnpm smoke:runtime` in fixture mode, `git diff --check`, `loom verify --target . --json`, and `loom fact-chain --target . --item HARBOR-234 --json`) passed. Read-only review lane reported a major finding that HTTP write-precheck could accept caller-supplied page facts; it was fixed by routing HTTP through `getSessionWritePrecheckFacts` and adding regression assertions that spoofed URL/title/locator do not enter evidence provenance. Downstream App/Core E2E remains outside HARBOR-234 scope until Core consumes this API and the user authorizes any real account/profile/production page action. This validation did not use real accounts, browser profiles, production pages, submit/publish/send/save actions, hosted browser, marketplace, bulk collection, or risk-control bypass.
- Recovery Boundary: Revert branch `work/harbor-234-site-runtime-facts`. No App/Core/Lode code changes, real account/profile/Cookie/production page action, submit, publish, send, save, hosted browser, marketplace, bulk collection, or risk-bypass claim may occur in this batch.
- Current Lane: Harbor #234 site-level runtime facts and write-precheck facts.

## Subagent Integration

- Read-only review lane `019f464d-b883-7213-92c3-6786ceba356e` reported one major finding: HTTP write-precheck accepted caller-supplied page/target facts that could be emitted as provided-context evidence.
- Integrated fix: HTTP now calls `getSessionWritePrecheckFacts`, which strips caller-supplied `url`, `title`, `summary`, and `locator_hint`; evidence provenance remains tied to the current runtime session.
- Regression evidence: `packages/runtime-api/src/server.test.ts` posts spoofed URL/title/locator and asserts the spoofed URL is absent from evidence provenance and the locator is not accepted.
- Delegate did not write files, did not perform GitHub operations, and did not touch real browser/profile/account/production pages.

## Execution Ledger

- Ledger Binding: recovery_entry
- Plan Locator: .loom/specs/HARBOR-234/plan.md
- Acceptance Locator: .loom/specs/HARBOR-234/spec.md
- Validation Evidence Locator: .loom/specs/HARBOR-234/evidence-map.md
- Handoff Notes Locator: .loom/specs/HARBOR-234/task-carrier.md
- Evidence Freshness: current

## Runtime Evidence

- Run Entry: 2026-07-09T10:23Z `loom suite validate --target . --item HARBOR-234 --json`; `loom suite evidence validate --target . --item HARBOR-234 --json`; `loom suite carrier validate --target . --item HARBOR-234 --json`; prior full validation passed `pnpm typecheck`, `pnpm test`, `pnpm smoke:runtime`, `git diff --check`, `loom verify --target . --json`, and `loom fact-chain --target . --item HARBOR-234 --json`.
- Logs Entry: .loom/progress/HARBOR-234.md
- Diagnostics Entry: .loom/specs/HARBOR-234/consistency-analysis.md
- Verification Entry: loom verify --target . --json
- Lane Entry: HARBOR-234
