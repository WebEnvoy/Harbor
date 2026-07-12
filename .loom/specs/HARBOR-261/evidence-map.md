# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | behavior_evidence | .loom/specs/HARBOR-261/spec.md | bounded provider readback acceptance | HARBOR-261 contract | present | review and PR readiness only | Refresh if timeout or fallback behavior changes. |
| EV-002 | test_evidence | .loom/progress/HARBOR-261.md | typecheck, build, targeted 7/7, full 85/85, diff-check | product/spec head b6a617ad81d97b32a86229832c5699e68be1a2f9 | present | review and PR readiness only | Rerun after product or formal spec changes. |
| EV-003 | fresh_verification_input | .loom/reviews/HARBOR-261.json | EV-001 EV-002 | independent final-head review | pending | hosted merge gate | Record after formal carrier commit. |
