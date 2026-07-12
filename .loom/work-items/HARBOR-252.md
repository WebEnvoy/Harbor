# HARBOR-252

## Static Facts

- Item ID: HARBOR-252
- Goal: Align Xiaohongshu note-detail operation source/evidence completion proof exactly with merged Lode detail truth.
- Scope: XHS detail pinned ref requirements, capture/completion proof, focused contract regressions, and HARBOR-252 carriers.
- Execution Path: work/harbor-252-lode-detail-alignment
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

- Do not edit App, Core, Lode, or BOSS production behavior.
- No production page, profile, account, Cookie, token, raw DOM, raw network body, or external write action during implementation validation.
- BOSS detail runtime is deferred and is not acceptance evidence for this Work Item.

## Associated Artifacts

- `.loom/progress/HARBOR-252.md`
- `.loom/specs/HARBOR-252/spec.md`
- `.loom/specs/HARBOR-252/plan.md`
- `.loom/specs/HARBOR-252/implementation-contract.md`
- `.loom/specs/HARBOR-252/evidence-map.md`
