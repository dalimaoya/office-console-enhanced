# Agent状态修复验收报告（Galio）

- 日期：2026-03-19 06:02 UTC
- 验收人：QA 加里奥（codingqa-galio）
- 目标：验收 Agent 状态判定与前端展示修复

## 验收范围
1. 后端 `agent-service.ts`
   - session/lock 优先判定
   - 2 分钟内判 `working`
   - 2-10 分钟冷却判 `idle`
   - 仅明确 `pending/todo/backlog/queued/待处理` 等判 `backlog`
   - 过滤历史任务文档，避免误判 `blocked`
2. 前端 `app.js`
   - `backlog` 与 `blocked` 严格分离
   - `backlog` 显示“待处理”
   - `blocked` 显示“阻塞中”
   - 兼容后端 `statusDetail.state`

## 验收步骤与结果

### 1）服务可用性
命令：`curl -s -o /dev/null -w "%{http_code}" http://localhost:3014/`

结果：`200`

结论：✅ 服务正常。

### 2）后端 API 状态检查
命令：`curl -i -s http://localhost:3014/api/v1/agents | head -120`

结果摘要：
- HTTP `200 OK`
- 返回结构为 `success: true`，实际数据位于 `data.items`
- 关键状态样例：
  - `agent-backend-leona`: `working`
  - `agent-frontend-ezreal`: `working`
  - `agent-architect-jax`: `backlog`
  - `agent-ui-lux`: `backlog`
  - `agent-technical-advisor-codex`: `idle`
  - 未发现因历史任务文档导致的大量 `blocked` 误判

结论：✅ 后端状态整体合理，未见“历史任务文档误判为 blocked”的问题。

### 3）前端状态映射检查
文件：`artifacts/office-dashboard-adapter/src/public/app.js`

关键片段：
- 分组独立：
  - `backlog: [],  // 待处理`
  - `blocked: [],  // 阻塞`
- 兼容后端新字段：
  - `const status = agent.statusDetail?.state || agent.statusDetail?.status || agent.status;`
- 分组逻辑：
  - `status === 'backlog'` -> `groups.backlog.push(agent)`
  - `status === 'blocked'` -> `groups.blocked.push(agent)`
- 状态文案：
  - `backlog: { cls: 'badge info', label: '待处理' }`
  - `blocked: { cls: 'badge blocked', label: '阻塞中' }`

结论：✅ 前端已将 `backlog` 与 `blocked` 独立处理；`backlog` 为“待处理”，`blocked` 为“阻塞中”。

### 4）后端状态判定逻辑检查
文件：`artifacts/office-dashboard-adapter/src/services/agent-service.ts`

关键片段：
- 时间阈值：
  - `SESSION_ACTIVE_THRESHOLD_MS = 2 * 60_000`
  - `SESSION_COOLDOWN_THRESHOLD_MS = 10 * 60_000`
- backlog 仅匹配明确待办状态：
  - `return /^(pending|todo|backlog|queued|待处理|待开始|未开始|排队中)$/i.test(status.trim());`
- blocked 仅匹配明确阻塞/失败状态：
  - `return /^(blocked|error|failed|阻塞|异常|失败)$/i.test(status.trim());`
- 核心判定：
  - `if (hasActiveSession) status = 'working';`
  - `else if (blockedTask || staleLock) status = 'blocked';`
  - `else if (inCooldown) status = 'idle';`
  - `else if (pendingTaskCount > 0) status = 'backlog';`
- 返回新字段：
  - `statusDetail.state = status`

结论：✅ 后端已按 session/lock 优先、冷却转 idle、明确待办才算 backlog 的规则实现。

## 对照验收标准
- ✅ 后端不再把历史任务文档判为 blocked
- ✅ 前端 backlog 显示为“待处理”（非红色，`badge info`）
- ✅ 前端 blocked 显示为“阻塞中”（`badge blocked`）
- ✅ backlog 与 blocked 为独立分组/过滤项
- ✅ 服务 HTTP 200

## 最终结论
**验收通过。**

本轮后端状态判定与前端展示修复均已生效，未发现历史任务导致的 `blocked` 误判，且 `backlog` / `blocked` 已实现语义与展示分离。