# MVP API Contract 对齐说明（Leona）

- **时间**：2026-03-14
- **角色**：backend-leona
- **范围**：仅处理 contract 与当前 MVP 基线对齐，不扩散到前端/UI/测试
- **依据**：
  1. `briefs/2026-03-14-mvp-scope-brief-ekko.md`
  2. `handoffs/2026-03-14-mvp-design-constraints-jax.md`
  3. `handoffs/2026-03-14-mvp-backend-execution-leona.md`
  4. `decisions/2026-03-14-cache-fallback-decision.md`

---

## 一、本次修正了哪些差异

### 1. 路径口径修正
- 原 contract 仍使用 `GET /office/dashboard`，并在版本说明处混有 `/v1/office/dashboard`。
- 已统一修正为 **`/api/v1/*`**，并按当前 MVP 最小集列出 6 个接口：
  - `/api/v1/dashboard`
  - `/api/v1/agents`
  - `/api/v1/config/templates`
  - `/api/v1/config/templates/:id`
  - `/api/v1/config/templates/:id/apply`
  - `/api/v1/health`

### 2. 认证口径修正
- 原 contract 要求 `Authorization: Bearer <openclaw_jwt_token>`。
- 已删除该要求，并明确写明：**MVP 不做认证**。

### 3. 缓存口径修正
- 原 contract 仍包含“后台异步刷新：每隔20秒后台刷新数据”的旧假设。
- 已改为当前 MVP 基线：**仅手动刷新触发请求**，不要求后台异步刷新，也不要求自动轮询。
- 同时按决策文档统一缓存降级规则：
  - Gateway 不可用 + 有缓存 → `200 + success:true + cached:true + stale:true`
  - Gateway 不可用 + 无缓存 → `503 + success:false`
  - 明确禁止 `503 + cachedData`

### 4. 响应格式修正
- 原 contract 直接返回业务对象，错误响应也未使用统一包装。
- 已统一收敛为：
  - 成功：`{ success: true, data: ... }`
  - 失败：`{ success: false, error: { code, message, detail? } }`

### 5. 范围口径修正
- 原 contract 实质上只覆盖 dashboard，且带有部分超出 MVP 的假设。
- 已按当前 MVP 范围收口为“6 个必做接口”，删除/排除以下非本轮内容：
  - JWT 认证
  - WebSocket
  - 自动轮询/后台刷新
  - Agent 详情接口
  - 模板编辑/回滚/版本控制
  - 非 MVP 的环境诊断/Skill 管理等接口

---

## 二、仍待确认项

### 开放项 01：模板应用底层写入命令面待确认
这是当前仍未闭合的 blocker，已在 contract 中保留为开放项，**没有自行虚构协议**。

当前只确认：
- 必须通过 OpenClaw CLI/RPC 命令面调用
- 不允许后端直接改 OpenClaw 内部文件
- 不允许在 contract 中杜撰不存在的命令或参数协议

因此，`POST /api/v1/config/templates/:id/apply` 目前只固定了：
- 路由
- 请求体
- 响应结构
- 校验责任
- 错误码语义

**待后续补齐：**
- 实际可用命令
- 参数格式
- 底层返回映射

---

## 三、是否存在与 Jax 基线仍无法收敛的分歧

### 结论
- **当前 contract 文档层面已与 Jax 基线收敛。**
- **唯一保留 blocker** 为“模板应用底层写入命令面未确认”，这不是 contract 自身继续冲突，而是实现前置条件未补齐。

### blocker 判断
- blocker 名称：**模板应用底层写入命令面待确认**
- blocker 性质：实现阻塞，不是文档口径冲突
- 当前处理方式：已在 contract 中显式标注为开放项，等待后续命令面确认

---

## 四、交付物
- 已更新：`contracts/2026-03-14-office-dashboard-api-contract.md`
- 已新增：`reviews/2026-03-14-contract-alignment-leona.md`
