# Spec

## Goal

Push milestone #7 `Harbor Runtime 架构基线` issue tree to PR Ready with a docs-only Harbor architecture baseline.

## Required Behavior

- A Harbor technical architecture ADR records TypeScript / Node.js / Playwright / CDP / SQLite defaults.
- The ADR defines Runtime Session, Execution Identity, Provider facts, SQLite/filesystem refs, Snapshot/RefMap/Evidence refs, Viewer/handoff/control ownership, smoke-test minimums, accepted/cut/rejected research locators, deferred scope and non-goals.
- `AGENTS.md` records technical stack, dependency, test, change-scope and safety constraints for later Harbor runtime implementation.
- `docs/contracts/README.md` links the baseline ADR and gives later provider/session/evidence/viewer skeletons a read path.
- The PR binds to real Work Item GH-71 and states coverage of #70-#79.
- PR text uses Refs and must not use automatic close keywords.

## Issue Coverage

| Issue | Coverage |
|---|---|
| #70 | Runtime API, Provider, Session baseline and docs-only non-goals. |
| #71 | TypeScript / Node.js / Playwright / CDP defaults and Rust/Go deferred gate. |
| #72 | Runtime Session, Execution Identity, Profile and Provider facts owner/consumer/forbidden fields. |
| #73 | SQLite metadata/refs and filesystem artifact locator storage boundary. |
| #74 | AGENTS stack, dependency, tests, scope and safety constraints. |
| #75 | Snapshot, Evidence, Viewer, handoff and control ownership technical baseline. |
| #76 | Snapshot/refmap/evidence refs, source_trace and unavailable states. |
| #77 | Mediated viewer refs, raw endpoint rejection and control owner facts. |
| #78 | Provider/session/snapshot/evidence/viewer smoke-test minimum. |
| #79 | Contracts index and deferred hosted browser/provider marketplace/credential vault/full desktop console boundaries. |

## Non-Goals

- Do not implement runtime, provider, viewer, evidence store, API schema, storage schema, browser binary, package scaffold or dependency installation.
- Do not initialize `package.json`.
- Do not merge PR or close issues.
- Do not use INIT-0001 as the PR Work Item.
- Do not claim runtime smoke has run for docs-only changes.

## Suite Applicability

- Suite path: not_applicable
- Artifact: suite-level
- Rationale: This PR changes only documentation and GH-71/current Loom carrier metadata. It does not change product code, runtime behavior, API/schema, storage schema, fixtures, generated facts, provider binaries or dependencies.
- Consumer boundary: `git diff --check`, Markdown readability checks, JSON readability checks, Loom metadata/body readback and hosted PR checks are the relevant validation for this docs-only baseline.
- Recheck condition: Require suite/runtime smoke if the PR adds or changes runtime/provider/session/evidence/viewer code, API/schema, storage schema, browser binary/install behavior, package/dependency files, fixtures, generated facts or non-GH-71 Loom carrier semantics.
