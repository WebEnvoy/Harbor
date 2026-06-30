# Plan

- Suite path: minimal

## Implementation

- Add `docs/adr/0005-runtime-session-lifecycle-v0.md`.
- Add GH-37 item-specific Loom carrier files.
- Add minimal task carrier/build evidence for docs-only suite path.
- Update `.loom/status/current.md` to point at GH-37 for this active lane.
- Keep GH-38 and GH-39 covered as referenced Work Items in the same docs-only contract.

## Validation

- `git diff --check`
- Available low-cost repo checks from the current worktree.
- `loom doctor --target . --json`
- `loom verify --target . --json`
- `loom fact-chain --target . --json`
- Hosted checks after PR creation when available.

## Minimal Path Applicability Records

- full-path-artifacts not_applicable rationale: docs-only contract and Loom carrier update; consumer boundary: ADR text, issue refs, PR metadata, and Loom fact-chain; recheck condition: implementation code, schema/API/runtime behavior, generated facts, fixtures, workflow changes, or user-facing behavior.

## Rollback

Revert this docs-only PR if Stage 2 chooses a different Runtime Session lifecycle contract.
