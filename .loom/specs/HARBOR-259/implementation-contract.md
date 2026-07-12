# HARBOR-259 Implementation Contract

- Ownership: `packages/runtime-api/src/identity-environment-manager.ts`, `packages/runtime-api/src/index.ts`, focused tests, and HARBOR-259 carriers.
- Required behavior: persisted user-confirmed authentication may rebind only to a fresh headed `control_owner=user` exact managed local-provider session; release then permits the existing one-time Core handoff without changing the session ref or visibility.
- Failure behavior: unconfirmed/expired/recovery-required identity, fixture/unknown execution surface, headless or non-user session, identity/profile/storage mismatch, lock conflict, and persistence failure remain fail closed.
- Privacy: status and opaque refs only; no password, Cookie, verification code, token, raw profile, raw page body, or raw browser endpoint.
- External behavior: read-only runtime contract only; no login automation, submit, send, apply, save, bulk collection, hosted browser, or risk-control bypass.
- Verification: typecheck, build, focused handoff/persistence tests, full suite, independent current-head review, hosted gate, then merged-package Computer Use E2E.
