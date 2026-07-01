# Plan

## Implementation

- Add `docs/adr/0008-harbor-runtime-architecture-baseline.md`.
- Update `docs/contracts/README.md` to link the baseline and define required read order for later skeletons.
- Update `AGENTS.md` with Harbor runtime stack, dependency, smoke-test, scope and safety constraints.
- Add GH-71 Loom carrier files and bind the branch to coverage #70-#79.

## Validation

- `git diff --check`
- JSON readability check for `.loom/specs/GH-71/build-evidence.json`
- Markdown readability check for changed Markdown files
- `loom suite validate --target . --item GH-71 --json`
- `loom suite carrier validate --target . --item GH-71 --json`
- `loom build --target . --item GH-71 --build-evidence .loom/specs/GH-71/build-evidence.json --json`
- PR body/head readback with PR metadata preflight.

## PR Ready

- Push `work/tech-baseline-harbor`.
- Create a PR against `main`.
- Use Refs for #70-#79; do not use automatic close keywords.
- Do not merge and do not close issues.
