# Current Status

## Derived Fact Chain View

- Item ID: GH-88
- Goal: Establish the first minimal Harbor Runtime API skeleton and deterministic Runtime Session smoke for milestone #8.
- Scope: Runtime API create/get/close entry, local dedicated profile provider baseline facts, profile/session lifecycle facts, provider/runtime error facts, and ownership constraints covering #85 and Work Items #88-#91.
- Execution Path: runtime-session-smoke/local-dedicated-profile
- Workspace Entry: .
- Recovery Entry: .loom/progress/GH-88.md
- Review Entry: .loom/reviews/GH-88.json
- Validation Entry: `pnpm test`; `pnpm smoke:runtime`; `pnpm smoke:runtime:local`; `loom suite validate --target . --item GH-88 --json`; `loom suite carrier validate --target . --item GH-88 --json`; `loom suite evidence validate --target . --item GH-88 --json`; `loom build --target . --item GH-88 --build-evidence .loom/specs/GH-88/build-evidence.json --json`.
- Closing Condition: PR is merged, hosted checks pass, ownership constraints are unchanged, closeout evidence records PR/head/merge commit/hosted run, and issues #88-#91 are closed or explicitly reconciled.
- Current Checkpoint: merge
- Current Stop: PR #101 has current-head Loom spec and implementation review records and is ready for hosted merge gate at head 5df38c05a84bbb2fa4dadd57e3a57de2c315974a.
- Next Step: Rerun hosted gate and merge only if required checks pass; do not close issues before post-merge closeout evidence.
- Blockers: None recorded.
- Latest Validation Summary: `pnpm typecheck`, `pnpm test`, `pnpm smoke:runtime`, `pnpm smoke:runtime:local`, `git diff --check`, JSON readability, `loom suite validate --item GH-88`, `loom suite carrier validate --item GH-88`, `loom suite evidence validate --item GH-88`, `loom verify`, and `loom fact-chain` passed on branch `work/GH-88-runtime-session-smoke`. Local smoke launched Chrome/149.0.7827.201 with a temporary dedicated profile and opaque `cdp_ref`; hosted run 28532906940 passed `py-compile`, `demo-bootstrap`, `repo-local-cli`, and `loom-check`, while `loom-pr-merge-gate` blocked on missing review artifacts.
- Recovery Boundary: Revert this branch if the runtime skeleton leaks raw CDP endpoints, stores credentials/profile data, expands into Snapshot/Evidence/Viewer scope, or requires real browser/account state for default tests.
- Current Lane: merge-ready

## Runtime Evidence

- Run Entry: not_applicable
- Logs Entry: not_applicable
- Diagnostics Entry: not_applicable
- Verification Entry: .loom/specs/GH-88/build-evidence.json
- Lane Entry: merge-ready

## Sources

- Static Truth: .loom/work-items/GH-88.md
- Dynamic Truth: .loom/progress/GH-88.md
- Locator Truth: .loom/bootstrap/init-result.json
- Fact Chain CLI: loom fact-chain --target . --json

## Notes

- 2026-07-01: Runtime-upgrade carrier refreshed for Loom 0.25.0 maintenance PR #83; this does not claim product or runtime implementation.
