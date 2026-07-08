# Research

## Existing Behavior

- `HarborRuntime.captureLiveSnapshot` delegates screenshot capture to the active runtime session and then calls `PageSceneStore.capture`.
- `PageSceneStore.capture` creates screenshot evidence by default unless screenshot capture is explicitly denied by evidence policy.
- Therefore, when a screenshot provider returns a structured failure but page facts remain readable, Harbor must explicitly deny screenshot evidence for that capture.

## Evidence Boundary

- Page refs and source trace refs can still be valid when screenshot capture fails.
- Screenshot refs and screenshot evidence are only valid when a screenshot artifact was actually captured or when the caller explicitly provided screenshot context that remains policy-allowed.
- Raw screenshot bytes are never exposed.
