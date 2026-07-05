# HARBOR-115

## Static Facts

- Item ID: HARBOR-115
- Goal: Complete Stage 5 validation runtime facts and private/redacted evidence policy facts for Core/App consumption.
- Scope: Batch covers Harbor #115, #116, #117, #120, #121, and #122 through Runtime API validation facts, provider/profile/session refs, runtime blockers, local private capture store boundaries, redacted export boundary, retention/redaction/export consent, and delete policy fields.
- Execution Path: stage5/validation-private-policy
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-115.md
- Review Entry: .loom/reviews/HARBOR-115.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; git diff --check
- Closing Condition: Core/App can consume Harbor validation and evidence lifecycle facts without raw DOM, raw network, cookies, tokens, profile storage, production pages, hosted browser, or Stage 6 behavior.

## Covered Work Items

- #115 capability validation runtime facts minimum set.
- #116 provider/profile/session refs and validation refs.
- #117 structured runtime-not-satisfied reasons.
- #120 local private capture store and sensitive material markers.
- #121 raw-to-redacted fixture export boundary.
- #122 retention, redaction, export consent, and delete policy.

## Associated Artifacts

- `.loom/work-items/HARBOR-115.md`
- `.loom/progress/HARBOR-115.md`
- `.loom/reviews/HARBOR-115.json`
- `.loom/specs/HARBOR-115/spec.md`
- `.loom/specs/HARBOR-115/plan.md`
- `.loom/specs/HARBOR-115/implementation-contract.md`
- `.loom/specs/HARBOR-115/evidence-map.md`
- `.loom/specs/HARBOR-115/task-carrier.md`
- `.loom/status/current.md`
- `packages/runtime-api/src/index.ts`
- `packages/runtime-api/src/page-scene.ts`
- `packages/runtime-api/src/index.test.ts`
- `packages/runtime-api/src/smoke.ts`
