# HARBOR-204

## Static Facts

- Item ID: HARBOR-204
- Goal: Complete the correction API slice for App/Core-consumable local identity environment management, with per-ref HTTP read/update/delete, status/redacted refs only, and optional local JSON persistence.
- Scope: Covers Harbor #203/#204/#205/#206/#207 as a reopened real-loop correction batch. Ownership is limited to Runtime API identity environment routes, server persistence wiring, matching tests, and HARBOR-204 Loom carriers. Excludes #208/#209/#210/#211/#212, real browser session launch, real site actions, real xiaohongshu/BOSS page launches, risk-control bypass promises, and GitHub issue closeout before merge.
- Execution Path: work/harbor-204-runtime-identity-api-correction
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-204.md
- Review Entry: .loom/reviews/HARBOR-204.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; git diff --check; loom fact-chain --target . --json; loom verify --target . --json; loom suite validate --target . --item HARBOR-204 --json; loom suite carrier validate --target . --item HARBOR-204 --json; loom suite evidence validate --target . --item HARBOR-204 --json
- Closing Condition: Implementation PR merged, covered issues receive post-merge closeout evidence with explicit non-live boundary, and current pointer returns to no_active_item.

## Covered Work Items

- #204 create/import xiaohongshu/BOSS local identity environments via Runtime API with refs and status only.
- #205 read/update/delete local profile, Cookie/storage, and login-state status refs without raw sensitive material.
- #206 expose proxy, region, language, timezone, provider, and fingerprint summary consistency facts as public summaries.
- #207 expose only public status and redacted refs to App/Core/Lode consumers.

## Non-covered Work Items

- #208/#209/#210/#211/#212 real identity browser sessions, site page opening, user handoff, screenshots, and live evidence refs.
- App/Core/Lode implementation changes.
- Real account, real browser profile, Cookie/token values, production page actions, submit/publish/send/write operations, hosted browser, marketplace, batch collection, or risk-control bypass.

## Associated Artifacts

- packages/runtime-api/src/identity-environment-manager.ts
- packages/runtime-api/src/identity-environment.ts
- packages/runtime-api/src/identity-consistency.ts
- packages/runtime-api/src/index.ts
- packages/runtime-api/src/index.test.ts
- packages/runtime-api/src/server.ts
- packages/runtime-api/src/server.test.ts
- packages/runtime-api/src/runtime-server.ts
- .loom/specs/HARBOR-204/spec.md
- .loom/specs/HARBOR-204/plan.md
- .loom/specs/HARBOR-204/evidence-map.md
- .loom/specs/HARBOR-204/task-carrier.md
- .loom/specs/HARBOR-204/build-evidence.json
