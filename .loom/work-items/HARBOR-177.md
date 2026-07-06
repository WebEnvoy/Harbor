# HARBOR-177

## Static Facts

- Item ID: HARBOR-177
- Goal: Manage local browser providers and installation guidance for CloakBrowser primary and official Chrome restricted fallback.
- Scope: Covers Harbor #177/#178/#179/#180/#181 and semantic stories #4/#5/#6/#7; excludes Chromium user provider management, Donut Browser provider registration, provider marketplace, hosted browser, automatic download/install, and target-site risk bypass guarantees.
- Execution Path: work/harbor-177-provider-management
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-177.md
- Review Entry: .loom/reviews/HARBOR-177.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; git diff --check
- Closing Condition: Implementation PR merged, #177/#178/#179/#180/#181 closeout evidence posted, and current pointer returns to no_active_item.

## Covered Work Items

- #178 detect CloakBrowser and official Chrome install/path/version/launchability states.
- #179 define capability matrix, limitations, and CloakBrowser default selection with Chrome restricted fallback.
- #180 bind identity environments to the selected default provider without silently degrading from CloakBrowser.
- #181 expose manual download guidance and launch failure diagnostics.

## Associated Artifacts

- packages/runtime-api/src/provider-management.ts
- packages/runtime-api/src/provider-capabilities.ts
- packages/runtime-api/src/index.ts
- packages/runtime-api/src/index.test.ts
- packages/runtime-api/src/smoke.ts
- .loom/specs/HARBOR-177/**
