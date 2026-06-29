# 0003. Local Chrome vs Remote Browser Boundary

## Status

Proposed, 2026-06-29.

## Context

Harbor must support local-first browser identity while leaving room for server, Docker, remote CDP, and hosted browser providers. Local Chrome can reuse real login state and user-visible windows, but it has higher privacy and control risks. Remote browser sessions can offer isolated CDP and viewer URLs, but persistence, profile ownership, and handoff semantics depend on the provider.

The boundary needs to let Core ask for runtime resources without knowing whether Harbor used local Chrome, a dedicated local Profile, or a remote browser session.

## Decision

Harbor treats local and remote browsers as provider modes behind Browser Drivers, but it does not pretend they have identical safety semantics.

Harbor should distinguish at least these provider modes:

- `local_dedicated_profile`: Harbor launches and owns a dedicated local browser Profile. This is the preferred local baseline for repeatable Agent work because Profile ownership, process lifecycle, CDP, and evidence policy are clearer.
- `local_user_chrome`: Harbor connects to or borrows an existing user Chrome/Profile/tab through an extension, native bridge, or CDP. This mode requires explicit user selection and should be marked as user-owned, privacy-sensitive, and handoff-oriented.
- `remote_browser_session`: Harbor connects to a provider-owned or container-owned browser session. Harbor records session id, CDP/websocket refs, viewer refs, TTL, persistence facts, proxy facts, storage/import facts, files/download support, and provider limitations.

Browser Drivers are responsible for launching or connecting, configuring the runtime, checking health, stopping or releasing sessions, and returning provider/session facts. They do not decide task strategy and do not run Lode site capabilities.

Harbor exposes CDP and Viewer as refs or scoped capabilities, not as raw public endpoints for every caller. App can render the Viewer; Core can request automation access through Harbor-controlled session refs.

For `local_user_chrome`, Harbor must report facts such as:

- user-owned Profile or tab,
- explicit grant requirement,
- profile selection source,
- control owner,
- whether mutating automation can be paused or locked during user control,
- evidence policy limits.

Core owns task run state and admission. Harbor owns runtime session state and control facts. App owns the user-facing viewer, approval, and handoff UI.

When a user takes control, Harbor should make the control state observable. Core should pause or stop mutating automation according to policy and record `unknown_outcome` when user action changes the task state in a way Core cannot verify.

## Consequences

Dedicated local Profiles are the simplest early local runtime because they avoid default access to the user's daily browser state.

Local user Chrome remains possible, but only as an explicit provider/handoff path with clear privacy and control facts.

Remote providers can be added without changing Core's task model, as long as Harbor returns the same class of refs and facts.

The App needs to show provider mode and control owner clearly, because "local user Chrome" and "remote isolated session" have different user expectations.

## Alternatives Considered

- Default all tasks to the user's daily Chrome: rejected because it exposes personal tabs, history, extensions, and login state unless explicitly chosen.
- Remote-browser-only Harbor: rejected because WebEnvoy's local-first goal requires durable local Profiles and user-visible handoff.
- Treat all providers as the same `BrowserSession`: rejected because local user Chrome, local dedicated Profile, and remote sessions differ in ownership, privacy, lifecycle, and evidence limits.
- Expose raw CDP/VNC URLs as the main public API: rejected because access control, evidence policy, and handoff state belong at the Harbor session boundary.

## Research Evidence

- `docs/draft/browser-drivers.md` defines Browser Drivers as launch/connect/configure/health/facts adapters, not site task executors.
- `docs/draft/resource-lifecycle.md` defines Profile, Execution Identity, Runtime Session, Viewer, proxy binding, evidence policy, and snapshot context as Harbor resources with acquire/release/invalidate traces.
- `browser-identity-and-runtime.md` compares local Chrome, extension bridge, CDP launch, and remote container sessions as separate provider boundaries.
- `browser-identity-and-runtime.md` flags daily Chrome reuse as useful but privacy-sensitive because it carries real history, extensions, and login state.
- `human-handoff-and-recovery.md` shows VNC/noVNC viewers and local Profile Browser windows solve observation/control, but not complete task recovery by themselves.
- `human-handoff-and-recovery.md` identifies explicit control ownership and handoff/takeover state as the missing piece between a Viewer and a recoverable task.

## Open Questions

- Should the first implementation start with `local_dedicated_profile`, `remote_browser_session`, or both?
- What exact user approval is required before `local_user_chrome` can be used?
- How should Harbor lock or pause automation during user control?
- Which remote session TTL, persistence, file, and download facts are mandatory?
- Should Viewer support start with a local browser window, noVNC-style remote viewer, or both?
