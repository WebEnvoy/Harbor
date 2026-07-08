# Plan

## Steps

1. Add a local identity environment manager/store with in-memory records and optional JSON persistence.
2. Reuse existing local identity facts, identity consistency facts, and provider binding facts for managed records.
3. Add sensitive input rejection for raw password, cookie, token, raw storage, raw profile, and raw endpoint material.
4. Expose HarborRuntime methods to create, import, update, list, delete, and open sessions by managed identity environment ref.
5. Expose Runtime API per-ref read/update/delete routes and configure the long-running runtime server with optional `HARBOR_IDENTITY_ENVIRONMENTS_PATH` persistence.
6. Cover xiaohongshu/BOSS creation/import, redacted output, per-ref read/update/delete, JSON persistence boundary, and managed session opening in tests and smoke.
7. Prepare one implementation PR for #203/#204/#205/#206/#207 without #208 or real site actions.
