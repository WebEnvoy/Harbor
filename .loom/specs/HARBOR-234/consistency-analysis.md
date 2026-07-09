# Consistency Analysis

| check | status | evidence |
| --- | --- | --- |
| GitHub issue exists and is open | pass | Harbor #234 is open and parented to #218 |
| Cross-repo dependency direction | pass | Harbor #234 blocks App #265 and Core #243 |
| Lode runtime boundary | pass | Lode supplies capability/resource truth only; Harbor supplies runtime facts |
| Sensitive material boundary | pass | `site-resource-facts`, `write-precheck-facts`, readiness, and evidence readback expose refs/public state only; tests assert no cookie/token/profile/raw page material and `raw_*` boundaries are `not_exposed` |
| Write-precheck no-submit guard | pass | HTTP and runtime tests assert `submitted=false`, `no_submit_guard=active`, blocked write events, and no caller-supplied URL/title/locator spoofing in evidence provenance |
| Live action boundary | pass | Work Item explicitly excludes live account/profile/production page actions |
