# Spec

## Goal

- Restore the Harbor repository Loom bootstrap fact chain so Stage 5 runtime/evidence-ref work can bind to a consumable repository carrier.
- Keep this change limited to governance carrier metadata; no runtime/session truth, browser profile storage, credential, raw DOM, raw network, or product behavior changes here.

## Suite Path

- Suite path: minimal
- full-path-artifacts not_applicable rationale: bootstrap repair only exercises the minimal formal suite needed to consume INIT-0001 carrier health; consumer boundary: suite validation, spec review, review, merge-ready, and controlled merge must not require suite-index.md, research.md, contracts.md, or readiness-checklist.md for this bootstrap-only repair; recheck condition: switch to full suite when the bootstrap PR carries runtime/session truth, evidence contracts, product behavior, external writes, or shared contract changes.

## Scope

- In scope: bootstrap fact-chain files under `.loom/` for INIT-0001, including current status, progress, review artifacts, and PR metadata surfaces.
- Out of scope: Stage 5 runtime/session/evidence-ref contracts, Browser management UI, raw evidence exposure, and any Stage 6 behavior.

## Behavior Evidence

- Story scenario mapping: No user-facing story scenario is changed by this bootstrap carrier repair.
- Story business confirmation locator: Stage 5 story readiness is carried by downstream real Work Item PRs, not INIT-0001.
- Scenario coverage: Repository carrier validation and hosted Loom check consume this repair.
- Expected evidence locator: `.loom/progress/INIT-0001.md`
- Freshness rule: Evidence is refreshed whenever the bootstrap carrier branch changes.
- Execution ledger acceptance locator: `.loom/progress/INIT-0001.md`

## Exceptions And Boundaries

- Failure modes: If hosted gate still reports stale review or invalid carrier fields, repair only those carrier fields before downstream Stage 5 PRs advance.
- Operational boundaries: No live account, runtime profile write, credential, cookie, raw DOM, raw network, or profile storage is introduced.
- Rollback or fallback expectations: Revert the bootstrap carrier commit without touching product code.

## Acceptance Criteria

- [x] Bootstrap carrier scope is explicit and non-product.
- [x] Suite path decision is present.
- [x] Full-path artifact deferral has rationale, consumer boundary, and recheck condition.
- [x] Validation evidence can be consumed by review, merge-ready, and closeout.
