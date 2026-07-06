# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | story_evidence | https://github.com/WebEnvoy/Harbor/issues/159#issuecomment-4888806364 | semantic story #2; read back 2026-07-06T08:10Z | HARBOR-169 / #159 identity consistency | present | review and PR-ready evidence only | Re-read #159 if the semantic story comment changes. |
| EV-002 | issue_tree_evidence | https://github.com/WebEnvoy/Harbor/issues/159, https://github.com/WebEnvoy/Harbor/issues/169, https://github.com/WebEnvoy/Harbor/issues/170, https://github.com/WebEnvoy/Harbor/issues/171, https://github.com/WebEnvoy/Harbor/issues/172 | issue bodies, milestone #11 story index, and scope/non-goals; read back 2026-07-06T08:10Z | HARBOR-169 / batch issue tree | present | review and PR-ready evidence only | Re-read issue tree before PR metadata/gate if issue relationships change. |
| EV-003 | prior_implementation | PR #183, PR #186, PR #189 | provider management, local identity environment, and runtime session implementation already merged into origin/main | HARBOR-169 / dependency baseline | present | source dependency evidence only | Rebase on origin/main if these PRs change or are reverted. |
| EV-004 | research_input | .loom/specs/HARBOR-169/evidence-map.md | CloakBrowser-Manager and Donut Browser research/source locators below | HARBOR-169 / provider facts and excluded-provider boundary | present | locator and absorption conclusion only | Refresh research input if external source locator changes. |
| EV-005 | behavior_evidence | .loom/specs/HARBOR-169/spec.md | story readiness, scenarios, non-goals, sensitive boundary, suite path | HARBOR-169 / acceptance | present | review and PR-ready evidence only | Refresh after facts shape or scope changes. |
| EV-006 | test_evidence | .loom/progress/HARBOR-169.md | typecheck, tests, smoke, sensitive-material check, diff check, Loom fact-chain/verify/suite validation | HARBOR-169 / local validation checks | present | review and PR-ready evidence only | Rerun local validation after runtime API, test, smoke, carrier, or PR body edits. |
| EV-007 | fresh_verification_input | .loom/progress/HARBOR-169.md | EV-005 behavior_evidence and EV-006 test_evidence for current HARBOR-169 scope | HARBOR-169 / PR-ready verification | present | review and PR-ready evidence only | Refresh after any runtime API, test, smoke, carrier, PR body, branch, or head SHA change. |
| EV-008 | build_evidence | .loom/specs/HARBOR-169/build-evidence.json | ownership contract, integration evidence, delegation evidence, suite path consumption | HARBOR-169 / build readiness input | present | review and PR-ready evidence only | Refresh after ownership, validation, PR head, or carrier changes. |

## Research Input Locators

- CloakBrowser-Manager: `../sources/CloakHQ/CloakBrowser-Manager/README.md`, `../sources/CloakHQ/CloakBrowser-Manager/BINARY-LICENSE.md`, `../sources/CloakHQ/CloakBrowser-Manager/backend/browser_manager.py`, `../sources/CloakHQ/CloakBrowser-Manager/backend/vnc_manager.py`, `../research/absorability/Harbor/runtime-provider-profile-viewer.md`, `../research/absorability/themes/anti-detection-and-provider-facts.md`.
  吸收结论：吸收 Profile Runtime、启动参数映射、CDP/VNC/viewer 机制和 provider capability/limitation facts；不整体迁入 Manager backend/frontend，不暴露原始 endpoint，不重新分发二进制，不承诺风控通过率。
- CloakBrowser: `../sources/CloakHQ/CloakBrowser/README.md`, `../sources/CloakHQ/CloakBrowser/BINARY-LICENSE.md`.
  吸收结论：CloakBrowser 是默认主力 provider 和 provider-claim 来源；Harbor 只记录 capability claim、manual install/license/binary boundary 和 validation requirement，不静默下载、不输出站点私有检测策略。
- Donut Browser: `../sources/zhom/donutbrowser/README.md`, `../research/subjects/zhom/donutbrowser/wiki/index.md`, `../research/absorability/themes/anti-detection-and-provider-facts.md`.
  吸收结论：Donut/Wayfern/Camoufox 的 provider facts 分层、proxy/geo/fingerprint/typing 机制可作为研究参考；Donut Browser 不登记为 Harbor provider，不复制 AGPL source，不作为用户 provider 选择。
