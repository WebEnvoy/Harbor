# Implementation Contract

- Write scope: `docs/adr/0007-page-scene-reference-facts-v0.md`, `docs/adr/pending-decisions.md`, `.loom/**/GH-45*` carrier files, `.loom/status/current.md`, and PR metadata.
- Referenced issues: GH-44, GH-45, GH-46, GH-47, GH-48, GH-49, GH-50, GH-51, GH-52, GH-53.
- Loom anchor: GH-45 only.
- Anchor rationale: GH-45 is the first concrete Work Item under GH-44 and defines the central `snapshot_ref` / `refmap_ref` / `source_trace` references that downstream evidence/viewer/handoff facts bind to. GH-48 and GH-53 remain covered FRs via refs, not alternate Loom anchors.
- Forbidden scope: runtime/provider/browser/viewer code, API schema, storage schema, database schema, real browser smoke, live runtime evidence, App/Core/Lode changes, `INIT-0001`, merge, and issue closeout.
- Validation floor: `git diff --check`, JSON validation, fact-chain, suite validate, suite carrier validate, and hosted checks after PR creation.
