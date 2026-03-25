# 模板应用 blocker 收口说明（Leona）

- 时间：2026-03-14 UTC
- 角色：backend-leona
- 目的：说明本轮如何消化“模板应用底层写入命令面尚未确认”这个 blocker，并记录剩余实现注意事项

---

## 1. 收口结论

本轮已依据 `reviews/2026-03-14-template-apply-advice-ryze.md`，将模板应用 blocker 从“命令面未知”收口为“可执行方案已明确”。

最终口径：

> `POST /api/v1/config/templates/:id/apply` 在 MVP 中不等待专用模板 RPC，而是通过 `openclaw config set` + `openclaw config validate`，对目标 `agents.list[]` 条目执行白名单字段更新。

这次收口后，blocker 不再是“有没有一条神秘写命令”，而变成了明确可执行的实现约束。

---

## 2. 本轮具体消化动作

### 2.1 回写 API contract
已将 contract 中原先“模板应用底层写入命令面尚待确认”的开放项，更新为已收口实现口径，明确：
- 写入目标是 `agents.list[]` 中的指定 agent 条目
- 写入通道是官方配置 CLI
- 成功条件包含 `openclaw config validate` 通过
- 模板应用成功不等于当前全部会话即时切换

### 2.2 回写后端执行说明
已新增后端执行说明，明确：
- 固定执行顺序
- 白名单字段范围
- 错误映射口径
- blocker 已更新为“已收口可执行方案”

---

## 3. 仍需保留的边界

本轮没有放大结论，以下边界仍必须保留：
1. 不能虚构 `templates.apply`、`config.applyTemplate`、`agents.update` 等不存在命令
2. 不能绕过官方 CLI 直接改写私有运行时状态
3. 不能承诺当前所有进行中会话即时强一致切换
4. 不能把模板应用扩展成根级全局配置覆盖

---

## 4. 剩余实现注意事项

虽然 blocker 已消化，但实现时还需注意：
- 白名单字段最终代码实现必须与文档一致，不可无边界扩写
- `validate` 必须作为成功门槛，而不是附加日志动作
- 若模板包含 `skills`，验收时要按“配置已更新并通过校验 / 新会话更稳妥生效”的语义编写用例
- 错误映射要确保模板非法、目标不存在、写入失败三类错误可分辨

---

## 5. 本轮交付物
- 已更新：`contracts/2026-03-14-office-dashboard-api-contract.md`
- 已更新：`handoffs/2026-03-14-mvp-backend-execution-leona.md`
- 已新增：`reviews/2026-03-14-template-apply-blocker-closure-leona.md`
