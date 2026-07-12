# HARBOR-268 Consistency Analysis

- Harbor remains owner of browser page/session/evidence facts; Core remains owner of task outcome and Run Record.
- URL, title, ready state and 2xx status remain transport/page-readability signals, not operation success.
- Search result targets must be bounded public facts and never expose raw DOM, network body, profile material or CDP endpoints.
- Existing opaque target storage, same-session and single-use invariants remain authoritative.
- BOSS production admission remains disabled; no BOSS selector or probe is expanded.
- Public contract shape remains unchanged unless implementation proves a bounded list summary field is strictly required.
