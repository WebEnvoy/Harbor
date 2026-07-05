# Implementation Contract

## Ownership

- Harbor owns runtime/session/evidence refs, validation facts, private capture markers, redaction, freshness, retention, and evidence lifecycle policy facts.
- Core owns run records and result envelopes.
- App owns UI display and local UI state only.

## Allowed Edits

- `packages/runtime-api/src/index.ts`
- `packages/runtime-api/src/page-scene.ts`
- `packages/runtime-api/src/index.test.ts`
- `packages/runtime-api/src/smoke.ts`
- `.loom/**/HARBOR-115*`
- `.loom/status/current.md`
- `.loom/bootstrap/init-result.json`

## Forbidden Edits

- No App/Core/Lode implementation changes.
- No hosted browser, real account/profile/session, production page, raw DOM, raw network, cookies, tokens, profile storage, screenshots, video, or Stage 6 behavior.

## Verification

- pnpm typecheck
- pnpm test
- pnpm smoke:runtime
- git diff --check
- loom suite validate --target . --item HARBOR-115 --json
- loom suite evidence validate --target . --item HARBOR-115 --json
- loom suite carrier validate --target . --item HARBOR-115 --json
- loom fact-chain --target . --json
- loom verify --target . --json
