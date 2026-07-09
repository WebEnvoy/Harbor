# HARBOR-219 Progress

## Dynamic Facts

- Item ID: HARBOR-219
- Current Checkpoint: merge
- Current Stop: PR #239 is open for branch `work/harbor-219-persistent-profile-session`. The Harbor side of the managed identity/session correction has been committed and pushed: managed identity `profile_storage_ref` reaches the local provider as internal protected material, public/direct identity facts redact raw profile storage refs, user-owned sessions default to visible `headless:false`, persistent profile directories are stable and permission-tightened, persistent profile dirs are preserved after close, and ephemeral profile dirs are removed. This is local contract evidence only; it does not close Harbor #218/#219 live E2E scope.
- Next Step: Consume hosted PR checks for #239 and perform controlled merge only after `loom-pr-merge-gate` passes. Do not treat fixture smoke or fake-browser tests as live App/Core E2E evidence.
- Blockers: None
- Latest Validation Summary: 2026-07-09T18:29Z UTC local validation passed on branch `work/harbor-219-persistent-profile-session` before commit: `pnpm typecheck`, `pnpm test`, `pnpm smoke:runtime:api`, detection-only provider readback with `node --input-type=module -e "import('./dist/packages/runtime-api/src/index.js').then(({detectBrowserProviders})=>console.log(JSON.stringify(detectBrowserProviders(),null,2)))"`, cross-repo App `WEBENVOY_HARBOR_RUNTIME_SOURCE_DIR=/Volumes/2T/dev/WebEnvoy/Harbor.worktrees/harbor-219-persistent-profile-session npm run smoke:packaged:runtime`, cross-repo App `WEBENVOY_HARBOR_RUNTIME_SOURCE_DIR=/Volumes/2T/dev/WebEnvoy/Harbor.worktrees/harbor-219-persistent-profile-session npm run smoke:packaged:readonly`, `git diff --check`, `jq empty` for HARBOR-219 review/build evidence JSON, `loom fact-chain --target . --json`, `loom suite carrier validate --target . --item HARBOR-219 --json`, and `loom suite evidence validate --target . --item HARBOR-219 --json`. Evidence boundary: Harbor tests use captured launcher, fixture launcher, or fake browser process only; direct/public identity facts redact raw profile storage refs while managed session launch still receives the internal protected ref; provider detection reports CloakBrowser missing and official Chrome installed/launchable without launching a real browser. No real Xiaohongshu/BOSS account, browser profile, Cookie, production page action, submit, publish, send, hosted browser, marketplace, bulk collection, full account cloud hosting, or risk-control bypass occurred.
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
