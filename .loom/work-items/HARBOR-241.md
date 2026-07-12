# HARBOR-241

## Static Facts

- Item ID: HARBOR-241
- Goal: 保证手动可见身份浏览器不会复用无可见窗口的 Core headless 会话，并保留确认后的 headed user session 向 Core 安全交接。
- Scope: Harbor Runtime Session 的 visibility compatibility、owner/holder lock、incompatible session cleanup、对应测试和 HARBOR-241 carriers；不改变认证语义，不触碰 App/Core/Lode 或真实账号材料。
- Execution Path: work/harbor-241-session-visibility-compatibility
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-241.md
- Review Entry: .loom/reviews/HARBOR-241.json
- Validation Entry: pnpm typecheck; pnpm test; git diff --check
- Closing Condition: Merge PR #258 after current-head review and hosted gate; keep #241 open until the merged packaged App proves a visible manual session, authentication synchronization, and safe Core handoff.

## Associated Artifacts

- `.loom/work-items/HARBOR-241.md`
- `.loom/progress/HARBOR-241.md`
- `.loom/reviews/HARBOR-241.json`
- `.loom/status/current.md`
- `packages/runtime-api/src/identity-environment-manager.ts`
- `packages/runtime-api/src/identity-environment-manager.test.ts`
- `.loom/specs/HARBOR-241/spec.md`
- `.loom/specs/HARBOR-241/plan.md`
