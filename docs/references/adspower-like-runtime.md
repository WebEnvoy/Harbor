# AdsPower-like Runtime 参考

外部项目和产品形态调研不再在 Harbor public docs 中维护。

Harbor 只保留已经采纳的 Runtime、Profile、Execution Identity、Browser Drivers 和 Evidence 设计结论。组织级调研材料统一沉淀在 `WebEnvoy/research`。

当前 Harbor 设计中已经吸收的稳定结论包括：

- Harbor 应具备 Profile Browser / Runtime 产品能力；
- Harbor 不应只是普通 Profile Manager；
- Harbor 需要补充 WebEnvoy 特有的 Execution Identity、Site-bound Profile、Resource Requirement、Capability Execution Context 和 Evidence Store；
- 浏览器 provider 应通过 Browser Driver 抽象接入。
