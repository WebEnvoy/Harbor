# Task Carrier

| carrier_type | carrier_locator | source_value | normalized_status | relationship | work_item_locator | breakdown_unit_locator | spec_scenario_locator | plan_phase_locator | validation_strategy_locator | provenance | freshness_rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| github_issue | https://github.com/WebEnvoy/Harbor/issues/263 | Preserve trusted handoff across separate Core reads | in_progress | primary | .loom/work-items/HARBOR-263.md | .loom/specs/HARBOR-263/execution-breakdown.md#u-001-continuous-trusted-handoff | .loom/specs/HARBOR-263/spec.md | .loom/specs/HARBOR-263/plan.md | .loom/specs/HARBOR-263/evidence-map.md | Packaged run `app-boss-mrhkpodu` reused a ready confirmed session but failed pre-probe as `session_user_controlled`. | Recheck after product head, PR head, merge, or live replay changes. |
