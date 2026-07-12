# HARBOR-252 Specification

- Suite Path: full

## Acceptance

1. XHS detail accepts only an opaque same-session search target and preserves existing TTL/single-use behavior.
2. Pinned operation requirements exactly consume Lode merge 66d79b4 source/evidence kinds: pinia_store_summary, network_summary, dom_snapshot_summary, snapshot_ref and post_check_ref.
3. Capture/completion proof rejects missing, extra, duplicated, mutated or mismatched source/evidence/post-check refs.
4. Public output remains bounded refs-only and does not expose raw DOM, HAR, network body, screenshot bytes, profile, Cookie/token or CDP endpoint.
5. BOSS production remains disabled/deferred and is not accessed.

## Evidence Boundary

Contract tests prove Harbor-Lode alignment only. Closing #252 additionally requires merged packaged App XHS search-to-detail live E2E.
