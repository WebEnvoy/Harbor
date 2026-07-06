# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | story_evidence | https://github.com/WebEnvoy/Harbor/issues/158#issuecomment-4888806689 | semantic stories #8/#9/#10; read back 2026-07-06T07:12Z | HARBOR-165 / FR #158 | present | review and PR metadata evidence only | Re-read #158 story baseline if comments change. |
| EV-002 | issue_tree_evidence | https://github.com/WebEnvoy/Harbor/issues/158; https://github.com/WebEnvoy/Harbor/issues/165; https://github.com/WebEnvoy/Harbor/issues/166; https://github.com/WebEnvoy/Harbor/issues/167; https://github.com/WebEnvoy/Harbor/issues/168 | FR and covered Work Item bodies read back 2026-07-06T07:12Z | HARBOR-165 / batch issue tree | present | review and PR metadata evidence only | Re-read issues before PR metadata/gate if issue bodies or states change. |
| EV-003 | behavior_evidence | .loom/specs/HARBOR-165/spec.md | story readiness, scenarios, provider boundary, non-goals, sensitive boundary | HARBOR-165 / acceptance | present | review and PR metadata evidence only | Refresh after lifecycle scope or provider boundary changes. |
| EV-004 | implementation_evidence | packages/runtime-api/src/runtime-session.ts | lifecycle state, open URL, reuse/lock/release/stop, launch/readiness facts, module split below 500 lines; related implementation files are runtime-session-types.ts, local-provider-launcher.ts, runtime-fixtures.ts, index.ts, smoke.ts, and viewer-control.ts | HARBOR-165 / runtime API code | present | App/Core public facts only | Rerun typecheck/test/smoke after runtime-api edits. |
| EV-005 | test_evidence | packages/runtime-api/src/index.test.ts | open/reuse/lock/release/stop tests; invalid URL failure; private material checks; runtime smoke facts are also exercised by packages/runtime-api/src/smoke.ts | HARBOR-165 / validation | present | local validation evidence only | Rerun required validation after code/carrier edits. |
| EV-006 | research_input | .loom/specs/HARBOR-165/evidence-map.md | Donut profile process/open URL/kill/running-state mechanism reference from source locators listed below | HARBOR-165 / #165 | present | mechanism reference only; not provider registration | Refresh only if Donut source locator changes. |
| EV-007 | fresh_verification_input | .loom/progress/HARBOR-165.md | EV-003 EV-004 EV-005 EV-006 | HARBOR-165 / latest validation summary | present | review and PR readiness evidence only | Refresh progress summary after validation or PR metadata changes. |

## Source Locators Read

- Donut Browser sources: `/Volumes/2T/dev/WebEnvoy/sources/zhom/donutbrowser/src-tauri/src/api_server.rs`, `/Volumes/2T/dev/WebEnvoy/sources/zhom/donutbrowser/src-tauri/src/profile/manager.rs`.

## Validation Commands

- `pnpm typecheck`
- `pnpm test`
- `pnpm smoke:runtime`
- `git diff --check`
- `loom verify --target . --json`
- `loom fact-chain --target . --json`
- `loom suite validate --target . --item HARBOR-165 --json`
- `loom suite evidence validate --target . --item HARBOR-165 --json`
- `loom suite carrier validate --target . --item HARBOR-165 --json`
