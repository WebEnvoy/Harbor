# HARBOR-173

## Static Facts

- Item ID: HARBOR-173
- Goal: Deliver PR Ready real scene evidence and viewer-entry facts for Harbor FR #160 so Core/App can consume real screenshot refs, page refs, timestamps, element refs, evidence refs, controller facts, and protected viewer entry facts.
- Scope: Covers Harbor #160/#173/#174/#175/#176 and semantic stories #11/#12; ownership is limited to Harbor runtime-api files and HARBOR-173 Loom carriers; excludes App/Core/Lode changes, issue closeout, current pointer retire, hosted browser, cloud runtime, Donut Browser provider registration, Chromium user provider registration, live account material, raw CDP/VNC endpoints, raw DOM/network, cookies, tokens, credentials, full profile storage, and platform-private risk strategy.
- Execution Path: work/harbor-160-real-scene-evidence
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-173.md
- Review Entry: .loom/reviews/HARBOR-173.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; sensitive material check; git diff --check; loom fact-chain --target . --json; loom verify --target . --json; loom suite validate/carrier/evidence validate --target . --item HARBOR-173 --json
- Closing Condition: Implementation PR for #160/#173/#174/#175/#176 is PR Ready and handed back to the controller; merge, issue closeout, and current pointer retire are out of scope.

## Covered Work Items

- #173 capture real screenshot refs, page refs, page URL/title, and capture timestamps.
- #174 expose element refs, field/source evidence refs, evidence refs, and stale/expired states without raw DOM.
- #175 expose user, agent, and Core task controller facts and handoff/takeover state without claiming task success.
- #176 expose Harbor-mediated viewer entry facts and sensitive material protection without raw CDP/VNC endpoints.

## Associated Artifacts

- packages/runtime-api/src/page-scene.ts
- packages/runtime-api/src/viewer-control.ts
- packages/runtime-api/src/runtime-session-types.ts
- packages/runtime-api/src/runtime-session.ts
- packages/runtime-api/src/local-provider-launcher.ts
- packages/runtime-api/src/index.ts
- packages/runtime-api/src/index.test.ts
- packages/runtime-api/src/smoke.ts
- .loom/specs/HARBOR-173/**
- .loom/progress/HARBOR-173.md
