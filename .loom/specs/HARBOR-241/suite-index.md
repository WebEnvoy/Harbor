# HARBOR-241 Suite Index

## Suite Path

- Suite path: full
- Path decision: a persistent Harbor identity state and local Runtime API contract consumed by App/Core change.
- Provenance: Harbor #203 correction and Harbor #241 created after a real managed Xiaohongshu session remained `needs_auth` following user-completed manual authentication.

## Artifact Inventory

| Artifact | Locator | Status | Consumer |
| --- | --- | --- | --- |
| spec | .loom/specs/HARBOR-241/spec.md | present | build and review |
| plan | .loom/specs/HARBOR-241/plan.md | present | build and validation |
| contracts | .loom/specs/HARBOR-241/contracts.md | present | API/privacy boundary |
| implementation contract | .loom/specs/HARBOR-241/implementation-contract.md | present | ownership boundary |
| readiness checklist | .loom/specs/HARBOR-241/readiness-checklist.md | present | PR readiness |
| execution breakdown | .loom/specs/HARBOR-241/execution-breakdown.md | present | task carrier mapping |
| task carrier | .loom/specs/HARBOR-241/task-carrier.md | present | GitHub binding |
| evidence map | .loom/specs/HARBOR-241/evidence-map.md | present | validation evidence |
| build evidence | .loom/specs/HARBOR-241/build-evidence.json | present | build readiness |
| consistency analysis | .loom/specs/HARBOR-241/consistency-analysis.md | present | owner and scope checks |

## Recheck Conditions

- Recheck after PR head, endpoint semantics, state ownership, validation evidence, or live App consumer changes.
