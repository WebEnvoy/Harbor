# Harbor

Harbor 是 WebEnvoy 的 Agent-ready 指纹浏览器 / Profile Runtime。

它提供 Profile、Execution Identity、Runtime Session、CDP / VNC、Evidence 和 Runtime API，既可以被人类用户直接使用，也可以作为 WebEnvoy Core 执行站点能力时依赖的浏览器底座。

## 仓库角色

Harbor 负责：

- Profile 与浏览器身份容器管理；
- Execution Identity 与站点账号状态管理；
- 浏览器会话、CDP、VNC / noVNC 和人工接管；
- 代理、Cookie、扩展和指纹配置；
- 运行证据记录；
- 面向 WebEnvoy Core、Agent 和自动化程序的 Runtime API。

## 文档

- [定位](docs/positioning.md)
- [架构](docs/architecture.md)
- [Profile 与 Execution Identity 模型](docs/profile-identity-model.md)
- [Browser Drivers](docs/browser-drivers.md)
- [Evidence Store](docs/evidence-store.md)
- [AdsPower-like Runtime 参考](docs/references/adspower-like-runtime.md)
- [DonutBrowser 参考](docs/references/donutbrowser.md)
- [CloakBrowser-Manager 参考](docs/references/cloakbrowser-manager.md)

## 相关仓库

- `WebEnvoy/WebEnvoy`：站点能力执行与编排层，包含 Core、API Server、SDK、CLI、MCP 和 Console；
- `WebEnvoy/Lode`：站点知识、站点能力、任务封装与模板资产库；
- `WebEnvoy/research`：组织级研究、调研、对比和决策候选仓库；
- `WebEnvoy/.github`：组织主页、issue 模板、PR 模板和社区配置。

## 状态

项目处于初始化阶段，接口、模块边界和产品形态仍在收敛中。

## 许可证

本仓库采用 GNU Affero General Public License v3.0。
