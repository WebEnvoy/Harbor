# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | contract | .loom/specs/HARBOR-251/spec.md | AC-001 through AC-004 | HARBOR-251 | present | build and review | Refresh when target/probe semantics change. |
| EV-002 | test | .loom/progress/HARBOR-251.md | query/city, page state, WAPI summary, refs binding, typecheck, 63 full tests, diff check | current branch head | present | PR readiness | Rerun after code changes. |
