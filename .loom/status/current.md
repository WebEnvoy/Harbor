# Current Status

## Derived Fact Chain View

- Item ID: GH-92
- Goal: Provide the first Harbor Snapshot, RefMap, and Evidence refs slice for FR #86.
- Scope: Low-noise snapshot capture, indexed RefMap element refs, local Evidence ref records with provenance/redaction/retention facts, structured unavailable classifications, Core-facing scene ref readback, and ownership constraints covering #86 and Work Items #92-#96.
- Execution Path: page-scene-refs/local-runtime-api
- Workspace Entry: .
- Recovery Entry: .loom/progress/GH-92.md
- Review Entry: .loom/reviews/GH-92.json
- Validation Entry: `pnpm typecheck`; `pnpm test`; `pnpm smoke:runtime`; `pnpm smoke:runtime:local`; `git diff --check`; `loom suite validate --target . --item GH-92 --json`; `loom suite carrier validate --target . --item GH-92 --json`; `loom suite evidence validate --target . --item GH-92 --json`; `loom build --target . --item GH-92 --build-evidence .loom/specs/GH-92/build-evidence.json --json`.
- Closing Condition: PR is merged into `main`, hosted checks and Loom gate pass for the PR head, closeout evidence records PR/head/merge commit/hosted run, and issues #86/#92-#96 are closed.
- Current Checkpoint: merge
- Current Stop: PR #103 is open for GH-92; code, carriers, metadata preflight, review readback, fact-chain, and local validation have passed, and hosted checks are being consumed before controlled merge.
- Next Step: Consume hosted merge gate for PR #103, merge after required checks pass, then record post-merge closeout evidence and close #86/#92-#96.
- Blockers: None recorded.
- Latest Validation Summary: GH-92 working tree passed `pnpm typecheck`, `pnpm test`, `pnpm smoke:runtime`, `pnpm smoke:runtime:local`, `git diff --check`, JSON readability, `loom doctor`, `loom verify`, `loom suite validate --item GH-92`, `loom suite carrier validate --item GH-92`, `loom suite evidence validate --item GH-92`, and `loom fact-chain`; `loom build` is blocked by installed CLI path consumption for repo-local `tools/loom.py`, while the required global suite/carrier/evidence surfaces passed separately.
- Recovery Boundary: Revert this branch if Snapshot/RefMap/Evidence refs expose raw DOM, raw HAR, screenshots, video, cookies, tokens, profile paths, raw CDP endpoints, provider secrets, production payloads, or viewer/handoff scope.
- Current Lane: merge-ready

## Runtime Evidence

- Run Entry: not_applicable
- Logs Entry: not_applicable
- Diagnostics Entry: not_applicable
- Verification Entry: .loom/specs/GH-92/build-evidence.json
- Lane Entry: merge-ready

## Sources

- Static Truth: .loom/work-items/GH-92.md
- Dynamic Truth: .loom/progress/GH-92.md
- Locator Truth: .loom/bootstrap/init-result.json
- Fact Chain CLI: loom fact-chain --target . --json

## Notes

- 2026-07-01: Runtime-upgrade carrier refreshed for Loom 0.25.0 maintenance PR #83; this does not claim product or runtime implementation.
- 2026-07-01: GH-88 terminal closeout recorded after PR #101 merge, hosted run 28533694122 success, and GitHub issue closure for #85/#88-#91.
- 2026-07-01: GH-92 carrier opened for FR #86 and issues #92-#96 on branch `work/GH-92-evidence-refs`.
