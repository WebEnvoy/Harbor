# HARBOR-161

## Static Facts

- Item ID: HARBOR-161
- Goal: Define local website identity environment facts and protected-material boundaries for Harbor FR #157.
- Scope: Covers Harbor #161/#162/#163/#164/#182 and semantic stories #1/#3 from #157; ownership is limited to Harbor runtime-api files and HARBOR-161 Loom carriers; excludes cloud account hosting, team password vaults, account marketplaces, risk-bypass guarantees, automatic CAPTCHA/2FA bypass, live site login, and App/Core/Lode changes.
- Execution Path: work/harbor-157-local-identity-environments
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-161.md
- Review Entry: .loom/reviews/HARBOR-161.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; git diff --check; loom verify --target . --json; loom fact-chain --target . --json; loom suite validate/carrier/evidence validate --target . --item HARBOR-161 --json
- Closing Condition: Implementation PR for #161/#162/#163/#164/#182 is PR Ready; no merge or issue closeout in this execution thread.

## Covered Work Items

- #161 define identity environment fields and sensitive material boundaries.
- #162 define site binding, login-state, browser-storage lifecycle, and cleanup rules.
- #163 define proxy, region, language, timezone, browser identity, and fingerprint summary facts.
- #164 define import/export/delete and local encryption boundaries.
- #182 define local credential references and manual authentication recovery states.

## Associated Artifacts

- packages/runtime-api/src/identity-environment.ts
- packages/runtime-api/src/index.ts
- packages/runtime-api/src/index.test.ts
- packages/runtime-api/src/smoke.ts
- .loom/specs/HARBOR-161/**
- .loom/progress/HARBOR-161.md
