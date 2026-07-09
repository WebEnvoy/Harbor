# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | behavior_evidence | .loom/specs/HARBOR-219/spec.md | S-001 S-002 S-003 S-004 and acceptance criteria | HARBOR-219 / Runtime API adapter behavior | present | review and PR readiness only | Refresh if endpoint scope or safety boundary changes. |
| EV-002 | test_evidence | .loom/progress/HARBOR-219.md | pnpm typecheck, pnpm test, pnpm smoke:runtime, pnpm smoke:runtime:api, HTTP readiness/provider readback, git diff check, JSON syntax check, Loom verify/fact-chain, suite carrier/evidence checks | HARBOR-219 / local validation checks | present | review and PR readiness only | Rerun validation and update progress after code, carrier, or PR metadata edits. |
| EV-003 | fresh_verification_input | .loom/progress/HARBOR-219.md | EV-001 EV-002 | HARBOR-219 / fresh validation summary | present | review and PR readiness only | Refresh after every push or if PR head changes. |
| EV-004 | build_evidence | .loom/specs/HARBOR-219/build-evidence.json | ownership constraints, delegation state, validation list, and HTTP provider readback | HARBOR-219 / build readiness input | present | review and PR readiness only | Refresh after ownership, validation, PR head, or carrier changes. |
