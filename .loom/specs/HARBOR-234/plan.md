# Plan

## Suite Decision

- Suite path: full

## Phases

1. P-001 Add a small `site-runtime-facts` module with public/redacted types and projection helpers.
2. P-002 Add `HarborRuntime` methods for session-scoped site resource facts and write-precheck facts.
3. P-003 Expose HTTP endpoints under `/runtime/sessions/{runtime_session_ref}/site-resource-facts` and `/runtime/sessions/{runtime_session_ref}/write-precheck-facts`.
4. P-004 Add focused server tests for success, unsupported input, missing sessions, challenge/failure classifications, write-precheck no-submit guard, and evidence ref readback.
5. P-005 Run Harbor validation, update build evidence, prepare PR metadata, and request current-head review.

## Validation

- `pnpm typecheck`
- `pnpm test`
- `pnpm smoke:runtime`
- `git diff --check`
- `loom fact-chain --target . --json`
- `loom verify --target . --json`
- `loom suite validate --target . --item HARBOR-234 --json`
- `loom suite carrier validate --target . --item HARBOR-234 --json`

## PR Body Requirements

- Anchor Work Item: Harbor #234.
- Covered: site resource facts endpoint and write-precheck facts endpoint.
- Not covered: App/Core/Lode code, live site/account/profile evidence, true writes, hosted browser, marketplace, batch collection, risk-control bypass, milestone closeout.
- Evidence: validation commands, head SHA, sample public/redacted facts payload, and explicit no-live-action boundary.
