# Implementation Contract

- Search probes may return at most 15 canonical same-site detail targets to Harbor internals. Public responses expose only `detail_*` refs.
- Xiaohongshu targets must be canonical `/explore/{24-hex}` URLs with only bounded `xsec_token`/`xsec_source` query keys. BOSS targets must be canonical `/job_detail/{opaque}.html` URLs without query or fragment.
- Detail requests accept only `site_id`, detail operation ID, and `detail_ref`; URL, query, city, business ID, security ID, or arbitrary locator input is rejected.
- Registry records are process-memory only, expire after ten minutes, bind session/site/operation, and are consumed once before provider execution.
- Detail probes use a temporary CDP target, block cross-origin document navigation, require exact target document response and an operation-specific rendered surface, capture refs-only evidence, and always close the target.
- Lode #268 remains the capability-truth dependency. This PR freezes the Harbor consumer implementation without claiming Lode merge or live success.

## Non-Goals

- No runtime success claim, Core run record, App UI, automatic login, submit/publish/send/apply/greet/save, or sensitive material persistence.
