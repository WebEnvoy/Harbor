# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | behavior_evidence | .loom/specs/HARBOR-241/spec.md | S-001 S-002 S-003 S-004 and acceptance criteria | HARBOR-241 session-bound user-confirmed authentication contract | present | review and PR readiness only | Refresh if endpoint behavior or privacy boundary changes. |
| EV-002 | test_evidence | .loom/progress/HARBOR-241.md | pnpm typecheck, pnpm test, focused Runtime API tests, and git diff check | HARBOR-241 local validation at the current branch head | present | review and PR readiness only | Rerun and refresh after code or carrier changes. |
| EV-003 | fresh_verification_input | .loom/progress/HARBOR-241.md | EV-001 EV-002 | HARBOR-241 current validation summary | present | review and PR readiness only | Refresh after every push or validation rerun. |
| EV-004 | build_evidence | .loom/specs/HARBOR-241/build-evidence.json | ownership, delegation, validation, and safety boundary | HARBOR-241 build readiness | present | review and PR readiness only | Refresh after ownership, validation, or head changes. |
