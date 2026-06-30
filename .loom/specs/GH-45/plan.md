# Plan

- Suite path: minimal

## Implementation

- Add `docs/adr/0007-page-scene-reference-facts-v0.md`.
- Update only the relevant pending decisions for Stage 2 v0 status.
- Add GH-45 item-specific Loom carrier files.
- Update `.loom/status/current.md` to point at GH-45 for this active lane.
- Keep GH-44/GH-46/GH-47/GH-48/GH-49/GH-50/GH-51/GH-52/GH-53 covered as referenced issues in the same docs-only contract.

## Validation

- `git diff --check`
- JSON validation for `.loom/**/*.json`
- `loom fact-chain --target . --json`
- `loom suite validate --target . --item GH-45 --json`
- `loom suite carrier validate --target . --item GH-45 --json`
- Hosted basic checks after PR creation when available.

## Minimal Path Applicability Records

- full-path-artifacts not_applicable rationale: docs-only contract and Loom carrier update.
- consumer boundary: ADR text, issue refs, PR metadata, and Loom fact-chain.
- recheck condition: implementation code, schema/API/runtime behavior, storage schema, generated facts, fixtures, workflow changes, provider adapter, browser smoke, live viewer, real evidence capture, or user-facing behavior.

## Rollback

Revert this docs-only PR if Stage 2 chooses a different Page scene reference facts contract.
