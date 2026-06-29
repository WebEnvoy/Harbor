# 0002. Profile, Session, and Provider Facts

## Status

Proposed, 2026-06-29.

## Context

Harbor must provide WebEnvoy Core, Lode, and App with a stable browser runtime boundary. The existing drafts already separate Profile, Execution Identity, Runtime Session, Browser Driver, Evidence Store, and Runtime Capability Facts.

The risk is turning Harbor into either a site-task system or a provider-specific browser wrapper. Harbor should instead expose objective runtime facts and references. Core, Lode, user policy, and App use those facts to decide whether a task can run, whether it needs handoff, and what evidence to keep.

## Decision

Harbor outputs runtime facts and references. It does not output business results, site schemas, provider rankings, or task suitability conclusions.

Harbor should expose these fact groups:

- `profile_ref` and Profile facts: persistent browser identity container, user data directory ownership class, cookie/storage presence, proxy binding, locale, timezone, viewport, user agent, extensions, last known normal state, running state, invalid state, and recent runtime events.
- `identity_ref` and Execution Identity facts: `site_id`, `account_ref`, linked Profile, login state, allowed execution channels, resource requirements, evidence policy, recovery/risk events, and usage history.
- `runtime_session_ref` and Runtime Session facts: provider, linked Profile and Execution Identity, running status, CDP availability, Viewer/VNC availability, screenshot/snapshot/network/log capture availability, handoff capability, pause/resume/close capability, current error state, lease refs, and resource trace refs.
- `provider_facts`: provider type, browser engine, local or remote mode, persistent profile support, independent `user_data_dir` support, proxy support, environment configuration support, extension support, CDP support, viewer support, snapshot support, provider-native fingerprint or patch capability, known limitations, license/binary boundary, and validation evidence refs when available.

Provider facts must distinguish:

- configured input,
- observed runtime fact,
- provider claim,
- validation evidence.

Anti-detection, stealth, fingerprint, proxy, patch, and captcha/provider claims are facts and policy inputs only. Harbor must not promise detection bypass, account safety, target-site success, or provider fitness for a task.

Core consumes:

- Harbor refs: `bundle_ref`, `lease_ref`, `profile_ref`, `identity_ref`, `runtime_session_ref`, `evidence_policy_ref`, `resource_trace_refs`.
- Harbor facts: provider/profile/session/evidence capability facts and current resource health facts.
- Harbor evidence refs and runtime errors.

Core does not consume:

- cookies, tokens, full browser storage, private Profile files, or provider secrets by default.
- normalized result envelopes, collection/comment/dataset schemas, or site business fields.
- provider-specific launch flags as public contract.

Lode may declare runtime requirements such as persistent Profile, logged-in identity, proxy binding, snapshot support, manual takeover, or write verification. Lode does not manage Harbor resources or store real Profile state.

App may display and manage Profile, Identity, Session, Viewer, handoff, and evidence policy state through Harbor APIs, but it should not reinterpret Harbor facts as task success guarantees.

## Consequences

Harbor providers can change without forcing Core or Lode to depend on a specific browser binary or launch flag.

Core admission needs to compare Lode/user policy requirements against Harbor facts. That comparison belongs outside Harbor.

Fact schemas will need versioning. A future schema should keep provider-specific fields behind provider details, not in the public Harbor object model.

## Alternatives Considered

- One large `BrowserProfile` model containing provider, proxy, fingerprint, recording, captcha, allowed domains, and task policy: rejected because it mixes runtime facts with Core admission policy.
- Harbor decides whether a task is safe or possible: rejected because Harbor does not understand site business, user intent, or Lode capability requirements.
- Public Harbor schema mirrors each provider's native flags: rejected because it would leak provider details and make provider replacement expensive.
- Anti-detect browser identity as the default runtime: rejected for now because it is a provider capability and compliance question, not a default product promise.

## Research Evidence

- `docs/draft/runtime-capability-facts.md` defines provider, Profile, Runtime Session, automation exposure, and evidence policy facts as objective facts rather than task conclusions.
- `docs/draft/profile-identity-model.md` separates Fingerprint, Profile, and Execution Identity, and records login/risk history on Execution Identity.
- `docs/draft/resource-lifecycle.md` says Harbor returns bundle, lease, runtime session, Profile, Identity, capability facts, evidence policy, and resource trace refs to Core.
- `browser-identity-and-runtime.md` shows Profile managers and browser runtimes converge on persistent Profile plus session facts such as profile id, CDP endpoint, viewer endpoint, display, and status.
- `anti-detection-and-provider-facts.md` says provider facts should be layered by engine, fingerprint config, network path, runtime behavior, license boundary, and validation evidence; provider claims are not task success evidence.
- `synthesis.md` accepts that runtime facts and task policy must be separated.

## Open Questions

- What is the first versioned field set for provider/profile/session/evidence facts?
- Which health states can Core treat as admissible for read-only, write, and recovery tasks?
- What is the minimal provider validation evidence format?
- Where do behavior-level facts such as typing cadence belong: Harbor helper facts, Core action policy, or Lode capability requirements?
- Which provider license and binary facts must be mandatory before a provider can be enabled?
