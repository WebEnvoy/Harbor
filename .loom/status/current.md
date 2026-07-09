# Current Status

## Derived Fact Chain View

- Item ID: HARBOR-219
- Goal: Repair Harbor #219 managed identity session behavior so App/Core can use Harbor owner API refs for persistent local browser profiles without exposing raw profile paths or sensitive browser material.
- Scope: Covers Harbor #219 under parent Harbor #218, with ownership constrained to runtime API managed identity session launch inputs, local provider profile storage mapping, public identity ref redaction, viewer/headless defaults, privacy-preserving tests, fixture-only API smoke, and HARBOR-219 carriers.
- Execution Path: work/harbor-219-persistent-profile-session
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-219.md
- Review Entry: .loom/reviews/HARBOR-219.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; pnpm smoke:runtime:api; git diff --check; loom fact-chain --target . --json; loom verify --target . --json; loom suite validate --target . --item HARBOR-219 --json; loom suite carrier validate --target . --item HARBOR-219 --json; loom suite evidence validate --target . --item HARBOR-219 --json
- Closing Condition: PR created and pushed for Harbor #219 with PR body listing covered and non-covered issues; no issue closeout in this worker batch.
- Current Checkpoint: build
- Current Stop: Branch `work/harbor-219-persistent-profile-session` contains the Harbor side of the managed identity/session correction: managed identity `profile_storage_ref` reaches the local provider as internal protected material, public/direct identity facts redact raw profile storage refs, user-owned sessions default to visible `headless:false`, persistent profile directories are stable and permission-tightened, persistent profile dirs are preserved after close, and ephemeral profile dirs are removed. This is local contract evidence only; it does not close Harbor #218/#219 live E2E scope.
- Next Step: Commit, push, and open the HARBOR-219 PR with PR body listing covered and non-covered user stories. Do not treat fixture smoke or fake-browser tests as live App/Core E2E evidence.
- Blockers: Pre-commit Loom purity only until this scoped diff is committed; no product-scope blocker in the local contract evidence.
- Latest Validation Summary: 2026-07-09T18:29Z UTC local validation passed on branch `work/harbor-219-persistent-profile-session` before commit: `pnpm typecheck`, `pnpm test`, `pnpm smoke:runtime:api`, detection-only provider readback with `node --input-type=module -e "import('./dist/packages/runtime-api/src/index.js').then(({detectBrowserProviders})=>console.log(JSON.stringify(detectBrowserProviders(),null,2)))"`, cross-repo App `WEBENVOY_HARBOR_RUNTIME_SOURCE_DIR=/Volumes/2T/dev/WebEnvoy/Harbor.worktrees/harbor-219-persistent-profile-session npm run smoke:packaged:runtime`, cross-repo App `WEBENVOY_HARBOR_RUNTIME_SOURCE_DIR=/Volumes/2T/dev/WebEnvoy/Harbor.worktrees/harbor-219-persistent-profile-session npm run smoke:packaged:readonly`, `git diff --check`, `jq empty` for HARBOR-219 review/build evidence JSON, `loom fact-chain --target . --json`, `loom suite carrier validate --target . --item HARBOR-219 --json`, and `loom suite evidence validate --target . --item HARBOR-219 --json`. Evidence boundary: Harbor tests use captured launcher, fixture launcher, or fake browser process only; direct/public identity facts redact raw profile storage refs while managed session launch still receives the internal protected ref; provider detection reports CloakBrowser missing and official Chrome installed/launchable without launching a real browser. No real Xiaohongshu/BOSS account, browser profile, Cookie, production page action, submit, publish, send, hosted browser, marketplace, bulk collection, full account cloud hosting, or risk-control bypass occurred.
- Recovery Boundary: Revert branch `work/harbor-219-persistent-profile-session`; no App/Core/Lode code changes, real account/profile/Cookie/production page action, submit, publish, send, hosted browser, marketplace, bulk collection, or risk-bypass claim occurred.
- Current Lane: Harbor #219 managed persistent profile session contract.

## Runtime Evidence

- Run Entry: fixture_and_fake_browser_contract_smoke_no_live_site
- Logs Entry: command output from `pnpm test`; `pnpm smoke:runtime:api`; App `smoke:packaged:runtime`; App `smoke:packaged:readonly`
- Diagnostics Entry: packages/runtime-api/src/runtime-session.ts; packages/runtime-api/src/local-provider-launcher.ts; packages/runtime-api/src/index.test.ts
- Verification Entry: .loom/progress/HARBOR-219.md
- Lane Entry: HARBOR-219

## Sources

- Static Truth: .loom/work-items/HARBOR-219.md
- Dynamic Truth: .loom/progress/HARBOR-219.md
- Locator Truth: .loom/bootstrap/init-result.json
- Fact Chain CLI: loom fact-chain --target . --item HARBOR-219 --json
