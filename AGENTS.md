# 仓库指南

## 项目结构与模块组织

本仓库是 `WebEnvoy/Harbor`，负责 Profile Runtime、Execution Identity、Runtime Session、Browser Drivers、CDP / VNC、Evidence 和 Runtime API。当前文档位于 `README.md` 和 `docs/`；后续代码建议按以下方向组织：`packages/runtime-api/` 放 Runtime API，`packages/profile-manager/`、`packages/identity-manager/`、`packages/session-manager/` 放核心对象，`packages/browser-drivers/` 放 chrome-official、cloakbrowser、camoufox、remote-cdp 等 driver，`packages/evidence-store/` 放证据存储，`examples/` 放启动示例。

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

## 路线图 / 里程碑 / 功能需求 / 工作项

- 跨仓长期方向以 `WebEnvoy/.github/ROADMAP.md` 为准。
- 当前执行状态以 GitHub Milestones、Project、issues 和 PR 为准，不在仓库文档中复制维护。
- GitHub Milestone 只承载当前 1-3 个可交付阶段，不承载全部远期设想。
- 功能需求（FR）issue 表达用户可见或系统可验证的能力增量。
- 工作项（Work Item）issue 是可由一个 PR 完成的最小执行单元。
- 新建功能需求或工作项前，先确认它属于当前活跃 Milestone；不属于则回到总 ROADMAP 或 backlog。
- 创建或调整 Milestone、功能需求或工作项前，先检查本仓 `docs/adr/pending-decisions.md`；会阻塞当前事项的决策必须链接到 issue，并标明阻塞级别：`Milestone blocker`、`FR blocker`、`Work Item blocker`、`Spec detail` 或 `Deferred`。
- 被决策阻塞的 issue 使用 `status: needs-decision`；决策完成后必须回写对应 ADR 或 `docs/adr/pending-decisions.md`，再继续拆分或实施。
- 仓库级 `ROADMAP.md` 是组织级 ROADMAP 的本仓投影，只能说明本仓如何服务总路线，不能新增跨仓阶段、重定义目标状态或覆盖组织级边界。
- 除仓库级 `ROADMAP.md` 外，单仓 planning 文档只能解释本仓如何服务当前活跃 Milestone，不能新增跨仓 Milestone。
- 不允许在单仓创建与总 ROADMAP 冲突的平行路线图。
- 规格文档只服务当前或下一个活跃 Milestone，不提前铺满远期设计。
- 涉及跨仓方向、阶段阶梯或边界调整时，先更新或评审总 ROADMAP / 跨仓架构，再拆单仓事项。

## 安全与配置说明

默认最小暴露运行证据。不要提交真实凭据、会话状态、未脱敏执行现场或用户业务数据。涉及本地加密、进程守护、低层代理或沙箱时，可以讨论 Rust / Go 等系统语言，但必须先更新设计文档。

## 许可证边界说明

本仓库属于 AGPL 核心仓库，承载 Runtime Server、Profile、Execution Identity、Browser Drivers、Evidence 和正式运行时能力。面向外部集成的 Runtime API schema、client types、client SDK、OpenAPI 或生成模型，应优先评估是否放入未来的 `contracts` 或 SDK 类 MIT / Apache-2.0 仓库，不应默认进入 Harbor 的 AGPL 核心代码路径。

<!-- LOOM_BOOTSTRAP_START -->
## Loom Bootstrap

本仓库采用 Loom 来管理 agent 执行流程、工作事实载体、review、merge-ready 和 closeout；开始实现、review、merge-ready 或 closeout 前，先完成以下 bootstrap 检查。

1. 检查 `.loom/installed-state.json`。
2. 若本机没有 `loom`，执行：
   `npm install -g @mc-and-his-agents/loom`
3. 运行：
   `loom doctor --target . --json`
4. 若 Codex Loom plugin 缺失，执行：
   `loom host install --host codex --scope user --apply --json`
   `loom host register --host codex --scope user --apply --json`
5. 重新运行：
   `loom doctor --target . --json`

不要把 Loom runtime、plugin 或 skills payload 写入仓库；它们属于用户级全局安装。
<!-- LOOM_BOOTSTRAP_END -->
