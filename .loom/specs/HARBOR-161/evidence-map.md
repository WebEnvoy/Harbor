# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | story_evidence | https://github.com/WebEnvoy/Harbor/issues/157#issuecomment-4888806238 | semantic stories #1/#3; read back 2026-07-06T05:31Z | HARBOR-161 / FR #157 | present | review and PR readiness evidence only | Re-read #157 if story baseline changes. |
| EV-002 | issue_tree_evidence | https://github.com/WebEnvoy/Harbor/issues/161 https://github.com/WebEnvoy/Harbor/issues/162 https://github.com/WebEnvoy/Harbor/issues/163 https://github.com/WebEnvoy/Harbor/issues/164 https://github.com/WebEnvoy/Harbor/issues/182 | issue bodies and milestone #11; read back 2026-07-06T05:31Z | HARBOR-161 batch issue tree | present | review and PR readiness evidence only | Re-read issues before PR metadata/gate if issue body changes. |
| EV-003 | provider_baseline | https://github.com/WebEnvoy/Harbor/pull/183 | merged provider facts: CloakBrowser default, official Chrome restricted fallback, Donut/Chromium boundary | HARBOR-161 provider binding | present | uses public provider catalog/binding only | Rebase on main if provider-management changes. |
| EV-004 | research_input | .loom/specs/HARBOR-161/evidence-map.md | identity/profile/runtime split, Donut and CloakBrowser-Manager mechanism input from research locators listed below | HARBOR-161 field model | present | locator and absorption conclusion only | Refresh if research synthesis changes. |
| EV-005 | source_input | .loom/specs/HARBOR-161/evidence-map.md | profile fields, local SQLite/user_data_dir, runtime CDP/VNC facts from CloakBrowser-Manager source locators listed below | HARBOR-161 field model | present | read-only source reference; no source copied | Re-read if adopting implementation code. |
| EV-006 | source_input | .loom/specs/HARBOR-161/evidence-map.md | profile metadata, profile data path, cookie import/export, password-protected profile boundary from Donut source locators listed below | HARBOR-161 import/export/delete boundary | present | read-only source reference; no source copied | Re-read if adopting implementation code. |
| EV-007 | behavior_evidence | .loom/specs/HARBOR-161/spec.md | story readiness, scenarios, non-goals, sensitive boundary | HARBOR-161 acceptance | present | review and PR readiness evidence only | Refresh after behavior or boundary changes. |
| EV-008 | test_evidence | .loom/progress/HARBOR-161.md | `pnpm typecheck`, `pnpm test` 17 tests, `pnpm smoke:runtime`, `git diff --check`, `loom verify`, `loom fact-chain`, and suite checks | HARBOR-161 latest validation | present | review and PR readiness evidence only | Rerun after code or carrier edits. |
| EV-009 | fresh_verification_input | .loom/progress/HARBOR-161.md | EV-007 and EV-008 | HARBOR-161 current behavior and validation evidence | present | review and PR readiness evidence only | Refresh after behavior, validation, PR head, or carrier changes. |
| EV-010 | build_evidence | .loom/specs/HARBOR-161/build-evidence.json | ownership contract, integration evidence, delegation evidence, suite path consumption | HARBOR-161 build readiness input | present | review and PR readiness evidence only | Refresh after ownership, validation, PR head, or carrier changes. |

## Research Absorption

- CloakBrowser-Manager is used as a profile/runtime facts reference: profile fields, proxy/timezone/locale/user agent/fingerprint summary, local `user_data_dir`, and runtime CDP/VNC status. Harbor does not copy Manager backend/frontend or expose raw CDP/VNC endpoints here.
- Donut Browser is used as a local Profile Browser reference: metadata/profile data separation, cookie import/export concepts, profile deletion, and password-protected profile boundary. Harbor does not register Donut as a provider or copy its source.
- Anti-detection and fingerprint claims remain provider claims or summaries; Harbor does not promise target-site risk bypass.

## Source Locators Read

- Research: `/Volumes/2T/dev/WebEnvoy/research/synthesis.md`, `/Volumes/2T/dev/WebEnvoy/research/absorability/themes/browser-identity-and-runtime.md`, `/Volumes/2T/dev/WebEnvoy/research/absorability/themes/anti-detection-and-provider-facts.md`, `/Volumes/2T/dev/WebEnvoy/research/absorability/themes/human-handoff-and-recovery.md`.
- CloakBrowser-Manager sources: `/Volumes/2T/dev/WebEnvoy/sources/CloakHQ/CloakBrowser-Manager/backend/models.py`, `/Volumes/2T/dev/WebEnvoy/sources/CloakHQ/CloakBrowser-Manager/backend/database.py`, `/Volumes/2T/dev/WebEnvoy/sources/CloakHQ/CloakBrowser-Manager/backend/browser_manager.py`.
- Donut Browser sources: `/Volumes/2T/dev/WebEnvoy/sources/zhom/donutbrowser/src-tauri/src/profile/types.rs`, `/Volumes/2T/dev/WebEnvoy/sources/zhom/donutbrowser/src-tauri/src/profile/manager.rs`, `/Volumes/2T/dev/WebEnvoy/sources/zhom/donutbrowser/src-tauri/src/cookie_manager.rs`.
