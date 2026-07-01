# Implementation Contract

## Work Item

- Item: GH-92
- Execution Entry: .loom/progress/GH-92.md

## Approved Spec

- Spec Path: .loom/specs/GH-92/spec.md
- Spec Review Entry: pending

## Implementation Scope

- In Scope: Snapshot capture API, in-process page-scene ref store, optional RefMap element refs, Evidence records with provenance/redaction/retention/access/storage facts, structured unavailable classes, Core-facing scene ref readback, smoke updates, focused tests, GH-92 item-specific Loom carrier, and current fact-chain binding.
- Out Of Scope: Persistent SQLite evidence storage, raw artifact archives, production payload capture, real account or secret handling, hosted browser, provider marketplace, anti-detection success claims, full remote console, Viewer/handoff/Core-App ownership facts, cross-repo Core/App changes, merge, and issue/FR/milestone closeout.

## Validation Plan

- Automated Checks: `pnpm typecheck`; `pnpm test`; `pnpm smoke:runtime`; optional local-browser `pnpm smoke:runtime:local`; `git diff --check`; JSON readability for GH-92 build evidence; Loom suite/carrier/evidence/build checks if available; hosted GitHub Actions after PR creation.
- Manual Verification: Core scene refs contain only refs and page summary; evidence records expose provenance and policy state; public facts do not include raw DOM/HAR/screenshots/video/cookies/tokens/raw CDP endpoints/profile paths/provider secrets; PR body and fact-chain bind to GH-92; PR references #86/#93/#94/#95/#96 without automatic close keywords until closeout is ready.

## Risks And Rollback

- Risks: This first slice stores refs in process memory and does not persist evidence metadata across runtime restarts. Mitigation: the issue scope requires type/source/provenance/redaction/retention facts and Core-readable refs, while persistent SQLite storage remains out of scope for this PR and should be added only when a consumer requires restart durability.
- Rollback Boundary: Revert the PR if page-scene refs leak raw artifacts, production data, credentials, provider secrets, raw endpoints, or expand into Viewer/handoff scope.

## Host Binding

- Pull Request: pending
- Reviewed Head: pending
