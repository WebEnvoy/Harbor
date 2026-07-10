# HARBOR-219 Progress

## Dynamic Facts

- Item ID: HARBOR-219
- Current Checkpoint: merge
- Current Stop: PR #240 contains the stale `DevToolsActivePort` repair needed by the real App authentication path. It needs a current-head review record and hosted merge-gate consumption. This is controller-owned integration work, not a user blocker.
- Next Step: Merge PR #240 after the hosted gate passes, rebuild the packaged App from Harbor main, and repeat the real App authentication session launch. Do not treat fixture smoke or fake-browser tests as live App/Core E2E evidence.
- Blockers: None
- Latest Validation Summary: 2026-07-10T10:05Z validation at rebased implementation head `46122903378083cb49c5098732bd2f7ca9fc82f5`: `pnpm typecheck`, the targeted persistent-profile close test, `git diff --check`, `loom fact-chain --target . --json`, `loom suite carrier validate --target . --item HARBOR-219 --json`, and `loom suite evidence validate --target . --item HARBOR-219 --json` passed. Full `pnpm test` observed one timing-sensitive fake-browser timeout in the persistent-profile test, then the isolated same test passed; the new unavailable/non-CDP stale-port regression passed in the full run. This is local runtime/test evidence only; no real site/account action, publish, send, submit, credential/Cookie capture, hosted browser, marketplace, bulk collection or risk-control bypass occurred.
- Recovery Boundary: Revert branch `work/harbor-219-persistent-profile-session`; no App/Core/Lode code changes, real account/profile/Cookie/production page action, submit, publish, send, hosted browser, marketplace, bulk collection, or risk-bypass claim occurred.
- Current Lane: Harbor #219 managed persistent profile session contract.

## Execution Ledger

- Ledger Binding: recovery_entry
- Plan Locator: .loom/specs/HARBOR-219/plan.md
- Acceptance Locator: .loom/specs/HARBOR-219/spec.md
- Validation Evidence Locator: .loom/specs/HARBOR-219/evidence-map.md
- Handoff Notes Locator: .loom/specs/HARBOR-219/task-carrier.md
- Evidence Freshness: current

## Runtime Evidence

- Run Entry: fixture_and_fake_browser_contract_smoke_no_live_site
- Logs Entry: command output from `pnpm test`; `pnpm smoke:runtime:api`; App `smoke:packaged:runtime`; App `smoke:packaged:readonly`
- Diagnostics Entry: packages/runtime-api/src/runtime-session.ts; packages/runtime-api/src/local-provider-launcher.ts; packages/runtime-api/src/index.test.ts
- Verification Entry: .loom/progress/HARBOR-219.md
- Lane Entry: HARBOR-219
