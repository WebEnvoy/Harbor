# Plan

## Suite Decision

- Suite path: full

## Phases

1. P-001 Add a screenshot failure guard in live snapshot capture.
2. P-002 Add a unit test proving screenshot evidence is not minted when screenshot capture fails.
3. P-003 Run Harbor validation and record evidence.
4. P-004 Prepare PR metadata for Harbor #212 and list non-covered issues.

## Validation

- `pnpm typecheck`
- `pnpm test`
- `pnpm smoke:runtime`
- `git diff --check`
- `loom fact-chain --target . --json`
- `loom verify --target . --json`
- `loom suite validate --target . --item HARBOR-212 --json`
- `loom suite carrier validate --target . --item HARBOR-212 --json`
- `loom suite evidence validate --target . --item HARBOR-212 --json`
