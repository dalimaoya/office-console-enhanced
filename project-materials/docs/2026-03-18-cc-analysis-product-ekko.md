# CC UI 模式分析报告

**作者**: Ekko（product-ekko）  
**日期**: 2026-03-18  
**来源**: https://github.com/TianyiDataScience/openclaw-control-center  
**分析重点**: 可直接借鉴的前端 UI 实现，而非宏观差距分析

---

## 0. 背景

Galio（2026-03-17）差距分析结论：我们功能覆盖约 42%，整体评分 66%。  
本次聚焦 CC 的 **具体 UI 实现**，目的是找出可以直接"抄"的 DOM 结构、CSS 类名、交互模式。

CC 核心技术：纯 Node.js SSR + 内联 CSS + 内联 JS，全部在 `src/ui/server.ts`（18024 行）。  
数据模型在 `src/types.ts`，后端运行时在 `src/runtime/`。

---

## 1. Overview / Dashboard 页面

### CC 的做法

**信息架构**：三栏布局（左侧导航 sidebar → 主内容 panel → 右侧 inspector-sidebar）

```html
<div class="app-shell">
  <aside class="sidebar">          <!-- 左栏：品牌 + 导航 -->
  <main class="panel">             <!-- 主区：section 内容 -->
  <aside class="sidebar inspector-sidebar">  <!-- 右栏：状态摘要 + 用量 + 活跃 agent -->
</div>
```

右栏可折叠（`body.inspector-collapsed` class 切换），使用 `localStorage` 持久化状态，通过按钮 `#inspector-toggle` 触发。宽度阈值 `>1320px` 才默认展开。

**KPI 卡片组（`.overview-kpi-grid`）**：

```css
.overview-kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);  /* 约8px */
}
.overview-kpi-card {
  border: 1px solid var(--card-border);
  border-radius: 20px;
  padding: var(--space-2);
  background: var(--card-fill-soft);
  position: relative;
  overflow: hidden;
}
.overview-kpi-card::before {
  /* 顶部蓝色渐变高亮线 */
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(0,113,227,0.74), rgba(91,183,255,0.72));
}
.overview-kpi-value {
  margin-top: 8px;
  font-size: 42px;  /* 大数字，用 tabular-nums */
  line-height: 1;
  letter-spacing: -0.03em;
  font-weight: 740;
  font-variant-numeric: tabular-nums;
}
```

KPI 卡片字段（5 个）：
- `key: "review-queue"` → 标题"审阅队列" / 数字 / 次级说明
- `key: "runtime-issues"` → "运行异常" / 数字 / 状态描述
- `key: "stalled-runs"` → "停滞执行" / 数字
- `key: "budget-risk"` → "预算风险" / 数字
- `key: "today-usage"` → "今日用量" / token 数 / 费用

卡片有状态着色：`tone-warn`（黄色）/ `tone-neutral`（灰色）/ 默认蓝色

**warn 状态 CSS**：
```css
.overview-kpi-card.tone-warn {
  border-color: rgba(181,127,16,0.3);
  background: linear-gradient(180deg, rgba(255,251,243,0.98), rgba(255,255,255,0.96));
}
.overview-kpi-card.tone-warn::before {
  background: linear-gradient(90deg, rgba(194,136,25,0.84), rgba(230,179,76,0.7));
}
```

**Executive Cards（`.executive-grid`）**：  
6 项大指标：Projects / Tasks / Agents / Budget / Subscription / System health  
每项 CSS `.exec-card` 字段：`.exec-title`（11px 大写）、`.exec-metric`（30px 数字）、`.meta`（补充说明）

**数字动画**：KPI 数字带有计数动画，通过 `data-counter-key` / `data-counter-target` / `data-counter-format` 属性驱动。

### 我们当前状态

- 无三栏布局，无右侧 inspector sidebar
- 无带颜色状态线的 KPI 卡片组
- 无数字计数动画

### 建议改进

1. **立即抄**：`.overview-kpi-grid` + `.overview-kpi-card` CSS 结构，实现 5 个 KPI 卡片，顶部加 3px 渐变线区分状态
2. **右侧 inspector sidebar**：固定显示"活跃会话数 / 审阅队列 / 今日用量"三行 meta，可折叠。折叠状态存 `localStorage`，key 建议 `openclaw:inspector-collapsed:v1`
3. **数字计数动画**：数字加载时从 0 计到目标值，CSS 实现或 JS requestAnimationFrame 递增，`data-counter-target` 属性驱动

---

## 2. Agent 列表页（Staff / 办公地图）

### CC 的做法

**四区域布局（`.office-floor`）**：
```
Builder Desks / Approval Desk / Support Bay / Standby Pods
```

每个区域 `<section class="zone">` 包含 `<ul class="desk-list">`。

**Agent 卡片（`.office-card`）**：
```html
<article class="office-card">
  <div class="office-head">
    <div class="agent-avatar" 
         style="--agent-accent: #4f9cf4;"
         data-agent-id="product-ekko"
         data-animal="fox"
         data-avatar-mode="pixel">
      <canvas class="agent-pixel-canvas" width="224" height="160"></canvas>
      <div class="agent-animal-label">Fox</div>
    </div>
    <div class="office-info">
      <div class="topline">
        <strong>Product Ekko</strong>
        [badge: running/idle/blocked]
      </div>
      <div class="meta"><strong>状态标签</strong> · 摘要描述</div>
      <div class="meta">活跃会话：N · 活跃任务：N</div>
    </div>
  </div>
  <!-- 当前重点 -->
  当前重点：任务名称
</article>
```

**状态类型（`AgentRunState`）**：
```typescript
type AgentRunState = "idle" | "running" | "blocked" | "waiting_approval" | "error";
```

CSS badge 颜色系统：
```css
.badge.ok, .badge.done { color: #1d7435; border-color: rgba(36,138,61,0.3); background: rgba(238,251,242,0.95); }
.badge.warn { color: #94680e; border-color: rgba(181,127,16,0.32); background: rgba(255,248,232,0.95); }
.badge.over, .badge.blocked, .badge.action-required { color: #b53125; border-color: rgba(210,63,49,0.34); background: rgba(255,240,238,0.95); }
.badge.info, .badge.in_progress, .badge.active { color: #0059b4; border-color: rgba(0,113,227,0.32); background: rgba(236,246,255,0.95); }
.badge.todo, .badge.idle { color: #666a70; border-color: rgba(125,129,136,0.3); background: rgba(248,248,249,0.95); }
```

**像素动物头像**：每个 agent 通过 `agentId` 关键词哈希映射到一种动物（fox/bear/owl 等），`--agent-accent` CSS 变量设置个性颜色，canvas 渲染像素图。

**Staff Overview Card（精简版）**：  
Overview 页面还有精简的 staffOverviewCards，显示"正在做什么"摘要：
- 字段：`agentId`、`statusLabel`、`summary`（当前任务摘要）、`activeSessions`、`activeTasks`

### 我们当前状态

- 无 Agent 卡片，只有文字列表或状态表格
- 无状态分区（活跃/阻塞/待机）
- 无头像/识别图标

### 建议改进

1. **立即抄 badge 系统**：复制 CC badge CSS，统一全站状态颜色（running=蓝、blocked=红、idle=灰、ok=绿、warn=黄）
2. **Agent 卡片三行布局**：`名称 + badge` / `当前重点：XXX` / `活跃会话 N · 活跃任务 N`
3. **分区显示**：将 agent 按状态分组，"活跃区"/"待机区"/"阻塞区"
4. **暂不必抄像素头像**：可用 emoji 或首字母颜色圆圈替代，降低实现成本

---

## 3. 任务管理页

### CC 的做法

**看板视图（`.board`）**：
```css
.board { 
  margin-top: 10px; 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); 
  gap: 12px; 
}
.lane {
  /* 泳道容器 */
}
.lane h3 { font-size: 14px; }
.lane-count { color: var(--muted); font-size: 12px; margin-top: 3px; }
```

**任务卡片（`.task-chip`）**：
```html
<div class="task-chip">
  <div><code>task-001</code></div>
  <div>任务标题</div>
  <div class="meta">projectId · owner</div>
</div>
```

**分组列表视图（`.group-list`）**：  
比看板更详细的视图：
```html
<li class="group-item">
  <div class="group-item-head">
    <strong>任务标题</strong>
    [badge: in_progress]
  </div>
  <div class="meta"><code>task-001</code> · project-name · 负责人 agent-name</div>
  <div class="meta">截止 2026-03-20 · 更新 2026-03-18</div>
  <div class="meta"><a href="/tasks/task-001">查看任务详情页</a></div>
</li>
```

**快速筛选器（`.quick-chip`）**：
```typescript
UI_QUICK_FILTERS = ["all", "attention", "todo", "in_progress", "blocked", "done"]
```
对应标签：Everything / Needs Attention / Ready To Start / In Motion / Blocked / Completed

筛选器实现为纯链接 `<a class="quick-chip active" href="/?quick=in_progress">In Motion</a>`，不用 JS，URL 驱动状态。

**审批操作 UI**：  
审批项在 Overview 页"需要你介入"区域展示：
```html
<strong>command 名称</strong>
<div class="meta">[badge: pending] agentId</div>
```
在 Tasks 页"审批请求"折叠块中：
```html
<ul class="story-list">
  <li>[badge: pending] exec bash ... · <strong>agent-name</strong> · 提交于 2026-03-18</li>
</ul>
```
审批通过 API：`POST /api/approvals/:approvalId/approve`（需要本地 token）

**任务数据模型**（`ProjectTask` in `src/types.ts`）：
```typescript
interface ProjectTask {
  projectId, taskId, title, status: TaskState,
  owner, dueAt, definitionOfDone: string[],
  artifacts: TaskArtifact[], rollback: RollbackPlan,
  sessionKeys: string[], budget: BudgetThresholds,
  updatedAt
}
```

### 我们当前状态

- 无看板视图，任务以飞书表格呈现
- 筛选需要手动操作飞书筛选器
- 审批无专用 UI

### 建议改进

1. **立即抄看板 CSS**：3 列泳道（Todo / In Progress / Blocked），`grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))`
2. **快速筛选器**：顶部横向 chip 筛选，URL 参数驱动，不需要 JS：`?quick=blocked`
3. **审批队列**：Overview 页添加"待审批"折叠区，`<ul class="story-list">` 每项显示 `command + agent + badge(pending)`
4. **任务字段对齐**：添加 `definitionOfDone`、`sessionKeys`、`budget.cost` 字段

---

## 4. 搜索体验

### CC 的做法

**文档/文件搜索**（在 Documents 页，`#docs-search-input`）：
```javascript
// client-side 实时筛选，data-file-search 属性存储可搜索文本
const needle = docsSearchInput.value.trim().toLowerCase();
document.querySelectorAll('[data-file-item]').forEach(item => {
  const haystack = item.getAttribute('data-file-search') ?? '';
  item.hidden = needle && !haystack.includes(needle);
});
```

**全站搜索 API**（Dashboard 内联搜索）：  
接口：`GET /?search_q={query}&search_scope={scope}`  
scope 类型：`tasks | projects | sessions | alerts`

搜索结果格式：
```
范围：Tasks · 关键词：ekko · 命中：3 条
[结果列表]
```

**文件过滤器**：
```html
<input class="file-filter-input" type="search" 
       data-file-filter 
       placeholder="筛选文件名或路径..." />
```

**搜索位置**：嵌入在各 section 内部，无全局搜索入口（无 `Cmd+K`）。

### 我们当前状态

- 无搜索功能
- 无 `Cmd+K` 快速唤起

### 建议改进

1. **优先实现 scope 搜索**：在 Tasks / Agents / Sessions 页内各加一个 `<input type="search" placeholder="搜索任务...">` + URL 参数提交（`search_q=`）
2. **client-side 文件筛选**：Documents 页用 `data-file-search` 属性 + 纯 JS 筛选，无需后端
3. **暂缓全局 Cmd+K**：CC 自身也没做全局搜索，可后续加入 spotlight 模式

---

## 5. 用量分析页

### CC 的做法

**时间段切换（`.segment-switch`）**：
```html
<div class="segment-switch">
  <a class="segment-item active" href="/?section=usage-cost&usage_view=today">今天</a>
  <a class="segment-item" href="/?section=usage-cost&usage_view=cumulative">累计</a>
</div>
```
```css
.segment-switch {
  display: inline-flex;
  background: rgba(0,0,0,0.05);
  border-radius: 10px;
  padding: 2px;
  gap: 2px;
}
.segment-item {
  padding: 5px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
}
.segment-item.active {
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
}
```

**饼图（`.pie-chart`）**：  
纯 CSS conic-gradient 实现，无 Chart.js 依赖：
```typescript
function renderTokenPieChart(rows, totalTokens, centerLabel) {
  let cursor = 0;
  const gradientStops = rows.sort((a,b) => b.tokens - a.tokens).map(item => {
    const share = (item.tokens / totalTokens) * 100;
    const stop = `${color} ${cursor.toFixed(2)}% ${(cursor + share).toFixed(2)}%`;
    cursor += share;
    return stop;
  });
  const gradient = `conic-gradient(${gradientStops.join(', ')})`;
  return `<div class="pie-chart" style="background:${gradient};">
    <div class="pie-hole"><strong>${centerLabel}</strong><span>${total} tokens</span></div>
  </div>`;
}
```
```css
.pie-chart {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  /* background 由内联 conic-gradient 设置 */
}
.pie-hole {
  position: absolute;
  inset: 18px;
  border-radius: 50%;
  background: white;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
```

**多维度拆分**：按 agent / project / task / model / provider / session-type / cron-job 拆分，每维度用同一套 `renderUsageBreakdownRows` 函数渲染表格。

**用量数据表字段**：
```
Agent | 用量(tokens) | 预估费用($) | 请求数 | 会话数 | 数据状态
```

**成本格式**（`formatCurrency`）：使用 `Intl.NumberFormat` 展示美元，格式如 `$0.12` / `$1,234.56`

**Context Pressure Card**：单独一个卡片展示每个 agent 的上下文用量百分比：
```
Agent | Session | Model | 上下文使用 | 节奏 | 阈值
```

### 我们当前状态

- 无用量可视化
- 无 token 费用追踪

### 建议改进

1. **立即抄 `.segment-switch` CSS**：通用时间段切换组件，可复用于任意页面的 Tab 切换
2. **立即抄 CSS conic-gradient 饼图**：无需引入图表库，100 行内实现，维度选 byAgent + byProject
3. **费用展示格式**：`$0.12`（两位小数），今日 / 近 7 日 / 近 30 日三行 meta 展示
4. **用量摘要卡**：Overview 右侧 inspector 添加"今日用量：1,234 tokens · 费用：$0.08"

---

## 6. 通知 / 告警 UI

### CC 的做法

**告警数据结构（`ExceptionFeedItem`）**：
```typescript
interface ExceptionFeedItem {
  level: "info" | "warn" | "action-required";
  code: "SESSION_BLOCKED" | "SESSION_ERROR" | "PENDING_APPROVAL" | "OVER_BUDGET" | "TASK_DUE";
  source: "system" | "session" | "approval" | "budget" | "task";
  sourceId: string;
  message: string;
  route: "timeline" | "operator-watch" | "action-queue";
  occurredAt?: string;
}
```

**告警列表渲染**（`renderExceptionsList`）：
```html
<li>
  [badge: warn] 
  <strong>Running sessions have gone quiet</strong> 
  <span class="meta-inline">session-abc · 2026-03-18T14:00:00Z</span>
</li>
```
每条告警：badge（级别）+ 粗体消息 + meta（sourceId + 时间），列表最多显示 12 条。

**决策队列（Action Queue / `.queue-item`）**：
```html
<li class="queue-item">
  <div>[badge: warn] <code>alert-item-001</code></div>
  <div class="meta">Running sessions have gone quiet</div>
  <div class="meta">相关链接：<a href="...">会话详情</a></div>
  <div class="queue-actions">
    <!-- 未确认时 -->
    <form method="POST" action="/action-queue/ack">
      <input type="hidden" name="itemId" value="..." />
      <input type="password" name="localToken" placeholder="本地令牌" />
      <button class="btn">确认</button>
    </form>
    <!-- 已确认时 -->
    <span class="meta">已确认于 2026-03-18 · 到期 2026-03-25</span>
  </div>
</li>
```

**通知中心数据结构（`ActionQueueItem`）**：
```typescript
interface ActionQueueItem extends ExceptionFeedItem {
  itemId: string;
  acknowledged: boolean;
  ackedAt?: string;
  note?: string;
  ackExpiresAt?: string;  // 确认有效期，过期后重新显示
  links: ActionQueueLink[];  // 关联跳转
}
```

**Overview 页"需要你介入"区域**：显示 pending 审批 + 告警 topN，以 `.decision-list` 展示：
```html
<div class="decision-list">
  <article class="decision-row hot">  <!-- hot = 需要立即处理 -->
    <strong>command 名称</strong>
    <div class="meta">[badge: pending] agent-name</div>
  </article>
</div>
```

**告警计数摘要**：
```
{info: N, warn: N, actionRequired: N}
```

### 我们当前状态

- 无通知中心 UI
- 告警以飞书消息展示，无状态确认

### 建议改进

1. **立即实现决策队列**：右侧 inspector sidebar 底部加"未确认告警：N"，点击展开告警列表
2. **三级告警着色**：`info`（蓝）/ `warn`（黄）/ `action-required`（红）对应 badge CSS
3. **确认机制**：每条告警有"确认"按钮，POST 到 `/api/action-queue/:id/ack`，确认后灰化显示"已确认 · 到期日"
4. **Overview 介入区**：Overview 页头部显示"需要你介入 N 项"，展开显示审批 + 超预算 + 阻塞会话

---

## 7. 立即可抄的 UI 模式（优先级排序）

### P0：本周必做

| 模式 | CC 实现 | 改进方案 |
|------|---------|---------|
| **Badge 状态系统** | `.badge.ok/warn/blocked/info/idle` + 颜色语义 | 复制整套 badge CSS，统一全站状态展示 |
| **Segment Switch** | `.segment-switch` + `.segment-item.active` CSS | 用于今日/累计切换、看板/列表视图切换 |
| **KPI 卡片顶线** | `::before` 伪元素 + 3px 渐变线 | Overview 页 5 个 KPI 卡片加彩色顶线 |
| **Quick Filters** | `.quick-chip` URL 驱动筛选 | Tasks 页加 6 个快速筛选 chip |

### P1：本迭代完成

| 模式 | CC 实现 | 改进方案 |
|------|---------|---------|
| **三栏布局** | `app-shell` = sidebar + panel + inspector-sidebar | 右侧加固定 inspector，宽屏下常驻 |
| **泳道看板** | `.board` grid + `.lane` + `.task-chip` | Tasks 页改为看板视图 |
| **CSS 饼图** | `conic-gradient` 无依赖 | Usage 页 byAgent 用量饼图 |
| **Agent 卡片** | `.office-card` + `.topline` + `.meta` | Staff 页改为卡片网格布局 |

### P2：下一个迭代

| 模式 | CC 实现 | 改进方案 |
|------|---------|---------|
| **Action Queue** | `.queue-item` + `/action-queue/ack` | 通知中心 + 确认/过期机制 |
| **右侧 Inspector** | 可折叠 sidebar，`localStorage` 持久化 | 活跃会话/用量/审阅队列常驻摘要 |
| **数字计数动画** | `data-counter-target` + JS requestAnimationFrame | KPI 数字加载动画 |
| **client-side 搜索** | `data-file-search` + JS 实时筛选 | Documents/Tasks 页内联搜索 |

---

## 8. 关键 API 路径（后端接口参考）

```
GET  /?section=overview&lang=zh          → 主界面 HTML
GET  /api/action-queue                   → 通知中心快照
POST /api/action-queue/:itemId/ack       → 确认告警
POST /api/approvals/:approvalId/approve  → 批准操作
GET  /?search_q={q}&search_scope={scope} → 内联搜索（scope: tasks/projects/sessions/alerts）
GET  /api/tasks?quick=blocked            → 任务筛选
GET  /api/projects                       → 项目列表
```

---

## 9. 结论

CC 最值得立即借鉴的三个 UI 模式：

1. **Badge 语义色系**：零成本，统一全站状态可读性
2. **Segment Switch + Quick Filters**：URL 驱动，无需 JS 框架，直接可用
3. **CSS conic-gradient 饼图**：无第三方依赖，实现用量可视化

最值得下一步跟进的产品功能：

- Action Queue（含确认机制）→ 解决目前告警无状态问题
- 三栏布局 + inspector sidebar → 解决关键信息可见性不足问题
- Agent 状态卡片（运行中/阻塞/待机）→ 解决目前 Staff 可观察性薄弱问题
