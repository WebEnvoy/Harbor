# Execution Breakdown

## U-001 Admission And Probe

- Covered issue: Harbor #245.
- Files: `read-operation.ts`, `runtime-session.ts`, `local-provider-launcher.ts`, `index.ts`, and `server.ts`.
- Validation: typecheck, build, focused tests, full tests, fixture API smoke.

## U-002 Evidence And Safety Regression

- Files: `read-operation.test.ts`, `server.test.ts`, HARBOR-245 carriers.
- Validation: forged probe rejection, authority-race rejection, exact response binding, refs-only output, and no-write boundary.
