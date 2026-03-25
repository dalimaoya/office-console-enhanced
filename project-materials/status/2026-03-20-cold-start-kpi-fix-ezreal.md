# 2026-03-20 Cold-Start 卡片字段映射修复（Ezreal）

## 修复摘要

根据 Galio 排查结论，修复 `loadColdStart()` 中 4 处 DTO 字段读取错配。

## 修复文件

- `artifacts/office-dashboard-adapter/src/public/app.js`
- 函数：`loadColdStart()`（约第 4616 行）

## 改动点

| 指标 | 旧字段（错误） | 新字段（正确） |
|------|--------------|--------------|
| 当前项目阶段 | `data.currentPhase \|\| data.phase` | `data.projectStage?.currentStage`（优先），旧字段兜底 |
| 活跃对象数 | `data.activeObjects`（数组，误当数字） | `data.activeObjectCount`（数字），回退 `data.activeObjects.length` |
| 阻塞项文案 | `b.message`（不存在字段） | `b.description`（真实字段），回退 `b.id` |
| 最近事件类型 | `lastEvent.type \|\| lastEvent.event` | `lastEvent.event_type`（优先） |
| 最近事件描述 | `lastEvent.message` | `lastEvent.description`（优先） |
| 最近事件时间 | `lastEvent.timestamp` | `lastEvent.ts`（优先），回退 `lastEvent.timestamp` |

## 预期修复效果

- 活跃对象数应显示 `3`（而非 `[object Array]`）
- 阻塞项数量 `3`，列表正确显示三条 description 文案
- 当前项目阶段显示 `active`
- 最近事件显示 `system.healthcheck_passed / Dashboard 请求成功`

## 修复策略

所有修复均采用**优先新字段、旧字段兜底**策略，保持向后兼容，不破坏其他环境。

## 建议下一步

1. 在测试/预览环境启动 Dashboard，人工回归验证上述 4 项指标
2. 如有 E2E 或快照测试，建议补充 `loadColdStart()` 的字段断言
3. 建议后续抽出 `normalizeColdStartPayload()` 做契约隔离，防止字段漂移再次造成问题
