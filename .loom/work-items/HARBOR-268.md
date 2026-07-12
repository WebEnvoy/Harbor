# HARBOR-268

## Static Facts

- Item ID: HARBOR-268
- Goal: Require verified Xiaohongshu result semantics instead of URL, title, or ready state before a read operation succeeds.
- Scope: XHS search semantic extraction, bounded canonical detail targets, fail-closed validation, focused regressions, and item-specific carriers.
- Execution Path: work/harbor-268-page-semantics
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-268.md
- Review Entry: .loom/reviews/HARBOR-268.json
- Validation Entry: pnpm typecheck; pnpm build; targeted tests; pnpm test; git diff --check
- Closing Condition: Ready PR for issue #268 with current-head review and hosted checks; live issue closeout remains post-merge.

## Non-Goals

- No BOSS production selector/probe or page access; BOSS remains disabled/deferred.
- No auth, session, profile, provider, Core, Lode, or App behavior changes.
- No automatic login, sensitive material access, external write, bulk collection, or risk-control bypass.

## Associated Artifacts

- .loom/specs/HARBOR-268/spec.md
- .loom/specs/HARBOR-268/plan.md
- .loom/specs/HARBOR-268/implementation-contract.md
- .loom/specs/HARBOR-268/evidence-map.md
- .loom/specs/HARBOR-268/task-carrier.md
