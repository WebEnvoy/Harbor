# Spec

- Suite path: not_applicable

- Suite-level not_applicable: rationale: Loom v0.26.3 maintenance upgrade updates repository installed-state metadata, workflow pin, and item-specific Loom carriers required for admission.; consumer boundary: No product runtime, business behavior, or application source changes are included; consumers are Loom governance/admission only.; recheck condition: Re-run Loom installed-state validate, pr metadata preflight, fact-chain, pre-review, review, merge-ready, and hosted merge gate before merge.; scope proof: Changed paths are limited to .loom/installed-state.json, .github/workflows/loom-check.yml, .loom/bootstrap/init-result.json, .loom/status/current.md, .loom/work-items/GH-107.md, .loom/progress/GH-107.md, and .loom/specs/GH-107/spec.md for the GH-107 maintenance item.; review requirement: current_head_review_required.

## PR Intent

- Intent profile: runtime-upgrade-only
- Work Item: GH-107
- Change class: runtime_upgrade
- Review, PR gate, merge-ready, release readback, and closeout evidence remain required by their normal gates.
