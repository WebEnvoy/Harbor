# Implementation Contract

## Scope

- Touch only Runtime API preview evidence status shape, tests, smoke, and item-specific Loom carrier for #142/#143/#144/#145.
- Keep all values refs-only or redacted; no raw browser/profile/network/evidence material.

## Verification

- `pnpm typecheck`
- `pnpm test`
- `pnpm smoke:runtime`
- `git diff --check`
