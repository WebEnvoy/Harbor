# Plan

- Suite path: minimal

## Implementation

- Rewrite `docs/draft/README.md` as lifecycle rules plus draft inventory.
- Add `docs/contracts/README.md` as an ADR contract index.
- Pointerize promoted draft files.
- Mark `docs/draft/architecture.md` as pending with owner, linked issue, and exit condition.
- Add GH-62 item-specific Loom carrier files.
- Update `.loom/status/current.md` to GH-62.

## Validation

- `git diff --check`
- JSON validation for `.loom/**/*.json`
- `loom fact-chain --target . --json`
- `loom suite validate --target . --item GH-62 --json`
- `loom suite carrier validate --target . --item GH-62 --json`

## Minimal Path Applicability Records

- full-path-artifacts not_applicable rationale: docs-only draft closeout and Loom carrier update.
- consumer boundary: ADR/contracts/draft docs, PR metadata, and GH-62 fact-chain.
- recheck condition: code, schema, API, runtime, generated facts, fixtures, provider, storage, browser, or behavior changes in this PR or a follow-up PR.

## Rollback

Revert this docs-only PR if Harbor keeps draft documents as active planning truth for the milestone.
