# Spec: Local Identity Environment Management

## Story Readiness

- User value: Users can create or import local identity environments for xiaohongshu and BOSS and see whether the profile, login state, local browser storage, proxy, region, language, timezone, provider, and fingerprint summary are coherent enough for Harbor admission.
- Success experience: Harbor Runtime API stores local identity environments in memory with optional JSON persistence, returns public status and redacted refs, opens a Runtime Session by managed environment ref, and rejects raw password, cookie, token, raw storage, raw profile, and raw endpoint material at input boundaries.
- Failure states: identity environment missing, login missing/expired/manual-auth-required, browser storage missing/unknown, provider unavailable, proxy/region/language/timezone/fingerprint missing or drifted, and session URL invalid.
- Sensitive data boundary: Public outputs expose status and redacted refs only. Persistence stores refs/status/summary only. Passwords, cookie values, tokens, raw storage values, raw profile data, raw CDP/VNC endpoints, and site private payloads are not accepted or emitted.
- Non-goals: #208, real xiaohongshu/BOSS page launch, real account login, CAPTCHA/2FA bypass, risk-control bypass, target-site success guarantees, Core/Lode/App changes, issue closeout, and merge.

## Scenarios

- Story #204: create xiaohongshu/BOSS local identity environment records with site binding, profile refs, login state, browser storage state, and redacted public refs.
- Story #205: import/update local profile, Cookie/storage, login recovery, keychain/local secret refs, and delete boundary as refs/status only.
- Story #206: summarize provider, proxy, region, language, timezone, browser family, and fingerprint consistency using existing provider binding and identity consistency facts.
- Story #207: expose App/Core/Lode-safe public records that omit raw sensitive material while retaining internal facts for managed session opening.

## Suite Path

- Suite path: minimal
- full-path-artifacts not_applicable rationale: bounded Runtime API manager/store slice with no real browser profile custody, no real account login, no real target-site launch, and no cross-repo contract release.
- consumer boundary: Harbor Runtime API consumers receive public status/redacted refs and internal Runtime API tests consume managed facts only.
- recheck condition: switch to full suite when adding encrypted protected payload custody, real profile import/export, OS keychain writes, database migrations, hosted browser/profile sharing, or live site evidence.
