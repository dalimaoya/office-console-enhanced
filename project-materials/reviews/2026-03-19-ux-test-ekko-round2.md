# UX 测试报告 Round 2 — 艾克（product-ekko）

**测试时间**：2026-03-19 12:50 UTC  
**测试轮次**：Round 2（针对修复后功能验证）  
**测试人**：艾克（product-ekko）  
**测试目标**：http://localhost:3014  
**测试方法**：API curl 验证 + 前端源码逻辑分析  

---

## 一、测试结论摘要

| 测试项 | 状态 | 说明 |
|--------|------|------|
| 用量统计 - Token/费用汇总 | ✅ 通过 | API 返回真实数据，前端正确渲染 |
| 用量统计 - 饼图渲染 | ✅ 通过 | by-agent 数据有效，饼图可渲染 |
| 用量统计 - Agent 中文名（汇总栏） | ⚠️ 部分通过 | 详情表格显示中文名，摘要 bar 仍显示 agentId |
| 上下文压力 - 非零百分比 | ✅ 通过 | API 返回非零值，如 teemo 235%, jayce/galio/ezreal 100% |
| 上下文压力 - 进度条颜色分级 | ❌ 失败 | `barCls` 变量未定义，颜色 class 无法生效 |
| Overview - "去配置"按钮跳转 Settings | ✅ 通过 | `<a href="#settings">` 已正确实现 |
| Agent 状态 - Azir/main 不再误显示执行任务 | ✅ 通过 | `currentTask: null`，任务行不渲染 |
| 整体数据连通性 | ✅ 通过 | 全部 5 个 API 端点正常返回 |

---

## 二、详细测试结果

### 1. 用量统计页（Usage）

#### 1.1 Token 与费用汇总

**API 响应**（`GET /api/v1/usage`）：
```json
{
  "success": true,
  "data": {
    "totalTokens": 44278748,
    "totalCost": 46.244307,
    "byAgent": [...9项],
    "period": "today"
  }
}
```

**结论**：✅ 有效真实数据。前端 `renderUsage()` 正确读取 `totalTokens` / `totalCost` 并渲染为：
- 总 Token：4426.9 万
- 总费用：$46.2443

**不再显示"无用量数据"**。

#### 1.2 饼图渲染

**API 响应**（`GET /api/v1/usage/by-agent`）：返回 12 个 Agent 条目，含 `totalToken`、`displayName` 等字段。

`renderUsagePieChart()` 筛选 `totalToken > 0` 的条目后生成 conic-gradient 饼图。实际有数据的 Agent（teemo、ezreal、jayce 等）均有 token，饼图可渲染。

**结论**：✅ 饼图数据条件满足，不再进入"无用量数据"分支。

#### 1.3 Agent 中文名显示

- **详情表格**（by-agent section）：使用 `item.displayName || item.agentId`，API 返回 `displayName` 包含中文名（如"提莫"、"伊泽瑞尔"、"加里奥"等）。✅
- **摘要栏 Agent bar**：`renderUsage()` 使用 `/api/v1/usage` 的 `byAgent` 数据，该接口只返回 `agentId` 无 `displayName`，代码直接用 `agent.agentId`（如 `agent-orchestrator-teemo`）。⚠️

**结论**：⚠️ 部分通过。详情表格已显示中文名，但摘要 bar 栏仍显示英文 agentId。

**建议修复**：在 `renderUsage()` 中合并 `usageState.byAgent` 数据以补充 `displayName`，或直接在 summery bar 中使用 by-agent 数据。

---

### 2. 上下文压力（Context Pressure）

#### 2.1 非零百分比

**API 响应**（`GET /api/v1/usage/context-pressure`）：
```
- agent-orchestrator-teemo: pressureRatio=2.3554 → pct=100% (超限), level=critical
- agent-aioffice-jayce: pressureRatio=1 → pct=100%, level=critical
- agent-codingqa-galio: pressureRatio=1 → pct=100%, level=critical
- agent-frontend-ezreal: pressureRatio=1 → pct=100%, level=critical
- agent-architect-jax: pressureRatio=0.5637 → pct=56%, level=warning
- agent-ui-lux: pressureRatio=0.4707 → pct=47%, level=normal
- agent-backend-leona: pressureRatio=0.3187 → pct=32%, level=normal
- agent-product-ekko: pressureRatio=0.034 → pct=3%, level=normal
- main: pressureRatio=0.0024 → pct=0%, level=normal
```

**结论**：✅ 数据非零，各 Agent 压力等级正确分类（normal / warning / critical）。

#### 2.2 进度条颜色分级 ❌ BUG

**源码问题**（app.js ~3238 行）：

```javascript
el.innerHTML = items.map((item) => {
    const level = item.level ?? ...;
    const pct   = Math.min(100, Math.round(ratio * 100));
    return `
      <div class="context-bar-fill ${barCls}" style="width:${pct}%"></div>  // ← barCls 从未定义！
    `;
}).join('');
```

`barCls` 变量在 `.map()` 回调内**从未赋值**，JavaScript 中引用未定义变量会导致 `ReferenceError`，或若为外部作用域的历史残留则值为 `undefined`，class 属性将变成 `"context-bar-fill undefined"`，导致颜色 class 失效。

**预期应为**：
```javascript
const barCls = level === 'critical' ? 'bar-critical' : level === 'warning' ? 'bar-warning' : 'bar-normal';
```

**结论**：❌ 进度条颜色分级无法正常工作，需修复 `barCls` 赋值缺失问题。

---

### 3. Overview 页 — Connection Health 卡片"去配置"按钮

**HTML 源码**（index.html 第 136 行）：
```html
<a href="#settings" class="health-card-action" id="connection-health-action-btn">去配置 →</a>
```

**结论**：✅ 已正确改为 `<a href="#settings">`，点击可跳转至 Settings 路由，符合修复要求。

---

### 4. Agent 状态 — Azir/main 是否误显示"正在执行任务"

**API 响应**（`GET /api/v1/agents`）：
```json
{
  "id": "main",
  "name": "Azir",
  "status": "working",
  "statusDetail": {
    "state": "working",
    "currentTask": null,   // ← null
    "pendingTaskCount": 0
  }
}
```

**前端逻辑**（app.js ~1632 行）：
```javascript
${sd.currentTask ? `<div class="agent-card-task">🔧 ${escapeHtml(sd.currentTask)}</div>` : ''}
```

`currentTask === null` → 条件为 falsy → 任务行不渲染。

**结论**：✅ Azir/main 虽然 `status === "working"`，但 `currentTask: null`，不会再误显示"正在执行任务"。Badge 仅显示"工作中"，无任务文字。

---

### 5. 整体数据连通性

| API 端点 | 状态码 | success | 数据 |
|----------|--------|---------|------|
| `/api/v1/usage` | 200 | true | totalTokens: 44,278,748 |
| `/api/v1/usage/by-agent` | 200 | true | 12 个 Agent 含中文 displayName |
| `/api/v1/usage/context-pressure` | 200 | true | 12 个 Agent 含 pressureRatio |
| `/api/v1/agents` | 200 | true | 12 个 Agent 状态 |
| `/api/v1/status` | 200 | ok: true | 系统正常，uptime: 612s |

**结论**：✅ 全部 5 个 API 端点正常，数据连通性良好。

---

## 三、发现的问题

### P1 — 上下文压力进度条颜色 Class 失效

- **位置**：`app.js` `renderContextPressure()` 函数，约第 3238 行
- **问题**：`barCls` 变量使用但未定义，导致进度条颜色分级 class 无法生效
- **影响**：颜色区分（normal/warning/critical）视觉失效，用户无法快速识别高压状态
- **修复**：在 `.map()` 回调内添加：
  ```javascript
  const barCls = level === 'critical' ? 'bar-critical' : level === 'warning' ? 'bar-warning' : 'bar-normal';
  ```

### P2 — 用量摘要 bar 显示 agentId 而非中文名（低优先级）

- **位置**：`app.js` `renderUsage()` 函数，约第 2998 行
- **问题**：使用 `/api/v1/usage` 的 `byAgent` 数组，该数组无 `displayName`，只有 `agentId`
- **影响**：用量摘要 bar 区域显示英文 ID（如 `agent-orchestrator-teemo`）而非中文名"提莫"
- **修复方案**：合并 `usageState.byAgent`（来自 `/api/v1/usage/by-agent`）的 `displayName` 字段

---

## 四、测试结论

本轮测试 **5 项修复点中 4.5 项通过**：
- ✅ Token/费用汇总有数据
- ✅ 饼图可渲染
- ⚠️ Agent 中文名部分支持（详情表格 ✅，摘要 bar ⚠️）
- ✅ Context Pressure 非零百分比
- ❌ 进度条颜色分级失效（`barCls` 未定义）
- ✅ Overview"去配置"按钮跳转正常
- ✅ Azir/main 不再误显示"正在执行任务"
- ✅ 所有 API 端点数据连通

**优先修复项**：`renderContextPressure()` 中的 `barCls` 未定义 BUG（P1）。
