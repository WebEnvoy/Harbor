# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | behavior_evidence | .loom/specs/HARBOR-252/spec.md | S-001 S-002 S-003 | HARBOR-252 contract | present | build/review only | Refresh on behavior changes. |
| EV-002 | test_evidence | local verification | typecheck, 68-test runtime/detail targeted suite, and 72-test full suite | current working tree | present | implementation only, not live E2E | Rerun after every code change. |
| EV-003 | dependency_evidence | https://github.com/WebEnvoy/Lode/pull/271 | corrected capability/output truth | merge 66d79b4 / registry dca2761b | present | static truth only; does not prove Harbor live success | Recheck if Lode truth changes. |
