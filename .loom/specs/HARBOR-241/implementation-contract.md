# Implementation Contract

## Ownership

- May edit Harbor Runtime API routing, `HarborRuntime`, identity environment state handling, associated Runtime API tests, and HARBOR-241 Loom carriers.
- Must not edit App, Core, Lode, browser launcher behavior, real account/profile data, Cookie/token/password/verification-code material, raw DOM, HAR, screenshot bytes, or site automation logic.

## Boundary

- The endpoint records only a user-confirmed completion fact for the exact active managed session.
- It does not inspect or claim proof from cookies, page content, URLs, titles, screenshots, or site responses.
- It does not submit, publish, send, or otherwise write to an external site.

## Verification

- Fixture tests cover all endpoint outcomes without any live account or production page.
- Live verification may call the local Harbor endpoint only after the user has manually authenticated in the selected managed browser session; it records only refs and public status.
