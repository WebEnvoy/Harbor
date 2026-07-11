# Plan

1. Package and validate the pinned, two-operation Lode #262 admission mirror.
2. Add managed-session preflight and a production-only CDP read-probe adapter.
3. Route the narrow endpoint and produce refs-only operation/evidence/post-check summaries.
4. Cover rejection/failure paths with fixture runtime tests; do not exercise a real browser or production page.
5. Run focused runtime API checks and record remaining merge/live evidence gates.

## Acceptance Mapping

- AC-001 -> automated: `read-operation.test.ts` admission and target validation tests.
- AC-002 -> automated: `server.test.ts` pre-probe and post-probe session-authority tests.
- AC-003 -> automated and structural: operation-specific response validation tests and concrete provider observer review.
- AC-004 -> automated: source/evidence/summary/post-check binding tests.
- AC-005 -> structural check: `closeProviderPage` is consumed by the concrete local-provider probe; real local smoke is required after merge.
- AC-006 -> automated and structural: request/response privacy assertions, fixture API smoke, and static boundary review.
