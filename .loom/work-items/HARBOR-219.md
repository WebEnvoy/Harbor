# HARBOR-219

## Static Facts

- Item ID: HARBOR-219
- Goal: Provide a local Harbor Runtime HTTP API readiness entry point that App and Core can consume before real browser/session work.
- Scope: Covers Harbor #219/#220/#221/#222/#223 as one thin Runtime API adapter batch under parent Harbor #218.
- Execution Path: work/harbor-219-runtime-api-readiness
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-219.md
- Review Entry: .loom/reviews/HARBOR-219.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; HTTP readiness/provider readback; git diff --check; loom fact-chain --target . --json; loom verify --target . --json; loom suite validate --target . --item HARBOR-219 --json; loom suite carrier validate --target . --item HARBOR-219 --json
- Closing Condition: PR created and pushed for Harbor #219 with PR body listing covered and non-covered issues; no issue closeout before merge.

## Covered Work Items

- #219 provide Harbor Runtime API readiness and service entry point.
- #220 expose browser provider status endpoints.
- #221 expose identity environment endpoints.
- #222 expose browser session lifecycle endpoints.
- #223 expose refs-only evidence endpoints.

## Non-covered Work Items

- #203-#212 complete product closeout and live site evidence.

## Safety Boundary

- No real account, daily browser profile, Cookie, token, production page action, submit, publish, message send, risk-control bypass, hosted browser, marketplace, or bulk collection.
- Runtime API returns status/facts/refs only and does not expose raw CDP endpoints, raw screenshots, profile storage, credential material, cookies, tokens, DOM, HAR, or network bodies.

## Associated Artifacts

- packages/runtime-api/src/server.ts
- packages/runtime-api/src/server.test.ts
- packages/runtime-api/src/runtime-server.ts
- packages/runtime-api/src/index.ts
- package.json
- .loom/specs/HARBOR-219/**
