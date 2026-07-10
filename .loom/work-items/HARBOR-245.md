# HARBOR-245

## Static Facts

- Item ID: HARBOR-245
- GitHub Work Item: https://github.com/WebEnvoy/Harbor/issues/245
- Goal: Provide one narrow, allowlisted read-only operation endpoint for an existing managed Harbor Runtime Session. It consumes the pinned Lode #262 local mirror and returns only public refs or a structured failure.
- Scope: Harbor Runtime API routing, static Lode admission mirror, managed-session/probe boundary, refs-only operation result, focused tests, and HARBOR-245 item-specific carriers.
- Ownership Constraints: Do not edit App, Core, or Lode. Do not modify `.loom/status/current.md` or another item's shared carrier. Do not access production sites, profiles, or account material during implementation tests.
- Execution Path: work/harbor-245-allowlisted-read-operations
- Workspace Entry: .
- Recovery Entry: .loom/progress/HARBOR-245.md
- Validation Entry: pnpm typecheck; pnpm test; pnpm build; git diff --check
- Closing Condition: A later PR may be created only after Loom #2026/#2015 gate repair is merged. The issue remains open until the merged implementation has a real managed-session probe, refs-only evidence/readback, and Core/App live evidence.

## Associated Artifacts

- `.loom/work-items/HARBOR-245.md`
- `.loom/progress/HARBOR-245.md`
- `.loom/specs/HARBOR-245/implementation-contract.md`
- `.loom/specs/HARBOR-245/plan.md`
- `.loom/specs/HARBOR-245/evidence-map.md`
