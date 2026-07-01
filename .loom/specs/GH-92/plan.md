# Plan

## Implementation

- Add a small page-scene ref store to `packages/runtime-api` using opaque refs and process-local records.
- Add `HarborRuntime.captureSnapshot`, `getSnapshot`, `getRefMap`, `getEvidence`, and `getCoreSceneReference`.
- Capture low-noise snapshot context, optional indexed RefMap elements, source trace refs, and evidence records with provenance/redaction/retention facts.
- Return structured unavailable states for denied capture, missing refs, stale session-bound refs, expired evidence, and unavailable sources.
- Extend the runtime smoke so fixture and local-browser modes produce page-scene refs without real accounts or production payloads.
- Add focused tests for refs, evidence metadata, raw payload exclusion, and unavailable classifications.
- Add GH-92 Loom carriers and bind the current fact-chain to GH-92.

## Validation

- `pnpm typecheck`
- `pnpm test`
- `pnpm smoke:runtime`
- `pnpm smoke:runtime:local`
- `git diff --check`
- `jq empty .loom/specs/GH-92/build-evidence.json .loom/bootstrap/init-result.json package.json tsconfig.json`
- `loom suite validate --target . --item GH-92 --json`
- `loom suite carrier validate --target . --item GH-92 --json`
- `loom suite evidence validate --target . --item GH-92 --json`
- `loom build --target . --item GH-92 --build-evidence .loom/specs/GH-92/build-evidence.json --json`

## PR Ready

- Push `work/GH-92-evidence-refs`.
- Create a PR against `main`.
- Use GH-92 as the primary Loom Work Item and reference #86/#93/#94/#95/#96 as covered issues.
- Do not merge or close issues before hosted gate and closeout evidence.
