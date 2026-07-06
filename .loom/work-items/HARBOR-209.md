# HARBOR-209

## Static Facts

- Item ID: HARBOR-209
- Goal: Start and stop local real-browser identity sessions, open xiaohongshu and BOSS default pages, report page title/url/status, expose user handoff/release ownership facts, and produce screenshot/page/evidence refs.
- Scope: Covers Harbor #208/#209/#210/#211/#212 in one PR, including session ownership facts and ownership constraints; anchor Work Item is #209.
- Execution Path: feat/harbor-209-real-identity-session
- Workspace Entry: /Volumes/2T/dev/WebEnvoy/Harbor.worktrees/harbor-209-real-identity-session
- Recovery Entry: .loom/progress/HARBOR-209.md
- Review Entry: .loom/reviews/HARBOR-209.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; pnpm smoke:runtime:local; git diff --check; loom fact-chain --target . --json; loom verify --target . --json
- Closing Condition: PR created and pushed for #208-#212; no merge and no issue closeout in this worker.

## Covered Work Items

- #209 start and stop local real browser sessions.
- #210 open xiaohongshu and BOSS default pages and report title/url/status.
- #211 expose user handoff, release, and session ownership facts.
- #212 produce real screenshot refs, page refs, and evidence refs.

## Safety Boundary

- Uses isolated temporary browser profiles only.
- Does not use a daily user profile.
- Does not log in, submit, publish, apply, greet, send messages, bypass CAPTCHA/risk controls, or save passwords, cookies, tokens, raw profile data, full DOM, HAR, network bodies, or raw debug endpoints.

## Associated Artifacts

- packages/runtime-api/src/local-provider-launcher.ts
- packages/runtime-api/src/runtime-session-types.ts
- packages/runtime-api/src/runtime-session.ts
- packages/runtime-api/src/page-scene.ts
- packages/runtime-api/src/index.ts
- packages/runtime-api/src/index.test.ts
- packages/runtime-api/src/smoke.ts
- .loom/specs/HARBOR-209/**
