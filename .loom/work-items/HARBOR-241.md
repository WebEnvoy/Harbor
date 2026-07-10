# HARBOR-241

## Static Facts

- Item ID: HARBOR-241
- Goal: 同步用户确认的受控会话认证状态，使 App 可消费 Harbor public identity fact。
- Scope: Harbor runtime API、identity environment manager、session-bound user-confirmed authentication intent、对应测试和 HARBOR-241 carriers。 Ownership constraints: only Harbor Runtime API code and HARBOR-241 carriers may change; App/Core/Lode and sensitive material remain forbidden.
- Execution Path: work/harbor-241-auth-readiness
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-241.md
- Review Entry: .loom/reviews/HARBOR-241.json
- Validation Entry: pnpm typecheck; pnpm test; git diff --check
- Closing Condition: Create and push a Harbor #241 PR with ownership constraints, current head, test evidence, and no-sensitive-material/non-write boundary; close only after real session/identity and App refresh evidence.

## Associated Artifacts

- `.loom/work-items/HARBOR-241.md`
- `.loom/progress/HARBOR-241.md`
- `.loom/reviews/HARBOR-241.json`
- `.loom/status/current.md`
- `packages/runtime-api/src/identity-environment-manager.ts`
- `packages/runtime-api/src/identity-environment-manager.test.ts`
- `.loom/specs/HARBOR-241/spec.md`
- `.loom/specs/HARBOR-241/plan.md`
