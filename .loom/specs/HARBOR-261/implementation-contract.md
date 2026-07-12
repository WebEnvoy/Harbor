# HARBOR-261 Implementation Contract

- Ownership: `packages/runtime-api/src/local-provider-launcher.ts`, focused launcher tests, and HARBOR-261 carriers.
- Required behavior: DevTools port readiness and initial provider readback share one absolute `input.timeout_ms` deadline; later open-url uses its own operation timeout; a deep CDP title failure may use only already-observed page-list URL/title.
- Failure behavior: version failure returns launch failure; page-list failure returns `cdp_unavailable`; open-url failure returns `url_unreachable`; challenge redirect remains a visible session fact and is later classified by admission.
- Privacy: never expose websocket URL, raw DOM/network/page body, credentials, Cookie/token, or raw profile path.
- External behavior: no CAPTCHA solution, bypass, automatic login, or write.
- Verification: typecheck, build, focused timeout tests, full suite, independent current-head review, hosted gate, then merged-package Computer Use E2E.
