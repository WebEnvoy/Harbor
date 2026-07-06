# Spec: Real Identity Browser Session Evidence

## Story Readiness

- User value: Users can ask Harbor to start a local real-browser identity session, open xiaohongshu and BOSS default pages, observe the page title/url/status, hand control to a user or release it, and receive refs for page scene and screenshot evidence.
- Success experience: Harbor selects CloakBrowser when available, otherwise uses official Chrome as a restricted fallback; sessions use isolated temporary profiles; runtime facts include provider, page, viewer, control owner, lifecycle, screenshot, page, and evidence refs.
- Failure states: provider missing, provider launch failure, CDP unavailable, URL unreachable, session lock conflict, missing identity environment, capture denied, source unavailable, or stale evidence.
- Sensitive data boundary: Outputs are refs, hashes, summaries, status, and redacted evidence metadata only. Raw CDP endpoints, raw screenshot bytes, cookies, tokens, raw DOM, HAR, response bodies, and profile storage are not exposed.
- Non-goals: real login, real account actions, post/apply/greet/message flows, CAPTCHA/risk-control bypass, hosted browser, issue closeout, merge, and Core/Lode/App changes.

## Scenarios

- Story #209: start and stop a local browser session using a real provider or return structured unavailable facts when no provider is launchable.
- Story #210: open default xiaohongshu and BOSS pages and report requested URL, observed URL, title, and ready/unavailable status.
- Story #211: record user handoff, release, lock conflict, and stop facts without stealing control from another owner.
- Story #212: capture live page scene refs, screenshot refs, screenshot artifact metadata, and evidence refs without exporting raw screenshot bytes or private browser state.

## Suite Path

- Suite path: minimal
- full-path-artifacts not_applicable rationale: bounded Runtime API implementation slice using existing stores and local smoke evidence; no schema release outside Harbor, no persistent database migration, no protected material custody, and no hosted runtime.
- consumer boundary: Harbor Runtime API consumers receive refs/status/facts only; PR body and smoke output carry local runtime evidence.
- recheck condition: switch to full suite when adding encrypted profile custody, OS keychain writes, persistent evidence storage, external runtime server, hosted browser, or cross-repo API release.
