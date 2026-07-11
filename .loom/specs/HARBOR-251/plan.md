# Plan

1. Align the BOSS target path with the pinned Lode package contract.
2. Keep the existing trusted probe, session, authentication, exact-network, and refs-only boundaries.
3. Add directed admission/probe/runtime regressions for the BOSS slice.
4. Run targeted tests, typecheck, full tests, and diff check.
5. Push a ready PR covering #251 without merge or issue closeout.

## Acceptance Mapping

- AC-001 -> automated: `read-operation.test.ts` canonical BOSS query/city target and city validation assertions.
- AC-002 -> automated: `read-operation.test.ts` exact path/origin/page/WAPI, cross-query/city, login, challenge, and SPA readiness assertions.
- AC-003 -> automated: `read-operation.test.ts` WAPI business-code/job-list reduction and network-summary binding assertions plus `server.test.ts` refs-only runtime assertions.
- AC-004 -> structural and full regression: scoped diff review plus `pnpm test`.
