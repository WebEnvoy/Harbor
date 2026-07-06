# Spec: Real Runtime Session Lifecycle

## Story Readiness

- User value: Users and agents can open a selected local identity environment in a real local browser session, reuse the same running session, and see who currently controls it.
- Success experience: Harbor opens the requested URL through the selected identity environment provider, returns runtime session refs, URL/title/status facts, controller/lock facts, and structured error facts; the same profile session is reused until released or stopped.
- Failure states: Browser provider missing/unlaunchable, identity environment missing required profile facts, invalid/unsupported target URL, CDP/page readiness unavailable, profile locked, session lost, or control lock conflict.
- Sensitive data boundary: Public facts expose refs, provider/profile/identity refs, URL/title/status, controller, lifecycle, and structured errors only; no raw CDP endpoint, VNC endpoint, cookie, token, credential, full profile path, raw DOM, HAR, or storage material is exposed.
- Non-goals: Full browser commercial console, hosted browser, provider marketplace, Donut Browser provider registration, credential/cookie/token plaintext storage, identity environment upload, CAPTCHA/risk bypass, real login automation, site task execution, and Core/Lode/App changes.

## Scenarios

- Story #8: Given a user-selected identity environment, when Harbor opens Xiaohongshu or BOSS, then it starts a real local browser session or returns structured provider/identity/URL failure facts, including URL, title, status, controller, and error reason.
- Story #9: Given an identity environment with a running session, when a user or task requests it again, then Harbor reuses the session for the same profile, can release/stop it, and returns a lock conflict when another controller owns it.
- Story #10: Given a running browser session, when App/Core reads runtime facts, then Harbor distinguishes user, agent, Core task, and idle/none controller states.

## Provider Boundary

- CloakBrowser remains the primary/default identity-environment provider.
- Official Chrome remains a restricted fallback for dev/manual use when CloakBrowser is unavailable.
- Donut Browser is consumed only as a launch lifecycle reference: profile process status, open URL, stop/kill, and running-state facts. It is not registered as a Harbor provider.

## Suite Path

- Suite path: minimal
- full-path-artifacts not_applicable rationale: bounded Runtime API lifecycle slice with no persistent storage migration, no live account/profile material, no hosted browser, no cross-repo API publication, and no external visible site action; local real browser availability is expressed as structured unavailable/failure facts when the environment cannot launch.
- Consumer boundary: App/Core/Lode consume public refs, URL/title/status, lifecycle, control owner/lock, and structured runtime errors only.
- Recheck condition: switch to full suite when adding persistent session store, long-lived profile directories, real credential/keychain integration, remote/hosted runtime, live account login, cross-repo schema publication, or external visible site actions.
