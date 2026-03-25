# 告警阈值配置化实现摘要（雷欧娜）

## 完成内容
- 新增 `src/services/settings-service.ts`，统一管理告警阈值配置：
  - `contextPressurePercent`，默认 `80`
  - `agentIdleMinutes`，默认 `120`
  - `costDailyUSD`，默认 `100`
- 新增持久化文件 `data/alert-config.json`
  - 启动/读取时若文件不存在，自动回退默认值
  - 更新时写入 JSON 文件
- 更新 Settings API：
  - `GET /api/v1/settings` 返回 `alertThresholds`
  - `POST /api/v1/settings/alerts` 支持更新 `alertThresholds` 并持久化
  - 写接口兼容现有 `dryRun` 机制
- 告警逻辑改造：
  - Context 压力告警从硬编码 `80%` 改为读取配置
  - Agent idle 告警从硬编码 `2h` 改为读取配置
  - Action Queue 中的 idle 告警阈值也切到同一配置源
  - 新增每日费用告警：在预算状态查询链路中按 `costDailyUSD` 阈值触发飞书通知

## 验证结果
- `npx tsc --noEmit` 通过
- `curl http://localhost:3014/api/v1/settings` 已返回：

```json
{
  "success": true,
  "data": {
    "readonlyMode": true,
    "tokenEnabled": false,
    "dryRunEnabled": true,
    "version": "0.1.0",
    "startedAt": "2026-03-19T16:37:38.683Z",
    "alertThresholds": {
      "contextPressurePercent": 80,
      "agentIdleMinutes": 120,
      "costDailyUSD": 100
    }
  }
}
```

## 说明
- 实际 POST 写入测试已完成，并已恢复默认阈值（80 / 120 / 100）。
- `data/operation-audit.log` 为本地测试写接口产生的运行日志，未纳入本次代码提交。
