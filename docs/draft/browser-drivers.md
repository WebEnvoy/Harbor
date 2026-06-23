# Browser Drivers

Browser Driver 是 Harbor 连接不同浏览器或远程运行时的抽象层。

## 目标

Harbor 不应绑定单一浏览器供应商。不同浏览器、反指纹内核或远程 CDP 服务都应通过 driver 接入。

Driver 不只负责启动或连接浏览器，也应向 Harbor 返回结构化能力事实。正式能力事实模型见 [Runtime Capability Facts](runtime-capability-facts.md)。

## 初期 driver 方向

```text
browser-drivers/
  chrome-official/
  cloakbrowser/
  camoufox/
  remote-cdp/
```

## Driver 职责

一个 driver 至少应负责：

- 校验浏览器 binary 或远程 endpoint 是否可用；
- 准备启动参数；
- 绑定 user_data_dir；
- 注入代理和基础环境配置；
- 分配或连接 remote debugging port；
- 等待 CDP ready；
- 返回 Runtime Session 所需信息；
- 支持停止、健康检查和错误归因；
- 返回 provider capability facts，例如是否支持长期 Profile、代理、语言、时区、viewport、扩展、CDP、Viewer、provider-native 指纹控制或反检测能力。

## 不属于 driver 的职责

Driver 不应：

- 理解站点业务；
- 决定任务是否应该执行；
- 直接保存用户私有业务参数；
- 直接替代 Evidence Store；
- 将特定供应商参数泄漏为 Harbor 公共模型；
- 判断当前 provider 是否适合某个具体网站任务。

## 供应商绑定策略

特定浏览器能力可以存在于具体 driver 中，但 Harbor 的公共对象和能力事实应保持稳定：

- Profile；
- Execution Identity；
- Runtime Session；
- Evidence；
- Resource Requirement；
- Capability Execution Context。
