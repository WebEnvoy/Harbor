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
- Closing Condition: Completed. PR #105 is merged into `main`, hosted checks and Loom gate passed for the PR head, closeout evidence records PR/head/merge commit/hosted run, and issues #87/#97-#100 are closed.
- Current Checkpoint: closed
- Current Stop: PR #105 was squash-merged into `main`, hosted run 28537724504 passed required checks, and GitHub issues #87/#97-#100 were closed with post-merge evidence.
- Next Step: Merge GH-97 closeout carrier sync, close milestone #8 if all issues remain closed, and report completion to the global controller thread.
- Blockers: None recorded.
- Latest Validation Summary: Closeout consumed PR #105, PR head `6f4940ec8964fd95263317938fe8a169873506e1`, merge commit `e2aac7ed264431be8fe09e01a55b69f3073f72f7`, target branch `main`, hosted run 28537724504, and closed issues #87/#97/#98/#99/#100. Pre-merge validation passed `pnpm typecheck`, `pnpm test`, `pnpm smoke:runtime`, `pnpm smoke:runtime:local`, JSON readability, `git diff --check`, `loom verify`, `loom suite validate --item GH-97`, `loom suite carrier validate --item GH-97`, `loom suite evidence validate --item GH-97`, `loom fact-chain`, and Loom review readback; `loom build` remained classified as installed CLI path consumption for repo-local `tools/loom.py`, with required suite/carrier/evidence surfaces validated separately.
- Recovery Boundary: Revert this branch if Viewer/control facts expose raw VNC/CDP/WebSocket endpoints, implement hosted browser/remote console, store accounts/secrets, change Core/App repositories, or claim task outcome/reconciliation behavior.
- Current Lane: terminal closeout

## Runtime Evidence

- Run Entry: not_applicable
- Logs Entry: not_applicable
- Diagnostics Entry: not_applicable
- Verification Entry: .loom/specs/GH-97/closeout-evidence.json
- Lane Entry: terminal closeout

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
- 2026-07-01: GH-97 terminal closeout recorded after PR #105 merge, hosted run 28537724504 success, and GitHub issue closure for #87/#97-#100.
