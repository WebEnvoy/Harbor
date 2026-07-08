# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | behavior_evidence | .loom/specs/HARBOR-212/spec.md | S-001 S-002 S-003 and acceptance criteria | HARBOR-212 / screenshot failure evidence semantics | present | review and PR readiness only | Refresh if capture or evidence semantics change. |
| EV-002 | code_evidence | packages/runtime-api/src/index.ts | screenshot failure guard in `captureLiveSnapshot` | HARBOR-212 / no fabricated screenshot refs | present | review and PR readiness only | Refresh after code edits. |
| EV-003 | test_evidence | packages/runtime-api/src/index.test.ts | fixture test for failed live screenshot capture | HARBOR-212 / regression coverage | present | review and PR readiness only | Refresh after test edits. |
| EV-004 | validation_evidence | .loom/progress/HARBOR-212.md | 2026-07-08T13:41Z carrier refresh plus 2026-07-08T13:15Z code validation | HARBOR-212 / local validation checks | present | review and PR readiness only | Rerun validation and update progress after code, carrier, or PR metadata edits. |
| EV-005 | build_evidence | .loom/specs/HARBOR-212/build-evidence.json | ownership constraints, delegation state, and validation list | HARBOR-212 / build readiness input | present | review and PR readiness only | Refresh after ownership, validation, PR head, or carrier changes. |
| EV-006 | fresh_verification_input | .loom/progress/HARBOR-212.md | EV-001 EV-002 EV-003 EV-004 EV-005 | HARBOR-212 / current verification input | present | review and PR readiness only | Refresh after every code, carrier, validation, head SHA, or PR metadata change. |
