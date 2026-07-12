# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | behavior_evidence | .loom/specs/HARBOR-261/spec.md | bounded provider readback acceptance | HARBOR-261 contract | present | review and PR readiness only | Refresh if timeout or fallback behavior changes. |
| EV-002 | test_evidence | .loom/progress/HARBOR-261.md | typecheck, build, targeted 7/7, full 85/85, diff-check | product/spec head 25b210f93ccfa1c541ccc974487e035e67b78bb9 | present | review and PR readiness only | Rerun after product or formal spec changes. |
| EV-003 | fresh_verification_input | .loom/reviews/HARBOR-261.json | EV-001 EV-002 | independent final-head review at 61e8fc93914ce84663305555f2f2285227c262f8 | present | hosted merge gate | Refresh after product/spec changes. |
