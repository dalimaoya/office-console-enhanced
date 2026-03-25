# 前端 Dashboard 原型联调验证（Ezreal）

## 1. 完成内容
- 已在 `artifacts/frontend-validation-scaffold/` 内完成 dashboard 页面原型重构。
- 已按 `contracts/2026-03-14-office-dashboard-api-contract.md` 对齐前端 DTO、请求层与页面展示。
- 已补齐办公友好的界面结构：
  - 系统状态摘要
  - Agent 状态分布图
  - 关键指标速览图
  - 工作空间动态表
  - 告警与建议区
  - 缓存/降级标签与说明

## 2. 关键实现点
### 2.1 接口与数据契约
- 请求地址：`GET /office/dashboard`
- 支持 `VITE_API_BASE_URL`
- 支持 Bearer Token 注入（`VITE_AUTH_TOKEN`）
- 兼容 Cookie 模式（`withCredentials=true`）

### 2.2 cached / stale 展示
- `cached=true`：显示“缓存命中”标签
- `stale=true`：显示“降级快照”标签与提醒文案
- `cacheExpiresAt`：换算成“缓存将在 xx 秒后过期”文案
- 若 503 返回 `cachedData`，前端自动回退并渲染最近可用快照

### 2.3 错误处理
- `401`：展示认证失效态，提示重新提供登录态或 Token
- 通用 5xx / 网络错误：展示统一错误页与重试按钮
- fallback cachedData：自动使用缓存数据，同时提示“接口刚刚异常，当前显示最近可用数据”

### 2.4 性能处理
- React Query `staleTime=60s`
- `refetchInterval=20s`
- `refetchOnWindowFocus=false`
- ECharts 按组件级初始化，避免额外封装依赖

## 3. 本地验证结果
### 3.1 通过项
- `npm run typecheck` ✅
- `npm run build` ✅
- `npm start` 可直接运行 Vite 开发服务（脚本已补充） ✅

### 3.2 风险项
- 构建产物仍存在大包告警（Ant Design + ECharts 组合导致主包偏大）
- 后续进入 MVP 开发建议补充：
  1. 图表区动态 import
  2. 路由级拆包
  3. Ant Design 按需优化

## 4. 真实联调结果
### 4.1 已执行探测
```bash
curl http://localhost:8080/api/office/dashboard
```

### 4.2 当前结果
- 当前环境返回：`Failed to connect to localhost port 8080`
- 结论：**前端已完成契约适配，但本轮运行环境中后端适配层未启动或未暴露该地址，因此真实联调尚未完成最终确认。**

## 5. 下一步建议
1. Leona 启动适配层并暴露 `GET /office/dashboard`
2. 将 `.env` 切换为：
   - `VITE_USE_MOCK=false`
   - `VITE_API_BASE_URL=http://localhost:8080/api`
3. 再执行一轮真实联调与错误注入验证（401 / 503 fallbackData）
