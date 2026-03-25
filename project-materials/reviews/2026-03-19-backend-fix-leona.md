# 2026-03-19 后端修复记录（Leona）

## 修复范围
项目：`artifacts/office-dashboard-adapter`

### 1. `/api/v1/status` 404 修复
- 新增 `src/controllers/status-controller.ts`
- 在 `src/routes/api.ts` 注册 `GET /api/v1/status`
- 返回字段：
  - `ok: true`
  - `version: "1.0"`
  - `uptime`（秒）
  - `timestamp`（ISO）
  - `agents.total / working / idle`
- agents 统计复用了 `agentService.listAgents()`

### 2. `/healthz` 404 修复
- 在 `src/app.ts` 新增根路由 `GET /healthz`
- 返回：`{ "status": "ok" }`

### 3. 任务状态全部 active 的修复
问题来源：`src/controllers/tasks-controller.ts` 扫描 `/tasks` 目录时，原逻辑几乎只识别 `blocked`，其余默认都归为 `active`，导致历史完成任务也被当作 active。

本次修复：
- 任务状态支持 `active | blocked | done`
- 增加历史任务过滤逻辑：识别 `done / completed / review / 已完成 / 已交付 / 验收 / 复盘` 等关键词
- 兼容 `- 状态：...` 与 `- **状态**：...` 两种写法
- 同步修复 `src/services/agent-service.ts` 的任务状态推导，避免 agent 状态统计被历史任务污染

## 验证结果
### HTTP 检查
```bash
curl -s http://localhost:3014/api/v1/status
# => HTTP 200

curl -s http://localhost:3014/healthz
# => HTTP 200
```

### 当前接口返回（摘录）
`/api/v1/status`
```json
{"ok":true,"version":"1.0","uptime":3,"timestamp":"2026-03-19T07:34:37.642Z","agents":{"total":12,"working":2,"idle":7}}
```

`/healthz`
```json
{"status":"ok"}
```

### 任务列表结果
- 修复前：UX 报告反馈为 **57 个 active，0 个完成**
- 修复后：接口返回缩减为 **5 个当前任务**，状态分布为：
  - `active`: 4
  - `blocked`: 1
- 说明：历史完成类任务已被过滤，不再全部堆积在 active 中

## 修改文件
- `src/app.ts`
- `src/routes/api.ts`
- `src/controllers/status-controller.ts`
- `src/controllers/tasks-controller.ts`
- `src/services/agent-service.ts`

## 备注
项目内 `npx tsc --noEmit` 仍存在仓库既有 TypeScript 报错（与本次修复无关），但本次运行路径已通过实际 HTTP 启动与接口验证。
