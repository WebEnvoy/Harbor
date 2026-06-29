# Harbor 路线图

本文是 `WebEnvoy/.github/ROADMAP.md` 的 Harbor 仓库级投影。若本文与组织级 ROADMAP 冲突，以组织级 ROADMAP 为准。

本文用于指导 Harbor GitHub Milestone 的创建和排序，不维护当前 issue、PR 或执行看板。

## 本仓职责

Harbor 负责 Profile、Execution Identity、Runtime Session、browser provider、Snapshot、RefMap、Evidence refs、Viewer / handoff facts 和运行现场事实。

Harbor 不判断任务业务成功，不拥有 Lode schema 或 Core Run Record。

## 路线原则

- GitHub Milestone 必须能映射到本文的阶段路线和组织级 ROADMAP。
- Harbor 可以在对外 runtime facts 合同稳定后独立加速实现，不要求 Core、Lode 和 App 同步进入同一阶段。
- provider、Profile Browser 或外部项目机制可以作为实现加速来源，但不能反向污染 Harbor 核心模型。
- Core 和 App 只消费 Harbor 对外 facts，不消费 provider 内部概念。
- 涉及当前 milestone 的 pending decision 必须先在 `docs/adr/pending-decisions.md` 标明阻塞级别。

## 阶段路线

### 组织阶段一投影：边界清晰

Harbor 明确自己是浏览器身份、运行现场和证据引用的事实源，不是站点能力解释器或任务编排器。

可创建 milestone 的主题：

- Harbor 边界和 ADR 治理。
- Profile / Session / Provider facts ownership。

### 组织阶段二投影：合同可执行

Harbor 的第一优先级是提供 Core 能消费的 runtime facts、session refs、snapshot refs 和 evidence refs。

可创建 milestone 的主题：

- Runtime Session lifecycle contract v0。
- Provider / Profile / Identity facts v0。
- Snapshot / RefMap contract v0。
- Evidence refs 和 viewer / handoff facts v0。

阶段二完成前，不应把某个 provider manager 或 Profile Browser 实现写成 Core 稳定依赖。

### 组织阶段三投影：运行底座可实现

Harbor 可以在合同层稳定后推进实现加速，包括 Profile Browser、provider adapter 和本地/远程 session 管理。

可创建 milestone 的主题：

- local dedicated profile runtime。
- provider adapter v0。
- Profile Browser MVP。
- 外部 Profile Browser / provider manager 机制吸收评估。

源码复用只有在 license、数据边界和核心模型隔离通过后才进入 milestone。

### 组织阶段四投影：运行可恢复

Harbor 提供可观察、可接管、可恢复的运行现场事实，并维护控制权归属。

可创建 milestone 的主题：

- Viewer / takeover control ownership。
- handoff / resume facts。
- stale RefMap、session loss 和 evidence unavailable 表达。

### 组织阶段五投影：产品可操作

Harbor 为 App 的 Browser 表面提供稳定数据和操作入口，但不成为独立任务产品。

可创建 milestone 的主题：

- Browser identities / profiles query。
- Runtime sessions / viewer entry。
- provider facts 和 health state 展示支持。

### 组织阶段六投影：生态可扩展

Harbor 支持更多 provider、远程 runtime 和团队环境，同时保持 facts contract 稳定。

可创建 milestone 的主题：

- remote runtime / server mode。
- multi-provider compatibility。
- evidence retention / encryption policy hardening。

## 不进入 Harbor 路线图

- Core Run Record、Result Envelope、Admission 和任务业务成功判断。
- Lode capability package、schema、fixtures 和 normalizer。
- App Shell 和业务 UI truth。
- 账号运营、内容策略、广告投放、CRM 或业务决策。

## Milestone 创建检查

创建 Harbor milestone 前必须确认：

- 对应组织级 ROADMAP 阶段。
- 对应的 Harbor 阶段路线主题。
- 是否对 Core、Lode 或 App 暴露新 facts contract。
- 是否有 `Milestone blocker` 或 `FR blocker` pending decision。
- provider 专有概念是否被隔离在 adapter 层。
