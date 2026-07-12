# HARBOR-252 Evidence Map

| Evidence ID | Evidence Type | Source Locator | Consumes | Binding | Freshness | Consumer Boundary | Remediation Direction |
|---|---|---|---|---|---|---|---|
| EV-001 | issue_tree_evidence | https://github.com/WebEnvoy/Harbor/issues/252 | corrected XHS-only scope | HARBOR-252 scope | present | review/PR only | Re-read if issue changes. |
| EV-002 | upstream_fact_evidence | https://github.com/WebEnvoy/Lode/pull/271 | merge 66d79b4 detail truth | source/evidence kinds | present | static Lode truth only | Re-read after Lode changes. |
| EV-003 | behavior_evidence | packages/runtime-api/src/read-operation.ts | exact capture/completion/post-check binding | HARBOR-252 acceptance | present | Harbor behavior only | Refresh after behavior changes. |
| EV-004 | test_evidence | packages/runtime-api/src/read-operation.test.ts | producer/capture/mutation regressions | HARBOR-252 validation | present | local tests; no live proof | Refresh after tests change. |
| EV-005 | fresh_verification_input | .loom/progress/HARBOR-252.md | EV-003 EV-004 | current product-head validation | present | PR readiness only | Refresh after head/validation change. |
| EV-006 | build_evidence | .loom/specs/HARBOR-252/build-evidence.json | delegated implementation/review integration | HARBOR-252 build | present | merge checkpoint only | Refresh after integration changes. |
