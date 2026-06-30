# Spec

## Goal

Record the docs-only suite decision for GH-13.

## Scope

- In scope: `docs/adr/pending-decisions.md` and GH-13 Loom carriers.
- Out of scope: runtime API schema, browser driver code, provider binary packaging, executable smoke tests, evidence storage behavior, viewer/handoff implementation, and live runtime actions.

## Suite Path

- Suite path: not_applicable
- Suite-level not_applicable artifact binding: suite-level; rationale: this PR changes decision/fact carriers only; consumer boundary: Harbor planning and issue closeout may consume this as boundary evidence only; recheck condition: require full or minimal executable suite when a later PR changes runtime API schema, browser driver code, provider validation packet, evidence storage behavior, viewer/handoff implementation, or live runtime action.
- Not applicable rationale: this PR changes decision/fact carriers only; no runtime code, schema package, provider binary, executable suite contract, or external action changes.
- Consumer boundary: Harbor planning and issue closeout may consume this as boundary evidence only; Core, App, and Lode must not treat it as executable provider validation.
- Recheck condition: require full or minimal executable suite when a later PR changes runtime API schema, browser driver code, provider validation packet, evidence storage behavior, viewer/handoff implementation, or live runtime action.
