# 办公控制台增强项目：修订后的技术验证方案（Gateway 适配层版）

- 日期：2026-03-13
- 负责人：backend-leona
- 协同输入：Gateway 可用性验证结果、前端技术选型验证结果
- 适用阶段：第一周技术验证收口 / D4-D5 联调准备
- 方案状态：修订版（替代“前端直连 Gateway REST `/api/v1/*`”假设）

---

## 0. 修订背景与结论

### 0.1 背景

本轮 Gateway 验证确认：

- OpenClaw Gateway **不提供**预期 REST 路由 `/api/v1/*`
- 当前可用能力主要通过以下方式获取：
  - `openclaw gateway call <method>`（RPC 形式）
  - `openclaw skills list`（CLI 表格输出）
  - HTTP `/health`（仅基础存活探测）

已验证可用命令：

- `openclaw gateway call health`
- `openclaw gateway call status`
- `openclaw gateway call agents.list`
- `openclaw gateway call system-presence`
- `openclaw gateway call config.get`
- `openclaw gateway call cron.list`
- `openclaw skills list`

未发现可直接替代的稳定能力：

- `agents.runtime`
- `skills.list`（RPC）
- `workspace.get`
- 目标 REST `/api/v1/agents/status`
- 目标 REST `/api/v1/skills`

### 0.2 修订结论

**项目技术路线调整为：前端只对接本地聚合 REST，后端适配层负责调用 Gateway CLI/RPC，并输出办公友好 DTO。**

结论分级：

1. **原方案（前端/服务直接按 Gateway REST 假设对接）不可行**
2. **修订方案（适配层封装 CLI/RPC + 缓存 + DTO）可行，建议继续推进**
3. **D4-D5 应冻结最小 REST 合同，而不是等待 Gateway 提供原生 REST**

---

## 1. 适配层职责边界

## 1.1 核心定位

适配层是“办公控制台”与“OpenClaw Gateway CLI/RPC”之间的**本地聚合服务层**，职责是：

- 屏蔽 Gateway 原始接口形态差异（HTTP/CLI/RPC/表格输出）
- 聚合多源数据并转换为办公友好的稳定 DTO
- 通过缓存降低 CLI/RPC 高时延对前端体验的影响
- 对外提供最小 REST 接口，供 React 前端使用
- 统一错误、日志、超时、重试和降级策略

## 1.2 适配层应该做什么

1. **数据采集**
   - 调用 `gateway call status/health/agents.list/config.get/system-presence/cron.list`
   - 调用 `openclaw skills list`

2. **数据规整**
   - 将深层嵌套结构转换为前端稳定 DTO
   - 将技术字段转换为办公语义字段（如 `riskLevel`、`actionHint`）

3. **数据聚合**
   - 组合 `status + agents.list + config.get` 形成 dashboard / agent overview
   - 从配置全集中抽取 workspace 映射，而不是原样暴露配置

4. **缓存与降级**
   - 以 TTL、后台刷新、stale-while-revalidate 方式减少高耗时调用
   - Gateway 超时或失败时返回最近一次成功快照，并标记 freshness

5. **安全与收敛**
   - 不向前端透出 CLI 命令细节、原始配置全文、敏感 token、完整 account 配置

## 1.3 适配层不应该做什么

1. **不承担前端业务渲染逻辑**
   - 不输出页面专属 UI 状态片段
   - 只输出稳定业务 DTO 和提示字段

2. **不作为 Gateway 的全功能代理**
   - 不试图一比一暴露所有 Gateway 方法
   - 仅暴露 D4-D5 联调需要的最小能力

3. **不直接暴露原始配置全集**
   - `config.get` 的 `raw/parsed` 仅在服务内部使用
   - 前端只拿精简后的 workspace/config summary

4. **不承诺实时强一致**
   - 当前 Gateway CLI/RPC 时延高，适配层应以“秒级可接受一致性”优先

## 1.4 推荐内部模块划分

```text
Frontend (React)
  -> Office REST API
    -> Controller
      -> Office Service
        -> Gateway Adapter
          -> RpcInvoker (gateway call)
          -> CliInvoker (skills list)
        -> Cache Manager
        -> DTO Mapper
        -> Error Mapper
```

模块职责：

- `RpcInvoker`：封装 `openclaw gateway call <method>`
- `CliInvoker`：封装 `openclaw skills list`
- `Gateway Adapter`：面向能力而非命令提供方法
- `DTO Mapper`：原始结果 -> 办公 DTO
- `Cache Manager`：TTL、失效、后台刷新、熔断窗口
- `Office Service`：组装 dashboard / agent detail / skills summary

---

## 2. CLI/RPC 调用方式

## 2.1 调用原则

由于当前 Gateway 主能力是 CLI/RPC，因此推荐服务端以**本机命令调用**方式接入，而不是前端直连。

### 推荐模式

- **RPC 优先**：`openclaw gateway call <method>`
- **CLI 补充**：当 RPC 无对应能力时使用 `openclaw skills list`
- **HTTP 仅用于基础健康探针**：`GET /health`

## 2.2 已验证可用的调用矩阵

| 目标能力 | 推荐命令 | 说明 |
|---|---|---|
| Gateway 存活 | `curl http://127.0.0.1:18789/health` | 快、适合 liveness |
| 运行总览 | `openclaw gateway call status` | 可替代 agents status 总览 |
| 健康详情 | `openclaw gateway call health` | 信息完整但较慢 |
| Agent 列表 | `openclaw gateway call agents.list` | 适合基础身份列表 |
| 系统在线存在 | `openclaw gateway call system-presence` | 可做附加状态补充 |
| 配置读取 | `openclaw gateway call config.get` | 仅服务内解析使用 |
| 定时任务列表 | `openclaw gateway call cron.list` | 非 P0，可预留 |
| Skills 目录 | `openclaw skills list` | 当前只能走 CLI 解析 |

## 2.3 推荐调用封装模式

### 模式A：同步读取 + 短超时

适用于：
- 页面首次进入
- 手工刷新
- 运维诊断页

建议：
- 单命令超时：6~8 秒
- 超时即走缓存回退
- 不在一次用户请求中串行触发过多慢命令

### 模式B：缓存命中 + 后台刷新

适用于：
- Dashboard 首页
- Agent 列表页
- Skills 列表页

流程：
1. 优先返回缓存
2. 若缓存过期但仍在可接受 staleness 窗口内，先返回旧值
3. 异步触发刷新
4. 下次请求命中新值

### 模式C：定时预热

适用于：
- `status`
- `agents.list`
- `skills list`

建议：
- 后台每 15~60 秒预热一次核心缓存
- 页面请求只读取内存/Redis 缓存
- 避免所有前端请求都直接打到 CLI/RPC

## 2.4 服务内调用示例（伪代码）

### RPC 调用封装

```ts
async function callGateway(method: string): Promise<any> {
  const cmd = `openclaw gateway call ${method}`
  const { stdout } = await execCommand(cmd, { timeoutMs: 8000 })
  return JSON.parse(stdout)
}
```

### CLI 调用封装

```ts
async function listSkills(): Promise<SkillRow[]> {
  const cmd = `openclaw skills list`
  const { stdout } = await execCommand(cmd, { timeoutMs: 10000 })
  return parseSkillsTable(stdout)
}
```

### Dashboard 聚合示例

```ts
async function getDashboardSnapshot() {
  const [status, agents, config] = await Promise.all([
    cache.wrap('gateway:status', 15, () => callGateway('status')),
    cache.wrap('gateway:agents.list', 60, () => callGateway('agents.list')),
    cache.wrap('gateway:config.get', 120, () => callGateway('config.get')),
  ])

  return mapDashboardDto({ status, agents, config })
}
```

## 2.5 命令调用注意事项

1. **必须做超时控制**，不能无限等待 Gateway CLI/RPC
2. **必须做 JSON 解析兜底**，CLI/RPC 异常时统一包装错误码
3. `config.get` **只在后端内部消费**，不要透传原文
4. `skills list` 是表格文本，必须单独做解析器与回归样例
5. 所有命令执行需记录：
   - method / command
   - durationMs
   - success/fail
   - cacheHit/cacheMiss
   - fallbackUsed

---

## 3. 缓存策略设计建议

## 3.1 设计目标

根据验证结果，除 HTTP `/health` 外，核心 CLI/RPC P95 大多在 4.8s~8.7s。前端若直连会导致：

- 首屏慢
- 手工刷新卡顿
- 多模块并发时重复消耗大

因此缓存不是优化项，而是**必需项**。

## 3.2 推荐缓存层级

### L1：进程内内存缓存

用途：
- dashboard 快照
- agent overview
- skills summary

特点：
- 命中最快
- 适合本地单实例 MVP
- 首选默认层

### L2：本地持久快照（文件或轻量 KV）

用途：
- 进程重启后的冷启动回退
- Gateway 临时不可用时的最后一次成功快照

特点：
- 不追求高并发
- 用于恢复与演示可用性

### L3（可选）：Redis

用途：
- 若未来改为多进程/服务端部署，可承接共享缓存

当前建议：
- MVP 本地部署阶段可不强依赖 Redis
- 先以内存 + 本地快照完成验证

## 3.3 推荐 TTL

| 数据 | 来源 | TTL | 允许陈旧窗口 | 说明 |
|---|---|---:|---:|---|
| liveness | `/health` | 5s | 10s | 只做在线探针 |
| dashboard snapshot | `status + agents.list + config.get` | 15s | 60s | P0 首页核心 |
| agent list | `agents.list` | 60s | 5min | agent 基础信息稳定 |
| agent runtime summary | `status.recent + config` 聚合 | 15s | 60s | 近实时但可秒级延迟 |
| skills summary | `skills list` | 5min | 30min | 变化相对较少 |
| workspace mapping | `config.get` | 10min | 60min | 配置变化低频 |
| cron summary | `cron.list` | 60s | 10min | 非首页关键数据 |

## 3.4 失效策略

### 主动失效

以下事件发生时清理相关 cache key：

- 手工点击“刷新状态”
- 配置修改成功
- Agent/Skill 相关操作完成后
- 系统重启/切换 workspace

### 被动失效

- TTL 到期后进入 stale 状态
- stale 窗口内允许先回旧值，再异步刷新
- 超出 stale 窗口则返回错误或显式 degraded 响应

## 3.5 性能优化建议

1. **聚合读并发化**
   - `status`、`agents.list`、`config.get` 尽量并发执行，不串行

2. **拆分首页与详情缓存**
   - Dashboard 不依赖技能详情全文
   - Skills 列表不要阻塞首页

3. **预计算 DTO**
   - 缓存的不只是原始响应，也缓存映射后的 DTO
   - 避免每次请求重新深度 transform

4. **后台预热**
   - 页面热点数据由服务定时刷新
   - 减少用户请求触发慢调用

5. **熔断/降级**
   - 连续 N 次失败后进入熔断窗口（例如 30s）
   - 熔断期间直接返回最近快照 + `gatewayDegraded=true`

## 3.6 freshness 字段建议

前端需要知道“这是不是旧数据”。推荐统一返回：

```json
{
  "fetchedAt": "2026-03-13T09:40:00Z",
  "expiresAt": "2026-03-13T09:40:15Z",
  "stale": false,
  "source": "cache",
  "fallbackUsed": false
}
```

---

## 4. DTO / 接口输出结构

## 4.1 DTO 设计原则

1. **办公友好**：减少技术术语，增加可行动字段
2. **稳定优先**：前端只依赖 DTO，不依赖 Gateway 原始层级
3. **枚举收敛**：状态字段固定枚举，不使用自由文本
4. **时间统一**：一律 ISO 8601 字符串
5. **显示与判断分离**：既给 machine-friendly enum，也给 display text

## 4.2 通用响应包装

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "req_20260313_xxx",
    "timestamp": "2026-03-13T09:46:00Z",
    "cache": {
      "hit": true,
      "stale": false,
      "fallbackUsed": false,
      "fetchedAt": "2026-03-13T09:45:55Z"
    }
  }
}
```

错误响应：

```json
{
  "success": false,
  "error": {
    "code": "GATEWAY_TIMEOUT",
    "message": "网关状态获取超时，已返回最近一次缓存快照",
    "details": {
      "fallbackUsed": true
    }
  },
  "meta": {
    "requestId": "req_20260313_xxx",
    "timestamp": "2026-03-13T09:46:00Z"
  }
}
```

## 4.3 Dashboard DTO（P0）

```ts
interface OfficeDashboardDto {
  gateway: {
    online: boolean
    status: 'healthy' | 'warning' | 'offline'
    statusText: string
    gatewayVersion?: string
    lastCheckedAt: string
    actionHint?: string
  }
  summary: {
    totalAgents: number
    activeAgents: number
    warningAgents: number
    readySkills: number
    totalSkills: number
  }
  agents: OfficeAgentCardDto[]
  risks: OfficeRiskDto[]
}
```

```ts
interface OfficeAgentCardDto {
  agentId: string
  displayName: string
  roleName?: string
  workspaceName?: string
  workspacePath?: string
  status: 'healthy' | 'idle' | 'warning' | 'offline' | 'unknown'
  statusText: string
  lastActiveAt?: string
  lastChannel?: string
  model?: string
  sessionCount?: number
  riskLevel: 'low' | 'medium' | 'high'
  actionHint?: string
}
```

示例：

```json
{
  "gateway": {
    "online": true,
    "status": "healthy",
    "statusText": "Gateway 在线",
    "gatewayVersion": "2026.3.11",
    "lastCheckedAt": "2026-03-13T09:46:00Z",
    "actionHint": "当前可查看 Agent 状态总览"
  },
  "summary": {
    "totalAgents": 8,
    "activeAgents": 6,
    "warningAgents": 1,
    "readySkills": 29,
    "totalSkills": 72
  },
  "agents": [
    {
      "agentId": "agent-backend-leona",
      "displayName": "Leona",
      "roleName": "后端工程师",
      "workspaceName": "backend-leona",
      "workspacePath": "/root/.openclaw/workspace-agent-backend-leona",
      "status": "idle",
      "statusText": "最近可用，当前无运行任务",
      "lastActiveAt": "2026-03-13T09:40:12Z",
      "lastChannel": "feishu",
      "model": "openai-codex/gpt-5.4",
      "sessionCount": 2,
      "riskLevel": "low",
      "actionHint": "可查看最近会话与工作区配置"
    }
  ],
  "risks": [
    {
      "code": "NO_NATIVE_REST_API",
      "title": "Gateway 未提供原生 REST 接口",
      "level": "medium",
      "message": "当前通过本地适配层封装 CLI/RPC 能力对外提供 REST。"
    }
  ]
}
```

## 4.4 Agent Detail DTO（P0）

由于没有 `agents.runtime`，单 Agent 详情只能以 `status.recent + agents.list + config.get` 近似构建：

```ts
interface OfficeAgentDetailDto {
  agentId: string
  displayName: string
  roleName?: string
  workspacePath?: string
  status: 'healthy' | 'idle' | 'warning' | 'offline' | 'unknown'
  statusText: string
  lastActiveAt?: string
  model?: string
  modelProvider?: string
  recentSessions: Array<{
    sessionId: string
    updatedAt: string
    channel?: string
    deliveryContext?: string
  }>
  notes: string[]
  limitations: string[]
}
```

其中 `limitations` 固定提示：

- 当前版本无原生单 Agent runtime API
- 详情为基于 recent sessions 的近似视图

## 4.5 Skills DTO（P0/P1）

```ts
interface OfficeSkillsSummaryDto {
  readyCount: number
  totalCount: number
  items: Array<{
    name: string
    status: 'ready' | 'missing'
    description?: string
    source?: string
  }>
}
```

---

## 5. 对前端暴露的最小 REST 接口草案

结合 Ezreal 当前 D4-D5 联调要求，建议先冻结以下最小接口，不扩张：

## 5.1 `GET /office/dashboard`

### 用途

首页总览卡、Agent 状态表、风险提示。

### 数据来源

- `status`
- `agents.list`
- `config.get`
- `skills list`（建议拆成独立缓存读取，不阻塞首页主链路）

### 返回

`OfficeDashboardDto`

### 性能目标

- 命中缓存 P95 < 300ms
- 允许后台刷新，不要求每次请求直连 Gateway

## 5.2 `GET /office/agents`

### 用途

Agent 列表页/筛选/表格。

### 查询参数（建议）

- `status?: healthy|idle|warning|offline|unknown`
- `keyword?: string`

### 返回

```ts
{
  items: OfficeAgentCardDto[]
  total: number
}
```

## 5.3 `GET /office/agents/:agentId`

### 用途

单 Agent 详情抽屉/详情页。

### 返回

`OfficeAgentDetailDto`

### 说明

- 这是**近似 runtime 详情**，不是 Gateway 原生 runtime 映射
- 响应中必须带 `limitations`

## 5.4 `GET /office/skills`

### 用途

技能目录页、ready/missing 统计。

### 返回

`OfficeSkillsSummaryDto`

### 缓存建议

默认只读缓存，TTL 5 分钟；手动刷新时强制失效

## 5.5 `GET /office/workspaces`

### 用途

展示 Agent 与 workspace 的映射关系，支撑后台配置视图。

### 返回建议

```ts
interface OfficeWorkspaceDto {
  agentId: string
  displayName: string
  workspacePath?: string
  workspaceName?: string
  configured: boolean
}
```

### 说明

- 仅输出 workspace 相关精简字段
- 不返回完整 `config.get.parsed`

## 5.6 `GET /office/health`

### 用途

前端轻量探活与顶部状态条。

### 返回建议

```json
{
  "online": true,
  "status": "healthy",
  "checkedAt": "2026-03-13T09:46:00Z"
}
```

---

## 6. 前后端契约建议（与 Ezreal 对齐）

## 6.1 前端通信约束

- 协议：REST + JSON
- 时间格式：ISO 8601
- 枚举值：固定英文枚举 + 中文 `statusText`
- 错误结构：统一 `code/message/details`

## 6.2 适合 React Query 的接口行为

建议 query key：

- `['office', 'dashboard']`
- `['office', 'agents', filters]`
- `['office', 'agent', agentId]`
- `['office', 'skills']`
- `['office', 'workspaces']`

建议前端 staleTime：

- dashboard：15s
- agents：15s
- agent detail：15s
- skills：5min
- workspaces：10min

## 6.3 前端无需感知的底层细节

以下内容不应泄露到前端协议：

- `openclaw gateway call ...` 命令文本
- `config.get.raw` 原文
- 全量 account/config/plugin 配置
- Gateway RPC 不稳定或缺失的方法名探测细节

---

## 7. 风险、限制与降级方案

## 7.1 当前限制

1. **没有原生 Gateway REST `/api/v1/*`**
2. **没有稳定单 Agent runtime API**
3. **skills 仅有 CLI 表格输出，需解析**
4. **CLI/RPC 时延偏高，缓存不可省略**

## 7.2 风险等级

| 风险 | 等级 | 应对 |
|---|---|---|
| Gateway CLI/RPC 响应慢 | 高 | 强制缓存 + 预热 + 降级 |
| skills list 文本格式变化 | 中 | 独立解析器 + 回归样例 |
| 单 Agent 详情精度不足 | 中 | DTO 中明确 limitations |
| config.get 暴露过多信息风险 | 高 | 仅后端内部消费并裁剪输出 |

## 7.3 降级建议

当 Gateway 慢或不可用时：

1. `dashboard` 返回最近快照 + `gateway.status=warning`
2. `skills` 返回最近缓存 + freshness 标记
3. `agent detail` 若无法刷新，则返回最近会话近照并标记 `limitations`
4. 若首次启动且无缓存，则使用 mock 数据保障演示链路

---

## 8. D4-D5 可执行建议

## 8.1 立即冻结的最小范围

P0：
- `GET /office/health`
- `GET /office/dashboard`
- `GET /office/agents`
- `GET /office/agents/:agentId`
- `GET /office/skills`
- `GET /office/workspaces`

不进入本轮：
- 写操作
- 复杂任务控制
- 全量配置编辑
- WebSocket 实时推送

## 8.2 建议推进顺序

1. 先完成 DTO 合同冻结
2. 再实现本地缓存快照读取逻辑
3. 再补 CLI/RPC 调用与 mapper
4. 最后给前端联调 `/office/dashboard`

## 8.3 判定标准

技术验证通过条件建议调整为：

1. 前端只依赖最小 REST，而不依赖 Gateway 原始结构
2. Dashboard/Agents/Skills 在缓存命中场景下可流畅打开
3. Gateway 超时或失败时，页面仍可展示上次快照与风险提示
4. DTO 契约可支撑 React + AntD + React Query 联调，不需前端拼接 Gateway 原始字段

---

## 9. 最终收口

**修订后的项目方案不再以“Gateway 原生 REST `/api/v1/*`”为前提，而是正式改为“本地适配层调用 OpenClaw Gateway CLI/RPC，对前端暴露最小 REST 聚合接口”。**

这一路线满足当前验证事实，也与前端已确认的技术栈方向一致：

- 前端：React 18 + TypeScript + Vite + Ant Design + React Query
- 后端适配：CLI/RPC 聚合 + DTO 映射 + 缓存快照
- 联调入口：`GET /office/dashboard` 为第一优先级

**建议 Teemo 以本方案作为 D4-D5 技术底稿继续推进；即便 Jax 的进一步架构评估稍后补齐，当前方案已足够支撑最小联调接口和缓存策略决策。**
