# HARBOR-261 Spec

- Suite Path: full
- User outcome: App receives real session/page facts or a structured failure within the configured launch timeout, including on login/challenge redirects.
- Acceptance: version/page-list/deep CDP title/open-url are bounded; challenge redirect preserves only public target URL/title; version failure remains launch failure; page-list/open-url failures remain refs-safe structured facts.
- Boundary: challenge facts do not imply task success or bypass; no raw websocket endpoint, page body, credential, Cookie, token, profile material, automatic login, or write action.
- Live closeout: merged packaged App must leave `请求中` and show the actual challenge or structured failure in bounded time.
