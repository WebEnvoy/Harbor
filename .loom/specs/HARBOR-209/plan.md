# Plan

## Steps

1. Reuse the existing RuntimeSessionStore, LocalProviderLauncher, PageSceneStore, ViewerControlStore, and local identity environment manager.
2. Add default xiaohongshu/BOSS site URLs and a managed default-site session entry point.
3. Extend the local provider launcher to keep CDP page facts current and capture PNG screenshot metadata through CDP.
4. Add live snapshot capture that stores screenshot artifact metadata as Harbor evidence refs while withholding raw bytes and endpoints.
5. Extend smoke to open xiaohongshu and BOSS with isolated temporary profiles, capture live evidence, record handoff/release/stop facts, and stop all real browser processes.
6. Cover default-page opening, live screenshot evidence metadata, and privacy boundaries in tests.

## Validation

- Automated: `pnpm typecheck`, `pnpm test`, `pnpm smoke:runtime`, `git diff --check`.
- Runtime evidence: `pnpm smoke:runtime:local` using isolated temporary profiles; provider fallback facts, page title/url/status, screenshot refs, evidence refs, handoff/release/stop facts.
- Governance: `loom fact-chain --target . --json`, `loom verify --target . --json`, suite/carrier/evidence checks where available.
