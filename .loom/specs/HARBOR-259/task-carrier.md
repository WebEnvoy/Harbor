# Task Carrier

| carrier_type | carrier_locator | source_value | normalized_status | relationship | work_item_locator | breakdown_unit_locator | spec_scenario_locator | plan_phase_locator | validation_strategy_locator | provenance | freshness_rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| github_issue | https://github.com/WebEnvoy/Harbor/issues/259 | Safely hand a persisted user-confirmed fresh headed session to Core | in_progress | primary | .loom/work-items/HARBOR-259.md | .loom/specs/HARBOR-259/execution-breakdown.md#u-001-authenticated-headed-handoff | .loom/specs/HARBOR-259/spec.md | .loom/specs/HARBOR-259/plan.md | .loom/specs/HARBOR-259/evidence-map.md | Merged-package run app-boss-mrhhy3sn proved the prior headed session was closed and replaced by headless. | Recheck after PR head, hosted gate, merge, or live runtime replay changes. |
