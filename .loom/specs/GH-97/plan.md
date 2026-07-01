# Plan

## Implementation

- Add a small viewer/control facts module to `packages/runtime-api` using opaque refs and process-local records.
- Add `HarborRuntime.getViewerControlFacts`, `recordHandoff`, `getCoreRuntimeFacts`, and `getAppRuntimeStatusFixture`.
- Create viewer facts on Runtime Session creation and mark viewer/control facts unavailable or expired on session close.
- Keep viewer facts ref-only with `viewer_url: null` for this slice; do not expose raw VNC/CDP/WebSocket endpoints.
- Extend runtime smoke so fixture and local-browser modes read back viewer/control, Core runtime, and App status facts.
- Add focused tests for viewer ref/unavailable state, handoff owner changes, Core/App shared facts, raw endpoint exclusion, and closed-session fixture state.
- Add GH-97 Loom carriers and bind the current fact-chain to GH-97.

## Validation

- `pnpm typecheck`
- `pnpm test`
- `pnpm smoke:runtime`
- `pnpm smoke:runtime:local`
- `git diff --check`
- `jq empty .loom/specs/GH-97/build-evidence.json .loom/bootstrap/init-result.json package.json tsconfig.json`
- `loom suite validate --target . --item GH-97 --json`
- `loom suite carrier validate --target . --item GH-97 --json`
- `loom suite evidence validate --target . --item GH-97 --json`
- `loom build --target . --item GH-97 --build-evidence .loom/specs/GH-97/build-evidence.json --json`

## PR Ready

- Push `work/GH-97-viewer-handoff-facts`.
- Create a PR against `main`.
- Use GH-97 as the primary Loom Work Item and reference #87/#98/#99/#100 as covered issues.
- Do not merge or close issues before hosted gate and closeout evidence.
