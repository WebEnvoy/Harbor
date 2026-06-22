# DonutBrowser 参考

外部项目调研不再在 Harbor public docs 中维护。

Harbor 只保留已经采纳的设计结论。DonutBrowser 的详细调研、对比和决策候选统一沉淀在 `WebEnvoy/research`。

当前 Harbor 设计中已经吸收的稳定结论包括：

- Profile 管理、分组、代理、Cookie、扩展和浏览器启动体验值得参考；
- DonutBrowser 不作为 Harbor 的直接运行时依赖；
- Wayfern / Camoufox 等浏览器供应链不应绑定进 Harbor 核心模型；
- Profile 不等于 WebEnvoy 的 Execution Identity。
