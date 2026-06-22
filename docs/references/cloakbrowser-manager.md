# CloakBrowser-Manager 参考

CloakBrowser-Manager 对 Harbor 的主要参考价值在 Server Runtime、Docker、CDP、VNC / noVNC 和远程会话管理。

## 可吸收方向

- Docker 化运行；
- Runtime Server；
- Profile launch / stop / status；
- CDP endpoint；
- VNC / noVNC viewer；
- 远程浏览器会话；
- 进程生命周期管理；
- 基础认证和本地存储方式。

## 局限

CloakBrowser-Manager 更接近浏览器 Server Runtime，不是完整的 Profile Browser 产品。

它通常不覆盖或不足以覆盖：

- 深层 Profile 产品体验；
- 分组 / 标签 / 批量配置；
- 扩展管理；
- 复杂 Cookie 管理；
- Execution Identity；
- Site-bound Profile；
- Resource Requirement；
- Capability Execution Context；
- Evidence Store。

## Harbor 的处理方式

Harbor 可以吸收其 Server Runtime 经验，但需要自建 WebEnvoy 特有语义层。
