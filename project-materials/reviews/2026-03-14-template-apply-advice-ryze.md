# 模板应用底层写入口径顾问结论（Ryze）

- 角色：technical-advisor-codex / 瑞兹
- 日期：2026-03-14 UTC
- 任务性质：技术顾问判断，不直接改 contract、不直接改后端实现
- 目标：为 `POST /api/v1/config/templates/:id/apply` 收口 MVP 阶段最小可行写入口径，明确可做/不可假设边界

---

## 0. 说明与取材边界

本轮按要求优先读取项目材料；其中用户点名的 2 个文件在当前项目目录中未找到：

1. `handoffs/2026-03-14-mvp-backend-execution-leona.md` **不存在**
2. `reviews/2026-03-14-mvp-acceptance-checklist-galio.md` **不存在**

为避免停在空缺文件上，本轮补充参考了当前实际存在、且与 blocker 直接相关的材料：

- `reviews/2026-03-14-contract-alignment-leona.md`
- `reviews/2026-03-14-backend-fix-validation-leona.md`
- `reviews/2026-03-14-validation-acceptance-closure-galio.md`

另外，为判断 OpenClaw 当前真实命令面，本轮核对了实际 CLI/文档能力，重点包括：

- `openclaw help`
- `openclaw gateway --help`
- `openclaw gateway call --help`
- `openclaw config --help`
- `openclaw config set --help`
- `openclaw config validate --help`
- `openclaw agents --help`
- 文档：Configuration / Configuration Reference / Channel Routing / Agent Workspace

---

## 1. 先给结论

### 1.1 当前 OpenClaw **可确认、推荐的模板应用写入口径**

**结论：MVP 阶段不应继续等待一个“专门的模板应用 RPC/CLI 命令”。当前更可行、也更符合 OpenClaw 现实能力的写入口径，是：**

> **把模板应用收口为“对 OpenClaw 配置（`~/.openclaw/openclaw.json`）中目标 `agents.list[]` 条目的受控更新”，通过 `openclaw config set` / `openclaw config validate` 这一组官方 CLI 完成写入与校验。**

原因：
1. 当前可确认的 Gateway `call` 命令面帮助只明确展示了 `health/status/system-presence/cron.*` 一类方法；**没有证据表明存在现成的 `config.applyTemplate`、`agents.update`、`templates.apply` 之类 RPC**。
2. `openclaw config` 是当前已公开、稳定、面向配置写入的**一等 CLI**：
   - `openclaw config get`
   - `openclaw config set`
   - `openclaw config unset`
   - `openclaw config validate`
3. 官方文档明确：
   - 配置位于 `~/.openclaw/openclaw.json`
   - Gateway 监听配置变更并执行 hot reload / hybrid reload
   - 配置必须严格通过 schema 校验，否则 Gateway 拒绝启动/应用
4. `openclaw agents` 当前公开的是 `add/bind/list/delete/set-identity/...`；**没有公开“任意覆盖 agent 配置体”的写命令**。

因此，对这个项目的 blocker，最稳妥的顾问建议不是去“猜”一条不存在的 Gateway 写命令，而是：

> **把模板应用定义为：后端把模板内容投影到目标 agent 的配置字段，然后调用 OpenClaw 配置 CLI 完成原子更新与校验。**

---

## 2. MVP 阶段 `POST /api/v1/config/templates/:id/apply` 的最小可行实现方案

## 2.1 推荐的最小闭环定义

`POST /api/v1/config/templates/:id/apply` 在 MVP 中应被定义为：

> **“将模板中允许覆盖的 agent 级配置字段，写入目标 `agents.list[]` 中指定 `id` 的 agent 条目；写入成功并通过 `openclaw config validate` 后，视为模板应用成功。”**

### 2.2 最小执行流程

建议后端执行顺序固定为：

1. **读取模板文件**（项目本地 YAML）
2. **校验模板元数据与配置结构**
3. **校验目标 Agent 存在**
   - 可用 `openclaw agents list`
   - 或 `openclaw config get agents.list`
4. **读取当前 `agents.list`**
5. **定位目标 agent 条目**
6. **仅对允许覆盖字段做受控 merge / replace**
7. **通过 `openclaw config set <path> <value>` 写回目标字段**
8. **执行 `openclaw config validate`**
9. **若校验通过，则返回 apply 成功**
10. **若校验失败，则返回 `TEMPLATE_APPLY_FAILED` 或 `TEMPLATE_INVALID`，且不得报告成功**

### 2.3 MVP 建议的“允许覆盖字段”范围

为了降低风险，MVP 不要把模板设计成“可写任意 OpenClaw 配置”。建议只允许覆盖目标 agent 条目中的**白名单字段**：

- `model`
- `identity`（如确有需要）
- `skills`（若项目模板明确要驱动 skill 组合）
- 其他经 Jax/Leona 明确确认属于 agent 级、且 schema 已支持的字段

**MVP 不建议覆盖：**
- `workspace`
- `agentDir`
- `bindings`
- channel 级配置
- gateway 级配置
- 任何跨 agent / 全局路由配置

也就是说：

> **模板应用 = agent 局部配置覆盖；不是全局 OpenClaw 配置重写器。**

### 2.4 成功语义建议

MVP 阶段“模板真实生效”的口径建议收口为两层：

#### A. 合同层成功（MVP 必做）
满足以下条件即可返回成功：
- 模板合法
- 目标 agent 存在
- 配置写入成功
- `openclaw config validate` 通过

#### B. 运行层生效（MVP 可声明为“尽力而为/下一次新会话生效”）
由于 OpenClaw 的部分配置/技能/会话快照可能在**下一次新 session**才完全体现，MVP 不宜把“当前已有会话即时切换全部行为”作为成功判据。

因此建议 contract/执行说明里明确：

> 模板应用成功表示“目标 agent 的配置已被更新并通过 OpenClaw 校验”；运行时效果以 Gateway 热重载能力和后续新会话生效为准，不承诺对当前进行中的会话做强一致即时替换。

这比声称“立刻 100% 改变当前 agent 所有运行态行为”更真实，也更不容易误导测试与用户。

---

## 3. 哪些动作可以做，哪些动作不能假设

## 3.1 当前**可以做**的动作（有依据）

### 可以做 1：通过官方 CLI 读写 OpenClaw 配置
已确认存在：
- `openclaw config get`
- `openclaw config set`
- `openclaw config unset`
- `openclaw config validate`

这是当前最明确的配置写入命令面。

### 可以做 2：通过 `openclaw agents list` / `openclaw config get agents.list` 判断目标 agent 是否存在
已确认存在：
- `openclaw agents list`
- `openclaw config get agents.list`

### 可以做 3：把模板应用定义为对 `agents.list[]` 某个 agent 条目的更新
已确认 `agents.list` 是 OpenClaw 的正式配置区，且当前环境也能实际读到该结构。

### 可以做 4：依赖 Gateway 配置热加载/混合重载机制
官方文档明确 Gateway 监听配置变更，并支持 hot reload / hybrid reload。

---

## 3.2 当前**不能假设**的动作（必须禁止写进 contract/实现说明）

### 不能假设 1：存在专门的模板应用 RPC
**不能写**：
- `openclaw gateway call templates.apply`
- `openclaw gateway call config.applyTemplate`
- `openclaw gateway call agents.update`
- `openclaw gateway call agent.setConfig`

原因：本轮没有任何 CLI 帮助或官方文档证据证明这些方法存在。

### 不能假设 2：存在官方“只改某个 agent 配置”的 `agents update` CLI
`openclaw agents --help` 当前未显示此类子命令，不能虚构。

### 不能假设 3：后端可以直接改写 OpenClaw 内部私有状态文件来实现配置生效
例如：
- 直接手改 session store
- 直接手改 agent 内部缓存/数据库
- 绕过 schema 的私有文件写入

这既不符合当前项目既有边界，也会制造不可控兼容风险。

### 不能假设 4：模板应用后，当前所有存量会话一定立即切换到新配置
文档已暗示部分技能/配置对“下一次新会话”生效更稳妥。MVP 不应承诺强一致热切换。

### 不能假设 5：模板可以安全覆盖所有 OpenClaw 根配置
模板若直接覆盖根级配置，风险过大，且超出当前办公控制台 MVP 的“便捷配置”边界。

---

## 4. 对 Leona/Jax 回写 contract 与执行说明的建议口径

## 4.1 建议回写到 contract 的执行口径

对 `POST /api/v1/config/templates/:id/apply`，建议补成如下语义：

> 本接口在 MVP 中将模板应用实现为：对目标 `agents.list[]` 条目的受控配置更新。后端读取本地 YAML 模板，校验模板与目标 Agent 后，通过 OpenClaw 官方配置 CLI（`openclaw config set` / `openclaw config validate`）写入允许覆盖的 agent 级字段。接口成功表示配置写入并校验通过；运行时效果以 Gateway 配置热加载与后续新会话生效为准。

## 4.2 建议回写到后端执行说明的实现约束

建议增加以下硬约束：

1. **写入通道唯一**：只允许通过 OpenClaw 官方配置 CLI 完成写入，不直接手改内部运行时状态
2. **写入范围白名单**：只允许更新目标 agent 条目的白名单字段
3. **必须先校验目标 agent 存在**
4. **必须做 schema 校验**：`openclaw config validate`
5. **失败不得半成功回执**：验证失败即接口失败
6. **返回语义不夸张**：成功 = 配置已更新并通过校验，不强承诺“所有进行中会话即时重配”

---

## 5. 对 MVP 风险的真实判断

### 5.1 这个 blocker 是否足以阻塞 MVP 启动？

**结论：会阻塞“模板真实生效”这条能力，但不再阻塞 contract 收口。**

因为当前其实已经可以收口到一个现实方案：
- 不等不存在的专用 RPC
- 直接采用 `openclaw config set + validate`
- 将模板应用定义为 agent 配置覆盖

所以这个 blocker 的本质应从：
> “OpenClaw 有没有某条神秘写入命令？”

改写为：
> “Leona 是否接受把模板应用实现为官方配置 CLI 驱动的 agent 配置更新，并据此补齐具体字段白名单与错误映射？”

### 5.2 仍需保留的不确定性

虽然命令面可收口，但以下点仍应如实保留：

1. **哪些 agent 字段适合纳入模板白名单**，需要 Jax/Leona 再定一次
2. **某些配置热加载是否对当前运行会话立即可见**，不应在 MVP 过度承诺
3. **若模板包含 skills 字段，其生效时机可能偏向新会话**，需要在验收中按真实语义编写用例

---

## 6. 最终顾问结论

### 结论 A：当前推荐/可行的底层写入口径
**不是等待专用模板 RPC，而是通过 OpenClaw 官方配置 CLI 对 `agents.list[]` 目标 agent 条目做受控更新。**

### 结论 B：MVP 最小可行方案
`POST /api/v1/config/templates/:id/apply` 的 MVP 实现应收口为：
- 模板 YAML 读取/校验
- 目标 agent 存在校验
- 白名单字段 merge 到 `agents.list[]`
- `openclaw config set`
- `openclaw config validate`
- 成功即返回“配置已更新并通过校验”

### 结论 C：明确不能假设的边界
**不能虚构任何不存在的 `gateway call xxx.apply` / `agents update` / 私有内部写命令。**

### 结论 D：对后续收口的建议
Jax/Leona 下一步不应再把“命令面未知”写成悬空 blocker，而应直接把 blocker 缩小为：
- 模板白名单字段最终范围
- apply 成功语义（配置生效 vs 当前会话立即生效）的文案收口
- 失败映射与验证步骤落地

---

## 7. 建议给 Teemo 的一句话口径

> 瑞兹建议：MVP 不再等待不存在的模板专用 RPC；`POST /api/v1/config/templates/:id/apply` 直接收口为“基于 `openclaw config set + validate` 的目标 agent 配置白名单更新”，成功语义定义为“配置已写入并通过校验”，而不是承诺所有运行态即时热切换。
