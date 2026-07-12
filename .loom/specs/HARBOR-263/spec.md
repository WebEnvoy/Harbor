# HARBOR-263 Spec

- Suite Path: full
- User outcome: after one explicit manual confirmation, two separately submitted Core read tasks can acquire, probe, and release the same headed managed session.
- Acceptance: a trusted Core release re-arms the next explicit Core acquisition; both tasks reach the provider probe; session ref, identity, profile, and holder boundaries remain stable.
- Fail closed: unconfirmed, headless, fixture, different identity/profile, user-held lock, holder conflict, and cleanup/persistence failure do not gain trusted read control.
- Boundary: no BOSS production rerun, BOSS probe expansion, Core, Lode, App, login automation, raw material, external write, or risk-control bypass.
- Live closeout: main controller runs only a packaged Xiaohongshu two-task same-session E2E after merge; BOSS production pages remain deferred and are not accessed.
