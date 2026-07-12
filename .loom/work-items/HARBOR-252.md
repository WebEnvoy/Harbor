# HARBOR-252

## Static Facts

- Item ID: HARBOR-252
- Goal: Add one-shot Xiaohongshu note-detail and BOSS job-detail read operations that consume only opaque refs minted from a same-session real search result.
- Scope: Harbor detail target registry, Runtime API operation admission, local-provider detail probe, focused tests, and HARBOR-252 item-specific carriers.
- Execution Path: work/harbor-252-detail-read-operations
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-252.md
- Review Entry: .loom/reviews/HARBOR-252.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm build; git diff --check
- Closing Condition: Ready implementation PR only. Keep #252 open until merged-head Core/App live detail E2E produces refs.

## Host Binding

- GitHub Work Item: https://github.com/WebEnvoy/Harbor/issues/252
- Parent FR: https://github.com/WebEnvoy/Harbor/issues/218
- Contract dependency: https://github.com/WebEnvoy/Lode/issues/268

## Ownership Constraints

- Do not edit App, Core, Lode, or shared `.loom/status/current.md`.
- No production page, profile, account, Cookie, token, raw DOM, raw network body, or external write action during implementation validation.

## Associated Artifacts

- `.loom/progress/HARBOR-252.md`
- `.loom/specs/HARBOR-252/spec.md`
- `.loom/specs/HARBOR-252/plan.md`
- `.loom/specs/HARBOR-252/implementation-contract.md`
- `.loom/specs/HARBOR-252/evidence-map.md`
