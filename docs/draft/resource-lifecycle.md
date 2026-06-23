# Resource Lifecycle

本文档描述 Harbor 中浏览器身份、运行会话和相关资源生命周期的初步方向，不代表最终稳定契约。

Harbor 管理的是可持续使用的浏览器身份和运行现场。Profile、Execution Identity、Runtime Session、Viewer、Evidence 等资源不应只是临时参数，而应具备可获取、可租约、可释放、可失效、可追踪的生命周期。

## 目标

Resource Lifecycle 要让上层系统回答：

- 当前 Profile / Identity / Session 是否可用；
- 一次任务是否独占或绑定了某个运行资源；
- 资源何时被 acquire、release 或 invalidate；
- 资源失效来自登录态、验证码、代理、浏览器崩溃还是人工判断；
- 资源使用是否能被 Run Record 追溯；
- 资源失效是否有脱敏证据支撑。

## 核心对象

候选对象：

```text
HarborResourceRecord
  resource_id
  resource_type
  status
  metadata

HarborResourceBundle
  bundle_id
  lease_id
  run_id
  profile_ref
  identity_ref
  session_ref
  viewer_ref
  evidence_policy_ref

HarborResourceLease
  lease_id
  run_id
  resource_refs
  acquired_at
  released_at
  target_status_after_release
  release_reason

HarborResourceTraceEvent
  event_id
  run_id
  lease_id
  resource_ref
  event_type
  from_status
  to_status
  occurred_at
  reason
```

## 资源类型

初始资源类型可以包括：

- `profile`；
- `execution_identity`；
- `runtime_session`；
- `viewer`；
- `proxy_binding`；
- `evidence_policy`；
- `snapshot_context`。

这些是 Harbor 资源，不是 Lode 能力输出，也不是 WebEnvoy Core 的 result envelope。

## 状态机

最小状态建议：

```text
AVAILABLE → IN_USE → AVAILABLE / INVALID
```

语义：

| 状态 | 说明 |
|---|---|
| `AVAILABLE` | 可被任务使用或绑定 |
| `IN_USE` | 已被某次 Run 或 Session lease 占用 |
| `INVALID` | 不应继续被使用，需要修复、重新登录、重建或人工处理 |

`INVALID` 不应自动恢复为 AVAILABLE。恢复应经过明确的健康证据、人工修复或重新初始化流程。

## Acquire / Release / Invalidate

`acquire` 负责为一次 Run 获取所需 Harbor 资源，并创建 lease。获取成功后，资源进入 `IN_USE`，并产生 trace event。

`release` 负责在任务结束后收口 lease。正常结束时资源可以回到 `AVAILABLE`；如果任务期间发现登录态失效、验证码、浏览器崩溃、代理不可用或人工标记异常，资源可以进入 `INVALID`。

`invalidate` 应要求证据。它不应由站点能力随意调用，而应通过 Harbor 或 Core 的受控路径，基于脱敏 health evidence 或人工确认完成。

## Health Evidence

Harbor 应使用脱敏健康证据表达资源状态，而不是暴露凭据材料。

候选字段：

```text
health_evidence_id
resource_ref
run_id
lease_id
status
observed_at
provenance
reason
redaction_status
diagnostic_ref
```

状态可以包括：

```text
healthy
stale
invalid
unknown
```

准入时，只有满足任务要求且健康状态可接受的资源才应被绑定。`unknown` 是否允许使用，应由 Core、用户策略或能力资源需求决定；高风险写侧任务应倾向 fail closed。

## Resource Trace

Harbor 应记录资源状态变化事件，而不是只写日志文本。

Trace event 应能回答：

- 哪个 Run 使用了哪个 Profile / Identity / Session；
- 资源何时被 acquire；
- 资源何时 release；
- 资源是否被 invalidate；
- 失效原因是什么；
- 哪些 evidence_ref 支撑该判断。

Core Run Record 可以引用这些 trace event，但不应复制 Harbor 的完整证据存储。

## 与 WebEnvoy Core 的关系

Core 声明本次任务需要什么资源能力，并请求 Harbor 绑定 Profile、Execution Identity、Runtime Session 和 evidence policy。

Harbor 返回：

- bundle_ref；
- lease_ref；
- runtime_session_ref；
- profile_ref；
- identity_ref；
- capability facts；
- evidence_policy_ref；
- resource_trace_refs。

Core 将这些引用写入 Run Record，并负责根据 Lode 资源需求和 Harbor 能力事实判断是否满足任务要求。

## 与 Lode 的关系

Lode 只声明资源需求 profile，例如是否需要 stable identity、persistent profile、proxy、manual takeover、snapshot 或 write verification。Lode 不管理 Harbor 资源状态，也不保存真实 Profile、Cookie、Token、Runtime Session 或 health evidence。

## 不应做的事

Harbor Resource Lifecycle 不应：

- 定义站点能力生命周期；
- 定义 normalized result；
- 执行业务任务编排；
- 保存 Lode 能力资产；
- 把 Cookie、Token 或完整请求响应放进公共 trace；
- 输出账号安全分或任务适配评分；
- 用 provider routing / fallback priority 替代 Core 的资源匹配。

Resource Lifecycle 的价值，是让 Harbor 的浏览器身份和运行现场具备可审计、可恢复、可失效收口的状态基础。
