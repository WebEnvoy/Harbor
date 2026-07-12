# Consistency Analysis

- Harbor remains the only owner of identity authentication provenance and Runtime Session lifecycle.
- Rebinding requires a fresh headed user-held exact managed local-provider session; stale authentication and non-local surfaces fail closed.
- Persistence is atomic for the default store and restores the previous in-memory binding on failure.
- Persisted authentication is not live login proof; the operation-specific site probe remains authoritative.
- App, Core, Lode, sensitive material, and external write behavior are unchanged.
