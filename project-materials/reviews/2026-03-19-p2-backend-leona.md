# 2026-03-19 P2 后端整改记录（Leona）

## 完成项

### 1. 快照导入/导出
- 新增 `artifacts/office-dashboard-adapter/src/controllers/snapshot-controller.ts`
- 新增路由：
  - `GET /api/v1/snapshot/export`
  - `POST /api/v1/snapshot/import`
- 导出内容：sessions / tasks / budget / notifications / timeline
- 导出响应头包含：
  - `Content-Disposition: attachment; filename="office-console-snapshot-YYYY-MM-DD.json"`
- 导入策略：
  - 导入前对 `data/budget-policy.json`、`data/notifications.json` 做 `.bak` 备份
  - 仅导入 `budget`、`notifications`
  - `sessions/tasks/timeline` 保持只读来源，不覆盖

### 2. 差量摘要 API
- 新增 `artifacts/office-dashboard-adapter/src/services/diff-service.ts`
- 在 `src/controllers/docs-controller.ts` 新增 `PATCH /api/v1/docs`
- 写入前读取旧内容、写入后生成 diff：
  - `added_lines`
  - `removed_lines`
  - `summary`
- 同步写入 timeline 事件：
  - `type = "doc_updated"`
  - `data.diff` 含摘要结果
- PATCH 响应追加：
  - `{ ok: true, diff: {...} }`

### 3. 增量轮询策略优化
- 修改 `artifacts/office-dashboard-adapter/src/services/agent-service.ts`
- 增加 agent 维度缓存 TTL：
  - `working` → 10s
  - `idle/backlog/blocked` → 60s
  - `offline/error` → 5min
- `/api/v1/agents` 每次仅刷新已过期 agent，其余复用缓存值
- 同步移除控制器外层整包 `agents` 缓存，避免与按-agent TTL 冲突

## 验证
- 执行：`curl -s -o /dev/null -w "%{http_code}" http://localhost:3014/api/v1/snapshot/export`
- 结果：`200`

## 备注
- 本地 `npx tsc --noEmit` 仍存在项目既有无关报错（`collaboration-controller.ts`、`healthz-controller.ts`、`simple-security-test.ts`），不属于本次 P2 改动引入。
- 为完成验证，已重启 `office-dashboard-adapter` 进程并确认新路由生效。
