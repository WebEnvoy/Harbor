# 仓库指南

## 项目结构与模块组织

本仓库是 `WebEnvoy/Harbor`，负责 Profile Runtime、Execution Identity、Runtime Session、Browser Drivers、CDP / VNC、Evidence 和 Runtime API。当前文档位于 `README.md` 和 `docs/`；后续代码建议按以下方向组织：`packages/runtime-api/` 放 Runtime API，`packages/profile-manager/`、`packages/identity-manager/`、`packages/session-manager/` 放核心对象，`packages/browser-drivers/` 放 chrome、cloakbrowser、camoufox、wayfern、remote-cdp 等 driver，`packages/evidence-store/` 放证据存储，`examples/` 放启动示例。

## 构建、测试与开发命令

当前尚未初始化 `package.json`。新增工程脚手架后，优先统一为：`pnpm install` 安装依赖，`pnpm build` 构建，`pnpm test` 运行测试，`pnpm lint` 检查风格，`pnpm typecheck` 做类型检查。涉及浏览器 driver 的 smoke test 应提供独立命令，例如 `pnpm test:drivers`。

## 代码风格与命名规范

默认主语言为 TypeScript / Node.js。浏览器自动化优先基于 Playwright / CDP，存储默认 SQLite。目录和包名使用小写短横线，例如 `browser-drivers`、`evidence-store`；核心模型使用 `Profile`、`ExecutionIdentity`、`RuntimeSession`、`RunEvidence` 等明确命名。不要把某个浏览器 provider 的专有参数泄漏成 Harbor 核心模型。

## 测试指南

测试应覆盖 typecheck、lint、unit tests、Runtime API contract tests、storage schema validation 和 browser driver smoke tests。测试文件建议使用 `*.test.ts` 或 `*.spec.ts`。Driver 测试必须明确是否需要本地浏览器、Docker 或远程 CDP，不能假设开发机已有同一环境。

## 提交与 Pull Request 规范

提交信息使用 Conventional Commits，例如 `docs: refine browser driver model`、`feat: add runtime session API`。PR 需要说明影响的核心对象、API 变化、验证命令和是否涉及本地敏感状态。涉及 VNC、CDP、Cookie、Profile 或 Evidence 的改动，必须说明数据边界和默认行为。

## 架构与 Agent 专项说明

Harbor 不理解具体站点业务，也不执行 Lode 任务封装。它只向 WebEnvoy Core 提供可执行 session、Profile / Identity 状态、资源约束、CDP / VNC 信息、Evidence 策略和 Runtime 错误。Browser Driver 只负责启动、连接、配置和返回 session，不承载站点能力逻辑。

## 安全与配置说明

默认最小暴露运行证据。不要提交真实凭据、会话状态、未脱敏执行现场或用户业务数据。涉及本地加密、进程守护、低层代理或沙箱时，可以讨论 Rust / Go 等系统语言，但必须先更新设计文档。

## 许可证边界说明

本仓库属于 AGPL 核心仓库，承载 Runtime Server、Profile、Execution Identity、Browser Drivers、Evidence 和正式运行时能力。面向外部集成的 Runtime API schema、client types、client SDK、OpenAPI 或生成模型，应优先评估是否放入未来的 `contracts` 或 SDK 类 MIT / Apache-2.0 仓库，不应默认进入 Harbor 的 AGPL 核心代码路径。
