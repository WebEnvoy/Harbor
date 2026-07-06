# HARBOR-173 Progress

## Dynamic Facts

- Item ID: HARBOR-173
- Current Checkpoint: merge
- Current Stop: Implementation PR #195 is open for HARBOR-173; scheduler-owned semantic review carrier is recorded and PR metadata/head readback is current.
- Next Step: Hosted merge gate should consume the current PR metadata and review carrier, then scheduler thread will merge PR #195 and perform issue closeout/current pointer retire.
- Blockers: None recorded.
- Latest Validation Summary: Local validation passed on 2026-07-06T09:08Z: `pnpm typecheck`, `pnpm test`, `pnpm smoke:runtime`, sensitive material check against smoke output, `git diff --check`, `loom fact-chain --target . --json`, `loom verify --target . --json`, and `loom suite validate/carrier/evidence --target . --item HARBOR-173 --json`.
- Recovery Boundary: Harbor runtime-api scene/evidence/viewer facts and HARBOR-173 Loom carriers only; no App/Core/Lode changes, no hosted browser, no cloud runtime, no Chromium user provider, no Donut Browser provider registration, no live account/profile/cookie/token material, no raw CDP/VNC/DOM/network output, no issue closeout, no merge, no current pointer retire.
- Current Lane: FR #160 real scene evidence batch anchored on HARBOR-173

## Execution Ledger

- Ledger Binding: recovery_entry
- Plan Locator: .loom/specs/HARBOR-173/plan.md
- Acceptance Locator: .loom/specs/HARBOR-173/spec.md
- Validation Evidence Locator: .loom/specs/HARBOR-173/evidence-map.md
- Handoff Notes Locator: .loom/specs/HARBOR-173/task-carrier.md
- Evidence Freshness: current
