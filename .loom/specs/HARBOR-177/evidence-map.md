# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | story_evidence | https://github.com/WebEnvoy/Harbor/issues/177#issuecomment-4888806502 | semantic stories #4/#5/#6/#7; read back 2026-07-06T03:21Z | HARBOR-177 / provider management | present | review and merge-ready evidence only | Re-read #177 comment if stories change. |
| EV-002 | issue_tree_evidence | https://github.com/WebEnvoy/Harbor/issues/177 | issue body, parent/sub-issue links, dependency links, milestone #11; #177/#178/#179/#180/#181 read back 2026-07-06T04:00Z | HARBOR-177 / batch issue tree | present | review and merge-ready evidence only | Re-read issue tree before PR metadata/gate if issue relationships change. |
| EV-003 | behavior_evidence | .loom/specs/HARBOR-177/spec.md | story readiness, scenarios, non-goals, sensitive boundary | HARBOR-177 / acceptance | present | review and merge-ready evidence only | Refresh after provider facts shape or scope changes. |
| EV-004 | test_evidence | .loom/progress/HARBOR-177.md | typecheck, tests, smoke, diff check, Loom doctor/verify/fact-chain | HARBOR-177 / local validation checks | present | review and merge-ready evidence only | Rerun local validation after runtime API, test, smoke, or carrier edits. |
| EV-005 | fresh_verification_input | .loom/progress/HARBOR-177.md | EV-001 EV-002 EV-003 EV-004 | HARBOR-177 / latest validation summary | present | review and merge-ready evidence only | Refresh progress summary after validation changes. |
