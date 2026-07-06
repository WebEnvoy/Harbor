# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | issue_tree_evidence | https://github.com/WebEnvoy/Harbor/issues/203 and https://github.com/WebEnvoy/Harbor/issues/204 | FR #203 and Work Items #204/#205/#206/#207 | HARBOR-204 / local identity environment batch | present | review and merge-ready evidence only | Re-read issue tree before review or merge-ready if issue relationships change. |
| EV-002 | behavior_evidence | .loom/specs/HARBOR-204/spec.md | story readiness, scenarios, non-goals, sensitive boundary | HARBOR-204 / acceptance | present | review and merge-ready evidence only | Refresh after Runtime API surface or sensitive boundary changes. |
| EV-003 | implementation_evidence | packages/runtime-api/src/identity-environment-manager.ts | manager/store, JSON persistence, public redacted record, managed facts, managed session opening | HARBOR-204 / implementation | present | Harbor Runtime API only | Re-run typecheck/test/smoke after edits. |
| EV-004 | test_evidence | packages/runtime-api/src/index.test.ts and packages/runtime-api/src/smoke.ts | xiaohongshu/BOSS create/import/update, redacted output, persistence no raw values, managed session opening | HARBOR-204 / validation | present | local fixture evidence only | Re-run `pnpm test` and `pnpm smoke:runtime` after edits. |
| EV-005 | validation_evidence | .loom/progress/HARBOR-204.md | typecheck, tests, smoke, diff check, Loom doctor/verify/fact-chain | HARBOR-204 / latest validation summary | present | review and merge-ready evidence only | Refresh after every push or validation rerun. |
