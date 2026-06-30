# GH-13 Task Carrier

## Task

- Work Item: GH-13
- Scope: merge-ready carrier repair for PR #34.
- Product semantics: unchanged docs-only provider baseline boundary.

## Ownership

- Allowed writes: `.loom/work-items/GH-13.md`, `.loom/progress/GH-13.md`, `.loom/status/current.md`, `.loom/reviews/GH-13.json`, `.loom/specs/GH-13/*`, and PR #34 metadata head fields.
- Forbidden writes: runtime/provider code, non-GH-13 Loom carriers, issue closeout, merge action, and product semantic changes in `docs/adr/pending-decisions.md`.

## Evidence

- Build evidence: `.loom/specs/GH-13/build-evidence.json`
- Validation: `git diff --check`, packaged `loom_flow.py fact-chain --target .`, packaged `loom_flow.py pr-gate check --target . --pr 34 --head-sha <head>`

## Carrier Rows

| carrier_type | carrier_locator | source_value | normalized_status | relationship | work_item_locator | breakdown_unit_locator | spec_scenario_locator | plan_phase_locator | validation_strategy_locator | provenance | freshness_rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| checklist_item | .loom/specs/GH-13/task-carrier.md | docs-only merge-ready carrier repair for PR #34 | done | evidence_locator | .loom/work-items/GH-13.md | .loom/specs/GH-13/task-carrier.md#task | .loom/specs/GH-13/spec.md#suite-path | .loom/specs/GH-13/plan.md#validation | .loom/specs/GH-13/build-evidence.json | main-thread carrier repair | fresh when PR head, review record, and GH-13 carrier reference the same head |
