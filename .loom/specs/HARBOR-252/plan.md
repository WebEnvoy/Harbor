# Plan

1. Add a process-memory detail target registry with canonical URL validation and one-shot binding.
2. Extend search probes to reduce bounded canonical detail targets and expose only opaque refs.
3. Add detail operation admission and exact local-provider detail-page probes.
4. Cover canonical, forged, binding, expiry, replay, refs-only, and API sequence behavior.
5. Run focused/full validation and prepare a scoped ready PR without live page actions.

## Acceptance Mapping

- AC-001 -> automated: `read-operation.test.ts` rejects direct URL/query/business-id shapes.
- AC-002 -> automated and structural: `detail-read-target.test.ts` plus provider search reductions.
- AC-003 -> automated: `detail-read-target.test.ts` and `server.test.ts` binding/TTL/replay cases.
- AC-004 -> automated and structural: `read-operation.test.ts`, `server.test.ts`, and concrete provider probe review.
- AC-005 -> API JSON privacy assertions plus structural review.
