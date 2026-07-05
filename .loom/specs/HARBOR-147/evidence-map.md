# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | behavior_evidence | .loom/specs/HARBOR-147/spec.md | story readiness, scenarios, and non-goals | HARBOR-147 / no-submit private boundary | present | review and merge-ready evidence only | Refresh after Runtime API boundary or fixture shape changes. |
| EV-002 | test_evidence | .loom/progress/HARBOR-147.md | typecheck, tests, runtime smoke, diff check, Loom verify/fact-chain | HARBOR-147 / local validation checks | present | review and merge-ready evidence only | Rerun local validation after runtime API, test, or smoke edits. |
| EV-003 | fresh_verification_input | .loom/progress/HARBOR-147.md | EV-001 EV-002 | HARBOR-147 / latest validation summary | present | review and merge-ready evidence only | Refresh progress summary after validation changes. |
