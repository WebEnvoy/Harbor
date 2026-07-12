# HARBOR-263 Spec

- Suite Path: full
- User outcome: after one explicit manual confirmation, two separately submitted Core read tasks can acquire, probe, and release the same headed managed session.
- Acceptance: a trusted Core release re-arms the next explicit Core acquisition; both tasks reach the provider probe; session ref, identity, profile, and holder boundaries remain stable.
- Fail closed: unconfirmed, headless, fixture, different identity/profile, user-held lock, holder conflict, and cleanup/persistence failure do not gain trusted read control.
- Boundary: no BOSS probe, Core, Lode, App, login automation, raw material, external page, or write behavior changes.
- Live closeout: main controller reruns packaged App E2E after merge; live success is not claimed by this PR.
