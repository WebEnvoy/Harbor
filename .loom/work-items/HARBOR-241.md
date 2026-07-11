# HARBOR-241

## Static Facts

- Item ID: HARBOR-241
- Goal: 同步用户确认的受控会话认证状态，使 App 可消费 Harbor public identity fact。
- Scope: Harbor runtime API、identity environment manager、session-bound user-confirmed authentication intent、对应测试和 HARBOR-241 carriers。Corrective Work Item #247 additionally updates only the installed Loom consumer and its repo-owned PR metadata contract in `.github/workflows/loom-check.yml`, `.loom/installed-state.json`, `.loom/companion/repo-interface.json`, and `.github/PULL_REQUEST_TEMPLATE.md` from the released `v0.28.0` compatibility shape to `v0.28.1`, so PR #246's hosted gate consumes the upstream fix; workflow behavior is unchanged. Ownership constraints: only those Harbor Runtime API, gate-consumer, PR metadata, and HARBOR-241 carriers may change; App/Core/Lode and sensitive material remain forbidden.
- Execution Path: work/harbor-241-auth-readiness
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-241.md
- Review Entry: .loom/reviews/HARBOR-241.json
- Validation Entry: pnpm typecheck; pnpm test; git diff --check
- Closing Condition: PR #246 has merged; close after its post-merge packaged-App authentication E2E is recorded in the recovery entry and this carrier-only retire lane reaches `main`.

## Associated Artifacts

- `.loom/work-items/HARBOR-241.md`
- `.loom/progress/HARBOR-241.md`
- `.loom/reviews/HARBOR-241.json`
- `.loom/status/current.md`
- `packages/runtime-api/src/identity-environment-manager.ts`
- `packages/runtime-api/src/identity-environment-manager.test.ts`
- `.loom/specs/HARBOR-241/spec.md`
- `.loom/specs/HARBOR-241/plan.md`
