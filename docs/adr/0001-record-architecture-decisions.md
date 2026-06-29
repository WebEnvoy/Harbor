# 0001. Record Architecture Decisions

## Status

Accepted, 2026-06-29.

## Context

Harbor already has planning drafts under `docs/draft/`, but those drafts are explicitly not stable specs or implementation commitments. The project needs a small place to record decisions that other WebEnvoy repositories can cite without treating every draft note as accepted architecture.

## Decision

Architecture decisions live in `docs/adr/` as numbered Markdown files:

```text
NNNN-short-kebab-title.md
```

Each ADR uses this compact shape:

- `Status`
- `Context`
- `Decision`
- `Consequences`
- `Alternatives Considered`
- `Research Evidence`
- `Open Questions`

Status values are:

- `Proposed` for drafts that need review.
- `Accepted` for decisions the repository currently follows.
- `Superseded by ADR NNNN` when a later decision replaces it.

ADRs describe product and architecture boundaries. They do not replace schemas, tests, migration notes, API references, or implementation docs.

## Consequences

This keeps the decision record small enough to maintain. Draft docs can stay exploratory, while accepted ADRs become the reference point for Harbor, Core, Lode, and App integration work.

Changing a decision means adding a new ADR or updating the status with a clear reason, not silently rewriting old context.

## Alternatives Considered

- Keep all decisions in `docs/draft/`: rejected because draft material mixes options, references, and open questions.
- Adopt a larger ADR template: rejected for now because Harbor is still defining first boundaries, and extra fields would add process without improving the decision.
- Write only final specs: rejected because boundary decisions need review before schema and implementation work.

## Research Evidence

- `docs/draft/README.md` says current drafts are planning candidates, not stable specs.
- `README.md` defines Harbor as the runtime/profile/evidence boundary and keeps site business logic outside Harbor.
- `AGENTS.md` requires design docs to be updated before low-level runtime, proxy, sandbox, or evidence design changes.

## Open Questions

- Where should versioned Runtime API schemas live once the ADRs are accepted?
- Should accepted ADRs later require an owner field, or is Git history enough for now?
