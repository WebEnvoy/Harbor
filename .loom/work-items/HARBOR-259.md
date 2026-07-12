# HARBOR-259

## Static Facts

- Item ID: HARBOR-259
- Goal: 让 Harbor 已确认认证的 fresh headed user session 在释放后安全交接给 Core 单次只读任务。
- Scope: persisted user-confirmed authentication rebinding、headed local-provider session handoff、原子持久化回滚和对应测试。
- Execution Path: work/harbor-259-authenticated-headed-handoff
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-259.md
- Review Entry: .loom/reviews/HARBOR-259.json
- Validation Entry: pnpm typecheck; pnpm build; targeted tests; pnpm test; git diff --check
- Closing Condition: Merge the HARBOR-259 PR after hosted gate; keep #259/#241 open until merged packaged App reuses the same headed session and completes a real BOSS read-only run.

## Associated Artifacts

- `.loom/specs/HARBOR-259/spec.md`
- `.loom/specs/HARBOR-259/plan.md`
- `.loom/progress/HARBOR-259.md`
- `.loom/reviews/HARBOR-259.json`
