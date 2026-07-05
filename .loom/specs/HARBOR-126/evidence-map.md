# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | behavior_evidence | .loom/specs/HARBOR-126/spec.md | Scenario 1 Scenario 2 Scenario 3 / acceptance criteria | HARBOR-126 / runtime and evidence status behavior | present | review and merge-ready evidence only | Refresh after runtime status, evidence status, or privacy boundary changes. |
| EV-002 | test_evidence | .loom/progress/HARBOR-126.md | typecheck, tests, runtime smoke, git diff check | HARBOR-126 / local validation checks | present | review and merge-ready evidence only | Rerun local validation after Runtime API edits. |
| EV-003 | fresh_verification_input | .loom/progress/HARBOR-126.md | EV-001 EV-002 | HARBOR-126 / latest validation summary | present | review and merge-ready evidence only | Refresh progress summary after validation changes. |
