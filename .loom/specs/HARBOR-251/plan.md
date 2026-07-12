# Plan

1. Add a trusted refs-only site-resource probe for the canonical rendered BOSS SPA.
2. Keep exact WAPI response proof deferred to the existing query/city-bound read-operation probe.
3. Add directed ready/login/challenge/blank/unprobeable and public-boundary regressions.
4. Run targeted tests, typecheck, full tests, and diff check.
5. Push a ready PR covering #251 without merge or issue closeout.

## Acceptance Mapping

- AC-001 -> automated: `read-operation.test.ts` canonical BOSS query/city target and city validation assertions.
- AC-002 -> automated: `read-operation.test.ts` exact path/origin/page/WAPI, cross-query/city, login, challenge, and SPA readiness assertions.
- AC-003 -> automated: `read-operation.test.ts` WAPI business-code/job-list reduction and network-summary binding assertions plus `server.test.ts` refs-only runtime assertions.
- AC-004 -> structural and full regression: scoped diff review plus `pnpm test`.
- AC-005 -> automated: `read-operation.test.ts` probe classification matrix and `server.test.ts` refs-only site-resource response assertions.
