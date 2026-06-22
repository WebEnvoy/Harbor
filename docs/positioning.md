# Harbor 定位

Harbor 是 WebEnvoy 的 Runtime 仓库。

它本质上是一个带 WebEnvoy 执行身份语义的 Agent-ready 指纹浏览器 / Profile Runtime。它既可以被人类用户直接使用，也可以被 Agent、自动化程序和 WebEnvoy Core 通过 API 调用。

## 一句话定位

> Harbor = 指纹浏览器 + Profile Runtime + Execution Identity + Evidence + WebEnvoy Runtime API。

## 使用者

Harbor 面向三类使用者：

- 人类用户：创建 Profile、配置代理和指纹、登录账号、维护账号状态、处理验证码或风控页面；
- Agent / 自动化程序：通过 API、CDP、VNC、MCP 或 SDK 获取可执行浏览器会话；
- WebEnvoy Core：根据站点能力、任务封装和资源需求获取稳定的执行身份与运行上下文。

## 与普通指纹浏览器的差异

普通指纹浏览器的核心对象通常是 Profile。

Harbor 的核心对象是 Execution Identity。Profile 只是执行身份的载体之一。

Harbor 需要额外理解：

- 站点绑定；
- 账号状态；
- 登录态；
- 历史风险事件；
- 资源需求；
- 可用执行通道；
- 运行证据策略；
- 面向 WebEnvoy Core 的能力执行上下文。
