# Evidence Map

| evidence_id | evidence_type | source_locator | source_kind | consumes | binding | freshness | freshness_rule | provenance | consumer_boundary | remediation_direction |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EV-209-typecheck | test_evidence | `pnpm typecheck` | structural_check | .loom/specs/HARBOR-209/plan.md#validation | HARBOR-209 / current branch head | present | Rerun after TypeScript changes. | Local validation on 2026-07-06 UTC | Review and PR-ready only | Fix type errors before review. |
| EV-209-test | test_evidence | `pnpm test` | structural_check | .loom/specs/HARBOR-209/plan.md#validation | HARBOR-209 / current branch head | present | Rerun after Runtime API changes. | Local validation on 2026-07-06 UTC | Review and PR-ready only | Fix failing Runtime API tests before review. |
| EV-209-smoke-fixture | behavior_evidence | `.loom/tmp/harbor-209-fixture-smoke.json` | runtime_attempt | #209/#210/#211/#212 fixture path | HARBOR-209 / current branch head | present | Rerun after smoke or Runtime API changes. | Local fixture smoke on 2026-07-06 UTC | Agent-safe summary only; tmp file not committed | Rerun smoke and update PR evidence. |
| EV-209-smoke-local | behavior_evidence | `.loom/tmp/harbor-209-local-smoke.json` | runtime_attempt | #209/#210/#211/#212 real local provider path | HARBOR-209 / current branch head | present | Rerun if provider, browser version, branch head, or site behavior changes. | Local real Chrome restricted fallback smoke on 2026-07-06 UTC | Public page facts, refs, hashes only; raw bytes/endpoints not exposed | Re-run with CloakBrowser when installed; keep Chrome as restricted fallback evidence. |
| EV-209-diff-check | test_evidence | `git diff --check` | structural_check | .loom/specs/HARBOR-209/plan.md#validation | HARBOR-209 / current branch head | present | Rerun before commit and PR update. | Local validation | Review and PR-ready only | Fix whitespace errors. |
| EV-209-loom | test_evidence | `loom fact-chain --target . --json`; `loom verify --target . --json` | structural_check | .loom/work-items/HARBOR-209.md and .loom/progress/HARBOR-209.md | HARBOR-209 / current branch head | present | Rerun after carrier or PR metadata changes. | Local Loom validation | PR-ready only, not merge-ready | Repair carrier drift before PR-ready. |
| EV-209-fresh | fresh_verification_input | `.loom/specs/HARBOR-209/build-evidence.json` | repo_file | EV-209-typecheck, EV-209-test, EV-209-smoke-fixture, EV-209-smoke-local, EV-209-diff-check, EV-209-loom | HARBOR-209 / current branch head | present | Rerun all consumed checks and refresh build evidence after code, carrier, PR metadata, or provider evidence changes. | Authored from local validation and real runtime evidence on 2026-07-06 UTC | PR-ready only; merge-ready must rebind to pushed head and PR URL | Refresh validation and build evidence for current head. |

## Runtime Evidence Summary

- Provider source: `pnpm smoke:runtime:local`, isolated temporary browser profiles, no daily profile.
- Provider observed on this workstation: CloakBrowser missing; official Chrome `149.0.7827.201` selected as `chrome_restricted_fallback`.
- xiaohongshu: requested `https://www.xiaohongshu.com/explore`, observed same URL, title `小红书 - 你的生活兴趣社区`, status `ready`, screenshot ref/evidence refs present with PNG hash metadata.
- BOSS: requested `https://www.zhipin.com/`, observed same URL, title empty from page runtime, status `ready`, page/evidence refs present; screenshot ref is present and raw bytes are not exposed.
- Control facts: handoff owner `user`, handoff reason `viewer_only`, release state `idle`, stopped sessions `closed`.
