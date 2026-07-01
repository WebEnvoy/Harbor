# Implementation Contract

## Work Item

- Item: GH-88
- Execution Entry: .loom/progress/GH-88.md

## Approved Spec

- Spec Path: .loom/specs/GH-88/spec.md
- Spec Review Entry: pending

## Implementation Scope

- In Scope: Runtime API create/get/close skeleton, local dedicated profile provider readiness facts, deterministic smoke, focused tests, root package/typecheck scripts and lockfile, GH-88 item-specific Loom carrier, and current fact-chain binding.
- Out Of Scope: Snapshot/RefMap/Evidence refs, Viewer/handoff/Core-App facts, hosted browser, provider marketplace, real account/secret handling, raw CDP endpoint public exposure, complete Profile Browser, production evidence capture, merge, and issue/FR/milestone closeout.

## Validation Plan

- Automated Checks: `pnpm typecheck`; `pnpm test`; `pnpm smoke:runtime`; optional local-browser `pnpm smoke:runtime:local`; `git diff --check`; JSON readability for GH-88 build evidence; Loom suite/carrier/build if available; hosted GitHub Actions after PR creation.
- Manual Verification: Public facts contain opaque refs and no raw CDP endpoint; PR body and fact-chain bind to GH-88; PR references #85/#89/#90/#91 without automatic close keywords until closeout is ready.

## Risks And Rollback

- Risks: Local browser availability varies by machine. Mitigation: default smoke uses fixture mode; local smoke returns structured unavailable or launch failure facts instead of requiring real account state. Current local validation did launch Chrome/149.0.7827.201 with a temporary dedicated profile and no real account state.
- Rollback Boundary: Revert the PR if the runtime API leaks raw endpoints or expands beyond #85/#88-#91.

## Host Binding

- Pull Request: pending
- Reviewed Head: pending
