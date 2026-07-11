# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | behavior_evidence | .loom/specs/HARBOR-252/spec.md | S-001 S-002 S-003 | HARBOR-252 contract | present | build/review only | Refresh on behavior changes. |
| EV-002 | test_evidence | .loom/progress/HARBOR-252.md | typecheck and 67-test full suite | current working tree | present | implementation only, not live E2E | Rerun after every code change. |
| EV-003 | dependency_evidence | https://github.com/WebEnvoy/Lode/issues/268 | capability-truth boundary | open dependency | present | does not prove merged Lode truth | Recheck before merge/closeout. |
