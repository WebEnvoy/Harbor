# ADR 待决策索引

本文件是 Harbor ADR 的唯一待决策索引。ADR 正文中的未决项必须引用这里的 ID。

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
