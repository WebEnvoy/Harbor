# Current Status

## Derived Fact Chain View

- Item ID: HARBOR-165
- Goal: Deliver PR Ready runtime session lifecycle for Harbor FR #158: open, reuse, lock, release, stop, and expose page/control/error facts for real local browser sessions.
- Scope: Covers Harbor #165/#166/#167/#168 and semantic stories #8/#9/#10 from #158; ownership is limited to Harbor runtime-api files and HARBOR-165 Loom carriers; excludes full browser management console, hosted browser, credential/cookie/token storage, identity environment upload, CAPTCHA/risk bypass, real login automation, and Core/Lode/App changes.
- Execution Path: work/harbor-158-real-runtime-session
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-165.md
- Review Entry: .loom/reviews/HARBOR-165.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm smoke:runtime; git diff --check; loom verify --target . --json; loom fact-chain --target . --json; loom suite validate/carrier/evidence validate --target . --item HARBOR-165 --json
- Closing Condition: Implementation PR is opened and passes PR metadata readback/hosted checks for PR Ready; do not merge and do not close #158/#165/#166/#167/#168 in this lane.
- Current Checkpoint: build_ready
- Current Stop: Runtime API implementation and local validation are ready for implementation PR creation; do not merge and do not close #158/#165/#166/#167/#168.
- Next Step: commit, push `work/harbor-158-real-runtime-session`, create PR, validate PR metadata readback, then observe hosted checks.
- Blockers: None recorded.
- Latest Validation Summary: `pnpm typecheck`, `pnpm test`, `pnpm smoke:runtime`, `git diff --check`, `loom fact-chain --target . --json`, `loom verify --target . --json`, `loom suite validate --target . --item HARBOR-165 --json`, `loom suite carrier validate --target . --item HARBOR-165 --json`, and `loom suite evidence validate --target . --item HARBOR-165 --json` passed locally on 2026-07-06T07:35Z.
- Recovery Boundary: Harbor runtime-api session lifecycle only; no App/Core/Lode changes, no hosted browser, no real account/login automation, no credential/cookie/token plaintext, no identity environment upload, no CAPTCHA/risk bypass, no issue closeout.
- Current Lane: FR #158 real runtime session lifecycle batch anchored on HARBOR-165

## Runtime Evidence

- Run Entry: not_applicable
- Logs Entry: not_applicable
- Diagnostics Entry: not_applicable
- Verification Entry: loom verify --target . --json
- Lane Entry: HARBOR-165

## Sources

- Static Truth: .loom/work-items/HARBOR-165.md
- Dynamic Truth: .loom/progress/HARBOR-165.md
- Locator Truth: .loom/bootstrap/init-result.json
- Fact Chain CLI: loom fact-chain --target . --json
