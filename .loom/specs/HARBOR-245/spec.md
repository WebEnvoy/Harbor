# HARBOR-245 Spec

## Scenarios

### S-001 Allowlisted Read Admission

An authenticated managed local session accepts only the pinned Xiaohongshu or BOSS read operation and its canonical public query target.

### S-002 Fail-Closed Runtime Execution

Unknown operations, invalid targets, fixtures, missing login, challenge state, authority changes during the probe, missing refs, and provider failures return structured unavailable facts without completed evidence.

### S-003 Refs-Only Completion

A trusted local provider may complete only after observing the exact operation response, capturing required opaque refs, rechecking session authority, and closing the temporary target. No raw credential, profile, DOM, HAR, network body, CDP endpoint, or screenshot bytes are returned or persisted.

## Acceptance Criteria

- AC-001: request admission matches the pinned Lode #262 mirror and rejects all other operation/target shapes.
- AC-002: session and identity admission is checked before and after the awaited provider probe.
- AC-003: only the exact allowlisted operation response can satisfy completion.
- AC-004: all required source, evidence, summary, and post-check refs are bound to one operation.
- AC-005: temporary probe targets are closed on success or failure.
- AC-006: no write action or sensitive material access is introduced.

## Non-Goals

- Core run records, App result rendering, automatic login, publish/send/submit/save, bulk collection, hosted browser, marketplace, or risk-control bypass.
