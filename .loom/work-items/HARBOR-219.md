# HARBOR-219

## Static Facts

- Item ID: HARBOR-219
- Goal: Repair the local Harbor Runtime HTTP API admission path so App/Core can start it from source without stale ignored build output and verify the API contract before real browser/session work.
- Scope: Covers Harbor #219 under parent Harbor #218, with ownership constrained to the runtime API start command, runtime server startup metadata, fixture-only API smoke, and HARBOR-219 carriers.
- Execution Path: work/harbor-234-runtime-admission-smoke
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-219.md
- Review Entry: .loom/reviews/HARBOR-219.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; pnpm smoke:runtime:api; git diff --check; loom fact-chain --target . --json; loom verify --target . --json; loom suite validate --target . --item HARBOR-219 --json; loom suite carrier validate --target . --item HARBOR-219 --json; loom suite evidence validate --target . --item HARBOR-219 --json
- Closing Condition: PR created and pushed for Harbor #219 with PR body listing covered and non-covered issues; no issue closeout in this worker batch.

## Covered Work Items

- #219 provide Harbor Runtime API readiness and service entry point.

## Non-covered Work Items

- #220-#223 endpoint implementation closeouts already exist and are not reopened or reclosed by this branch.
- #234 site-level resource facts and write-precheck facts is closed and not the anchor for this branch.
- App/Core packaged E2E, live site evidence, and issue closeout are outside this worker batch.

## Safety Boundary

- No real account, daily browser profile, Cookie, token, production page action, submit, publish, message send, risk-control bypass, hosted browser, marketplace, or bulk collection.
- Runtime API returns status/facts/refs only and does not expose raw CDP endpoints, raw screenshots, profile storage, credential material, cookies, tokens, DOM, HAR, or network bodies.

## Ownership Constraints

- Writes are limited to `package.json`, `packages/runtime-api/src/runtime-server.ts`, `packages/runtime-api/src/server-smoke.ts`, and HARBOR-219 item-specific Loom carriers, including the active status pointer needed for later PR/review consumption.
- This worktree does not modify App, Core, Lode, closeout records, real browser profile data, cookies, tokens, raw DOM, raw HAR, network response bodies, or production page evidence.

## Associated Artifacts

- packages/runtime-api/src/runtime-server.ts
- packages/runtime-api/src/server-smoke.ts
- package.json
- .loom/specs/HARBOR-219/build-evidence.json
- .loom/specs/HARBOR-219/**
- .loom/status/current.md
- .loom/reviews/HARBOR-219.json
