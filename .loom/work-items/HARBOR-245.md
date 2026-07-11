# HARBOR-245

## Static Facts

- Item ID: HARBOR-245
- Goal: Provide one narrow, allowlisted read-only operation endpoint for an existing managed Harbor Runtime Session. It consumes the pinned Lode #262 local mirror and returns only public refs or a structured failure.
- Scope: Ownership is limited to Harbor Runtime API routing, static Lode admission mirror, managed-session/probe boundary, refs-only operation result, focused tests, and HARBOR-245 item-specific carriers.
- Execution Path: work/harbor-245-local-provider-auth-confirmation
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-245.md
- Review Entry: .loom/reviews/HARBOR-245.json
- Validation Entry: pnpm typecheck; pnpm test; pnpm build; git diff --check
- Closing Condition: Create a scoped PR after current-head review and hosted checks. Keep the issue open until the merged implementation has a real managed-session probe, refs-only evidence/readback, and Core/App live evidence.

## Host Binding

- GitHub Work Item: https://github.com/WebEnvoy/Harbor/issues/245

## Ownership Constraints

- Do not edit App, Core, or Lode.
- The main controller may serially transfer `.loom/status/current.md` and the generated fact-chain entry in `.loom/bootstrap/init-result.json` from merged HARBOR-241 to HARBOR-245; no subagent may edit shared carriers.
- Do not access production sites, profiles, or account material during implementation tests.

## Associated Artifacts

- `.loom/work-items/HARBOR-245.md`
- `.loom/progress/HARBOR-245.md`
- `.loom/specs/HARBOR-245/implementation-contract.md`
- `.loom/specs/HARBOR-245/plan.md`
- `.loom/specs/HARBOR-245/evidence-map.md`
