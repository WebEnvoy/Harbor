# HARBOR-165

## Static Facts

- Item ID: HARBOR-165
- Goal: Deliver PR Ready runtime session lifecycle for Harbor FR #158: open, reuse, lock, release, stop, and expose page/control/error facts for real local browser sessions.
- Scope: Covers Harbor #165/#166/#167/#168 and semantic stories #8/#9/#10 from #158; ownership is limited to Harbor runtime-api files and HARBOR-165 Loom carriers; excludes full browser management console, hosted browser, credential/cookie/token storage, identity environment upload, CAPTCHA/risk bypass, real login automation, and Core/Lode/App changes.
- Execution Path: work/harbor-158-real-runtime-session
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-165.md
- Review Entry: .loom/reviews/HARBOR-165.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; git diff --check; loom verify --target . --json; loom fact-chain --target . --json; loom suite validate/carrier/evidence validate --target . --item HARBOR-165 --json
- Closing Condition: Implementation PR #189 is merged, closeout evidence is posted for #158/#165/#166/#167/#168, and HARBOR-165 terminal metadata is recorded before current pointer retire.

## Covered Work Items

- #165 absorb Donut Browser launch lifecycle mechanisms as reference only.
- #166 open a target URL for a selected identity environment and report launch failure facts.
- #167 reuse, lock, release, and stop runtime sessions without control-owner stealing.
- #168 expose URL, title, status, controller, lock, and error facts without private browser material.

## Associated Artifacts

- packages/runtime-api/src/runtime-session.ts
- packages/runtime-api/src/runtime-session-types.ts
- packages/runtime-api/src/local-provider-launcher.ts
- packages/runtime-api/src/runtime-fixtures.ts
- packages/runtime-api/src/index.ts
- packages/runtime-api/src/index.test.ts
- packages/runtime-api/src/smoke.ts
- packages/runtime-api/src/viewer-control.ts
- .loom/specs/HARBOR-165/**
- .loom/progress/HARBOR-165.md
