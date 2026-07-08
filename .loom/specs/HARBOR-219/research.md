# Research

- Existing `HarborRuntime` already owns provider detection, identity environment management, session lifecycle, snapshot capture, and evidence ref readback.
- A thin HTTP adapter is enough for App/Core consumption; no new browser driver, hosted browser, schema framework, or dependency is needed.
- `pnpm smoke:runtime` remains fixture mode; live provider detection evidence comes from `/runtime/browser-providers` against the local machine.
