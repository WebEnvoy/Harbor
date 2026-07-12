# HARBOR-263 Implementation Contract

- Ownership: `packages/runtime-api/src/runtime-session.ts`, focused `server.test.ts` lifecycle coverage, and HARBOR-263 carriers.
- Required behavior: release by a confirmed Core controller re-arms handoff only when that controller currently holds a trusted read-operation handoff and matching lock.
- Failure behavior: release without confirmation/trusted handoff or without matching held ownership cannot mint pending handoff; acquisition conflicts remain unchanged.
- Identity boundary: reuse remains scoped by identity environment, execution identity, profile, storage binding, headed compatibility, and explicit Core acquisition.
- Privacy/external boundary: no credential, Cookie, token, raw profile/page/network material, browser action, login, or external write.
- Verification: focused lifecycle and negative tests, typecheck, build, full suite, diff-check, independent review, and hosted gate.
