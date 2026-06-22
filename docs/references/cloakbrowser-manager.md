# CloakBrowser-Manager 参考

外部项目调研不再在 Harbor public docs 中维护。

Harbor 只保留已经采纳的设计结论。CloakBrowser-Manager 的详细调研、对比和决策候选统一沉淀在 `WebEnvoy/research`。

当前 Harbor 设计中已经吸收的稳定结论包括：

- Server Runtime、Docker、CDP endpoint、VNC / noVNC 和 Session API 值得参考；
- CloakBrowser-Manager 不作为 Harbor 的直接运行时依赖；
- Harbor 不应绑定单一浏览器 provider；
- VNC / noVNC 可后置，不作为 P0 硬前提。
