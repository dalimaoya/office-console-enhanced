# 2026-03-19 P0 后端整改记录（backend-leona）

## 完成状态

- [x] 任务1：操作审计日志
- [x] 任务2：安全门控扩展
- [x] 任务3：Timeline 历史事件采集层

## 变更摘要

### 1. 操作审计日志
- 新增 `src/middleware/audit-logger.ts`
- 对 `POST/PATCH/PUT/DELETE` 写操作统一追加审计日志
- 审计文件写入 `data/operation-audit.log`
- 采用 append 方式写入，文件不存在自动创建
- 审计失败采用 try/catch 吞错，不影响主流程
- 已验证 `POST /api/v1/tasks`、`PATCH /api/v1/tasks/:filename/status` 生成审计记录

### 2. 安全门控扩展
- 在 `src/config/env.ts` 增加 `REQUIRE_DRYRUN_CONFIRM`，默认 `false`
- 在 `src/middleware/security.ts` 扩展写操作门控
- 当 `REQUIRE_DRYRUN_CONFIRM=true` 且缺少 `X-Confirm: true` 时，返回 HTTP 200 dry-run 响应：
  - `dry_run: true`
  - `message: 此为模拟请求，添加 X-Confirm: true 以确认执行`
  - `payload: <原始body>`
- 在 `GET /api/v1/status` 返回中新增：
  - `security.readonly`
  - `security.require_dryrun`
- 已在本地 3015 端口临时实例验证 dry-run 门控返回正确

### 3. Timeline 历史事件采集层
- 新增 `src/services/timeline-service.ts`
- 新增 `src/controllers/timeline-controller.ts`
- 新增只读接口 `GET /api/v1/timeline?limit=50&type=<过滤类型>`
- Timeline 数据写入 `data/timeline.log`
- 已接入事件：
  - 服务启动：`system_start`
  - 任务创建：`task_created`
  - 任务状态更新：`task_updated`
- 已验证 `/api/v1/timeline` 可返回最近事件并按逆序输出

## 验证结果

### /api/v1/timeline
执行：
```bash
curl -s http://localhost:3014/api/v1/timeline | head -3
```

结果：接口返回 JSON，包含最近 `system_start` / `task_created` / `task_updated` 事件，`total` 字段正常。

### 审计日志样例
```json
{"ts":"2026-03-19T08:43:17.095Z","method":"POST","path":"/api/v1/tasks","body_summary":"创建任务:P0最终验证任务","ip":"127.0.0.1","result":"ok"}
{"ts":"2026-03-19T08:43:17.134Z","method":"PATCH","path":"/api/v1/tasks/2026-03-19-1773909797092-p0%e6%9c%80%e7%bb%88%e9%aa%8c%e8%af%81%e4%bb%bb%e5%8a%a1.md/status","body_summary":"更新任务:2026-03-19-1773909797092-p0最终验证任务.md -> done","ip":"127.0.0.1","result":"ok"}
```
