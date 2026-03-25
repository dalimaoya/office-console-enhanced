# 2026-03-13 真实联调验证结果（Leona）

## 范围
对办公控制台 dashboard 前后端原型进行真实联调验证，覆盖：
- 前端真实调用后端 `GET /office/dashboard`
- DTO/接口契约一致性检查
- 缓存命中与 stale 展示验证
- 401 / Gateway 失败场景验证
- 基础性能验证

## 本次联调环境
- 前端：`artifacts/frontend-validation-scaffold/`
- 后端：`artifacts/office-dashboard-adapter/`
- 前端访问地址：`http://127.0.0.1:8080/`
- 后端接口地址：`http://127.0.0.1:3014/office/dashboard`
- 鉴权 Token：`dev-office-dashboard-token`

## 关键配置调整
### 1. 前端切换到真实 API
新增 `artifacts/frontend-validation-scaffold/.env`：
```env
VITE_API_BASE_URL=/api
VITE_USE_MOCK=false
VITE_AUTH_TOKEN=dev-office-dashboard-token
```

### 2. 解决浏览器 CORS 阻塞
真实联调初次失败，原因是前端从 `8080` 直连 `3014` 被浏览器拦截。

已在 `vite.config.ts` / `vite.config.js` 增加开发代理：
- `/api/* -> http://127.0.0.1:3014/*`
- 自动去掉 `/api` 前缀

这使前端无需修改请求代码即可完成真实联调。

## 验证结果

### A. 前后端真实联通
**结果：通过**

验证方式：
- 直接访问 `http://127.0.0.1:8080/api/office/dashboard`
- Playwright headless 打开 `http://127.0.0.1:8080/`

页面已成功展示：
- 办公控制台今日运行概况
- 系统状态卡
- 活跃 Agent 卡
- 活跃工作空间卡
- 告警区
- 工作空间动态表
- 办公解读区
- 缓存命中标签

### B. DTO / 接口契约一致性
**结果：通过（主路径）**

实际返回数据已覆盖前端依赖字段：
- `system.status / uptime / version / lastCheck / performance.avgResponseMs / performance.health`
- `agents.total / active / statusBreakdown / quickStats`
- `workspaces.activeCount / recentActivity`
- `alerts[]`
- `cached / cacheExpiresAt / stale`

前端页面已按契约正常渲染，没有出现字段缺失导致的渲染报错。

### C. 缓存机制验证
**结果：通过**

#### 1) 缓存命中
前端页面可正确显示：
- `缓存命中`
- `当前为缓存结果`
- `缓存将在 X 秒后过期`

#### 2) 缓存接口性能
对现网 `3014` 适配层连续请求 15 次：
```json
{
  "count": 15,
  "avgMs": 1.7,
  "p95Ms": 7.13,
  "maxMs": 7.13,
  "apiCached": true,
  "apiStale": false,
  "apiReportedAvgResponseMs": 4586
}
```

结论：
- **缓存命中响应性能优秀**（P95 ≈ 7ms）
- 页面体验主要受首屏资源与首次查询影响，不受缓存接口拖累

### D. stale / 降级展示验证
**结果：部分通过，发现后端缺陷**

我构造了一个 Gateway 调用失败的临时适配层实例（3015），并注入过期但仍在 stale 窗口内的快照。

验证到：
- 适配层可返回 `cached=true, stale=true`
- 返回体 `meta.fallbackReason=background_refresh`
- 说明前端的 `stale` 展示逻辑具备可用性

但同时发现：
- 后端后台刷新失败时出现**未处理异常导致进程退出**
- 因此在“持续失败 + stale 窗口”场景下，服务稳定性不足
- 契约中的 `503 + cachedData` fallback 路径在当前实现里**较难稳定触发，疑似逻辑存在死角**

### E. 401 错误处理
**结果：通过（接口层）**

未带 Token 请求：
- 返回 `401 Unauthorized`
- 返回体为：
```json
{
  "error": "authentication_required",
  "message": "Valid OpenClaw authentication token required"
}
```

前端代码已具备 401 专属提示页逻辑，接口语义与前端预期一致。

### F. 页面性能验证
**结果：通过（前端页面体验），不通过（后端未命中目标）**

#### 前端页面加载（Playwright 5 次）
以“页面打开到出现 `办公控制台今日运行概况` + `缓存命中` 标签”为准：
```json
{
  "count": 5,
  "avgMs": 1006.1,
  "p95Ms": 1590.58
}
```

结论：
- **页面侧 P95 ≈ 1591ms，满足 P95 ≤ 2000ms 目标**

#### 后端聚合耗时
接口返回中 `system.performance.avgResponseMs` 持续约 `4.5s~4.7s`。

结论：
- **缓存命中场景满足目标**
- **缓存未命中/真实聚合场景不满足 ≤ 2000ms 目标**
- 当前瓶颈主要在 `openclaw gateway call status / agents.list / config.get`

## 发现的问题

### 1. 真实联调首个阻塞：CORS
- 现象：前端浏览器请求被拦截
- 处理：改为 Vite dev proxy
- 状态：已解决

### 2. 后端 stale 刷新失败会导致进程退出
- 现象：模拟 Gateway 失败时，后台刷新异常未被完全兜住，临时适配层崩溃
- 影响：降级场景稳定性不足
- 优先级：高

### 3. `503 + cachedData` 降级契约路径可达性存疑
- 现象：当前实现更容易返回 `200 + stale=true`，而不是 `503 + cachedData`
- 影响：与契约中的 fallback 设计不完全一致
- 优先级：高

### 4. 非缓存聚合性能偏慢
- 现象：实际聚合平均约 4.6s
- 影响：不满足未命中场景 SLA
- 优先级：中高

## 最终结论

### 已通过
- [x] 前端成功从后端获取 dashboard 数据并正确渲染
- [x] 主 DTO 结构与接口契约匹配
- [x] 缓存标识可正确展示
- [x] 401 接口错误语义符合前端处理预期
- [x] 页面侧 P95 ≤ 2000ms

### 未完全通过
- [ ] 降级链路稳定性仍不足（后台刷新失败可能崩溃）
- [ ] `503 + cachedData` fallback 契约路径需再核查/修正
- [ ] 未命中聚合性能未达标（约 4.6s > 2s）

## 建议下一步
1. 后端修复 stale 背景刷新异常兜底，确保失败不崩进程。
2. 明确并修正 `503 + cachedData` 触发条件，使其与契约一致且可验证。
3. 优化 Gateway 聚合：
   - 评估并行调用之外的进一步缓存/采样策略
   - 降低 CLI 调用频率或改为更轻量通道
4. 前端保留当前 Vite 代理配置作为开发联调默认方案。
