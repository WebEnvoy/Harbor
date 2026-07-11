# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | behavior_evidence | .loom/specs/HARBOR-251/spec.md | S-001 S-002 S-003 and AC-001 through AC-004 | HARBOR-251 BOSS one-shot read behavior | present | build, review, and PR readiness only | Refresh when target, probe, response-summary, or privacy semantics change. |
| EV-002 | test_evidence | .loom/progress/HARBOR-251.md | query/city, page state, WAPI summary, refs binding, typecheck, 63 full tests, and diff check | HARBOR-251 current branch head | present | local implementation evidence only | Rerun after code or carrier changes. |
| EV-003 | fresh_verification_input | .loom/progress/HARBOR-251.md | EV-001 EV-002 | HARBOR-251 current validation summary | present | review and PR readiness only | Refresh after every push or validation rerun. |
