# Evidence Store

Evidence Store 负责保存 Harbor 与 WebEnvoy Core 执行过程中的关键证据。

它不是日志堆积系统，而是用于调试、验证、追踪失败原因和推动站点能力进化的结构化证据层。

## 可保存内容

- 执行截图；
- 关键 DOM 摘要；
- network 摘要；
- console error；
- CDP trace 摘要；
- 能力执行步骤；
- 写入前检查结果；
- 写入后验证结果；
- 失败原因；
- 站点变化摘要；
- 风控、验证码、登录失效等状态记录。

## 默认不保存或不上传内容

默认不应上传：

- 账号；
- Cookie；
- Token；
- 发布内容；
- 完整截图；
- 完整 DOM；
- 完整请求 / 响应；
- 用户私有任务封装；
- 用户业务参数。

本地保存敏感信息也应有明确授权、加密策略和保留周期。

## Evidence、Raw Reference 与 Normalized Result 的边界

Harbor 保存和暴露的是执行现场事实，例如 Runtime Session、Profile 状态、截图引用、Snapshot 引用、network 摘要、console 错误、raw payload 引用和 source trace。

Harbor 不解释站点业务字段，不定义 normalized result，也不判断某条结果是内容、评论、作者还是媒体资产。这些公共结果契约属于 Lode，运行时校验和封装属于 WebEnvoy Core。

Harbor 可以提供：

- `raw_payload_ref`；
- `evidence_ref`；
- `snapshot_ref`；
- `network_summary_ref`；
- `screenshot_ref`；
- `source_trace`；
- Runtime Session 与 Profile / Identity 引用。

Harbor 不应提供：

- normalized result；
- collection item schema；
- comment item schema；
- dataset record schema；
- 站点业务字段映射；
- cursor / continuation 业务语义。

## Evidence 与 Core 的关系

Core 负责告诉 Harbor 本次能力执行需要怎样的 evidence_policy。

Harbor 负责按策略采集、索引、存储和提供查询入口。

Core 最终返回给上游系统的是结构化事实，而不是完整执行现场。
