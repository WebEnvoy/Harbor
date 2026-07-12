# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | behavior_evidence | .loom/specs/HARBOR-263/spec.md | continuous trusted handoff acceptance | HARBOR-263 contract | present | review and PR readiness only | Refresh if lifecycle semantics change. |
| EV-002 | test_evidence | .loom/progress/HARBOR-263.md | targeted/full/typecheck/build/diff-check | pending product head | pending | review and PR readiness only | Record after validation. |
| EV-003 | live_evidence | GitHub issue #263 | packaged two-task same-session replay | post-merge package | pending | closeout only | Main controller records after merge. |
