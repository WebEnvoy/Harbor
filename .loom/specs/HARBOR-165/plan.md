# Plan

## Steps

1. Split runtime session lifecycle out of `index.ts` into focused runtime session, launcher, type, and fixture modules.
2. Add identity-environment session open/reuse/lock/release/stop APIs with structured unavailable facts.
3. Extend local dedicated provider launch to build a real launch command, read CDP/page facts, open URLs, and stop the child browser process.
4. Keep provider scope to CloakBrowser primary/default and official Chrome restricted fallback; record Donut Browser only as lifecycle reference.
5. Update tests and runtime smoke for URL/title/status/controller/error facts, control lock conflicts, release/stop, and private material boundaries.
6. Run required validation, create implementation PR, read back PR metadata and hosted checks.
