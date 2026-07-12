# HARBOR-263 Plan

1. Preserve pending trusted handoff when a confirmed Core controller releases a session that it acquired through a trusted handoff.
2. Keep the existing explicit acquire path and stable-controller preflight unchanged.
3. Change the existing one-shot lifecycle regression into two independent Core acquire/probe/release cycles.
4. Retain directed negative coverage for unconfirmed/headless/fixture/identity/profile/lock/holder/cleanup boundaries.
5. Run targeted tests, typecheck, build, full tests, and diff-check; push a ready PR without merge or issue closeout.
