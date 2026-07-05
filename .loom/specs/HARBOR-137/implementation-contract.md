# Implementation Contract

## Scope

- Runtime API only; no browser provider expansion and no true submit.
- Return structured unavailable states rather than raw target/session material.

## Verification

- `pnpm typecheck`
- `pnpm test`
- `pnpm smoke:runtime`
- `git diff --check`
