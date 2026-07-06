# Current Status

## Derived Fact Chain View

- Item ID: HARBOR-173
- Goal: Deliver PR Ready real scene evidence and viewer-entry facts for Harbor FR #160 so Core/App can consume real screenshot refs, page refs, timestamps, element refs, evidence refs, controller facts, and protected viewer entry facts.
- Scope: Covers Harbor #160/#173/#174/#175/#176 and semantic stories #11/#12; ownership is limited to Harbor runtime-api files and HARBOR-173 Loom carriers; excludes App/Core/Lode changes, issue closeout, current pointer retire, hosted browser, cloud runtime, Donut Browser provider registration, Chromium user provider registration, live account material, raw CDP/VNC endpoints, raw DOM/network, cookies, tokens, credentials, full profile storage, and platform-private risk strategy.
- Execution Path: work/harbor-160-real-scene-evidence
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-173.md
- Review Entry: .loom/reviews/HARBOR-173.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; sensitive material check; git diff --check; loom fact-chain --target . --json; loom verify --target . --json; loom suite validate/carrier/evidence validate --target . --item HARBOR-173 --json
- Closing Condition: Implementation PR for #160/#173/#174/#175/#176 is PR Ready and handed back to the controller; merge, issue closeout, and current pointer retire are out of scope.
- Current Checkpoint: build
- Current Stop: Runtime API implementation and item-specific carriers are in progress for PR Ready handoff.
- Next Step: run final validation, create PR for #160/#173/#174/#175/#176, validate PR metadata, start hosted checks, then hand back to the controller.
- Blockers: None recorded.
- Latest Validation Summary: Local validation passed on 2026-07-06T09:08Z: `pnpm typecheck`, `pnpm test`, `pnpm smoke:runtime`, sensitive material check against smoke output, `git diff --check`, `loom fact-chain --target . --json`, `loom verify --target . --json`, and `loom suite validate/carrier/evidence --target . --item HARBOR-173 --json`.
- Recovery Boundary: Harbor runtime-api scene/evidence/viewer facts and HARBOR-173 Loom carriers only; no App/Core/Lode changes, no hosted browser, no cloud runtime, no Chromium user provider, no Donut Browser provider registration, no live account/profile/cookie/token material, no raw CDP/VNC/DOM/network output, no issue closeout, no merge, no current pointer retire.
- Current Lane: FR #160 real scene evidence batch anchored on HARBOR-173

## Runtime Evidence

- Run Entry: .loom/progress/HARBOR-173.md
- Logs Entry: .loom/specs/HARBOR-173/evidence-map.md
- Diagnostics Entry: .loom/specs/HARBOR-173/build-evidence.json
- Verification Entry: loom verify --target . --json
- Lane Entry: HARBOR-173

## Sources

- Static Truth: .loom/work-items/HARBOR-173.md
- Dynamic Truth: .loom/progress/HARBOR-173.md
- Locator Truth: .loom/bootstrap/init-result.json
- Fact Chain CLI: loom fact-chain --target . --json
