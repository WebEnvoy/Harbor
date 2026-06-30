# Implementation Contract

- Write scope: `docs/draft/**`, `docs/contracts/README.md`, `.loom/work-items/GH-62.md`, `.loom/progress/GH-62.md`, `.loom/status/current.md`, minimal `.loom/bootstrap/init-result.json` fact-chain locator update, `.loom/specs/GH-62/*`, and PR metadata.
- Referenced issues: GH-60, GH-61, GH-62, GH-63, GH-64.
- Loom anchor: GH-62 only.
- Anchor rationale: GH-62 owns the draft inventory, which is the convergence point for docs directory semantics, promoted contracts, and pending/deferred cleanup.
- Forbidden scope: runtime/provider/browser/viewer code, API schema, storage schema, generated facts, fixtures, real browser smoke, live runtime evidence, other repositories, `INIT-0001`, `docs/guides/`, merge, and issue closeout.
- Validation floor: `git diff --check`, JSON validation, fact-chain, suite validate, and suite carrier validate.
