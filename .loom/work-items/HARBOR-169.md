# HARBOR-169

## Static Facts

- Item ID: HARBOR-169
- Goal: Output identity environment consistency facts for Harbor #159 so users can see whether a local identity environment is usable and Core/App can consume provider, environment, login, drift, and risk summaries.
- Scope: Covers Harbor #159/#169/#170/#171/#172 and semantic story #2; ownership is limited to Harbor runtime-api identity consistency files and HARBOR-169 Loom carriers; excludes App/Core/Lode changes, issue closeout, dependency graph edits, real account/profile/cookie/token material, platform-private detection strategies, risk-bypass promises, cloud hosting, Chromium provider registration, and Donut Browser provider registration.
- Execution Path: work/harbor-159-identity-consistency-facts
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-169.md
- Review Entry: .loom/reviews/HARBOR-169.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; sensitive material check; git diff --check; loom fact-chain --target . --json; loom verify --target . --json; loom suite validate/carrier/evidence --target . --item HARBOR-169 --json
- Closing Condition: Implementation PR #192 merged; #159/#169/#170/#171/#172 closed with post-merge evidence; closeout carrier PR is pending.

## Covered Work Items

- #169 absorb CloakBrowser-Manager provider capability and launch facts while keeping CloakBrowser as the default primary provider.
- #170 output proxy, fingerprint, browser version, and resource satisfaction states.
- #171 record drift, missing login state, site block, browser error, and recoverable risk facts.
- #172 expose Core/App/Lode-safe public facts without sensitive material.

## Associated Artifacts

- packages/runtime-api/src/identity-consistency.ts
- packages/runtime-api/src/identity-consistency.test.ts
- packages/runtime-api/src/index.ts
- packages/runtime-api/src/index.test.ts
- packages/runtime-api/src/smoke.ts
- .loom/specs/HARBOR-169/**
- .loom/reviews/HARBOR-169.json
- .loom/reviews/HARBOR-169.spec.json
