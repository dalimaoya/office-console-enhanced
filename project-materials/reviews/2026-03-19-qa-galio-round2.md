# 办公增强控制台技术验收报告（Round 2）

- 时间：2026-03-19 12:50 UTC
- 验收角色：codingqa-galio
- 验收对象：办公增强控制台 `http://localhost:3014`
- 验收范围：今日字段映射修复、Agent 状态修复、缓存修复、导航修复

## 验收结论总览

| 项目 | 结果 | 结论 |
|---|---|---|
| 1. 用量统计字段映射 | **部分通过 / 总体失败** | `/api/v1/usage/by-agent` 与前端读取逻辑已对齐；但 `/api/v1/usage` 仍返回旧字段 `totalTokens/totalCost/byAgent.tokens/cost`，前端 `renderUsage()` 也仍按旧字段读取，不满足本轮要求的统一字段口径 |
| 2. 上下文压力字段映射 | **部分通过 / 总体失败** | 前端已正确读取 `contextUsedEstimate/contextWindowMax/pressureRatio/level`；但 `renderContextPressure()` 模板中引用了未定义变量 `barCls`，页面渲染存在运行时风险 |
| 3. probe 文件排除 / Agent 状态 | **失败** | `/api/v1/agents` 中 `main`（Azir）仍显示 `working`，但 `currentTask=null`、`pendingTaskCount=0`，状态不合理；说明本轮修复未被有效验证通过 |
| 4. no-store 头 | **部分通过 / 总体失败** | `/assets/app.js` 已返回 `Cache-Control: no-store`；但 `/api/v1/status` GET 响应头中未见 `Cache-Control: no-store` |
| 5. 去配置按钮导航 | **通过** | `index.html` 中 `connection-health-action-btn` 已改为 `<a href="#settings">` |

## 详细验收记录

### 1) 字段映射修复：用量统计

#### 接口返回核验
- `/api/v1/usage/by-agent` 返回字段已包含：
  - `displayName`
  - `tokenIn`
  - `tokenOut`
  - `totalToken`
  - `costEstimateUSD`
- 实测样例：
  - `agent-orchestrator-teemo 提莫 0 0 42151289 42.721954`
  - `agent-frontend-ezreal 伊泽瑞尔 0 0 1083035 1.196797`

#### 前端读取核验
`src/public/app.js` 中 `renderUsageByAgent()` 已读取：
- `displayName || item.agentId || item.name`
- `item.tokenIn ?? item.inputTokens ?? item.input_tokens`
- `item.tokenOut ?? item.outputTokens ?? item.output_tokens`
- `item.costEstimateUSD ?? item.estimatedCost ?? item.cost`

#### 问题点
- `/api/v1/usage` 当前仍返回旧结构：
  - `totalTokens`
  - `totalCost`
  - `byAgent[].tokens`
  - `byAgent[].cost`
- 前端 `renderUsage()` 仍使用旧字段：
  - `d.totalTokens ?? 0`
  - `d.totalCost ?? 0`
  - `byAgent.sort((a, b) => (b.tokens || 0) - (a.tokens || 0))`

#### 判定
- **判定：部分通过 / 总体失败**
- 原因：`/api/v1/usage/by-agent` 这一路修复已生效，但 `/api/v1/usage` 与前端总览读取逻辑仍是旧口径，不满足“用量统计字段映射修复”整体验收通过标准。

---

### 2) 字段映射修复：上下文压力

#### 接口返回核验
`/api/v1/usage/context-pressure` 返回字段符合要求：
- `contextUsedEstimate`
- `contextWindowMax`
- `pressureRatio`
- `level`

实测样例：
- `agent-orchestrator-teemo 473622 200000 2.3681 critical`
- `agent-frontend-ezreal 200000 200000 1 critical`

#### 前端读取核验
`renderContextPressure()` 已读取：
- `item.contextUsedEstimate ?? item.usedContext ?? item.used`
- `item.contextWindowMax ?? item.maxContext ?? item.max`
- `item.pressureRatio ?? (max > 0 ? used / max : 0)`
- `item.level ?? item.pressureLevel ?? 'normal'`

#### 问题点
- 同函数模板中存在：
  - `<div class="context-bar-fill ${barCls}" style="width:${pct}%"></div>`
- 但当前函数内**未定义 `barCls`**，存在前端运行时报错或渲染异常风险。

#### 判定
- **判定：部分通过 / 总体失败**
- 原因：字段读取点已修正，但页面渲染逻辑仍有明显缺陷，不能算完整通过。

---

### 3) Agent 状态修复：probe 文件排除

#### 接口核验
`/api/v1/agents` 关键结果：
- `main working`
- `agent-orchestrator-teemo working`

其中 `main` 返回内容：
- `status = working`
- `currentTask = null`
- `pendingTaskCount = 0`

#### 判定
- **判定：失败**
- 原因：`main/Azir` 在无当前任务、无待处理任务情况下仍为 `working`，不符合“应排除 probe-*.jsonl，不应再误判 working”的验收要求。
- 注：`agent-orchestrator-teemo` 当前处于实际活跃会话附近，显示 `working` 可接受；但 `main/Azir` 仍异常。

---

### 4) 缓存修复：no-store 头

#### 实测结果
- `curl -sI http://localhost:3014/assets/app.js`
  - 返回：`Cache-Control: no-store`
- `curl -sI -X GET http://localhost:3014/api/v1/status`
  - **未返回** `Cache-Control: no-store`

#### 判定
- **判定：部分通过 / 总体失败**
- 原因：静态前端 JS 已正确禁缓存，但 `/api/v1/status` GET 头未达到要求。

---

### 5) 导航修复：去配置按钮

#### 文件核验
`src/public/index.html` 中已确认：
```html
<a href="#settings" class="health-card-action" id="connection-health-action-btn">去配置 →</a>
```

#### 判定
- **判定：通过**

---

## 关键证据摘录

### `/assets/app.js` 响应头
```http
HTTP/1.1 200 OK
Cache-Control: no-store
```

### `/api/v1/status` 响应头
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
```
> 未见 `Cache-Control: no-store`

### `/api/v1/agents` 关键状态
```text
main working
agent-orchestrator-teemo working
```

### `connection-health-action-btn` 结构
```html
<a href="#settings" class="health-card-action" id="connection-health-action-btn">去配置 →</a>
```

## 总体结论

本轮验收**未通过**。

已确认真正通过的修复只有：
1. `connection-health-action-btn` 导航改为 `href="#settings"`
2. `/assets/app.js` 已带 `Cache-Control: no-store`
3. `/api/v1/usage/by-agent` 与前端表格字段读取基本对齐
4. `/api/v1/usage/context-pressure` 字段名已与前端读取逻辑对齐

但仍存在以下阻断项：
1. `/api/v1/usage` 与前端 `renderUsage()` 仍使用旧字段口径
2. `renderContextPressure()` 引用了未定义变量 `barCls`
3. `main/Azir` 状态仍异常显示 `working`
4. `/api/v1/status` GET 未返回 `Cache-Control: no-store`

## 建议回修项

1. 统一 `/api/v1/usage` 与前端总览使用的新字段命名口径，避免一半新一半旧。
2. 立即修复 `renderContextPressure()` 中 `barCls` 未定义问题。
3. 继续排查 `getAgentLastActiveMs()` 对 `main/Azir` 的活跃判定来源，确认是否仍被 probe 文件或其他非任务文件干扰。
4. 给 `/api/v1/status` GET 明确补齐 `Cache-Control: no-store` 响应头。
