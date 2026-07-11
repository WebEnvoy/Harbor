# HARBOR-252 Spec

## Scenarios

### S-001 Search-Origin Detail Ref

A successful same-session Xiaohongshu/BOSS search may expose only opaque detail refs for canonical same-site targets reduced by the trusted provider probe.

### S-002 One-Shot Detail Read

A detail operation consumes exactly one unexpired ref bound to the same session, site, and detail operation and returns public summary/evidence/post-check refs only.

### S-003 Fail Closed

Forged, cross-session, cross-site, expired, repeated, arbitrary-URL, login, challenge, SPA drift, empty-detail, origin-drift, and authority-race cases cannot mint completion evidence.

## Acceptance Criteria

- AC-001: callers cannot submit note/job/security IDs or target URLs.
- AC-002: canonical targets are reduced from a trusted real search probe and held only in process memory behind opaque refs.
- AC-003: refs are session/site/operation/TTL bound and consumed once before the awaited detail probe.
- AC-004: detail completion requires exact target navigation, a rendered detail surface, screenshot ref, source ref, and post-check.
- AC-005: no raw credential, profile, Cookie/token, DOM/HAR/network body, CDP endpoint, or screenshot bytes are returned or persisted.

## Non-Goals

- No Core/App integration, Lode #268 closeout, live E2E, automatic login, write action, bulk collection, or risk-control bypass.
