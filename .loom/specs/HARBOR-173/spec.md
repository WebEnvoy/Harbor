# Spec: Real Scene Evidence And Viewer Entry Facts

## Story Readiness

- User value: Users and systems can inspect a real browser scene through Harbor facts instead of fixed sample projections.
- Success experience: Harbor returns screenshot refs, page refs, URL/title/summary, capture timestamp, snapshot/refmap/evidence refs, element source evidence refs, viewer entry facts, and user/agent/Core task controller facts from the same runtime session.
- Failure states: capture denied, source unavailable, stale snapshot/refmap, missing/expired evidence, unsupported viewer, permission denied viewer, session closed, or control owner conflict.
- Sensitive data boundary: Public facts expose refs, redaction/retention/access state, URL/title/page summary, controller state, and viewer availability only; they do not expose credentials, cookie values, tokens, full storage, raw CDP/VNC endpoints, raw DOM, raw network, unredacted screenshot bytes, or platform-private detection strategy.
- Non-goals: No App/Core/Lode changes, no hosted browser, no cloud runtime, no Donut Browser provider registration, no Chromium user provider registration, no CAPTCHA/risk bypass promise, no live account automation, no issue closeout, no merge, no current pointer retire.

## Scenarios

- Story #11 / #173: Given a readable runtime session, when evidence is captured, then Harbor returns snapshot_ref, screenshot_ref, page_ref, frame_ref, page URL/title/summary, evidence_refs, source_trace_ref, and captured_at.
- #174: Given captured elements, when Core/Lode need source binding, then Harbor returns element_ref and source_evidence_ref under a refmap_ref; stale, missing, denied, and expired refs return structured states.
- #175: Given a session controlled by user, agent, or Core task, when Harbor facts are read, then viewer/control facts show current owner, previous owner, handoff reason, and takeover availability without declaring task outcome.
- #176: Given a local visible session or unsupported viewer, when App asks for an entry, then Harbor returns a mediated viewer_ref with transport/access/input capability/expiry/privacy facts and never raw CDP/VNC endpoints.

## Provider And Research Boundary

- CloakBrowser remains the primary/default provider and official Chrome remains a restricted fallback.
- CloakBrowser-Manager contributes the viewer/CDP/VNC/profile-runtime mechanism: mediated viewer refs, port isolation, local-only endpoints, CDP compatibility, and provider capability facts.
- Donut Browser remains mechanism reference only and is not registered as a Harbor provider.

## Suite Path

- Suite path: minimal
- full-path-artifacts not_applicable rationale: bounded Runtime API facts/fixture slice with no persistent evidence store, no storage migration, no real account/profile/cookie/token material, no hosted runtime, no cross-repo schema publication, and no external visible site action in default validation.
- Consumer boundary: Core/App/Lode consume public refs, URL/title/summary, capture timestamps, controller facts, viewer entry facts, redaction/retention/access states, and structured unavailable reasons only.
- Recheck condition: switch to full suite before adding persistent evidence storage, live account capture, raw artifact export, cross-repo API/schema publication, hosted/cloud runtime, long-lived remote viewer, provider-private endpoint exposure, or external visible site actions.
