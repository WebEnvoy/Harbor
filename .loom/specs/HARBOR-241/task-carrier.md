# Task Carrier

| carrier_type | carrier_locator | source_value | normalized_status | relationship | work_item_locator | breakdown_unit_locator | spec_scenario_locator | plan_phase_locator | validation_strategy_locator | provenance | freshness_rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| github_issue | https://github.com/WebEnvoy/Harbor/issues/241 | HARBOR-241 synchronizes a user-confirmed active managed session with its redacted Harbor identity public fact | in_progress | primary | .loom/work-items/HARBOR-241.md | .loom/specs/HARBOR-241/execution-breakdown.md#u-001-session-bound-confirmation | .loom/specs/HARBOR-241/spec.md#scenarios | .loom/specs/HARBOR-241/plan.md#phases | .loom/specs/HARBOR-241/evidence-map.md | User reported successful manual QR login while Harbor remained needs_auth; source-only investigation confirmed no synchronization route. | Recheck after API shape, PR head, session binding, or live public readback changes. |
