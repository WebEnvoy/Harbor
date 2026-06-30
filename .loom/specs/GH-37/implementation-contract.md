# Implementation Contract

- Write scope: `docs/adr/0005-runtime-session-lifecycle-v0.md` and `.loom/**/GH-37*` carrier files plus `.loom/status/current.md`.
- Referenced issues: GH-36, GH-37, GH-38, GH-39.
- Loom anchor: GH-37 only.
- Forbidden scope: runtime/provider code, browser skeleton, API schema, database schema, other repositories, `INIT-0001`, merge, and issue closeout.
- Validation floor: `git diff --check`, low-cost available repo checks, Loom fact-chain checks where the local wrapper works, and hosted checks after PR creation.
