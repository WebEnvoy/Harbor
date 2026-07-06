# Spec: Local Website Identity Environments

## Story Readiness

- User value: Users can manage a local website identity environment as a first-class Harbor object, not as scattered browser, cookie, proxy, and credential settings.
- Success experience: Harbor returns one App/Core-readable facts object containing site binding, account label/ref, profile/storage refs, login state, browser storage lifecycle, proxy, region, language, timezone, browser identity summary, fingerprint summary, selected provider binding, credential refs, manual authentication state, import/export/delete rules, and consumer boundaries.
- Failure states: login state is logged out, expired, unknown, or manual-authentication-required; browser storage is missing, cleared, or unknown; proxy/region/language/timezone/fingerprint configuration is missing; provider binding is unavailable or degraded to official Chrome fallback.
- Sensitive data boundary: Public facts expose summaries and refs only. Passwords, verification codes, cookie values, session tokens, storage values, raw browser storage, and provider secrets stay local to Harbor and are not exposed to App/Core/Lode.
- Ownership: implementation writes are limited to Harbor runtime-api files and HARBOR-161 Loom carriers.
- Non-goals: Cloud account hosting, team password vaults, account marketplaces, risk-bypass guarantees, automatic CAPTCHA or 2FA bypass, real website login, persistent storage implementation, and cross-repo App/Core/Lode changes.

## Scenarios

- Story #1: creating or importing an identity environment returns local facts for site binding, browser profile, login state, proxy, region, language, timezone, browser identity, and fingerprint summary.
- Story #3: expired or missing authentication returns manual authentication required facts and a browser-site recovery boundary without exposing passwords, verification codes, cookies, or tokens.
- Credential boundary: Harbor may expose account labels, login method, keychain/local secret refs, QR/2FA/CAPTCHA state, and recovery actions; it never exposes credential payloads.
- Import/export/delete: default export is desensitized; full export requires explicit user action; protected local material requires local encryption; delete requires confirmation and residual checks.

## Suite Path

- Suite path: minimal
- full-path-artifacts not_applicable rationale: bounded Runtime API facts/fixture slice with no real browser launch, no persistent storage migration, no live account/profile use, and no cross-repo contract publication.
- Consumer boundary: App/Core/Lode consume public summaries, refs, readiness states, blocking reasons, and no-bypass risk boundary only.
- Recheck condition: switch to full suite when adding persistent identity storage, real browser profile import/export/delete implementation, real credential/keychain integration, live site authentication, cross-repo API schema publication, or external visible account actions.
