# HARBOR-268 Specification

- Suite Path: full

## Acceptance

1. XHS search succeeds only when the requested query matches and a non-empty, structurally valid bounded note list is present.
2. Detail targets are canonical same-site `/explore/<24-hex-note-id>` targets derived from verified search results and minted through the existing opaque-ref store.
3. Empty feeds, missing targets, invalid/cross-origin URLs, Pinia/DOM mismatch, home/login/challenge/shell pages fail closed with no success result.
4. Existing XHS detail validation and same-session single-use ref behavior remain intact.
5. BOSS production remains disabled and no production page is accessed in this implementation batch.

## Evidence Boundary

Unit, contract, and smoke tests prove Harbor semantics only. Closing #268 additionally requires a merged packaged App XHS search -> opaque ref -> detail -> evidence/post-check E2E.
