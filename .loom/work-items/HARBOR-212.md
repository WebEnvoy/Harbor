# HARBOR-212

## Static Facts

- Item ID: HARBOR-212
- Goal: Ensure live snapshot capture never mints screenshot refs or screenshot evidence when the underlying browser screenshot capture fails.
- Scope: Covers Harbor #212 only as a narrow evidence-safety correction under parent Harbor #208/#218. Ownership is limited to `packages/runtime-api/src/index.ts`, `packages/runtime-api/src/index.test.ts`, and HARBOR-212 item-specific Loom carriers.
- Execution Path: work/harbor-212-screenshot-failure-refs
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-212.md
- Review Entry: .loom/reviews/HARBOR-212.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; git diff --check; loom fact-chain --target . --json; loom verify --target . --json; loom suite validate --target . --item HARBOR-212 --json; loom suite carrier validate --target . --item HARBOR-212 --json; loom suite evidence validate --target . --item HARBOR-212 --json
- Closing Condition: PR created and pushed for Harbor #212 with PR body listing covered and non-covered issues, plus ownership boundaries and validation evidence; no issue closeout before merge.

## Covered Work Items

- #212 generate real screenshot, page reference, and evidence references without fabricating screenshot evidence on capture failure.

## Non-covered Work Items

- #209 local real browser start/stop closeout.
- #210 Xiaohongshu/BOSS default page live readback closeout.
- #211 user takeover/release ownership closeout.
- #208/#218 parent FR closeout.
- App/Core/Lode runtime consumption.

## Safety Boundary

- No real account, daily browser profile, Cookie, token, production page action, submit, publish, message send, risk-control bypass, hosted browser, marketplace, or bulk collection.
- Evidence remains refs/status/facts only and does not expose raw CDP endpoints, raw screenshots, profile storage, credential material, cookies, tokens, DOM, HAR, or network bodies.

## Associated Artifacts

- packages/runtime-api/src/index.ts
- packages/runtime-api/src/index.test.ts
- .loom/specs/HARBOR-212/**
