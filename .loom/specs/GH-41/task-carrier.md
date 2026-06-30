# GH-41 Task Carrier

## Task

- Work Item: GH-41
- Parent / covered FR: GH-40
- Covered work items: GH-41, GH-42, GH-43
- Branch: work/stage2-harbor-provider-identity
- Repository: WebEnvoy/Harbor
- Product semantics: docs-only Provider、Profile 与 Identity facts v0 contract.

## Ownership

- Allowed writes: `docs/adr/0006-provider-profile-identity-facts-v0.md`, `.loom/work-items/GH-41.md`, `.loom/progress/GH-41.md`, `.loom/status/current.md`, `.loom/reviews/GH-41*.json`, `.loom/specs/GH-41/*`, minimal `.loom/bootstrap/init-result.json` fact-chain locator update, and PR metadata.
- Forbidden writes: runtime/provider code, browser skeleton, API schema, database schema, provider evaluation packet, browser smoke, GH-44/GH-48/GH-53, `INIT-0001`, issue closeout, and merge action.

## Evidence

- Build evidence: `.loom/specs/GH-41/build-evidence.json`
- Validation: `git diff --check`, JSON validation, `loom suite validate --target /Volumes/2T/.codex/worktrees/stage2/harbor-provider-identity --item GH-41 --json`, `loom suite carrier validate --target /Volumes/2T/.codex/worktrees/stage2/harbor-provider-identity --item GH-41 --json`, `loom fact-chain --target /Volumes/2T/.codex/worktrees/stage2/harbor-provider-identity --json`, hosted basic checks after PR creation.

## Carrier Rows

| carrier_type | carrier_locator | source_value | normalized_status | relationship | work_item_locator | breakdown_unit_locator | spec_scenario_locator | plan_phase_locator | validation_strategy_locator | provenance | freshness_rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| checklist_item | .loom/specs/GH-41/task-carrier.md | docs-only Provider/Profile/Identity facts v0 contract for GH-40/GH-41/GH-42/GH-43 | in_progress | evidence_locator | .loom/work-items/GH-41.md | .loom/specs/GH-41/task-carrier.md#task | .loom/specs/GH-41/spec.md#required-behavior | .loom/specs/GH-41/plan.md#validation | .loom/specs/GH-41/build-evidence.json | main-thread docs contract | fresh when PR head, ADR 0006, review record, and GH-41 carrier reference the same docs-only head |
