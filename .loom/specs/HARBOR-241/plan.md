# Plan

## Phases

1. Add a Harbor runtime method that resolves an active managed session and atomically updates its linked identity environment with a user-confirmed authentication fact.
2. Expose the session-bound Runtime API endpoints with structured fail-closed responses, including canonical redacted 404 owner readbacks for missing and lost sessions on both GET routes.
3. Add fixture-server tests for success, persisted public readback, and rejected session states.
4. Validate static tests, then use the existing real session only to send the user-confirmed intent after confirming the user has manually logged in; read back Harbor and App public facts.
5. Create a single Harbor #241 PR. The App consumer wiring remains a separate dependent scope.

## Validation

- `pnpm typecheck`
- `pnpm test`
- targeted Runtime API tests
- `git diff --check`
- `loom fact-chain --target . --item HARBOR-241 --json`
- `loom suite validate --target . --item HARBOR-241 --json`
- `loom suite carrier validate --target . --item HARBOR-241 --json`
- `loom suite evidence validate --target . --item HARBOR-241 --json`
