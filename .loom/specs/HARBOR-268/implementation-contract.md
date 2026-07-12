# HARBOR-268 Implementation Contract

- Allowed writes: XHS read-operation extraction/validation, bounded public summary types if required, focused tests, and HARBOR-268 carriers.
- Preserve: existing API ownership, opaque ref store, same-session/single-use rules, XHS detail validation, BOSS disabled state, and fail-closed defaults.
- Prohibit: BOSS production expansion, auth/session/profile changes, raw DOM/HAR/network body/screenshot bytes/CDP endpoints, external writes, login automation, bulk collection, or risk-control bypass.
- Validation: `pnpm typecheck`, `pnpm build`, targeted tests, `pnpm test`, and `git diff --check`.
