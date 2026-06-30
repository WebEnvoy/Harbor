# GH-37 Task Carrier

## Task

- Work Item: GH-37
- Scope: docs-only Runtime Session lifecycle v0 contract for GH-36/GH-37/GH-38/GH-39.
- Product semantics: Harbor runtime facts contract only; no runtime/provider implementation.

## Ownership

- Allowed writes: `docs/adr/0005-runtime-session-lifecycle-v0.md`, `.loom/work-items/GH-37.md`, `.loom/progress/GH-37.md`, `.loom/status/current.md`, `.loom/reviews/GH-37*.json`, `.loom/specs/GH-37/*`, and PR metadata.
- Forbidden writes: runtime/provider code, browser skeleton, API/database schema, other repositories, `INIT-0001`, merge action, and issue closeout.

## Evidence

- Build evidence: `.loom/specs/GH-37/build-evidence.json`
- Validation: `git diff --check`, workflow-equivalent Python compile check, local Loom wrapper checks when the workstation binding works, and hosted checks after PR creation.

## Carrier Rows

| carrier_type | carrier_locator | source_value | normalized_status | relationship | work_item_locator | breakdown_unit_locator | spec_scenario_locator | plan_phase_locator | validation_strategy_locator | provenance | freshness_rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| suite_path_decision | .loom/specs/GH-37/spec.md#suite-path | minimal docs-only contract; full suite artifacts not_applicable rationale: docs and item-specific Loom carrier only; consumer_boundary: downstream repos consume ADR text and PR metadata, not executable schema/runtime artifacts; recheck_condition: require stronger validation if implementation code, API schema, generated artifacts, workflow logic, real runtime evidence, or user-facing behavior is added | done | evidence_locator | .loom/work-items/GH-37.md | .loom/specs/GH-37/task-carrier.md#task | .loom/specs/GH-37/spec.md#suite-path | .loom/specs/GH-37/plan.md#validation | .loom/specs/GH-37/build-evidence.json | main-thread docs-only carrier | fresh when PR head, PR body, and GH-37 carrier reference the same branch/head |
| checklist_item | .loom/specs/GH-37/task-carrier.md | Runtime Session ref/status/lease/continuity/unavailable contract written to ADR 0005 | done | evidence_locator | .loom/work-items/GH-37.md | .loom/specs/GH-37/task-carrier.md#task | docs/adr/0005-runtime-session-lifecycle-v0.md | .loom/specs/GH-37/plan.md#implementation | .loom/specs/GH-37/build-evidence.json | main-thread docs-only carrier | fresh when ADR 0005 remains in the PR diff |
