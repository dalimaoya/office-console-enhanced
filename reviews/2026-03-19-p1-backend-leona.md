# 2026-03-19 P1 backend review — Leona

## 完成项
- 新增持久化通知中心 API：`src/controllers/notifications-controller.ts`
- 新增通知持久化服务：`src/services/persistent-notifications-service.ts`
- 新增预算策略/预算状态 API：`src/controllers/budget-controller.ts`
- 新增预算服务：`src/services/budget-service.ts`
- 更新路由：`src/routes/api.ts`
- 更新状态接口：`src/controllers/status-controller.ts`，追加 `notifications.unread_count`

## 接口说明
### 通知中心 API
- `GET /api/v1/notifications?status=unread&limit=20`
- `POST /api/v1/notifications/:id/ack`
- `POST /api/v1/notifications/:id/snooze`
- `POST /api/v1/notifications`

通知数据写入：`data/notifications.json`

### 预算 API
- `GET /api/v1/budget/policy`
- `PUT /api/v1/budget/policy`
- `GET /api/v1/budget/status`

预算策略写入：`data/budget-policy.json`

## 验证结果
### 指令要求验证
```bash
curl -s http://localhost:3014/api/v1/notifications | head -5
# => {"items":[],"unread_count":0}

curl -s http://localhost:3014/api/v1/budget/policy | head -3
# => {"daily_warn_usd":1,"daily_over_usd":5,"context_pressure_warn":0.7,"context_pressure_over":0.9}
```

### 补充功能验证
```bash
POST /api/v1/notifications
# => {"ok":true,"id":"1773910255578-wrygt7"}

POST /api/v1/notifications/:id/ack
# => {"ok":true}

POST /api/v1/notifications/:id/snooze {"minutes":60}
# => {"ok":true,"snoozed_until":"2026-03-19T09:51:02.947Z"}

GET /api/v1/budget/status
# => {"daily_cost_usd":31.604973,"status":"over","context_pressure":1.0176,"context_status":"over",...}
```

## 备注
- 仓库存在历史 TypeScript 报错（`collaboration-controller.ts`、`healthz-controller.ts`、`simple-security-test.ts`），与本次接口改动无关；本次通过重启服务并使用 HTTP 实测完成验证。
