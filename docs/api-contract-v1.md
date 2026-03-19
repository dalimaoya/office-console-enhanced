# API Contract V1

> 适用范围：`office-dashboard-adapter` 对外办公友好接口层  
> 版本：v1（2026-03-20）

## 1. 目标

本文件用于冻结前后端对接字段，避免再次出现 `totalToken` / `contextUsedEstimate` 等字段错位问题。

- **稳定字段**：由适配层 DTO 显式定义，对前端长期承诺，不随 OpenClaw 内部结构变化而直接漂移。
- **适配层计算字段**：由 adapter 聚合、估算、映射或降级生成，字段名稳定，但字段值可能来自计算/估算。
- **OpenClaw 原始字段**：不直接作为前端契约，前端不得绕过本契约依赖内部返回结构。

## 2. 通用响应信封

多数只读接口使用统一信封：

```json
{
  "success": true,
  "data": {}
}
```

错误响应：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "human readable message",
    "detail": "optional detail"
  }
}
```

注意：`/api/v1/usage/by-agent` 与 `/api/v1/usage/context-pressure` 当前历史实现为 `res.json({ success: true, ...result })`，未包在 `data` 下，前端接入时必须按下文示例读取。

---

## 3. 接口清单

### 3.1 GET `/api/v1/usage`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `period` | `today \| week` | 否 | 默认 `today` |

#### 响应 JSON 示例

```json
{
  "success": true,
  "data": {
    "totalTokens": 182340,
    "totalCost": 0.36468,
    "byAgent": [
      {
        "agentId": "agent-backend-leona",
        "tokens": 92840,
        "cost": 0.18568
      },
      {
        "agentId": "agent-orchestrator-teemo",
        "tokens": 89500,
        "cost": 0.179
      }
    ],
    "period": "today"
  }
}
```

#### 字段说明

- `data.totalTokens`: **稳定字段**。基础聚合总 token。
- `data.totalCost`: **稳定字段**。基础聚合总成本。
- `data.byAgent[].agentId`: **稳定字段**。
- `data.byAgent[].tokens`: **稳定字段**。注意这里字段名是 `tokens`，不是 `totalToken`。
- `data.byAgent[].cost`: **稳定字段**。
- `data.period`: **稳定字段**。
- `data.note`: **稳定字段，可选**。当无数据或降级时返回说明。

#### 注意事项

1. 此接口是旧版轻量聚合接口，保留用于总览卡片。
2. `byAgent[].tokens` 与 `/api/v1/usage/by-agent` 中的 `totalToken` **不是同名字段**，前端不得混用。
3. `totalTokens` 为聚合值，来源于 session usage 扫描；若底层缺失 usage 数据，可能退化为 0。

---

### 3.2 GET `/api/v1/usage/by-agent`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `period` | `today \| week` | 否 | 默认 `today` |

#### 响应 JSON 示例

```json
{
  "success": true,
  "data": [
    {
      "agentId": "agent-backend-leona",
      "displayName": "雷欧娜",
      "model": "gpt-5.4",
      "tokenIn": 51000,
      "tokenOut": 41840,
      "totalToken": 92840,
      "costEstimateUSD": 0.18568,
      "sessionCount": 6,
      "estimated": false,
      "modelBreakdown": {
        "gpt-5.4": {
          "tokenIn": 51000,
          "tokenOut": 41840,
          "totalToken": 92840,
          "costEstimateUSD": 0.18568
        }
      }
    }
  ],
  "period": "today",
  "generatedAt": "2026-03-20T00:00:00.000Z"
}
```

#### 字段说明

- `data[]`: **稳定字段**。按 agent 维度返回的主数组。
- `data[].agentId`: **稳定字段**。
- `data[].displayName`: **稳定字段**。来自 agent identity/name 的适配映射。
- `data[].model`: **稳定字段**。主模型名称。
- `data[].tokenIn`: **稳定字段**。
- `data[].tokenOut`: **稳定字段**。
- `data[].totalToken`: **稳定字段**。重点：稳定字段名固定为单数 `totalToken`。
- `data[].costEstimateUSD`: **稳定字段**。
- `data[].sessionCount`: **稳定字段**。
- `data[].estimated`: **适配层计算字段**。表示 token/cost 是否含估算。
- `data[].modelBreakdown`: **稳定字段名 + 适配层聚合值**。
- `period`: **稳定字段**。
- `generatedAt`: **稳定字段**。

#### 注意事项

1. 这是前端做角色用量排行、明细表格时的主接口。
2. 如果底层只有 `usage.totalTokens` 没有 `inputTokens/outputTokens`，则 `tokenIn/tokenOut` 可能为 0，但 `totalToken` 仍有值。
3. `costEstimateUSD` 在底层未提供真实 cost 时由适配层估算，字段名稳定、值可能为估算值。

---

### 3.3 GET `/api/v1/usage/context-pressure`

#### 请求参数

无。

#### 响应 JSON 示例

```json
{
  "success": true,
  "data": [
    {
      "agentId": "agent-backend-leona",
      "contextWindowMax": 200000,
      "contextUsedEstimate": 92310,
      "pressureRatio": 0.4616,
      "level": "normal",
      "estimated": true
    }
  ]
}
```

#### 字段说明

- `data[]`: **稳定字段**。上下文压力数组。
- `data[].agentId`: **稳定字段**。
- `data[].contextWindowMax`: **稳定字段**。模型上下文窗口上限。
- `data[].contextUsedEstimate`: **稳定字段**。重点：稳定字段名固定为 `contextUsedEstimate`。
- `data[].pressureRatio`: **稳定字段**。
- `data[].level`: **稳定字段**，取值 `normal | warning | critical`。
- `data[].estimated`: **适配层计算字段**。当前实现恒为 `true`，表示压力值由 session 内容估算。

#### 注意事项

1. 这是今日字段错位 bug 的重点接口，前端不得再使用 `usedTokens`、`contextUsed` 等非契约命名。
2. `pressureRatio >= 0.8` 为 `critical`，`>= 0.5` 为 `warning`。
3. 该接口会异步触发飞书告警，不影响响应结构。

---

### 3.4 GET `/api/v1/agents`

#### 请求参数

无。

#### 响应 JSON 示例

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "agent-backend-leona",
        "displayName": "雷欧娜",
        "status": "working",
        "lastActiveAt": "2026-03-20T00:00:00.000Z",
        "currentTask": "三期 DTO 稳定接口层",
        "contextPressure": null,
        "summaryTags": ["leona", "working"],
        "statusDetail": {
          "state": "working",
          "lastActiveAt": "2026-03-20T00:00:00.000Z",
          "currentTask": "三期 DTO 稳定接口层",
          "pendingTaskCount": 1
        }
      }
    ],
    "total": 1
  }
}
```

#### 字段说明

- `data.items[]`: **稳定字段**。Agent 状态数组。
- `data.items[].id`: **稳定字段**。
- `data.items[].displayName`: **稳定字段**。由后端适配 `name -> displayName` 后对外固定。
- `data.items[].status`: **稳定字段**，取值 `working | idle | blocked | backlog | error | offline | unknown`。
- `data.items[].lastActiveAt`: **稳定字段**。
- `data.items[].currentTask`: **稳定字段**。从 `statusDetail.currentTask` 提升出的办公友好字段。
- `data.items[].contextPressure`: **稳定字段，可选/可空**。当前控制器未实时联表填充，允许为 `null`。
- `data.items[].summaryTags`: **稳定字段**。
- `data.items[].statusDetail`: **稳定字段**。
- `data.total`: **稳定字段**。

#### 注意事项

1. 底层 `AgentSummary` 使用 `name` / `lastActive`，但对外契约固定暴露为 `displayName` / `lastActiveAt`。
2. 这是 DTO 稳定层的核心作用：前端只认对外字段，不直接消费底层 domain 字段。
3. 控制器当前未合并 context pressure 实时值，因此 `contextPressure` 允许为空。

---

### 3.5 GET `/api/v1/dashboard`

#### 请求参数

无。

#### 响应 JSON 示例

```json
{
  "success": true,
  "data": {
    "system": {
      "status": "warning",
      "uptime": "4h 12m",
      "version": "OpenClaw v2026.3.13",
      "lastCheck": "2026-03-20T00:00:00.000Z",
      "performance": {
        "avgResponseMs": 812,
        "health": "healthy"
      }
    },
    "agents": {
      "total": 8,
      "active": 6,
      "statusBreakdown": {
        "working": 3,
        "idle": 3,
        "blocked": 1,
        "backlog": 1,
        "error": 0,
        "offline": 0,
        "unknown": 0
      },
      "quickStats": [
        {
          "name": "Task Success Rate",
          "value": "75%",
          "trend": "stable"
        },
        {
          "name": "Avg Response Time",
          "value": "0.8s",
          "trend": "improving"
        }
      ]
    },
    "workspaces": {
      "activeCount": 2,
      "recentActivity": [
        {
          "name": "office-console-enhanced",
          "status": "active",
          "agentCount": 8,
          "lastUpdated": "2026-03-20T00:00:00.000Z"
        }
      ]
    },
    "usage": {
      "todayTokens": 182340,
      "todayCost": 0.36468,
      "period": "today"
    },
    "alerts": [
      {
        "level": "warning",
        "type": "system_performance",
        "message": "适配层最近一次聚合耗时偏高（1812ms）",
        "suggestion": "优先依赖缓存结果，并检查 Gateway CLI/RPC 响应时间",
        "timestamp": "2026-03-20T00:00:00.000Z"
      }
    ],
    "readinessScore": {
      "overall": 87,
      "dimensions": [
        {
          "name": "runtime",
          "score": 90,
          "items": [
            {
              "check": "gateway",
              "status": "pass",
              "detail": "ok"
            }
          ]
        }
      ],
      "computedAt": "2026-03-20T00:00:00.000Z"
    }
  },
  "cached": true,
  "stale": false
}
```

#### 字段说明

- `data.system.*`: **稳定字段**。面向前端总览卡。
- `data.agents.*`: **稳定字段**。
- `data.workspaces.*`: **稳定字段**。
- `data.usage.todayTokens`: **稳定字段**。
- `data.usage.todayCost`: **稳定字段**。
- `data.alerts[]`: **稳定字段**。
- `data.readinessScore`: **稳定字段，可选**。
- `cached` / `stale`: **适配层计算字段**。来自缓存命中和降级状态。
- `warning`: **适配层计算字段，可选**。存在降级或告警提示时返回。

#### 注意事项

1. Dashboard 是聚合接口，多个字段来自适配层计算，不直接等价于 OpenClaw 原始返回。
2. 前端不得假设 `readinessScore` 一定存在；获取失败时该字段会被省略。
3. `system.version` 为适配层格式化值，例如 `OpenClaw v2026.3.13`。

---

## 4. DTO 对照约束

| DTO | 关键稳定字段 | 说明 |
|---|---|---|
| `UsageData` | `totalToken`, `tokenIn`, `tokenOut`, `costEstimateUSD`, `displayName` | 用于 `/api/v1/usage/by-agent` |
| `ContextPressureItem` | `contextUsedEstimate`, `contextWindowMax`, `pressureRatio`, `level` | 用于 `/api/v1/usage/context-pressure` |
| `AgentStatus` | `id`, `displayName`, `status`, `currentTask` | 用于 `/api/v1/agents` |
| `DashboardData` | `system`, `agents`, `workspaces`, `usage`, `alerts` | 用于 `/api/v1/dashboard` |

## 5. 前后端约束

1. 前端禁止直接依赖 OpenClaw 原始字段名。
2. 字段新增只能追加，不可无通知改名。
3. 若必须改名，先更新 `src/types/dto.ts` 与本文档，再走 changelog。
4. 对外字段以本文件与 DTO 类型为准，注释和临时 mock 不算契约。
