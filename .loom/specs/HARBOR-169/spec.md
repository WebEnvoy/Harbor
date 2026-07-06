# Spec: Identity Environment Consistency Facts

## Story Readiness

- User value: Users can see whether a Harbor identity environment is usable before starting a site task, and Core can base admission on facts instead of assumptions.
- Success experience: Harbor returns one public facts object that summarizes provider selection, launchability, capability posture, proxy, region, language, timezone, browser version, fingerprint summary, resource satisfaction, drift, login state, site/browser risk facts, recovery suggestions, and Core/App/Lode-safe boundaries.
- Failure states: CloakBrowser missing or not launchable, official Chrome restricted fallback, provider unavailable, proxy or environment drift, missing/expired/unknown login state, site blocked, browser error, resource unknown, and sensitive evidence denied.
- Sensitive data boundary: Public facts expose summaries, refs, states, and limitations only; they do not expose cookie values, tokens, passwords, verification codes, raw storage, raw CDP/VNC endpoints, raw network, raw DOM, private profile paths, or platform-private detection strategies.
- Non-goals: No App/Core/Lode changes, no real login automation, no CAPTCHA/2FA bypass, no target-site success guarantee, no cloud/hosted browser, no provider marketplace, no Chromium provider registration, no Donut Browser provider registration, no issue closeout or dependency graph edit.

## Scenarios

- Story #2 / #159: viewing an identity environment shows whether it is logged in, expired, proxy-ready, drift-free, and backed by a provider that satisfies requirements.
- #169: CloakBrowser remains the default primary provider; CloakBrowser-Manager contributes mechanism facts for profile runtime, launch args, CDP/VNC/viewer refs, and capability limits; official Chrome is recorded as restricted fallback/dev/manual only.
- #170: resource satisfaction can express `satisfied`, `missing`, `unknown`, `conflict`, and `drift` for provider, proxy, region, language, timezone, browser version, fingerprint, and login state.
- #171: drift, login missing, site blocked, and browser error risk states are structured and recoverable without promising bypass.
- #172: Core/App/Lode consume public summary facts and blocking reasons without receiving sensitive material or raw endpoints.

## Suite Path

- Suite path: minimal
- full-path-artifacts not_applicable rationale: bounded Runtime API facts/fixture slice with no persistent storage migration, no live account/profile/cookie/token use, no real external provider launch in default smoke, no cross-repo API schema publication, and no hosted/runtime write behavior; consumer boundary: Core/App/Lode consume public facts, refs, limitations, and blocking reasons only; recheck condition: switch to full suite before adding real provider consistency validation, persistent fact storage, external browser actions, real account login checks, cross-repo schema publication, or hosted/cloud runtime.
