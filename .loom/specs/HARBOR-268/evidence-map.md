# HARBOR-268 Evidence Map

| Evidence ID | Evidence Type | Source Locator | Consumes | Binding | Freshness | Consumer Boundary | Remediation Direction |
|---|---|---|---|---|---|---|---|
| EV-001 | issue_tree_evidence | https://github.com/WebEnvoy/Harbor/issues/268 | Work Item scope and non-goals | HARBOR-268 scope | present | review and PR readiness only | Re-read if issue changes. |
| EV-002 | behavior_evidence | packages/runtime-api/src/local-provider-launcher.ts | XHS semantic success and fail-closed behavior | HARBOR-268 acceptance | present | Harbor behavior only | Refresh after implementation changes. |
| EV-003 | test_evidence | packages/runtime-api/src/read-operation.test.ts | mixed feeds, virtual DOM, empty, mismatch, duplicate, malformed and cross-origin cases | HARBOR-268 validation | present | local tests only; no live proof | Refresh after tests change. |
| EV-004 | fresh_verification_input | .loom/progress/HARBOR-268.md | EV-002 EV-003 | current product-head validation | present | PR readiness only | Refresh after validation/head change. |
| EV-005 | build_evidence | .loom/specs/HARBOR-268/build-evidence.json | delegated implementation and review-fix integration | HARBOR-268 build | present | merge checkpoint only | Refresh after implementation/review integration changes. |
