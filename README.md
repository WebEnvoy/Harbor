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

## 组织级文档

完整仓库地图、跨仓关系和许可证边界由 `WebEnvoy/.github` 维护：

- [仓库地图](https://github.com/WebEnvoy/.github/blob/main/docs/repository-map.md)
- [许可证边界](https://github.com/WebEnvoy/.github/blob/main/docs/licensing.md)

## 状态

项目处于初始化阶段，接口、模块边界和产品形态仍在收敛中。

## 许可证

本仓库采用 GNU Affero General Public License v3.0。
