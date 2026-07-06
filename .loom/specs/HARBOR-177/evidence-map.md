# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | story_evidence | https://github.com/WebEnvoy/Harbor/issues/177#issuecomment-4888806502 | semantic stories #4/#5/#6/#7; read back 2026-07-06T03:21Z | HARBOR-177 / provider management | present | review and merge-ready evidence only | Re-read #177 comment if stories change. |
| EV-002 | issue_tree_evidence | https://github.com/WebEnvoy/Harbor/issues/177 | issue body, parent/sub-issue links, dependency links, milestone #11; #177/#178/#179/#180/#181 read back 2026-07-06T04:00Z | HARBOR-177 / batch issue tree | present | review and merge-ready evidence only | Re-read issue tree before PR metadata/gate if issue relationships change. |
| EV-003 | behavior_evidence | .loom/specs/HARBOR-177/spec.md | story readiness, scenarios, non-goals, sensitive boundary | HARBOR-177 / acceptance | present | review and merge-ready evidence only | Refresh after provider facts shape or scope changes. |
| EV-004 | test_evidence | .loom/progress/HARBOR-177.md | typecheck, tests, smoke, diff check, Loom doctor/verify/fact-chain | HARBOR-177 / local validation checks | present | review and merge-ready evidence only | Rerun local validation after runtime API, test, smoke, or carrier edits. |
| EV-005 | fresh_verification_input | .loom/progress/HARBOR-177.md | EV-001 EV-002 EV-003 EV-004 | HARBOR-177 / latest validation summary | present | review and merge-ready evidence only | Refresh progress summary after validation changes. |
| EV-006 | research_input | .loom/specs/HARBOR-177/evidence-map.md | CloakBrowser JS/Python binary management locators and absorption conclusion below | HARBOR-177 / provider detection | present | locator and absorption conclusion only | Refresh the research input section if external source locator changes. |
| EV-007 | research_input | .loom/specs/HARBOR-177/evidence-map.md | CloakBrowser-Manager README/BINARY-LICENSE/backend browser_manager locators and absorption conclusion below | HARBOR-177 / capability and limitations | present | locator and absorption conclusion only | Refresh the research input section if external source locator changes. |
| EV-008 | research_input | .loom/specs/HARBOR-177/evidence-map.md | Donut Browser mechanism-reference locators and absorption conclusion below | HARBOR-177 / excluded provider decision | present | locator and absorption conclusion only | Refresh the research input section if external source locator changes. |

## Research Input Locators

- CloakBrowser JS/Python binary management config: `../sources/CloakHQ/CloakBrowser/js/README.md`, `../sources/CloakHQ/CloakBrowser/js/src/config.ts`, `../sources/CloakHQ/CloakBrowser/js/src/download.ts`, `../sources/CloakHQ/CloakBrowser/cloakbrowser/config.py`, `../sources/CloakHQ/CloakBrowser/cloakbrowser/download.py`.
  吸收结论：Harbor 只做本机缓存/路径/版本/可启动状态检测和手动安装引导；不自动下载、不接管 CloakBrowser binary manager。
- CloakBrowser-Manager: `../sources/CloakHQ/CloakBrowser-Manager/README.md`, `../sources/CloakHQ/CloakBrowser-Manager/BINARY-LICENSE.md`, `../sources/CloakHQ/CloakBrowser-Manager/backend/browser_manager.py`.
  吸收结论：Manager 可作为 profile/viewer/CDP/启动机制参考；Harbor 不重新分发二进制，只展示官方安装和许可边界。
- Donut Browser: `../sources/zhom/donutbrowser/README.md`, `../sources/zhom/donutbrowser/src-tauri/src/browser_version_manager.rs`, `../sources/zhom/donutbrowser/src-tauri/src/downloaded_browsers_registry.rs`, `../research/synthesis.md`.
  吸收结论：Donut Browser 只作为机制参考，不注册为 Harbor provider；Chromium/Donut 都不进入用户可选 provider 管理。
