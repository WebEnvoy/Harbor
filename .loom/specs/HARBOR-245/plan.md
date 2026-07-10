# Plan

1. Package and validate the pinned, two-operation Lode #262 admission mirror.
2. Add managed-session preflight and a production-only CDP read-probe adapter.
3. Route the narrow endpoint and produce refs-only operation/evidence/post-check summaries.
4. Cover rejection/failure paths with fixture runtime tests; do not exercise a real browser or production page.
5. Run focused runtime API checks and record remaining merge/live evidence gates.
