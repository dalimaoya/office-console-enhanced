# 用户视角功能测试报告

- **测试时间**：2026-03-19（UTC）
- **测试人**：杰斯（aioffice-jayce）
- **服务地址**：http://localhost:3014
- **测试方式**：Playwright 自动化 + curl API 验证 + 源码逻辑分析
- **背景**：Galio 完成功能验收（18/20通过，2项已修复）后，本轮从实际用户视角对使用体验做补充测试

---

## 总结

| 优先级 | 问题数 | 主要影响 |
|--------|--------|----------|
| 🔴 高  | 2      | CSS 完全失效导致页面无视觉样式；Agent 操作栏全卡片常驻显示 |
| 🟡 中  | 3      | 首屏数据延迟明显；Tasks 视图切换语义混乱；KPI Usage 恒为 0 |
| 🟢 低  | 1      | Tasks 数据为静态数组而非 API 实时数据 |

**共发现 6 个问题（高2/中3/低1）**

---

## 详细问题列表

### 🔴 P1-1：CSS 完全失效 — style.css 和 tokens.css 均 404

**问题描述**

打开 http://localhost:3014 后，浏览器控制台报错：
```
Refused to apply style from 'http://localhost:3014/style.css' because its MIME type ('text/html') is not a supported stylesheet MIME type
Refused to apply style from 'http://localhost:3014/assets/tokens.css' because its MIME type ('text/html') is not a supported stylesheet MIME type
```

实测：
- `GET /style.css` → HTTP 404（无路由）
- `GET /assets/tokens.css` → HTTP 404（路径映射错误）

`app.ts` 中静态文件配置为：
```typescript
app.use('/assets', express.static(publicDir));  // publicDir = src/public/
```

但 `index.html` 引用路径为：
- `href="style.css"` → 实际请求 `/style.css`（无路由）
- `href="/assets/tokens.css"` → 映射到 `src/public/tokens.css`（不存在；实际文件在 `src/public/assets/tokens.css`）

**用户感知影响**：🔴 高  
页面完全无样式。颜色、间距、字体、暗色主题全部丢失。CSS 变量（`--color-bg`、`--space-lg` 等）不可用，所有依赖变量的组件行为异常。

**建议修复**

> Leona（后端）负责修改 `src/app.ts`：
```typescript
// 修改前：
app.use('/assets', express.static(publicDir));

// 修改后：
app.use(express.static(publicDir));                              // 服务 /style.css
app.use('/assets', express.static(path.join(publicDir, 'assets')));  // 服务 /assets/tokens.css
```

> Ezreal（前端）负责修改 `src/public/index.html`，将 script src 从 `/assets/app.js` 改为 `/app.js`（因 app.js 在 publicDir 根目录，改为根路径服务后路径变更）：
```html
<!-- 修改前 -->
<script type="module" src="/assets/app.js"></script>
<!-- 修改后 -->
<script type="module" src="/app.js"></script>
```

---

### 🔴 P1-2：Agent 操作栏全卡片常驻显示（hover 交互失效）

**问题描述**

进入 Agents 分区后，所有 12 个 Agent 卡片的操作按钮（📋 查看日志 / 🔍 当前任务 / 📌 复制 ID）同时可见（共 36 个按钮全部 display:block），未实现"悬停时出现"效果。

通过 Playwright 确认：hover 后 `opacity: 1`、`visibility: visible`，但 hover 前也是相同状态，说明 hover 状态切换逻辑依赖 CSS（`:hover` 伪类 + `opacity` 过渡），CSS 失效后默认展开。

**用户感知影响**：🔴 高  
界面密集、视觉干扰严重，操作栏语义（hover 才出现）完全丢失。

**建议修复**

此问题为 CSS 失效（P1-1）的连带影响。修复 CSS 加载后应自动恢复。  
若 CSS 修复后仍有问题，Ezreal 可在 JS 中添加 mouseenter/mouseleave 事件来补充控制显隐。

**责任角色**：Leona（根本原因：静态文件服务）→ Ezreal（若需 JS 兜底）

---

### 🟡 P2-1：Overview 首屏数据延迟 — 前 3 秒持续"系统检查中"

**问题描述**

打开 Overview 分区后：
- 页面加载后约 3 秒内，`#overview-status-headline` 显示「系统检查中…」
- 约 5 秒后才变为实际状态「有 5 项需要关注」
- KPI 卡片数值在 3 秒时可能显示为 0（loading 默认值）

数据来源：
- `/api/v1/dashboard` 首次响应约需 2.1s（API 响应头 `avgResponseMs: 2129`）
- `/api/v1/action-queue` 返回 3 条警告，需额外请求

**用户感知影响**：🟡 中  
用户 30 秒内判断系统健康状态的目标无法满足——首屏 3-5 秒是空白占位状态，影响第一印象。

**建议修复**

> Leona（后端）：优化 `/api/v1/dashboard` 聚合耗时，考虑并发获取子数据源或增加 304 缓存命中。  
> Ezreal（前端）：显示 loading skeleton 而非空文字，让用户感知"正在加载"而非"没有内容"。

---

### 🟡 P2-2：Tasks 分区视图切换语义混乱

**问题描述**

Tasks 分区顶部有"📋 列表 / 📌 看板"切换按钮，默认激活"📋 列表"。

但实际行为：
- 默认状态（"列表"激活时）：显示的是看板（Kanban 3列 lane）布局
- 点击"📌 看板"后：切换到另一个看板视图（`#tasks-board-view`），显示 19 个 `board-task-chip`
- `#tasks-list-view` 元素不存在

JS 逻辑中 `#tasks-board`（kanban lane）被视为"列表视图"，但其结构为看板，语义错误。

**用户感知影响**：🟡 中  
用户点"列表"看到的是看板，混乱。点"看板"才显示真正的看板，但两者外观差异因 CSS 失效后难以区分。

**建议修复**

> Ezreal（前端）：将 `#tasks-board`（`#lane-pending` / `#lane-active` / `#lane-done`）改为真正的列表视图（task-row 逐行展示），或重命名以匹配语义。  
> 如果"列表"本来就是看板视图的另一种展示方式，建议将按钮文案改为更准确的描述（如"分组 / 卡片"）。

---

### 🟡 P2-3：KPI Usage（今日用量）恒为 0

**问题描述**

Overview 的 KPI 卡片"今日用量"（`#kpi-usage`）始终显示 `0`。

JS 代码从 dashboard 响应中取 `todayTokens` 字段，但 `/api/v1/dashboard` 的响应中不包含此字段：
```json
{
  "system": {...},
  "agents": {"total": 12, "active": 9, ...},
  "workspaces": {...},
  "alerts": [...]
}
```

`todayTokens` 字段缺失，前端默认为 0。

**用户感知影响**：🟡 中  
用量 KPI 对于 token 成本感知有重要价值。恒为 0 会让用户认为"没数据"或系统问题。

**建议修复**

> Leona（后端）：在 `/api/v1/dashboard` 响应中添加 `todayTokens`（当日累计 token 消耗）和 `todayCost`（估算成本）字段，或通过 `/api/v1/usage` 提供此数据并由前端补充请求。

---

### 🟢 P3-1：Tasks 数据来自前端静态数组而非 API 实时数据

**问题描述**

进入 Tasks 分区时，网络请求中无 `/api/v1/tasks` 调用。Tasks 数据来源于 `app.js` 内的 `STATIC_TASKS` 静态常量（约 19 条任务记录）。

`/api/v1/tasks` API 实际存在且返回当前真实任务文件列表，但前端未调用。

**用户感知影响**：🟢 低  
目前静态数据与实际任务基本对齐，用户短期无感知。但若任务文件变更（新增/删除/状态更新），Tasks 分区不会实时反映。

**建议修复**

> Ezreal（前端）：在 `renderTasks()` 初始化时调用 `/api/v1/tasks` 拉取真实列表，替换 `STATIC_TASKS` 硬编码数据；状态筛选逻辑保持不变。

---

## 正常运行确认

以下功能经测试工作正常：

| 功能项 | 测试结果 |
|--------|---------|
| 页面可访问 | ✅ 正常 |
| JS 主逻辑加载（app.js 200 OK）| ✅ 正常 |
| API 实时数据（agents/dashboard/action-queue）| ✅ 正常 |
| 12 个 Agent 卡片渲染 | ✅ 正常 |
| Agent 状态徽章语义（working/idle/backlog/offline）| ✅ 正常（文字正确，颜色依赖 CSS） |
| 导航切换（8 个分区）| ✅ 正常 |
| 当前分区高亮（`.nav-link.active`）| ✅ 正常 |
| 搜索框（Ctrl+K 触发 `#search-overlay`）| ✅ 正常 |
| Settings 分区可访问 | ✅ 正常 |
| Tasks 看板数据（1 进行中 / 18 完成）| ✅ 有数据 |
| Tasks 筛选 chip（全部/进行中/已阻塞/已完成）| ✅ 可用 |
| Task 详情面板点击展开 | ✅ 正常 |
| Action Queue 告警聚合显示 | ✅ 正常 |
| SSE 实时事件连接（/api/v1/events）| ✅ 正常 |

---

## 修复优先级建议

| 优先 | 问题 | 责任 | 预计影响 |
|------|------|------|---------|
| 立即 | P1-1：CSS 404 | Leona + Ezreal | 修复后所有样式相关问题自动恢复 |
| 立即 | P1-2 随 P1-1 修复 | — | CSS 修复后自动恢复 |
| 近期 | P2-1：首屏延迟 | Leona（后端优化）+ Ezreal（骨架屏） | 改善第一印象 |
| 近期 | P2-2：Tasks 视图 | Ezreal | 语义准确性 |
| 近期 | P2-3：Usage KPI | Leona | 数据完整性 |
| 计划 | P3-1：静态任务数据 | Ezreal | 数据实时性 |

---

*测试方法：Playwright headless chromium + curl API + app.js 源码分析*  
*报告由 aioffice-jayce（杰斯）完成*
