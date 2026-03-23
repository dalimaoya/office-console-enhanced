# 2026-03-20 后端修复记录 - Leona

## 范围
修复控制台后端接口契约与统计口径相关问题：#14 #2 #13 #3 #8 #9 #11 #10。

## 已完成

### P0
1. **#14 环境诊断接口统一 envelope**
   - `src/controllers/diagnostic-controller.ts`
   - `/api/v1/diagnostic` 现统一返回 `{ success, data }`
   - 诊断执行后写入 timeline：`diagnostic_run`

2. **#2 阈值配置兼容旧新字段**
   - `src/controllers/settings-controller.ts`
   - 读取时同时返回：
     - 新字段：`contextPressurePercent` / `costDailyUSD`
     - 兼容字段：`contextPressurePct` / `dailyCostUSD`
   - 写入时兼容前端旧 payload：
     - `contextPressurePct -> contextPressurePercent`
     - `dailyCostUSD -> costDailyUSD`
   - 保存后写入 timeline：`settings_alert_thresholds_updated`
   - 用量汇总接口会触发 `checkAndNotifyDailyCost()`，补齐日费用阈值告警链路

3. **#13 项目组实例接口兼容层**
   - `src/controllers/instance-controller.ts`
   - `/api/v1/instances` 同时返回：`instances` + `items`
   - 每个实例同时返回：`instanceId` + `id`
   - create/archive 响应也补了 `id` 别名
   - 实例创建/归档写入 timeline

### P1
4. **#3 设置页版本/运行时长字段补齐**
   - `src/controllers/settings-controller.ts`
   - `/api/v1/settings` 现补充：
     - `tokenAuth`（兼容旧前端）
     - `dryRun`
     - `uptime`
     - `uptimeLabel`
     - `version`
   - `/api/v1/settings/update-status` 也补回 `version` 别名

5. **#8 时间线数据扩展**
   - 新增事件类型：
     - `diagnostic_run`
     - `settings_alert_thresholds_updated`
     - `project_instance_created`
     - `project_instance_archived`
     - `usage_context_pressure_evaluated`
     - `alert_context_pressure_triggered`
     - `alert_idle_agent_triggered`
     - `alert_daily_cost_triggered`

6. **#9 / #10 用量统计支持 period + 自定义时间范围**
   - `src/services/usage-service.ts`
   - `src/controllers/usage-controller.ts`
   - 支持：
     - `?period=today|week|month`
     - `?from=timestamp&to=timestamp`
   - 覆盖接口：
     - `/api/v1/usage`
     - `/api/v1/usage/by-agent`
     - `/api/v1/usage/by-model`
     - `/api/v1/usage/context-pressure`
   - 响应补充 `period/from/to`

7. **#11 超限口径对齐到“实际日累计成本 vs 配置阈值”**
   - `src/controllers/usage-controller.ts`
   - 聚合 `/usage` 总成本后触发 `checkAndNotifyDailyCost(totalCost)`
   - 不再只检查 context pressure，日费用阈值链路可工作

## 额外修正
- `src/services/budget-service.ts`：适配新的 usage 查询参数对象，避免类型错误
- 已通过：`npx tsc --noEmit`
- 已验证（本地 3015 端口临时启动）：
  - `/api/v1/diagnostic`
  - `/api/v1/settings`
  - `/api/v1/instances`
  - `/api/v1/usage?period=month`
  - `/api/v1/usage?from=...&to=...`
  - `/api/v1/usage/by-agent?period=month`
  - `/api/v1/usage/context-pressure?from=...&to=...`

## 风险 / 备注
- 当前 3014 常驻服务仍是旧进程；代码已修，需由运行环境重启服务后才会对主端口生效。
- `npm run verify` 失败点是仓库原有校验脚本对 `/api/v1/agents` 的缓存断言，不是本次修改引入；本次改动已独立通过 TypeScript 编译和关键接口 smoke test。
