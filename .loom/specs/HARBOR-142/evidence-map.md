# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | behavior_evidence | .loom/specs/HARBOR-142/spec.md | scenarios and acceptance criteria | HARBOR-142 / preview evidence refs and freshness behavior | present | review and merge-ready evidence only | Refresh after Runtime API evidence, provenance, freshness, or privacy-boundary changes. |
| EV-002 | test_evidence | .loom/progress/HARBOR-142.md | typecheck, tests, runtime smoke, diff check, Loom verify/fact-chain | HARBOR-142 / local validation checks | present | review and merge-ready evidence only | Rerun local validation after runtime API, test, or smoke edits. |
| EV-003 | fresh_verification_input | .loom/progress/HARBOR-142.md | EV-001 EV-002 | HARBOR-142 / latest validation summary | present | review and merge-ready evidence only | Refresh progress summary after validation changes. |
