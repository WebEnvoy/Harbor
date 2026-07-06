# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | story_evidence | https://github.com/WebEnvoy/Harbor/issues/160#issuecomment-4888806854 | semantic stories #11/#12 read back 2026-07-06T09:03Z | HARBOR-173 / FR #160 | present | review and PR metadata evidence only | Re-read #160 story baseline if comments change. |
| EV-002 | issue_tree_evidence | https://github.com/WebEnvoy/Harbor/issues/160; https://github.com/WebEnvoy/Harbor/issues/173; https://github.com/WebEnvoy/Harbor/issues/174; https://github.com/WebEnvoy/Harbor/issues/175; https://github.com/WebEnvoy/Harbor/issues/176 | FR and Work Item bodies read back 2026-07-06T09:03Z | HARBOR-173 / batch issue tree | present | review and PR metadata evidence only | Re-read issues before PR metadata/gate if issue bodies or states change. |
| EV-003 | behavior_evidence | .loom/specs/HARBOR-173/spec.md | story readiness, scenarios, provider boundary, suite path, sensitive boundary | HARBOR-173 / acceptance | present | review and PR metadata evidence only | Refresh after scope or provider boundary changes. |
| EV-004 | implementation_evidence | packages/runtime-api/src/page-scene.ts | screenshot refs, page refs, element source evidence refs, viewer entry facts, controller readback, smoke output across runtime-api implementation files | HARBOR-173 / runtime API code | present | App/Core public facts only | Rerun typecheck/test/smoke after runtime-api edits. |
| EV-005 | test_evidence | packages/runtime-api/src/index.test.ts | screenshot/page/evidence refs, stale/expired state, local viewer entry, control owner, sensitive material checks | HARBOR-173 / validation | present | local validation evidence only | Rerun required validation after code/carrier edits. |
| EV-006 | research_input | .loom/specs/HARBOR-173/evidence-map.md | CloakBrowser-Manager and Donut Browser absorption conclusions below | HARBOR-173 / provider and viewer boundary | present | mechanism reference only; not provider registration | Refresh only if source locators change. |
| EV-007 | fresh_verification_input | .loom/progress/HARBOR-173.md | EV-003 EV-004 EV-005 EV-006 | HARBOR-173 / latest validation summary | present | PR readiness evidence only | Refresh progress summary after final validation and PR metadata readback. |

## Source Locators Read

- Harbor docs: `AGENTS.md`, `README.md`, `ROADMAP.md`, `docs/adr/0004-snapshot-refmap-and-evidence-capture.md`, `docs/adr/0005-runtime-session-lifecycle-v0.md`, `docs/adr/0006-provider-profile-identity-facts-v0.md`, `docs/adr/0007-page-scene-reference-facts-v0.md`, `docs/adr/0008-harbor-runtime-architecture-baseline.md`, `docs/contracts/README.md`.
- Recent implementation carriers/PRs: PR #183/#186/#189/#192 metadata and `.loom/specs/HARBOR-177/**`, `.loom/specs/HARBOR-165/**`, `.loom/specs/HARBOR-169/**`.
- CloakBrowser-Manager: `/Volumes/2T/dev/WebEnvoy/research/absorability/Harbor/runtime-provider-profile-viewer.md`, `/Volumes/2T/dev/WebEnvoy/sources/CloakHQ/CloakBrowser-Manager/README.md`, `/Volumes/2T/dev/WebEnvoy/sources/CloakHQ/CloakBrowser-Manager/backend/browser_manager.py`, `/Volumes/2T/dev/WebEnvoy/sources/CloakHQ/CloakBrowser-Manager/backend/vnc_manager.py`.

## Research Absorption

- CloakBrowser-Manager: absorb Profile Runtime, mediated viewer/VNC, CDP compatibility, port isolation, and provider fact mechanisms; do not migrate backend/frontend wholesale, expose raw endpoints, redistribute binaries, or promise target-site risk bypass.
- Donut Browser: remains mechanism reference only; it is not registered as a Harbor provider.

## Validation Commands

- `pnpm typecheck`
- `pnpm test`
- `pnpm smoke:runtime`
- sensitive material check against smoke output
- `git diff --check`
- `loom fact-chain --target . --json`
- `loom verify --target . --json`
- `loom suite validate --target . --item HARBOR-173 --json`
- `loom suite evidence validate --target . --item HARBOR-173 --json`
- `loom suite carrier validate --target . --item HARBOR-173 --json`
