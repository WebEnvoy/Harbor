# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | behavior_evidence | .loom/specs/HARBOR-245/spec.md | S-001 S-002 S-003 and acceptance criteria | HARBOR-245 allowlisted one-shot read contract | present | build, review, and PR readiness only | Refresh when admission, probe, or privacy semantics change. |
| EV-002 | test_evidence | .loom/progress/HARBOR-245.md | typecheck, build, 56 tests, runtime API smoke, and diff check | HARBOR-245 current implementation branch | present | local implementation evidence only | Rerun after code or carrier changes. |
| EV-003 | fresh_verification_input | .loom/progress/HARBOR-245.md | EV-001 EV-002 | HARBOR-245 current validation summary | present | review and PR readiness only | Refresh after every push or validation rerun. |
