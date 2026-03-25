# MVP 后端执行说明（Leona）

- 时间：2026-03-14 UTC
- 角色：backend-leona
- 范围：仅定义办公控制台 MVP 后端执行口径，聚焦模板应用 blocker 收口后的可执行实现说明
- 依据：
  1. `contracts/2026-03-14-office-dashboard-api-contract.md`
  2. `reviews/2026-03-14-template-apply-advice-ryze.md`
  3. `reviews/2026-03-14-contract-alignment-leona.md`
  4. `reviews/2026-03-14-validation-acceptance-closure-galio.md`

---

## 1. 本轮收口结论

`POST /api/v1/config/templates/:id/apply` 的 MVP 实现口径已收口，不再把“模板应用底层写入命令面尚未确认”保留为悬空 blocker。

正式执行口径如下：

> 模板应用 = 将模板中允许覆盖的 agent 级白名单字段，写入 OpenClaw 配置中目标 `agents.list[]` 的指定 agent 条目；通过 `openclaw config set` 完成写入，并以 `openclaw config validate` 通过作为成功判据。

这意味着：
- **不等待**任何专用模板 RPC
- **不虚构** `templates.apply`、`config.applyTemplate`、`agents.update` 等命令
- **不直接手改** OpenClaw 内部私有运行时状态

---

## 2. apply 接口实现口径

### 2.1 接口
- 方法：`POST`
- 路径：`/api/v1/config/templates/:id/apply`
- 请求体：

```json
{
  "targetAgentId": "agent-backend-leona"
}
```

### 2.2 执行步骤
后端实现顺序固定为：

1. 读取本地 YAML 模板文件
2. 校验模板存在、元数据完整、`config` 结构合法
3. 校验 `targetAgentId` 存在
   - 可通过 `openclaw agents list`
   - 或 `openclaw config get agents.list`
4. 读取当前 `agents.list`
5. 定位目标 agent 条目
6. 仅对模板允许覆盖的白名单字段执行 merge / replace
7. 通过 `openclaw config set` 写回目标配置字段
8. 调用 `openclaw config validate`
9. 校验通过后返回成功
10. 任一步失败则返回失败，不得回执“已应用”

---

## 3. 白名单与非目标范围

### 3.1 MVP 允许覆盖字段
本轮按瑞兹顾问结论，先收口为以下白名单：
- `model`
- `skills`
- `identity`（仅当模板显式提供且 schema 支持时）

### 3.2 MVP 不允许覆盖
以下内容本轮明确不纳入模板应用：
- `workspace`
- `agentDir`
- `bindings`
- channel 级配置
- gateway 级配置
- 任意跨 agent 或根级全局配置

结论：

> MVP 模板应用只是一种 **agent 局部配置覆盖**，不是 OpenClaw 全局配置重写器。

---

## 4. 成功语义与错误语义

### 4.1 成功语义
`apply` 返回成功，表示以下条件同时成立：
- 模板合法
- 目标 Agent 存在
- 白名单字段已写入目标 `agents.list[]` 条目
- `openclaw config validate` 已通过

### 4.2 明确不承诺的内容
MVP 成功语义**不等于**：
- 当前所有存量会话已即时切换
- 所有运行态行为已强一致热更新

本轮正式口径：

> 成功 = 配置已更新并通过校验；运行时效果以 Gateway 热加载能力和后续新会话生效为准。

### 4.3 错误映射要求
- 模板不存在 → `TEMPLATE_NOT_FOUND`
- 目标 Agent 不存在 → `AGENT_NOT_FOUND`
- 模板结构非法 / YAML 非法 / 白名单外字段非法进入执行路径 → `TEMPLATE_INVALID`
- 配置写入失败或 `validate` 失败 → `TEMPLATE_APPLY_FAILED`
- 参数缺失 → `BAD_REQUEST`

---

## 5. blocker 状态更新

原 blocker：**模板应用底层写入命令面尚未确认**

本轮更新为：

> 已收口为可执行方案：采用 `openclaw config set + openclaw config validate` 对目标 `agents.list[]` 条目做白名单字段更新。

仍需保留的边界：
1. 不能假设存在专用模板 RPC
2. 不能假设存在 `openclaw agents update` 一类公开命令
3. 不能假设当前全部进行中会话即时生效
4. 不能把模板范围扩张到全局根配置覆盖

---

## 6. 实现注意事项（本轮仅文档化，不展开编码）

1. **写入通道唯一**：只能走官方配置 CLI，避免后门改写
2. **白名单先行**：先做模板字段裁剪，再进入写入
3. **validate 必须是成功门槛**：不能写完就回成功
4. **失败不得半成功**：任何一步失败都不能产生误导性成功态
5. **测试口径要与成功语义一致**：验证的是“配置已更新并通过校验”，而不是“旧会话全部即时切换”

---

## 7. 给后续开发/联调的最小提示

本轮已消化 blocker，但实现时仍需注意两类事项：
- 白名单字段的最终代码落点要与 contract 保持一致
- 若模板包含 `skills`，验证口径要允许“更稳妥地在新会话体现”，不要在验收中写成强制即时热切换

---

## 8. 交付状态
- [x] `apply` 接口底层写入口径已收口
- [x] 成功语义已明确
- [x] blocker 已从“未确认命令面”更新为“已收口可执行方案”
- [x] 保留边界已写明
- [ ] 具体编码实现
- [ ] 联调验证
