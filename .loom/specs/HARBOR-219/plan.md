# Plan

## Phases

1. P-001 Add a thin HTTP server module around existing `HarborRuntime`.
2. P-002 Add a CLI entry point and package script for the compiled server.
3. P-003 Add small tests for readiness, provider status, identity/session/evidence endpoint plumbing, and JSON error behavior.
4. P-004 Run Harbor validation and record evidence.
5. P-005 Prepare PR metadata for Harbor #219 as anchor and list #220/#221/#222/#223 coverage.

## Validation

- `pnpm typecheck`
- `pnpm test`
- `pnpm smoke:runtime`
- `git diff --check`
- `loom fact-chain --target . --json`
- `loom verify --target . --json`
- `loom suite validate --target . --item HARBOR-219 --json`
- `loom suite carrier validate --target . --item HARBOR-219 --json`
