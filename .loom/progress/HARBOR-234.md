# HARBOR-234 Progress

## Dynamic Facts

- Item ID: HARBOR-234
- Current Checkpoint: build
- Current Stop: Harbor runtime API now exposes site-level resource facts and write-precheck facts for fixture/local-safe sessions. Implementation covers session-scoped facts projection, HTTP endpoints, readiness discovery, tests, smoke output, and session-bound write-precheck evidence provenance. The dependency correction still holds: App #265 and Core #243 remain downstream until Core consumes these facts and App E2E is implemented.
- Next Step: Finish review/readiness, commit, push, open PR, run current-head review and merge gates for Harbor #234.
- Blockers: None
- Latest Validation Summary: 2026-07-09T10:32Z UTC build validation on branch `work/harbor-234-site-runtime-facts` after direct runtime API spoofing fix: `pnpm typecheck` passed, `pnpm test` passed with 32/32 tests, `pnpm smoke:runtime` passed in fixture mode, and `git diff --check` passed. Earlier Loom checks passed for `loom verify --target . --json`, `loom fact-chain --target . --item HARBOR-234 --json`, `loom suite validate --target . --item HARBOR-234 --json`, `loom suite evidence validate --target . --item HARBOR-234 --json`, `loom suite carrier validate --target . --item HARBOR-234 --json`, and `loom build --target . --item HARBOR-234 --build-evidence .loom/specs/HARBOR-234/build-evidence.json --json`. Read-only review lanes reported and the main controller fixed two provenance findings: HTTP write-precheck accepted caller-supplied page facts, and public `HarborRuntime.getWritePrecheckFacts` accepted caller-supplied URL/title/summary/locator for direct consumers. Downstream App/Core E2E remains outside HARBOR-234 scope until Core consumes this API and the user authorizes any real account/profile/production page action. This validation did not use real accounts, browser profiles, production pages, submit/publish/send/save actions, hosted browser, marketplace, bulk collection, or risk-control bypass.
- Recovery Boundary: Revert branch `work/harbor-234-site-runtime-facts`. No App/Core/Lode code changes, real account/profile/Cookie/production page action, submit, publish, send, save, hosted browser, marketplace, bulk collection, or risk-bypass claim may occur in this batch.
- Current Lane: Harbor #234 site-level runtime facts and write-precheck facts.

## Subagent Integration

- Read-only review lane `019f464d-b883-7213-92c3-6786ceba356e` reported one major finding: HTTP write-precheck accepted caller-supplied page/target facts that could be emitted as provided-context evidence.
- Integrated fix: HTTP now calls `getSessionWritePrecheckFacts`, which strips caller-supplied `url`, `title`, `summary`, and `locator_hint`; evidence provenance remains tied to the current runtime session.
- Regression evidence: `packages/runtime-api/src/server.test.ts` posts spoofed URL/title/locator and asserts the spoofed URL is absent from evidence provenance and the locator is not accepted.
- Delegate did not write files, did not perform GitHub operations, and did not touch real browser/profile/account/production pages.
- Read-only review lane `019f4658-7d40-72e0-aa66-b08d10b2c8f3` reported one blocking finding: public `HarborRuntime.getWritePrecheckFacts` still accepted caller-supplied `title`, `url`, `summary`, and `locator_hint`, so direct Core/App library consumers could spoof write-precheck evidence provenance even though HTTP was fixed.
- Integrated fix: `getWritePrecheckFacts` is now session-bound for page URL/title/summary/locator, accepts only target label and field state from input, and `getSessionWritePrecheckFacts` reuses the same safe path.
- Regression evidence: `packages/runtime-api/src/index.test.ts` passes spoofed URL/title/locator to the direct method and asserts spoofed values are absent while evidence provenance is tied to the runtime session.

## Execution Ledger

- Ledger Binding: recovery_entry
- Plan Locator: .loom/specs/HARBOR-234/plan.md
- Acceptance Locator: .loom/specs/HARBOR-234/spec.md
- Validation Evidence Locator: .loom/specs/HARBOR-234/evidence-map.md
- Handoff Notes Locator: .loom/specs/HARBOR-234/task-carrier.md
- Evidence Freshness: current

## Runtime Evidence

- Run Entry: 2026-07-09T10:32Z `pnpm typecheck`; `pnpm test`; `pnpm smoke:runtime`; `git diff --check`; prior Loom validation passed `loom verify --target . --json`, `loom fact-chain --target . --item HARBOR-234 --json`, `loom suite validate --target . --item HARBOR-234 --json`, `loom suite evidence validate --target . --item HARBOR-234 --json`, `loom suite carrier validate --target . --item HARBOR-234 --json`, and `loom build --target . --item HARBOR-234 --build-evidence .loom/specs/HARBOR-234/build-evidence.json --json`.
- Logs Entry: .loom/progress/HARBOR-234.md
- Diagnostics Entry: .loom/specs/HARBOR-234/consistency-analysis.md
- Verification Entry: loom verify --target . --json
- Lane Entry: HARBOR-234
