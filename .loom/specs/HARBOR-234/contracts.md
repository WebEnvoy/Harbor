# Contracts

## Harbor Facts Contract

Harbor owns browser/runtime public facts and evidence refs. For HARBOR-234 it may expose:

- `schema_version`
- `runtime_session_ref`
- `site_id`
- `task_kind`
- `generated_at`
- `page` public facts: URL/title/origin/status/failure only
- `resource_facts`: key/state/source/severity/message
- `evidence_refs`: refs only
- `write_precheck`: submitted/no-submit guard/action target/form state refs only
- `public_boundary`: raw material exposure policy

## Consumer Boundary

- Core consumes this contract for admission and Run Record refs only.
- Lode remains the source of capability/resource requirements and does not run Harbor.
- App consumes Core/Harbor summaries and refs; it does not own Runtime Session truth.

## Prohibited Fields

Harbor must not expose Cookie, token, password, raw profile storage, raw DOM, raw HAR, raw network bodies, CDP/VNC/websocket endpoints, or full screenshot/video/trace bytes through these endpoints.
