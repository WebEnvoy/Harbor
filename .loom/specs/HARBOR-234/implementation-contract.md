# Implementation Contract

## Ownership

- Main controller owns `.loom/work-items/HARBOR-234.md`, `.loom/progress/HARBOR-234.md`, `.loom/status/current.md`, `.loom/specs/HARBOR-234/**`, PR metadata, review, merge-ready, merge, and post-merge issue closeout.
- Read-only subagents may inspect Harbor #234 code, spec, plan, and validation evidence, but may not edit files or operate GitHub state.
- Implementation writes are limited to `packages/runtime-api/src/**` and HARBOR-234 item-specific Loom carriers.
- Shared status and bootstrap fact-chain carriers are updated only by the main controller.

## Forbidden Targets

- App, Core/WebEnvoy, and Lode repositories.
- Provider launch internals outside existing session, snapshot, evidence, and runtime API surfaces.
- Real account, browser profile, Cookie, token, credential, or production page actions.
- Submit, publish, send, save, delete, pay, apply, greet, or any other external visible write.
- Risk-control or CAPTCHA bypass claims.
- Hosted browser, marketplace, batch collection, complete account cloud hosting, raw CDP endpoint export, raw DOM, raw HAR, network bodies, full screenshot bytes, or private profile storage.

## Verification

- Required local checks: `pnpm typecheck`, `pnpm test`, `pnpm smoke:runtime`, `git diff --check`, `loom verify --target . --json`, `loom fact-chain --target . --item HARBOR-234 --json`, `loom suite validate --target . --item HARBOR-234 --json`, `loom suite evidence validate --target . --item HARBOR-234 --json`, and `loom suite carrier validate --target . --item HARBOR-234 --json`.
- Build readiness must consume `.loom/specs/HARBOR-234/build-evidence.json` and show delegated review output integrated.
- Validation in this Work Item is fixture/local-safe only. Live Xiaohongshu/BOSS account, profile, or production page evidence requires a later explicit allowed/prohibited action record.

## PR Scope

- Covered: Harbor Runtime API site resource facts, write-precheck facts, readiness discovery, session-scoped facts projection, and regression coverage for session-bound evidence provenance.
- Not covered: Core task execution, App packaged runtime supervision, Lode runtime execution, final App E2E, live site login/session evidence, or true writes.
