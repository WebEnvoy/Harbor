# AdsPower-like Runtime 参考

Harbor 可以类比 AdsPower 这一类指纹浏览器 / Profile Runtime 产品，但不能停留在普通多账号浏览器心智上。

## 相似点

Harbor 需要具备类似能力：

- Profile 管理；
- 指纹配置；
- 代理配置；
- Cookie 和登录态持久化；
- 多账号隔离；
- 浏览器启动 / 停止；
- 人类用户可视化操作；
- 自动化 API；
- 批量操作能力；
- 后期可能的同步和团队能力。

## 差异点

Harbor 的中心对象不是 Profile，而是 Execution Identity。

Harbor 需要额外支持：

- Site-bound Profile；
- 资源需求声明；
- 能力执行上下文；
- 运行证据；
- Core-facing Runtime Contract；
- Agent 和自动化程序稳定调用。

## 产品心智

不建议只把 Harbor 表达为：

```text
多账号浏览器
账号矩阵工具
反检测浏览器
```

更合适的表达是：

```text
Agent-ready fingerprint browser
Execution Identity Browser
Profile Runtime for Website Automation
WebEnvoy Runtime 底座
```
