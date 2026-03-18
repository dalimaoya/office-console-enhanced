# office-dashboard-adapter

办公控制台 MVP 适配层，提供：

- `GET /api/v1/dashboard`
- `GET /api/v1/agents`
- `GET /api/v1/config/templates`
- `GET /api/v1/config/templates/:id`
- `POST /api/v1/config/templates/:id/apply`
- `GET /api/v1/health`
- 旧路径 `/office/dashboard`、`/v1/office/dashboard` 兼容跳转

## 启动

```bash
cd artifacts/office-dashboard-adapter
npm install
npm start
```

默认端口：`3014`

## 设计说明

- Gateway 采集：
  - `GET http://127.0.0.1:18789/health`
  - `openclaw gateway call status`
  - `openclaw gateway call agents.list`
  - `openclaw gateway call config.get`
- 缓存策略：
  - dashboard 30s
  - agents 60s
  - templates.list 300s
  - health 15s
  - stale 窗口保留在本地快照 `data/cache-snapshots.json`，用于重启后联调验证 stale 回退路径
- 降级策略：
  - Gateway 不可用但存在 stale 快照时，返回 `200 + success:true + cached:true + stale:true`
  - Gateway 不可用且无可用快照时，返回 `503 + success:false + error.code=GATEWAY_UNAVAILABLE`

## MVP 契约提醒

- 当前 MVP **不做认证**。
- 不要求 `Authorization` / `Bearer` / `JWT` 请求头。
- 成功响应统一为 `{ success: true, data }`。
- 失败响应统一为 `{ success: false, error }`。
- stale 降级响应统一用 `cached:true + stale:true + warning`，不再使用旧的 `cachedData` 口径。
- `POST /api/v1/config/templates/:id/apply` 的成功语义是：目标 agent 配置已写入并通过 `openclaw config validate`；**不承诺进行中会话即时切换**。

## 基准测试

```bash
npm run benchmark
```

## 验证脚本

```bash
npm run verify
```

当前 verify 已按 MVP 新契约校正，并补入尾项分支验证：
- 成功响应使用 `{ success, data }`
- agents stale 可通过本地快照 + `MOCK_GATEWAY_MODE=offline` 稳定复现
- `AGENT_NOT_FOUND` 可通过不存在的 `targetAgentId` 稳定复现
- `TEMPLATE_INVALID` 可通过临时模板目录中的非白名单字段模板稳定复现
- `TEMPLATE_APPLY_FAILED` 可通过 `MOCK_CONFIG_APPLY_FAILURE` 测试钩子稳定复现

## QA 最小复现提示

### 1) agents stale

依赖本地快照文件 `data/cache-snapshots.json`，并以离线模式启动：

```bash
MOCK_GATEWAY_MODE=offline npm start
```

若快照中的 `agents` 已过 fresh TTL 但未过 stale TTL，则 `/api/v1/agents` 应返回：
- `200`
- `success: true`
- `cached: true`
- `stale: true`
- `warning.type = gateway_unreachable`

### 2) TEMPLATE_APPLY_FAILED

该分支默认难以在不同环境稳定命中；为避免真实污染运行配置，当前保留一个仅用于联调验证的环境变量钩子：

```bash
MOCK_CONFIG_APPLY_FAILURE=verify-hook npm start
```

此时对任意合法模板执行 apply，会稳定返回：
- `500`
- `error.code = TEMPLATE_APPLY_FAILED`

> 该钩子仅用于 QA / verify 分支验证，不用于生产运行。
