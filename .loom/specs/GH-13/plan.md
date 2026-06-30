# Plan

## Execution

- Suite path: not_applicable
- Update `docs/adr/pending-decisions.md` with the accepted provider baseline, runtime smoke, research absorption, and non-goal boundaries.
- Keep changes docs/carrier-only; do not add runtime code or provider scaffolding.

## Validation

- `git diff --check`
- packaged `loom_flow.py fact-chain --target .`
- PR body metadata preflight/readback
- Hosted checks; merge gate remains blocked until current-head Loom review exists.
