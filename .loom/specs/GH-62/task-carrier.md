# GH-62 Task Carrier

## Task

- Work Item: GH-62
- Parent FR: GH-60
- Covered work items: GH-61, GH-62, GH-63, GH-64
- Branch: work/docs-draft-closeout-harbor
- Repository: WebEnvoy/Harbor
- Product semantics: docs-only draft lifecycle and accepted-contract pointerization.

## Ownership

- Allowed writes: `docs/draft/**`, `docs/contracts/README.md`, `.loom/work-items/GH-62.md`, `.loom/progress/GH-62.md`, `.loom/status/current.md`, minimal `.loom/bootstrap/init-result.json` fact-chain locator update, `.loom/specs/GH-62/*`, `.loom/reviews/GH-62*.json`, and PR metadata.
- Forbidden writes: runtime/provider/browser/viewer code, API schema, storage schema, generated facts, fixtures, real browser smoke, live runtime evidence, other repositories, `INIT-0001`, `docs/guides/`, issue closeout, and merge action.

## Evidence

- Build evidence: `.loom/specs/GH-62/build-evidence.json`
- Validation: `git diff --check`, JSON validation, `loom fact-chain --target . --json`, `loom suite validate --target . --item GH-62 --json`, `loom suite carrier validate --target . --item GH-62 --json`.

## Carrier Rows

| carrier_type | carrier_locator | source_value | normalized_status | relationship | work_item_locator | breakdown_unit_locator | spec_scenario_locator | plan_phase_locator | validation_strategy_locator | provenance | freshness_rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| github_issue | https://github.com/WebEnvoy/Harbor/issues/62 | 盘点 docs/draft 文档归宿 | in_progress | primary | .loom/work-items/GH-62.md | .loom/specs/GH-62/task-carrier.md#task | .loom/specs/GH-62/spec.md#required-behavior | .loom/specs/GH-62/plan.md#implementation | .loom/specs/GH-62/build-evidence.json | main-thread docs closeout | fresh when PR head, docs inventory, GH-62 carrier, and PR body reference the same head |
| github_issue | https://github.com/WebEnvoy/Harbor/issues/60 | 收口 docs 目录语义与 draft 生命周期 | in_progress | mirror | .loom/work-items/GH-62.md | .loom/specs/GH-62/task-carrier.md#task | .loom/specs/GH-62/spec.md#scope | .loom/specs/GH-62/plan.md#implementation | .loom/specs/GH-62/build-evidence.json | main-thread docs closeout | parent mirror only |
| github_issue | https://github.com/WebEnvoy/Harbor/issues/61 | 定义 docs 目录语义与 draft 生命周期 | in_progress | mirror | .loom/work-items/GH-62.md | .loom/specs/GH-62/task-carrier.md#task | .loom/specs/GH-62/spec.md#scope | .loom/specs/GH-62/plan.md#implementation | .loom/specs/GH-62/build-evidence.json | main-thread docs closeout | covered by GH-62 PR |
| github_issue | https://github.com/WebEnvoy/Harbor/issues/63 | 迁移已接受合同到正式事实载体 | in_progress | mirror | .loom/work-items/GH-62.md | .loom/specs/GH-62/task-carrier.md#task | .loom/specs/GH-62/spec.md#scope | .loom/specs/GH-62/plan.md#implementation | .loom/specs/GH-62/build-evidence.json | main-thread docs closeout | covered by GH-62 PR |
| github_issue | https://github.com/WebEnvoy/Harbor/issues/64 | 标记 pending/deferred 并清理重复草稿 | in_progress | mirror | .loom/work-items/GH-62.md | .loom/specs/GH-62/task-carrier.md#task | .loom/specs/GH-62/spec.md#scope | .loom/specs/GH-62/plan.md#implementation | .loom/specs/GH-62/build-evidence.json | main-thread docs closeout | covered by GH-62 PR |
| checklist_item | .loom/specs/GH-62/task-carrier.md | docs-only draft closeout and pointerization | in_progress | evidence_locator | .loom/work-items/GH-62.md | .loom/specs/GH-62/task-carrier.md#task | .loom/specs/GH-62/spec.md#required-behavior | .loom/specs/GH-62/plan.md#validation | .loom/specs/GH-62/build-evidence.json | main-thread docs closeout | fresh when local validation and PR metadata are bound to current head |
