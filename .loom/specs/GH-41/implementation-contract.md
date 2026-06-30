# Implementation Contract

- Write scope: `docs/adr/0006-provider-profile-identity-facts-v0.md` and `.loom/**/GH-41*` carrier files plus `.loom/status/current.md` and minimal `.loom/bootstrap/init-result.json` fact-chain locator update.
- Referenced issues: GH-40, GH-41, GH-42, GH-43.
- Loom anchor: GH-41 only.
- Forbidden scope: runtime/provider code, browser skeleton, API schema, database schema, provider evaluation packet, browser smoke, other repositories, GH-44/GH-48/GH-53, `INIT-0001`, merge, and issue closeout.
- Validation floor: `git diff --check`, JSON validation, low-cost available repo/Loom checks, fact-chain checks where the local wrapper works, and hosted checks after PR creation.
