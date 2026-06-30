# Plan

- Suite path: minimal

## Implementation

- Add `docs/adr/0006-provider-profile-identity-facts-v0.md`.
- Add GH-41 item-specific Loom carrier files.
- Add minimal task carrier/build evidence for docs-only suite path.
- Update `.loom/status/current.md` to point at GH-41 for this active lane.
- Keep GH-40, GH-42 and GH-43 covered as referenced issues in the same docs-only contract.

## Validation

- `git diff --check`
- JSON validation for `.loom/**/*.json`
- `loom doctor --target . --json`
- `loom verify --target . --json`
- `loom fact-chain --target . --json`
- `loom suite validate --target . --item GH-41 --json` if available
- `loom suite carrier validate --target . --item GH-41 --json` if available
- Hosted basic checks after PR creation when available.

## Minimal Path Applicability Records

- full-path-artifacts not_applicable rationale: docs-only contract and Loom carrier update; consumer boundary: ADR text, issue refs, PR metadata, and Loom fact-chain; recheck condition: implementation code, schema/API/runtime behavior, generated facts, fixtures, workflow changes, provider evaluation, browser smoke, or user-facing behavior.

## Rollback

Revert this docs-only PR if Stage 2 chooses a different Provider/Profile/Identity facts contract.
