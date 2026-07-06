# HARBOR-204

## Static Facts

- Item ID: HARBOR-204
- Goal: Manage local xiaohongshu and BOSS identity environments with local profile, Cookie/storage login-state status, provider binding, and environment consistency summaries.
- Scope: Covers Harbor #203/#204/#205/#206/#207; excludes #208, real site actions, real xiaohongshu/BOSS page launches, risk-control bypass promises, and GitHub issue status changes.
- Execution Path: work/harbor-203-local-identity-management
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-204.md
- Review Entry: .loom/reviews/HARBOR-204.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; git diff --check
- Closing Condition: Implementation PR merged, covered issues receive post-merge closeout evidence, and current pointer returns to no_active_item.

## Covered Work Items

- #204 create local identity environments for xiaohongshu/BOSS with refs and status only.
- #205 import/manage local browser profile, Cookie/storage, login-state, keychain/local secret refs, and deletion boundary.
- #206 bind proxy, region, language, timezone, browser family, provider, and fingerprint summary consistency facts.
- #207 expose only public status and redacted refs to App/Core/Lode consumers.

## Associated Artifacts

- packages/runtime-api/src/identity-environment-manager.ts
- packages/runtime-api/src/identity-environment.ts
- packages/runtime-api/src/identity-consistency.ts
- packages/runtime-api/src/index.ts
- packages/runtime-api/src/index.test.ts
- packages/runtime-api/src/smoke.ts
- README.md
- .loom/specs/HARBOR-204/**
