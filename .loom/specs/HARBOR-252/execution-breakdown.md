# Execution Breakdown

## U-001 Opaque Target Registry

- Files: `detail-read-target.ts`, `runtime-session-types.ts`, `index.ts`.
- Validation: canonical/binding/TTL/replay tests.

## U-002 Provider Detail Probe

- Files: `local-provider-launcher.ts`, `read-operation.ts`.
- Validation: exact target/surface and failure-path tests.

## U-003 Runtime API Regression

- Files: `server.test.ts`, `read-operation.test.ts`, `detail-read-target.test.ts`.
- Validation: search-to-detail sequence and refs-only assertions.
