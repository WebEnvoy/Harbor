# Evidence Map

| evidence_id | evidence_type | source_locator | consumes | binding | freshness | consumer_boundary | remediation_direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | issue_tree_evidence | https://github.com/WebEnvoy/Harbor/issues/234 https://github.com/WebEnvoy/App/issues/265 https://github.com/WebEnvoy/WebEnvoy/issues/243 | HARBOR-234 dependency and E2E blocker truth | HARBOR-234 scope | present | planning/review only | Re-read before PR metadata, review, merge-ready, or closeout. |
| EV-002 | contract_evidence | .loom/specs/HARBOR-234/contracts.md | Harbor facts contract and prohibited fields | Harbor/Core/Lode/App boundary | present | contract review | Refresh if field ownership changes. |
| EV-003 | behavior_evidence | .loom/specs/HARBOR-234/spec.md | S-001 through S-005 behavior | HARBOR-234 acceptance | present | Harbor PR review only | Refresh after behavior changes. |
| EV-004 | implementation_evidence | packages/runtime-api/src/site-runtime-facts.ts | Facts projection and HTTP endpoints in `site-runtime-facts.ts`, `index.ts`, and `server.ts` | Harbor runtime implementation | present | public/redacted refs only | Rerun validation after implementation changes. |
| EV-005 | test_evidence | packages/runtime-api/src/server.test.ts | Missing/unsupported/ready/write-precheck/evidence assertions | HARBOR-234 validation | present | fixture/local-safe only | Supplement with App E2E after user authorization. |
| EV-006 | fresh_verification_input | .loom/progress/HARBOR-234.md | EV-003 EV-004 EV-005 | HARBOR-234 readiness and latest validation summary | present | Harbor PR review only | Refresh after every head change. |
| EV-007 | non_goal_evidence | .loom/work-items/HARBOR-234.md | Prohibited actions and excluded repos | HARBOR-234 safety boundary | present | no external visible action | Recheck if scope changes. |
| EV-008 | build_evidence | .loom/specs/HARBOR-234/build-evidence.json | ownership constraints, review finding resolution, validation list, and remaining downstream limitations | HARBOR-234 build readiness input | present | review and PR readiness only | Refresh after ownership, validation, PR head, or carrier changes. |
| EV-009 | test_evidence | packages/runtime-api/src/index.test.ts | Direct HarborRuntime write-precheck spoofing regression for URL/title/locator provenance | HARBOR-234 validation | present | fixture/local-safe only | Supplement with App/Core direct consumption E2E after integration. |
