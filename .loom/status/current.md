# Current Status

## Derived Fact Chain View

- Item ID: GH-97
- Goal: Expose the first Harbor Viewer, handoff, Core runtime facts, and App status fixture slice for FR #87.
- Scope: Viewer ref/readback, viewer availability/access mode/expiry, control owner and handoff reason facts, takeover availability facts, Core runtime facts query, App runtime status fixture, and ownership constraints covering #87 and Work Items #97-#100.
- Execution Path: viewer-handoff-facts/local-runtime-api
- Workspace Entry: .
- Recovery Entry: .loom/progress/GH-97.md
- Review Entry: .loom/reviews/GH-97.json
- Validation Entry: `pnpm typecheck`; `pnpm test`; `pnpm smoke:runtime`; `pnpm smoke:runtime:local`; `git diff --check`; `loom suite validate --target . --item GH-97 --json`; `loom suite carrier validate --target . --item GH-97 --json`; `loom suite evidence validate --target . --item GH-97 --json`; `loom build --target . --item GH-97 --build-evidence .loom/specs/GH-97/build-evidence.json --json`.
- Closing Condition: PR is merged into `main`, hosted checks and Loom gate pass for the PR head, closeout evidence records PR/head/merge commit/hosted run, and issues #87/#97-#100 are closed.
- Current Checkpoint: merge
- Current Stop: GH-97 code, carriers, suite/carrier/evidence validation, fact-chain, review readback, and verify have passed; PR metadata is being prepared before hosted checks.
- Next Step: Push branch, create PR, read back PR body/head, run metadata preflight, then consume hosted checks before merge.
- Blockers: None recorded.
- Latest Validation Summary: GH-97 working tree passed `pnpm typecheck`, `pnpm test`, `pnpm smoke:runtime`, `pnpm smoke:runtime:local`, `git diff --check`, JSON readability, `loom verify`, `loom suite validate --item GH-97`, `loom suite carrier validate --item GH-97`, `loom suite evidence validate --item GH-97`, and `loom fact-chain`; `loom build` is blocked by installed CLI path consumption for repo-local `tools/loom.py`, while the required global suite/carrier/evidence surfaces passed separately.
- Recovery Boundary: Revert this branch if Viewer/control facts expose raw VNC/CDP/WebSocket endpoints, implement hosted browser/remote console, store accounts/secrets, change Core/App repositories, or claim task outcome/reconciliation behavior.
- Current Lane: merge-ready

## Runtime Evidence

- Run Entry: not_applicable
- Logs Entry: not_applicable
- Diagnostics Entry: not_applicable
- Verification Entry: .loom/specs/GH-97/build-evidence.json
- Lane Entry: merge-ready

## Sources

- Static Truth: .loom/work-items/GH-97.md
- Dynamic Truth: .loom/progress/GH-97.md
- Locator Truth: .loom/bootstrap/init-result.json
- Fact Chain CLI: loom fact-chain --target . --json

## Notes

- 2026-07-01: Runtime-upgrade carrier refreshed for Loom 0.25.0 maintenance PR #83; this does not claim product or runtime implementation.
- 2026-07-01: GH-88 terminal closeout recorded after PR #101 merge, hosted run 28533694122 success, and GitHub issue closure for #85/#88-#91.
- 2026-07-01: GH-92 carrier opened for FR #86 and issues #92-#96 on branch `work/GH-92-evidence-refs`.
- 2026-07-01: GH-92 terminal closeout recorded after PR #103 merge, hosted run 28536212257 success, and GitHub issue closure for #86/#92-#96.
- 2026-07-01: GH-97 carrier opened for FR #87 and issues #97-#100 on branch `work/GH-97-viewer-handoff-facts`.
