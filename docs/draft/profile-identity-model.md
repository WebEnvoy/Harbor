# Profile 与 Execution Identity 模型

Harbor 的核心不是单纯的 Profile，而是 Execution Identity。

## 三层关系

```text
Fingerprint < Profile < Execution Identity
```

## Fingerprint

Fingerprint 是设备和浏览器环境表达，包括：

- User-Agent；
- Canvas / WebGL / Audio / Font；
- 语言、时区、地理位置；
- 屏幕尺寸、窗口尺寸、设备参数；
- WebRTC、DNS、代理和网络特征。

## Profile

Profile 是浏览器身份容器，包括：

- user_data_dir；
- Cookie、localStorage、sessionStorage；
- 扩展；
- 代理；
- 指纹配置；
- 浏览器版本和 driver；
- 启动参数；
- 登录态持久化数据。

## Execution Identity

Execution Identity 是 Harbor 相比普通指纹浏览器增加的高层语义，包括：

- site_id；
- account_ref；
- profile_id；
- login_state；
- last_known_normal_state；
- risk_events；
- resource_requirement；
- allowed_execution_channels；
- evidence_policy；
- linked_capabilities；
- linked_tasks；
- usage_history。

## 设计要求

- 一个 Profile 可以服务一个或多个 Execution Identity，但高风险账号应尽量长期绑定稳定环境；
- 账号态写入任务应使用更严格的身份和环境约束；
- 公开读取任务可以使用更低成本资源；
- 风控、验证码、登录失效等状态应进入执行身份历史，而不是只作为一次性错误。
