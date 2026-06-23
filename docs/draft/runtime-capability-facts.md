# Runtime Capability Facts

本文档定义 Harbor 应向 WebEnvoy Core、WebEnvoy App、Agent、CLI、MCP、SDK 和上游系统暴露的结构化能力事实。

这些事实用于描述当前 provider、Profile 和 Runtime Session 具备什么能力、启用了什么配置、有哪些已知限制。它们不是任务适配结论，也不是风险评分。

## 核心原则

Harbor 负责输出客观能力事实，不直接判断某个网站任务是否可以执行。

任务是否满足要求，应由以下上层根据能力事实进行判断：

- WebEnvoy Core；
- Lode 能力声明；
- 用户策略；
- 上游系统。

因此 Harbor 不应输出类似以下判断：

- 当前 provider 适合某个任务；
- 当前身份可以安全执行某个任务；
- 当前账号风险高或低；
- 当前环境足以处理某个高防网站。

Harbor 应输出的是可比较、可检查、可记录的事实。

## Provider Capability Facts

Provider Capability Facts 描述底层浏览器 provider 或远程运行时的能力。

典型字段包括：

- provider 类型，例如 Chrome Official、CloakBrowser、Camoufox、Remote CDP 或其他 provider；
- 是否支持本地启动；
- 是否支持远程连接；
- 是否支持持久 Profile；
- 是否支持独立 user_data_dir；
- 是否支持代理配置；
- 是否支持语言、时区、viewport、UA 等基础环境配置；
- 是否支持扩展；
- 是否支持 CDP；
- 是否支持 Viewer / VNC；
- 是否提供 provider-native 指纹控制；
- 是否提供 provider-native 反检测能力；
- 已知不可用能力或限制。

这些字段只描述 provider 能力，不判断它是否适合某个网站任务。

## Profile Capability Facts

Profile Capability Facts 描述某个 Profile 当前作为浏览器身份载体时具备什么状态和能力。

典型字段包括：

- 是否使用长期 Profile；
- 是否绑定站点账号；
- 是否有持久 Cookie / storage；
- 是否绑定代理；
- 是否绑定语言、地区、时区、viewport 或其他环境配置；
- 是否有扩展配置；
- 是否有最近一次正常使用记录；
- 是否有历史登录异常、验证码、访问受限或其他运行事件；
- 当前 Profile 是否处于运行中；
- 当前 Profile 是否有未清理的异常会话状态。

这些字段只描述 Profile 状态，不输出账号安全分或执行风险分。

## Runtime Session Capability Facts

Runtime Session Capability Facts 描述一次运行中的浏览器会话具备什么连接和观察能力。

典型字段包括：

- session 是否正在运行；
- 关联的 Profile 和 Execution Identity；
- 当前 provider；
- CDP 是否可用；
- Viewer / VNC 是否可用；
- 当前页面或上下文是否可观察；
- 是否支持截图；
- 是否支持 Snapshot / RefMap；
- 是否支持网络摘要；
- 是否支持日志捕获；
- 是否支持人工接管；
- 是否支持暂停、恢复和关闭；
- 当前 session 的错误状态和最近异常。

这些字段只描述运行现场，不替 WebEnvoy Core 判断是否继续执行任务。

## Automation Exposure Facts

Automation Exposure Facts 描述 Harbor 在当前 provider 和 session 下可以减少哪些临时自动化特征或异常暴露。

典型字段包括：

- 是否使用长期 Profile；
- 是否避免每次任务新建干净临时浏览器；
- 是否减少不必要页面注入；
- 是否减少不必要调试暴露；
- 是否维护合理启动参数；
- 是否保留稳定 Cookie / storage；
- 是否复用一致代理和环境配置；
- 是否记录了 provider-native 反检测能力是否存在。

这些事实不表示“不会被检测”，也不表示“足以执行某个任务”。它们只说明当前环境减少了哪些已知自动化暴露面。

## Evidence Policy Facts

Evidence Policy Facts 描述当前运行证据会记录什么、不记录什么，以及是否允许外传。

典型字段包括：

- 是否记录截图；
- 是否记录日志；
- 是否记录网络摘要；
- 是否记录 Snapshot；
- 是否记录错误状态；
- 是否记录关键运行事件；
- 是否默认排除 Cookie、token、完整 DOM、完整请求响应和用户业务数据；
- 是否允许脱敏摘要被上报给上层或公共能力进化链路。

Evidence Policy Facts 应帮助用户和上层系统理解证据边界，但不替代隐私、权限或合规策略。

## 与资源需求的关系

WebEnvoy Core、Lode 能力声明或用户策略可以声明任务需要什么资源，例如：

- 必须使用长期 Profile；
- 必须使用账号登录态；
- 必须绑定代理；
- 必须支持完整浏览器上下文；
- 必须支持写入后验证；
- 必须支持人工接管；
- 必须支持特定 provider-native 指纹控制。

Harbor 只提供能力事实。上层根据任务要求和 Harbor 返回的事实判断是否满足要求、是否换 provider、是否降级执行、是否请求人工处理或是否停止任务。

## 不做什么

Runtime Capability Facts 不应成为：

- 黑盒风险评分；
- provider 排名；
- 网站任务适配结论；
- 账号安全分；
- 风控绕过承诺；
- 业务策略判断。

一句话：Harbor 暴露事实，上层做判断。
