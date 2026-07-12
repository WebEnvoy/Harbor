# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | behavior_evidence | .loom/specs/HARBOR-259/spec.md | authenticated headed-session handoff acceptance | HARBOR-259 contract | present | review and PR readiness only | Refresh if runtime behavior or privacy boundary changes. |
| EV-002 | test_evidence | .loom/progress/HARBOR-259.md | typecheck, build, targeted 8/8, full 84/84, diff-check | product head 9d82532e50f7d638d2382b553277ac730c63e66c | present | review and PR readiness only | Rerun after product code changes. |
| EV-003 | fresh_verification_input | .loom/reviews/HARBOR-259.json | EV-001 EV-002 | independent current-head ALLOW | present | hosted merge gate | Refresh after product head changes. |
