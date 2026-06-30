# GH-45 Task Carrier

## Task

- Work Item: GH-45
- Parent / covered FRs: GH-44, GH-48, GH-53
- Covered work items: GH-45, GH-46, GH-47, GH-49, GH-50, GH-51, GH-52
- Branch: work/stage2-harbor-page-scene-facts
- Repository: WebEnvoy/Harbor
- Product semantics: docs-only Page scene reference facts v0 contract.

## Ownership

- Allowed writes: `docs/adr/0007-page-scene-reference-facts-v0.md`, relevant `docs/adr/pending-decisions.md` v0 status rows, `.loom/work-items/GH-45.md`, `.loom/progress/GH-45.md`, `.loom/status/current.md`, `.loom/specs/GH-45/*`, and PR metadata.
- Forbidden writes: runtime/provider/browser/viewer code, API schema, storage schema, database schema, real browser smoke, live runtime evidence, App/Core/Lode changes, `INIT-0001`, issue closeout, and merge action.

## Evidence

- Build evidence: `.loom/specs/GH-45/build-evidence.json`
- Validation: `git diff --check`, JSON validation, `loom fact-chain --target . --json`, `loom suite validate --target . --item GH-45 --json`, `loom suite carrier validate --target . --item GH-45 --json`, hosted basic checks after PR creation.

## Carrier Rows

| carrier_type | carrier_locator | source_value | normalized_status | relationship | work_item_locator | breakdown_unit_locator | spec_scenario_locator | plan_phase_locator | validation_strategy_locator | provenance | freshness_rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| github_issue | https://github.com/WebEnvoy/Harbor/issues/45 | Define snapshot_ref, refmap_ref, and source_trace | in_progress | primary | .loom/work-items/GH-45.md | .loom/specs/GH-45/task-carrier.md#task | .loom/specs/GH-45/spec.md#required-behavior | .loom/specs/GH-45/plan.md#implementation | .loom/specs/GH-45/build-evidence.json | main-thread docs contract | fresh when PR head, ADR 0007, GH-45 carrier, and PR body reference the same head |
| github_issue | https://github.com/WebEnvoy/Harbor/issues/44 | Snapshot, RefMap, and Source Trace v0 | in_progress | mirror | .loom/work-items/GH-45.md | .loom/specs/GH-45/task-carrier.md#task | .loom/specs/GH-45/spec.md#required-behavior | .loom/specs/GH-45/plan.md#implementation | .loom/specs/GH-45/build-evidence.json | main-thread docs contract | mirror only; does not replace GH-45 primary carrier |
| github_issue | https://github.com/WebEnvoy/Harbor/issues/48 | Evidence refs v0 | in_progress | mirror | .loom/work-items/GH-45.md | .loom/specs/GH-45/task-carrier.md#task | .loom/specs/GH-45/spec.md#required-behavior | .loom/specs/GH-45/plan.md#implementation | .loom/specs/GH-45/build-evidence.json | main-thread docs contract | mirror only; does not replace GH-45 primary carrier |
| github_issue | https://github.com/WebEnvoy/Harbor/issues/53 | Viewer and Handoff facts v0 | in_progress | mirror | .loom/work-items/GH-45.md | .loom/specs/GH-45/task-carrier.md#task | .loom/specs/GH-45/spec.md#required-behavior | .loom/specs/GH-45/plan.md#implementation | .loom/specs/GH-45/build-evidence.json | main-thread docs contract | mirror only; does not replace GH-45 primary carrier |
| checklist_item | .loom/specs/GH-45/task-carrier.md | docs-only Page scene reference facts v0 contract for GH-44/GH-45/GH-46/GH-47/GH-48/GH-49/GH-50/GH-51/GH-52/GH-53 | in_progress | evidence_locator | .loom/work-items/GH-45.md | .loom/specs/GH-45/task-carrier.md#task | .loom/specs/GH-45/spec.md#required-behavior | .loom/specs/GH-45/plan.md#validation | .loom/specs/GH-45/build-evidence.json | main-thread docs contract | fresh when local validation and hosted checks are bound to the current PR head |
