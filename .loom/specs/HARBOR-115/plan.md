# Plan

## Steps

1. Add validation runtime facts to the Runtime API.
2. Extend evidence status privacy boundary with private store, redacted export, retention, consent, and delete policy fields.
3. Add tests for ready and blocked runtime validation facts.
4. Add tests and smoke output for App/Core-safe evidence policy facts.
5. Run pnpm typecheck, pnpm test, pnpm smoke:runtime, git diff check, Loom checks, hosted gate, merge, and closeout.

## Out of Scope

- Hosted browser, real accounts/profiles, production pages, raw DOM/network/profile storage, Browser management console, and Stage 6 behavior.
