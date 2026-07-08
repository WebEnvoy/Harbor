# Spec

## Scenarios

1. S-001 App/Core starts or connects to a local Harbor Runtime API and calls `/readiness`.
   - Response is JSON.
   - Response reports `status: "ready"`, service name, timestamp, and safety boundaries.
   - Response does not require a real browser, account, profile, or production page.

2. S-002 App/Core calls provider status.
   - `/runtime/browser-providers` returns the existing `HarborRuntime.getBrowserProviderStatus()` catalog.
   - `/runtime/browser-provider-status` remains an alias for compatibility.
   - Detection failures are represented as structured JSON, not process crashes.

3. S-003 App/Core calls unsupported or invalid routes.
   - Unknown route returns 404 JSON.
   - Invalid JSON returns 400 JSON.
   - Method mismatch returns 405 JSON.

- S-004 App/Core creates/list identity environments, opens/stops sessions, captures a snapshot, and reads evidence refs through HTTP endpoints.
  - The server delegates to existing `HarborRuntime` methods.
  - The response remains refs/status/facts only.
  - No raw credentials, profile storage, CDP endpoints, DOM, HAR, or screenshot bytes are exposed.

## Acceptance

- The server uses Node stdlib HTTP and existing `HarborRuntime`; no new dependency.
- The API can be started from package scripts after build.
- Tests exercise readiness and provider endpoints without real accounts or production pages.
- Tests exercise identity/session/evidence endpoint plumbing with the fixture launcher only.
- PR closeout lists covered issues, non-goals, validation commands, and evidence boundaries.

## Non-goals

- No hosted browser service.
- No new browser driver logic.
- No Core task runner, Lode execution, App UI, real account login, production site automation, or write action.
