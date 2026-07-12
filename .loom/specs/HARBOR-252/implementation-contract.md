# Implementation Contract

- Search probes may return at most 15 canonical same-site detail targets to Harbor internals. Public responses expose only `detail_ref_*` refs.
- Xiaohongshu targets must be canonical `/explore/{24-hex}` URLs with only bounded `xsec_token`/`xsec_source` query keys. BOSS targets must be canonical `/job_detail/{opaque}.html` URLs without query or fragment.
- Detail requests accept only `site_id`, detail operation ID, and `detail_ref`; URL, query, city, business ID, security ID, or arbitrary locator input is rejected.
- Registry records are process-memory only, expire after ten minutes, bind session/site/operation, and are consumed once before provider execution. Release/stop clears session refs; consumed/expired classifications use a ten-minute, 4096-entry bounded tombstone window.
- Detail probes use a temporary CDP target, block cross-origin document navigation, require exact target document response and an operation-specific rendered surface, capture refs-only evidence, and always close the target.
- Detail truth is pinned to Lode #268 corrective merge `66d79b4e600565a00515b1c801e84291edc7b0c1`, `registry/detail-runtime-consumption.json` SHA-256 `dca2761b7feb09a0ab86f7202e153da3c97b21a75299af6adaf64eade319deef`. BOSS consumes package/lock `0.1.1`.
- XHS completion requires Vue hydration, a current-note Pinia record whose note ID and normalized fields match the target and rendered values, exact target document response, source kinds `pinia_store_summary` + `network_summary`, and snapshot evidence. BOSS requires `wapi_job_detail_summary` + `dom_snapshot_summary` and snapshot evidence, and exposes only the opaque `detail_ref`; post-check binds the exact source/evidence refs separately.
- Challenge/login scanning covers the complete visible page text plus overlay selectors and never returns page text.

## Non-Goals

- No runtime success claim, Core run record, App UI, automatic login, submit/publish/send/apply/greet/save, or sensitive material persistence.
