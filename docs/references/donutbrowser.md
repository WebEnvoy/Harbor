# DonutBrowser 参考

DonutBrowser 对 Harbor 的主要参考价值在 Profile Browser Desktop 和管理层能力。

## 可吸收方向

- Profile 管理；
- 分组 / 标签；
- 代理、Cookie、扩展；
- 浏览器启动器；
- 浏览器版本管理；
- API / MCP；
- 同步和配置层；
- 桌面产品工作流。

## 需要谨慎的部分

DonutBrowser 的 Chromium 反指纹能力主要依赖 Wayfern 这类外部分发的浏览器二进制。DonutBrowser 更像开源启动器 / 管理器，而不是完整开源的 Chromium 反指纹内核。

因此 Harbor 可以吸收：

- Profile Browser 管理层；
- 启动器；
- 配置层；
- 代理层；
- API / MCP 层；
- 部分 CDP 配置经验。

但不能直接吸收：

- Wayfern 的 Chromium fork 补丁；
- 底层反检测实现；
- 完整浏览器内核能力。

## 不建议直接照搬

- Tauri IPC；
- 具体 UI 结构；
- 特定 Wayfern 供应链绑定；
- 内部配置文件格式；
- 与 Harbor 公共模型不一致的同步逻辑。
