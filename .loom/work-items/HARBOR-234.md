# HARBOR-234

## Static Facts

- Item ID: HARBOR-234
- Goal: Add Harbor Runtime API projections for site-level resource facts and write-precheck facts so Core can satisfy Lode Xiaohongshu/BOSS resource requirements without receiving raw browser material.
- Scope: Covers Harbor #234 under parent Harbor #218. Ownership is limited to Harbor runtime API facts projection code, focused tests, and HARBOR-234 item-specific Loom carriers. The implementation may expose session-scoped facts endpoints and write-precheck facts endpoints that return public/redacted status, refs, failure classes, and guard state only.
- Execution Path: work/harbor-234-site-runtime-facts
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-234.md
- Review Entry: .loom/reviews/HARBOR-234.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; git diff --check; loom fact-chain --target . --json; loom verify --target . --json; loom suite validate --target . --item HARBOR-234 --json; loom suite carrier validate --target . --item HARBOR-234 --json
- Closing Condition: PR ready with current-head review and hosted checks for Harbor #234. Issue closeout requires merge commit, PR/head SHA, validation commands, sample facts payload evidence, and explicit boundary that no live account/profile/production page action occurred in this PR.

## Covered Work Items

- #234 produce site-level runtime resource facts and write-precheck facts.

## Blocking / Blocked

- Blocks WebEnvoy/App#265.
- Blocks WebEnvoy/WebEnvoy#243.
- Consumes WebEnvoy/Lode#235, WebEnvoy/Lode#240, and WebEnvoy/Lode#252 capability/resource requirement truth.

## Safety Boundary

- No real account, daily browser profile, Cookie, token, production page action, submit, publish, message send, save, risk-control bypass, hosted browser, marketplace, or bulk collection.
- Facts output must not expose raw CDP endpoints, raw screenshots, profile storage, credential material, cookies, tokens, DOM, HAR, network bodies, or full screenshot bytes.
- This Work Item can use fixture/local-safe sessions and synthetic public page status facts for tests. Live Xiaohongshu/BOSS E2E remains blocked until the user explicitly confirms allowed and prohibited actions.

## Ownership Constraints

- Writes are limited to `packages/runtime-api/src/**`, package-level test files, and HARBOR-234 item-specific Loom carriers including the active status pointer and current-head review record.
- No App, Core, Lode, repository workflow, release, or closeout-retire implementation changes are in scope for this PR.

## Associated Artifacts

- packages/runtime-api/src/server.ts
- packages/runtime-api/src/index.ts
- packages/runtime-api/src/site-runtime-facts.ts
- packages/runtime-api/src/server.test.ts
- .loom/specs/HARBOR-234/**
- .loom/progress/HARBOR-234.md
- .loom/status/current.md
- .loom/reviews/HARBOR-234.json
