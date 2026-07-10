# HARBOR-241

## Static Facts

- Item ID: HARBOR-241
- Goal: 同步用户确认的受控会话认证状态，使 App 可消费 Harbor public identity fact。
- Scope: Harbor runtime API、identity environment manager、session-bound user-confirmed authentication intent、对应测试和 HARBOR-241 carriers。
- Execution Path: work/harbor-241-manual-auth-sync
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-241.md
- Review Entry: .loom/reviews/HARBOR-241.json
- Validation Entry: pnpm typecheck; pnpm test; git diff --check
- Closing Condition: 创建并推送绑定 Harbor #241 的 PR；关闭前需有真实 session/identity 回读和 App 刷新证据。

## Associated Artifacts

- `.loom/work-items/HARBOR-241.md`
- `.loom/progress/HARBOR-241.md`
- `.loom/reviews/HARBOR-241.json`
- `.loom/status/current.md`
- `packages/runtime-api/src/server.ts`
- `packages/runtime-api/src/index.ts`
- `packages/runtime-api/src/identity-environment-manager.ts`
- `packages/runtime-api/src/server.test.ts`
- `.loom/specs/HARBOR-241/spec.md`
- `.loom/specs/HARBOR-241/plan.md`
