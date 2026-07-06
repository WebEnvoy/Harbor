# Spec: Browser Provider Management And Install Guidance

## Story Readiness

- User value: Users can see whether their local machine has a usable browser provider, understand why CloakBrowser is preferred, and receive clear guidance when CloakBrowser is missing or launch cannot proceed.
- Success experience: Harbor reports CloakBrowser and official Chrome install status, path, version, launchability, capabilities, limitations, default identity-environment binding, fallback warnings, download guidance, and launch failure diagnostics.
- Failure states: CloakBrowser missing, official Chrome missing, configured path invalid, version unknown/unsupported, executable not launchable, incompatible launch args, profile directory unavailable, proxy unavailable, CDP readiness unavailable, or launch timeout.
- Sensitive data boundary: Public facts expose provider metadata, refs, capability states, and diagnostics only; no cookies, tokens, credentials, profile storage, raw CDP/VNC endpoints, provider secrets, or target-site success claims are exposed.
- Non-goals: Chromium user provider management, Donut Browser provider registration, browser store/marketplace, hosted browser, automatic download/install, system permission bypass, real account/profile use, and anti-detection or risk-bypass guarantees.

## Scenarios

- Story #4: provider detection returns CloakBrowser and official Chrome install/path/version/launchability states.
- Story #5: identity environments default to CloakBrowser when it is launchable.
- Story #6: official Chrome is selected only as a restricted fallback when CloakBrowser is unavailable, with explicit warnings.
- Story #7: missing CloakBrowser status includes manual install/download guidance and capability impact.

## Suite Path

- Suite path: minimal
- full-path-artifacts not_applicable rationale: bounded Runtime API provider-facts slice with no real browser launch/download, no persistent storage migration, and no external account/profile use; consumer boundary: Core/App consume provider facts, warnings, refs, and diagnostics only; recheck condition: switch to full suite when adding real provider launch behavior, persistent provider registry storage, automatic download/install, hosted browser, or cross-repo API schema changes.
