# Spec

## Goal

Use a temporary bootstrap-bound docs-only gate for the Harbor boundary documentation PR.

## Scope

- In scope: review the Harbor boundary documentation semantics in PR #29.
- Out of scope: Phase 2 runtime/provider implementation, product code, generated facts, and cross-repo runtime behavior.

## Boundary Statement

Harbor documents ownership of runtime, profile, session, provider, evidence, viewer, and control facts.

## Validation

- Review changed ADR pending-decision documentation only.
- Confirm no product code or test fixture files changed.
- Confirm PR metadata binds `Loom Work Item: INIT-0001`, branch, and head SHA.

## Suite Applicability

- Suite path: not_applicable
- Artifact: suite-level
- Rationale: This PR changes only boundary documentation and does not change executable code, schemas, APIs, runtime behavior, or tests.
- Consumer boundary: This N/A applies only to Harbor PR #29 boundary documentation semantics at the current PR head; it does not approve Phase 2 implementation.
- Recheck condition: Require suite/test validation if code, schema, API, runtime behavior, generated facts, or fixture contracts change.
