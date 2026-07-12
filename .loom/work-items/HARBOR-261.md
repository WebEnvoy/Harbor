# HARBOR-261

## Static Facts

- Item ID: HARBOR-261
- Goal: 让真实浏览器启动、页面读取和后续 open-url 在安全验证或无响应目标上有界完成。
- Scope: provider version/page-list/CDP title/open-url timeout、challenge target fallback 和对应测试。
- Execution Path: work/harbor-261-bounded-provider-readback
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-261.md
- Review Entry: .loom/reviews/HARBOR-261.json
- Validation Entry: pnpm typecheck; pnpm build; targeted tests; pnpm test; git diff --check
- Closing Condition: Merge the HARBOR-261 PR after hosted gate; close only after packaged App no longer remains indefinitely at session request.

## Associated Artifacts

- `.loom/specs/HARBOR-261/spec.md`
- `.loom/specs/HARBOR-261/plan.md`
- `.loom/specs/HARBOR-261/implementation-contract.md`
- `.loom/progress/HARBOR-261.md`
