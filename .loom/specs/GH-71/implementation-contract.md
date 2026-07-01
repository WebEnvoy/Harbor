# Implementation Contract

## Work Item

- Item: GH-71
- Execution Entry: .loom/progress/GH-71.md

## Approved Spec

- Spec Path: .loom/specs/GH-71/spec.md
- Spec Review Entry: not_applicable_for_docs_only_pr_ready

## Implementation Scope

- In Scope: `docs/adr/0008-harbor-runtime-architecture-baseline.md`, `docs/contracts/README.md`, `AGENTS.md`, GH-71 item carrier, current status binding and the minimal bootstrap fact-chain entry for GH-71.
- Out Of Scope: runtime/provider/viewer/evidence code, API/OpenAPI/schema, database schema, package/dependency files, browser binary, fixtures, generated facts, hosted browser, provider marketplace, credential vault, full desktop console, merge and issue closeout.

## Validation Plan

- Automated Checks: `git diff --check`; JSON readability for GH-71 build evidence; Markdown readability for changed docs; Loom suite validate/carrier validate/build if available; hosted GitHub Actions after PR creation.
- Manual Verification: PR body and fact-chain item bind to GH-71; PR body states coverage of #70-#79 and uses Refs without close keywords.

## Risks And Rollback

- Risks: Docs may accidentally imply implementation or runtime smoke. Mitigation: ADR and AGENTS explicitly mark code, dependency, package and runtime smoke as deferred.
- Rollback Boundary: Revert the docs-only PR if the baseline expands beyond milestone #7 docs scope.

## Host Binding

- Pull Request: pending
- Reviewed Head: pending
