# CC 项目 vs 我们项目：深度对比分析报告

**作者**：Jax（architect-jax）  
**日期**：2026-03-19  
**综合参考**：CC 架构分析（Jax）、CC 产品分析（Ekko）、CC 办公适用性分析（Jayce）  
**CC 仓库**：https://github.com/TianyiDataScience/openclaw-control-center

---

## 一、功能对比矩阵

### 1.1 我们有 CC 没有：我们的优势

| # | 功能 | 我们的实现 | 优势说明 |
|---|------|----------|---------|
| 1 | **飞书深度集成** | `feishu-notifier.ts` + Gateway push 事件自动触发飞书 webhook | CC 无消息推送，纯 web 展示；我们可把 agent 异常、任务 blocked、上下文压力直接推到飞书群 |
| 2 | **SSE 实时推送** | `sse-hub.ts` 实现浏览器实时事件流 + 文件变更自动广播 | CC 纯 SSR 页面，无浏览器实时更新；我们的 SSE 方案让前端无需刷新即可看到状态变化 |
| 3 | **文件变更监控** | `file-watcher.ts` 监控项目目录，联动 SSE 广播 | CC 靠服务端轮询 + 手动刷新；我们基于 `fs.watch` 实现文件级变更检测 |
| 4 | **Gateway WebSocket 双源降级** | `gateway-ws-client.ts` 优先 WS，失败自动降级文件读取 | CC 也有 Gateway 连接，但我们的降级策略更完善（collaboration-service 中明确实现了 `file-fallback`） |
| 5 | **Agent 配置模板系统** | 5 个 YAML 模板（blank/collab-assistant/doc-processor/office-basic/tech-bridge）+ apply/preview | CC 无配置模板，无法一键配置 agent |
| 6 | **写操作安全框架** | `readonlyMode` + `dryRunDefault` + `consoleToken` + `allowedWriteOrigins` IP 白名单 + 审计日志 | CC 也有 READONLY_MODE，但我们的安全框架更细粒度（IP 白名单、dry-run 默认、审计日志目录） |
| 7 | **Express 标准架构** | Controller → Service → Adapter 分层，中间件链（request-id/logger/error-handler/security） | CC 用原生 `node:http`，无中间件链，代码维护性不如标准框架 |
| 8 | **主动告警通知** | `notification-service.ts` 实现 context 压力 ≥80% 和 agent idle >2h 自动飞书告警 + 冷却防重 | CC 只展示告警，不主动推送 |

### 1.2 CC 有我们没有：差距 / 借鉴机会

| # | 功能 | CC 实现方式 | 差距评估 |
|---|------|-----------|---------|
| 1 | **总览仪表盘（Command Deck）** | 5 张 KPI 告警卡 + 6 项 Executive 摘要 + 需要介入区域 + 告警计数 | 我们有 `/dashboard` 但信息密度低，缺少"一眼看清"的卡片式聚合 |
| 2 | **Agent 协作可视化** | 独立 Collaboration 页：父子会话接力 + 跨会话通信 + 等待节点定位 | 我们有 `/collaboration` 但只是 session 列表，无流向图、无接力可视化 |
| 3 | **ReadinessScore 综合评分** | 4 维度（observability/governance/collaboration/security）就绪度评分 | 我们完全没有系统综合健康评分 |
| 4 | **DoneChecklist 完成核查** | 每个任务有 `definitionOfDone: string[]` + per-item pass/warn/fail | 我们任务只有简单状态字段，无完成核查清单 |
| 5 | **双语支持** | 全站 `?lang=en/zh` + `pickUiText(lang, en, zh)` 函数级切换 | 我们 API 响应混合中英文，无系统性 i18n |
| 6 | **Ack 确认机制** | `acknowledged` 状态 + `ackExpiresAt` 过期重现 + `POST /api/action-queue/:id/ack` | 我们有 ack 端点但 action-queue-service 缺少完整的 ack 数据模型和过期恢复 |
| 7 | **回放与审计时间线** | timeline.log + approval-actions.log + operation-audit.log 聚合 + diff 摘要 | 我们有审计日志目录，但无回放索引和时间线可视化 |
| 8 | **像素办公室** | agent 映射为动物角色，按区域分布（Builder/Approval/Support/Standby） | 我们无此可视化，但优先级低 |
| 9 | **UI 偏好持久化** | `ui-preferences.json` 存储语言/过滤器/视图模式 | 我们无用户偏好持久化 |
| 10 | **三栏布局 + Inspector Sidebar** | sidebar + panel + inspector-sidebar，宽屏常驻，localStorage 持久化 | 我们是纯 API 后端，无前端布局 |
| 11 | **快速过滤器（Quick Chip）** | URL 参数驱动的一键切换：all/attention/todo/in_progress/blocked/done | 我们无 URL 驱动的过滤系统 |
| 12 | **Memory 状态卡片** | 每个 agent 的记忆文件可用性/可搜索性/最后更新时间 | 我们有 `/memory` 端点但无健康状态评估 |
| 13 | **Settings 三张运维卡** | Connection Health + Security Risk Summary + Update Status | 我们有 `/settings/wiring-status` 但信息不够"人话化" |
| 14 | **CSS conic-gradient 饼图** | 纯 CSS 实现用量分布可视化，无第三方依赖 | 我们无可视化（纯 API） |
| 15 | **Cron 健康状态** | 定时任务 scheduled/due/late/unknown/disabled 五态 | 我们有 `/cron` 端点但状态细分不够 |

### 1.3 两者都有但实现不同

| # | 功能 | CC 实现 | 我们的实现 | 哪个更好 |
|---|------|--------|----------|---------|
| 1 | **Dashboard 聚合** | 服务端快照 `last-snapshot.json` → SSR HTML | Express API → JSON → 前端消费 | **我们更好**：API-first 解耦前后端，支持多客户端 |
| 2 | **Agent 状态** | 5 种：idle/running/blocked/waiting_approval/error | 7 种：working/idle/blocked/backlog/error/offline/unknown | **我们更好**：状态粒度更细，区分了 backlog 和 offline |
| 3 | **搜索** | 4 个独立端点（tasks/projects/sessions/exceptions） | 统一 `/search?q=&type=` 端点，支持 agent/task/session | **各有优劣**：CC 分离度高，我们统一度高 |
| 4 | **用量统计** | 按 agent/project/task/model/provider/session-type/cron 七维度 | 按 agent 维度 + context 压力 | **CC 更好**：维度更丰富，我们缺 project/model 维度 |
| 5 | **安全框架** | READONLY_MODE + LOCAL_TOKEN_AUTH + IMPORT_MUTATION 开关 | readonlyMode + consoleToken + dryRunDefault + IP 白名单 + 审计 | **我们更好**：安全层次更多，有 IP 白名单和审计日志 |
| 6 | **缓存** | 内存缓存 3-10s TTL + inFlight 防重入 | `memory-cache.ts` + `cached-resource-service.ts`，TTL 15s-300s | **我们更好**：分层缓存 + stale-while-revalidate 模式 |
| 7 | **HTTP 框架** | 原生 `node:http`（零依赖） | Express + 中间件链 | **我们更好**：Express 生态成熟，中间件可组合 |
| 8 | **数据通信** | REST API + Gateway WebSocket | REST API + Gateway WebSocket + SSE 推送 | **我们更好**：多了 SSE 实时推送通道 |

---

## 二、技术架构对比

### 2.1 前端技术选型

| 维度 | CC | 我们 | 评价 |
|------|-----|------|------|
| 前端框架 | 无框架，服务端拼接 HTML 字符串 | 纯 API 后端，前端待建 | 我们有机会选择现代前端框架（React/Vue） |
| CSS 方案 | 内联 CSS + CSS 变量 Token | 无前端 | CC 的 Design Token 方案值得参考 |
| 路由 | URL 查询参数路由（`?section=xxx`） | 无前端路由 | CC 方案简单但不标准 |
| 构建工具 | `tsc` + `tsx` 直接运行 | TypeScript + ESM | 基本相当 |

### 2.2 后端架构

| 维度 | CC | 我们 | 评价 |
|------|-----|------|------|
| HTTP 框架 | 原生 `node:http` | Express 4.x | **我们更好**：Express 中间件生态 |
| 项目结构 | 大文件模块（ui/runtime 分离） | 标准分层：controllers/services/middleware/data | **我们更好**：职责分离清晰 |
| 数据聚合 | `ReadModelSnapshot` 快照中心 | Service 层聚合 + 多数据源降级 | **我们更好**：降级策略更完善 |
| 类型系统 | TypeScript 严格模式 | TypeScript + 领域类型定义 | 基本相当 |
| 安全层 | READONLY + TOKEN_AUTH | READONLY + TOKEN + IP_WHITELIST + DRY_RUN + AUDIT | **我们更好**：多层安全 |

### 2.3 数据流

| 维度 | CC | 我们 |
|------|-----|------|
| 数据获取 | 服务端定时轮询 Gateway → 写入本地 JSON 快照 → SSR 读快照 | API 请求时实时从 Gateway/文件系统聚合 |
| 实时更新 | 浏览器手动刷新 | SSE 推送 + 文件变更监控 |
| 缓存策略 | 内存缓存 3-10s TTL | 分层缓存 15s-300s + stale-while-revalidate |
| 降级策略 | Gateway 不可用时部分功能不可用 | Gateway → 文件系统自动降级，标注 `source: 'file-fallback'` |

### 2.4 部署方式

| 维度 | CC | 我们 |
|------|-----|------|
| 运行方式 | `npm run dev:ui` 启动 HTTP + Monitor | `node dist/server.js` 启动 Express |
| 端口 | 4310 | 3014 |
| 环境配置 | `.env` 文件 | 环境变量 + `.env` |
| 依赖 | 零运行时依赖（仅开发依赖） | Express + 少量运行时依赖 |
| 前提条件 | 需要 OpenClaw Gateway 可达 | 同上，但降级更平滑 |

---

## 三、优劣势总结

### 3.1 我们的优势（5 条）

1. **飞书深度集成 + 主动告警**：CC 是纯 web 展示层，不推送；我们通过 `feishu-notifier` + `notification-service` 实现 agent 异常、context 压力、任务阻塞的自动飞书推送，且有冷却防重机制
2. **SSE 实时推送 + 文件监控**：CC 靠手动刷新，我们通过 SSE 推送文件变更事件到浏览器，无需手动刷新即可看到最新状态
3. **多层安全框架**：READONLY + Token 鉴权 + IP 白名单 + Dry-Run 默认 + 审计日志，比 CC 的 READONLY + TOKEN_AUTH 更完善
4. **标准 Express 分层架构**：Controller → Service → Adapter 清晰分层 + 中间件链（request-id/logger/security/error-handler），比 CC 的原生 HTTP 大文件模式更易维护和扩展
5. **Agent 配置模板系统**：支持一键应用预置模板（blank/collab-assistant/doc-processor 等），CC 完全没有配置模板功能

### 3.2 我们的劣势 / CC 的优势（5 条）

1. **信息密度与可视化不足**：CC 的 Overview 用 5 张 KPI 卡 + Executive 摘要 + 介入区域实现"一眼看清"，我们的 `/dashboard` 返回 JSON 但信息聚合度和展示设计不如 CC
2. **缺少系统综合评分**：CC 有 ReadinessScore（4 维度就绪度）给用户一个直观的系统健康数字，我们没有类似的综合评分机制
3. **协作可视化薄弱**：CC 的 Collaboration 页有父子会话接力、跨会话通信可视化和等待节点定位，我们只有 session 列表
4. **用量归因维度不足**：CC 支持按 agent/project/task/model/provider/session-type/cron 七维度归因，我们只有按 agent 维度
5. **缺少完整前端**：CC 是全栈方案（服务端渲染完整 UI），我们目前只有 API 后端，前端展示层尚未建设

---

## 四、可借鉴功能清单（可执行）

### P0：本迭代必须借鉴

| # | 功能 | CC 实现方式 | 我们应该怎么实现 | 工作量 | 角色 |
|---|------|-----------|---------------|--------|------|
| **P0-1** | **ReadinessScore 综合评分** | `ReadinessScoreSnapshot` 含 overall + 4维度（observability/governance/collaboration/security），每个维度有 pass/warn/fail checklist | 在 `dashboard-service.ts` 中新增 `computeReadinessScore()` 方法：<br>• observability = Gateway连接 + SSE活跃 + 审计日志可写<br>• governance = readonlyMode + consoleToken + dryRun 配置检查<br>• collaboration = 活跃 session 数 + agent 响应率<br>• security = IP白名单 + 审计日志启用 + token 配置<br>在 `/dashboard` 响应中新增 `readinessScore` 字段 | **中** | **Leona** |
| **P0-2** | **Action Queue Ack 完整实现** | `ActionQueueItem` 含 `acknowledged` + `ackExpiresAt`，过期后自动重现；`POST /api/action-queue/:id/ack` 接受 `durationMinutes` 参数 | 完善 `action-queue-service.ts`：<br>• 新增 `runtime/acks.json` 持久化确认状态<br>• `ackItem(id, durationMinutes)` 写入确认 + 过期时间<br>• `getActionQueue()` 过滤时检查 ack 过期恢复<br>• 已有 `POST /action-queue/:itemId/ack` 端点，完善 handler | **小** | **Leona** |
| **P0-3** | **DoneChecklist 任务核查** | 任务模型含 `definitionOfDone: string[]` → per-item status=pass/warn/fail | 在 `tasks-controller.ts` 中解析任务 markdown 的 checklist 段落（`- [x]`/`- [ ]`）：<br>• 新增 `parseChecklist(content)` 函数<br>• 在任务详情响应中新增 `checklist: { item: string, done: boolean }[]`<br>• 计算完成率 `checklistProgress: number` | **小** | **Leona** |
| **P0-4** | **Memory 健康状态评估** | 扫描每个 agent 的 MEMORY.md/SOUL.md/IDENTITY.md，返回可用/可搜索/需检查状态 | 完善 `memory-controller.ts`：<br>• 新增 `/memory/health` 端点<br>• 扫描各 agent workspace 下的 MEMORY.md/SOUL.md<br>• 检查文件存在性 + 文件大小 + 最后修改时间<br>• 超过 7 天未更新标记 `stale`，0 字节标记 `empty` | **小** | **Leona** |
| **P0-5** | **用量多维度归因** | 按 agent/project/task/model/provider 多维度拆分 token 消耗 | 扩展 `usage-service.ts` 的 `readAgentSessionData()`：<br>• 解析 JSONL 中的 `model` 字段做 model 维度归因<br>• 新增 `/usage/by-model` 端点<br>• 在 `/usage/by-agent` 响应中追加 `modelBreakdown` 字段 | **中** | **Leona** |

### P1：本轮迭代末完成

| # | 功能 | CC 实现方式 | 我们应该怎么实现 | 工作量 | 角色 |
|---|------|-----------|---------------|--------|------|
| **P1-1** | **协作流向可视化 API** | Collaboration 页展示父子会话接力 + 跨会话通信 + 等待节点 | 扩展 `collaboration-service.ts`：<br>• 新增 `getCollaborationGraph()` 返回 `{ nodes: SessionNode[], edges: RelayEdge[] }`<br>• 从 session JSONL 中解析 `parentSessionId` 构建父子关系<br>• 识别 `sessions_send` 事件构建跨会话通信边<br>• 新增 `/collaboration/graph` 端点 | **大** | **Leona** |
| **P1-2** | **Settings 运维卡片增强** | Connection Health + Security Risk Summary + Update Status 三张卡 | 扩展 `settings-controller.ts`：<br>• `GET /settings/connection-health`：检查 Gateway/OpenClaw Home/飞书/SSE 连接状态<br>• `GET /settings/security-summary`：把 readonlyMode/consoleToken/dryRun 翻译成人话风险评估<br>• `GET /settings/update-status`：读取 `package.json` version + 检查最新版 | **中** | **Leona** |
| **P1-3** | **双语 API 支持** | `pickUiText(lang, en, zh)` 函数级切换 | 新增 `utils/i18n.ts`：<br>• 定义 `t(lang, enText, zhText)` 工具函数<br>• API 响应中的固定文案支持 `?lang=en/zh` 参数<br>• 告警消息、状态描述等字段双语化 | **中** | **Leona** |
| **P1-4** | **审计时间线 API** | 聚合 timeline.log + 操作审计日志，支持时间窗口过滤 | 新增 `audit-timeline-service.ts`：<br>• 读取 `logs/audit.log` 文件<br>• 新增 `GET /audit/timeline?since=&until=&level=` 端点<br>• 返回 `{ events: AuditEvent[], total: number }` | **中** | **Leona** |
| **P1-5** | **前端总览仪表盘** | Overview 单页：KPI 卡 + Executive 摘要 + 介入区 + 告警计数 | 新建前端页面（React/Tailwind）：<br>• 系统健康状态宽卡（颜色 + 数字 + 一句话）<br>• 待处理事项列表<br>• Agent 状态卡片网格<br>• 调用现有 `/dashboard` + `/action-queue` + `/agents` API | **大** | **Ezreal** |
| **P1-6** | **前端 Agent 卡片网格** | Staff 页：四区域办公室布局 + 状态角标 + 悬停操作 | 新建 Agent 页面组件：<br>• 卡片网格（3-4 列），每张卡含状态圆点 + 名称 + 当前任务<br>• 悬停显示快捷操作（查看 log、当前任务、复制 ID）<br>• 调用 `/agents` API | **中** | **Ezreal** |
| **P1-7** | **语义色彩系统 + UI 设计规范** | Badge 色系 + Segment Switch + KPI 顶线 + Quick Chip | 定义 Design Token：<br>• 7 色语义系统（绿/黄/橙/红/灰/蓝/紫）<br>• 卡片规范（圆角/内边距/投影/字号层级）<br>• 状态色条规范<br>• 输出 Tailwind theme config + 组件设计稿 | **中** | **Lux** |

### P2：下一迭代

| # | 功能 | 工作量 | 角色 |
|---|------|--------|------|
| P2-1 | 日历视图（任务时间线） | 中 | Ezreal |
| P2-2 | 数据导出（ExportBundle） | 中 | Leona |
| P2-3 | 回放索引与会话回放 | 大 | Leona |
| P2-4 | UI 偏好持久化 | 小 | Ezreal |
| P2-5 | 快速过滤器（Quick Chip + URL 驱动） | 小 | Ezreal |
| P2-6 | 三栏布局 + Inspector Sidebar | 中 | Ezreal |

---

## 五、架构设计原则借鉴

### 应该借鉴的

| 原则 | CC 做法 | 我们的落地方式 |
|------|--------|-------------|
| **快照中心** | 所有 UI 从统一快照读取 | 我们的 `cached-resource-service` 已有类似能力，可进一步统一为单一数据快照 |
| **请求追踪** | `x-request-id` 全链路透传 | 已有 `request-id.ts` 中间件 ✅ |
| **配置化轮询** | 不同数据不同间隔 | 已有 `cacheTtlMs` 配置 ✅ |
| **操作审计** | 所有写操作记录审计日志 | 已有 `audit-service.ts` ✅ |
| **降级友好** | 数据源缺失时继续运行，标注降级 | 已有 `source: 'file-fallback'` 标注 ✅ |

### 不应该照搬的

| CC 做法 | 原因 |
|--------|------|
| 纯 SSR HTML（无前端框架） | 交互能力弱，不适合办公增强场景 |
| 原生 `node:http`（零依赖） | 过于极端，丧失中间件生态 |
| 纯 CSS 可视化 | 无法做复杂图表，我们应引入轻量图表库 |
| 查询参数路由 | 不标准，应使用 SPA 路由 |

---

## 六、总结

| 维度 | 对比结论 |
|------|---------|
| 后端架构 | **我们更好**：Express 分层 + 多层安全 + SSE + 降级 |
| 数据通信 | **我们更好**：SSE 实时推送 + 文件监控 + 飞书集成 |
| 信息密度 | **CC 更好**：KPI 卡片 + 综合评分 + 人话化展示 |
| 可视化 | **CC 更好**：完整前端 UI，我们无前端 |
| 协作展示 | **CC 更好**：流向图 + 接力可视化 |
| 安全性 | **我们更好**：多层安全 + IP 白名单 + 审计 |
| 可扩展性 | **我们更好**：API-first 支持多客户端 |

**核心结论**：我们在后端基础设施上领先 CC，但在"信息展示效果"和"综合运营视图"上需要向 CC 学习。P0 优先补齐 ReadinessScore、Ack 机制、DoneChecklist、Memory 健康、用量多维度这 5 项后端能力，P1 启动前端建设。

---

*本报告综合了架构（Jax）、产品（Ekko）、办公顾问（Jayce）三份 CC 深度分析报告，产出可执行的借鉴任务清单。*
