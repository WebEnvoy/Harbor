# Evidence Map

| Evidence id | Type | Source locator | Consumes | Binding | Freshness | Consumer boundary | Remediation direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-001 | behavior_evidence | .loom/specs/HARBOR-263/spec.md | continuous trusted handoff acceptance | HARBOR-263 contract | present | review and PR readiness only | Refresh if lifecycle semantics change. |
| EV-002 | test_evidence | .loom/progress/HARBOR-263.md | focused 6/6, full 85/85, typecheck, build, diff-check | product/spec head cebd9384a4c3eac1ce810684833bf525c6db1d21 | present | review and PR readiness only | Refresh after product or formal spec changes. |
| EV-003 | live_evidence | GitHub issue #263 | packaged Xiaohongshu two-task same-session replay; no BOSS production access | post-merge package | pending | closeout only | Main controller records XHS evidence after merge; BOSS remains deferred. |
| EV-004 | build_evidence | .loom/specs/HARBOR-263/build-evidence.json | ownership, integration, validation, and boundary evidence | HARBOR-263 build readiness | present | review and PR readiness only | Refresh after ownership, validation, product head, or PR metadata changes. |
