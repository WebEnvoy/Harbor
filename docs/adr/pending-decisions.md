# ADR 待决策索引

本文件是 Harbor ADR 的唯一待决策索引。ADR 正文中的未决项必须引用这里的 ID。

## 第一阶段真相源边界收口

本节收口 GitHub issues #8、#9、#16、#17、#18、#19 的第一阶段边界判断。来源为 2026-06-30 回读的 issue 正文、[Harbor 路线图](../../ROADMAP.md)、[0002. Profile、Session 与 Provider 事实](0002-profile-session-and-provider-facts.md)、[0003. 本地 Chrome 与远程浏览器边界](0003-local-chrome-vs-remote-browser-boundary.md)、[0004. Snapshot、RefMap 与证据捕获](0004-snapshot-refmap-and-evidence-capture.md) 以及 `docs/draft/` 下的现有草稿。

| 对象/事实 | 本仓归属 | 非本仓归属 | 消费方 | 依据 | 状态 |
|---|---|---|---|---|---|
| Profile facts | Harbor 记录持久浏览器身份容器、storage/profile ref、proxy、locale、timezone、user agent、extensions、运行状态和健康事件。 | 不拥有 Core Run Record、Lode resource requirement、App UI 状态或真实凭据明文。 | Core、App、Lode resource requirements。 | ADR 0002；`docs/draft/profile-identity-model.md`；`docs/draft/runtime-capability-facts.md`。 | accepted |
| Execution Identity facts | Harbor 记录 `site_id`、`account_ref`、关联 Profile、login state、allowed execution channels、risk/recovery events、usage history 和 evidence policy ref。 | 不判断任务业务成功，不定义 normalized result，不保存 Lode capability schema。 | Core admission、App Browser 表面、Lode resource requirements。 | ADR 0002；`docs/draft/profile-identity-model.md`；`docs/draft/resource-lifecycle.md`。 | accepted |
| Runtime Session facts | Harbor 记录 session ref、provider/profile/identity refs、CDP/Viewer/Snapshot/Evidence 可用性、lease/resource trace refs、错误状态和 control facts。 | Core 拥有 task/run 状态机、admission、unknown outcome 和 Run Record；App 只展示和发送用户意图。 | Core、App、Agent/CLI/API。 | ADR 0002；ADR 0003；`docs/draft/resource-lifecycle.md`。 | accepted |
| Provider facts | Harbor/Browser Driver 生产 provider type、engine、local/remote mode、profile/CDP/viewer/snapshot/evidence capabilities、limitations、license/binary boundary 和 validation evidence refs。 | 不输出 provider 排名、站点通过率承诺、黑盒风险分或 provider-specific launch flags 作为公共 contract。 | Core resource matching、App provider health 展示、Lode requirement matching。 | ADR 0002；ADR 0003；`docs/draft/browser-drivers.md`；research synthesis。 | accepted |
| Provider claims and secrets | Harbor 只能把 provider claim 标记为 claim，并用 validation evidence ref 区分；secrets、tokens、raw provider credentials 不进入公共 facts。 | 不把 README/marketing claim 当成 WebEnvoy capability evidence，不默认再分发 provider binary。 | Core/App 只能消费脱敏 facts 或 refs。 | ADR 0002；research `anti-detection-and-provider-facts`。 | rejected |
| Snapshot refs | Harbor 按 Runtime Session 和 evidence policy 生成页面观察 artifact refs，可包括 DOM、AX tree、semantic text、simplified HTML 或 provider-native snapshot metadata。 | 不属于 Lode normalized result、collection/comment/dataset schema 或站点业务字段。 | Core action/extraction context、App evidence/browser view、Lode authoring。 | ADR 0004；`docs/draft/evidence-store.md`。 | accepted |
| RefMap refs | Harbor 生成绑定 session、page/frame、snapshot generation 和 navigation state 的临时元素引用，负责解析、stale-ref error 或要求 resnapshot。 | 不保证跨站点版本稳定，不作为业务 locator 或 Lode schema。 | Core action execution、Lode authoring、App debug view。 | ADR 0004；research `execution-space-and-context`。 | accepted |
| Evidence refs and source trace | Harbor 按 evidence policy 捕获、脱敏、存储并暴露 screenshot/network/console/trace/raw payload/diagnostic refs 与 provenance；Core 只把 refs 写入 Run Record。 | Core 不复制完整 Harbor evidence store；默认不上传 cookies、tokens、credentials、完整 storage、完整 DOM、完整 bodies、完整 screenshots、HAR、video 或 trace。 | Core Run Record、App evidence view、debug/closeout evidence。 | ADR 0004；`docs/draft/evidence-store.md`；research `evidence-and-observability`。 | accepted |
| Sensitive evidence by default | 默认不持久化或上传高敏 runtime material；需要显式 policy、retention、redaction 和 export 边界。 | 不把 ring buffer、raw logs、provider public endpoint 或 unredacted artifacts 当正式 evidence。 | Core/App 只能消费 policy 允许的 refs。 | ADR 0004；`docs/draft/evidence-store.md`。 | rejected |
| Viewer facts | Harbor 暴露 viewer ref/ws、transport type、access boundary、clipboard/input capability、provider limitations 和 control owner hint。 | 不直接裸露内部 VNC/CDP endpoint 给所有上层，不把 live viewer 等同完整 recovery。 | App Browser/Viewer、Core run record refs、用户接管流程。 | ADR 0003；research `human-handoff-and-recovery`。 | accepted |
| Handoff and control ownership facts | Harbor 记录 runtime control owner、handoff capability、user-control state、pause/lock capability 和恢复所需 runtime facts。 | Core 拥有 run-level pause/resume/unknown outcome/reconciliation；App 拥有用户可见审批、接管和反馈 UI。 | Core、App、用户。 | ADR 0003；research `human-handoff-and-recovery`。 | accepted; PD-0010 blocks detailed state machine |

阶段一 closeout 可直接消费上表。后续字段集、API schema、provider validation packet、Snapshot/RefMap contract、retention/encryption、trace/HAR/video 开启策略、stale RefMap 错误语义和 handoff 状态机仍保留为下列非本轮阻塞项：PD-0003、PD-0004、PD-0005、PD-0006、PD-0007、PD-0008、PD-0009、PD-0010、PD-0011、PD-0012、PD-0013、PD-0014、PD-0015、PD-0016、PD-0017。

| Issue | 本节覆盖 |
|---|---|
| #8 | Profile、Execution Identity、Runtime Session 与 Provider facts 的 Harbor truth source 边界。 |
| #9 | Snapshot、RefMap、Evidence refs、Viewer、handoff 和 control ownership facts 的 Harbor truth source 边界。 |
| #16 | Profile / Execution Identity / Runtime Session 三行。 |
| #17 | Provider facts 与 Provider claims and secrets 两行。 |
| #18 | Snapshot refs、RefMap refs、Evidence refs and source trace、Sensitive evidence by default 四行。 |
| #19 | Viewer facts、Handoff and control ownership facts 两行。 |

## PD-0001

- 问题：ADR 被接受后，版本化 Runtime API schema 应放在哪里？
- 来源 ADR：[0001. 记录架构决策](0001-record-architecture-decisions.md)
- 阻塞什么：后续 Runtime API schema 的仓库归属；不阻塞 ADR 0001 成立。
- 当前状态：后续决策。
- 后续归属/下一步：Harbor 进入 API schema 草案时决定。

## PD-0002

- 问题：已接受 ADR 后续是否需要 owner 字段，还是 Git 历史已经足够？
- 来源 ADR：[0001. 记录架构决策](0001-record-architecture-decisions.md)
- 阻塞什么：ADR 维护流程细化；不阻塞 ADR 0001 成立。
- 当前状态：后续决策。
- 后续归属/下一步：ADR 数量增长或多人维护时再评估。

## PD-0003

- 问题：provider/profile/session/evidence facts 的首版版本化字段集是什么？
- 来源 ADR：[0002. Profile、Session 与 Provider 事实](0002-profile-session-and-provider-facts.md)
- 阻塞什么：首版 Harbor facts schema。
- 当前状态：草案待决策。
- 后续归属/下一步：Runtime API schema 草案中定义。

## PD-0004

- 问题：哪些 health states 可以被 Core 用于只读、写入和恢复任务准入？
- 来源 ADR：[0002. Profile、Session 与 Provider 事实](0002-profile-session-and-provider-facts.md)
- 阻塞什么：Core admission 与 Harbor resource health 对齐。
- 当前状态：草案待决策。
- 后续归属/下一步：Core admission 与 Harbor resource lifecycle 联合决策。

## PD-0005

- 问题：最小 provider validation evidence 格式是什么？
- 来源 ADR：[0002. Profile、Session 与 Provider 事实](0002-profile-session-and-provider-facts.md)
- 阻塞什么：provider facts 的可审阅证据格式。
- 当前状态：草案待决策。
- 后续归属/下一步：provider registry 或 provider evaluation ADR 中定义。

## PD-0006

- 问题：typing cadence 这类行为层 facts 属于 Harbor helper facts、Core action policy，还是 Lode capability requirements？
- 来源 ADR：[0002. Profile、Session 与 Provider 事实](0002-profile-session-and-provider-facts.md)
- 阻塞什么：行为层自动化事实的归属边界。
- 当前状态：草案待决策。
- 后续归属/下一步：Core action policy 或 Lode resource requirement 决策时处理。

## PD-0007

- 问题：启用 provider 前，哪些 provider license 和 binary facts 必须存在？
- 来源 ADR：[0002. Profile、Session 与 Provider 事实](0002-profile-session-and-provider-facts.md)
- 阻塞什么：provider enablement gate。
- 当前状态：草案待决策。
- 后续归属/下一步：provider evaluation 模板中定义。

## PD-0008

- 问题：第一阶段实现应先支持 `local_dedicated_profile`、`remote_browser_session`，还是两者都支持？
- 来源 ADR：[0003. 本地 Chrome 与远程浏览器边界](0003-local-chrome-vs-remote-browser-boundary.md)
- 阻塞什么：Harbor runtime MVP provider 顺序。
- 当前状态：草案待决策。
- 后续归属/下一步：首版 runtime implementation plan 中决定。

## PD-0009

- 问题：使用 `local_user_chrome` 前需要哪种精确用户授权？
- 来源 ADR：[0003. 本地 Chrome 与远程浏览器边界](0003-local-chrome-vs-remote-browser-boundary.md)
- 阻塞什么：local user Chrome provider 的启用条件。
- 当前状态：草案待决策。
- 后续归属/下一步：App approval 与 Harbor provider policy 决策时定义。

## PD-0010

- 问题：用户控制期间 Harbor 应如何 lock 或 pause automation？
- 来源 ADR：[0003. 本地 Chrome 与远程浏览器边界](0003-local-chrome-vs-remote-browser-boundary.md)
- 阻塞什么：handoff control ownership 状态机。
- 当前状态：草案待决策。
- 后续归属/下一步：handoff/recovery ADR 中定义。

## PD-0011

- 问题：哪些 remote session TTL、persistence、file 和 download facts 是必需字段？
- 来源 ADR：[0003. 本地 Chrome 与远程浏览器边界](0003-local-chrome-vs-remote-browser-boundary.md)
- 阻塞什么：remote browser provider facts schema。
- 当前状态：草案待决策。
- 后续归属/下一步：remote browser driver schema 草案中定义。

## PD-0012

- 问题：Viewer 支持应先从本地浏览器窗口、noVNC-style remote viewer，还是两者开始？
- 来源 ADR：[0003. 本地 Chrome 与远程浏览器边界](0003-local-chrome-vs-remote-browser-boundary.md)
- 阻塞什么：App/Harbor viewer MVP。
- 当前状态：草案待决策。
- 后续归属/下一步：Viewer MVP 决策中定义。

## PD-0013

- 问题：第一版 Snapshot/RefMap contract 应是 AX-first、DOM-first、semantic text，还是 provider-native？
- 来源 ADR：[0004. Snapshot、RefMap 与证据捕获](0004-snapshot-refmap-and-evidence-capture.md)
- 阻塞什么：Snapshot/RefMap 首版 contract。
- 当前状态：草案待决策。
- 后续归属/下一步：Snapshot/RefMap contract ADR 或 schema 草案中定义。

## PD-0014

- 问题：第一版 Harbor API 必须包含哪些 evidence refs？
- 来源 ADR：[0004. Snapshot、RefMap 与证据捕获](0004-snapshot-refmap-and-evidence-capture.md)
- 阻塞什么：Evidence Store 与 Runtime API 首版字段。
- 当前状态：草案待决策。
- 后续归属/下一步：Evidence Store schema 草案中定义。

## PD-0015

- 问题：本地 evidence 的默认 retention 和 encryption 规则是什么？
- 来源 ADR：[0004. Snapshot、RefMap 与证据捕获](0004-snapshot-refmap-and-evidence-capture.md)
- 阻塞什么：本地 evidence 存储安全默认值。
- 当前状态：草案待决策。
- 后续归属/下一步：Evidence Store policy 决策中定义。

## PD-0016

- 问题：Playwright trace/HAR/video 应在什么情况下开启，由谁请求？
- 来源 ADR：[0004. Snapshot、RefMap 与证据捕获](0004-snapshot-refmap-and-evidence-capture.md)
- 阻塞什么：高敏 evidence capture policy。
- 当前状态：草案待决策。
- 后续归属/下一步：Evidence policy 或 Core request policy 中定义。

## PD-0017

- 问题：stale RefMap failures 应如何表达，才能让 Core 安全 retry 或 resnapshot？
- 来源 ADR：[0004. Snapshot、RefMap 与证据捕获](0004-snapshot-refmap-and-evidence-capture.md)
- 阻塞什么：Core 使用 RefMap 的错误处理 contract。
- 当前状态：草案待决策。
- 后续归属/下一步：Snapshot/RefMap error contract 中定义。
