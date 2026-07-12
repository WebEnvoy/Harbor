# HARBOR-263

## Static Facts

- Item ID: HARBOR-263
- Goal: 保持已确认 headed managed session 在连续、独立提交的 Core 只读任务之间的可信 controller handoff。
- Scope: shared Runtime Session release/acquire handoff lifecycle and focused lifecycle regressions.
- Execution Path: work/harbor-263-continuous-handoff
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-263.md
- Review Entry: .loom/reviews/HARBOR-263.json
- Validation Entry: pnpm typecheck; pnpm build; targeted tests; pnpm test; git diff --check
- Closing Condition: Merge the HARBOR-263 PR after hosted gate; close only after packaged App proves two separately submitted reads on the same confirmed session.

## Associated Artifacts

- `.loom/specs/HARBOR-263/spec.md`
- `.loom/specs/HARBOR-263/plan.md`
- `.loom/specs/HARBOR-263/implementation-contract.md`
- `.loom/progress/HARBOR-263.md`
