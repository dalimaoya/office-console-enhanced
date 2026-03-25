# 艾克 UX 测试报告（产品/用户视角）

测试日期：2026-03-19  
测试角色：艾克（product-ekko）  
服务地址：http://localhost:3014  
测试视角：第一次打开控制台的真实办公用户

---

## 数据接口

- `/api/v1/status`：**异常**，HTTP 404 "Cannot GET /api/v1/status"。Overview 页面的系统状态 badge / health 检查依赖此接口，用户打开首页就会看到"等待检查"状态永远不变，是首屏最高优先问题。
- `/api/v1/agents`：**正常**，返回 12 个 Agent 的完整结构（id/name/status/lastActive/statusDetail），数据有意义，状态值（working/idle/backlog/offline）语义清晰。
- `/api/v1/tasks`：**基本正常**，返回 40+ 个任务记录。但大量任务 `checklistProgress: 0` 且 `status: "active"`，说明很多历史任务仍以"进行中"状态暴露给用户，任务列表信噪比偏低。
- `/api/v1/memory`：**正常**，返回 5 条 memory 文件记录，包含路径和时间戳，数据有意义。
- `/api/v1/usage/by-agent`：**正常**，返回各 Agent 的 token 消耗、费用估算和模型分组，数据详尽，`estimated` 字段标注清晰。
- `/api/v1/settings/wiring-status`：**正常**，返回 gateway（connected）/feishu（not_configured）/fileSystem（ok）的状态，`overallHealth: "partial"` 语义合理。
- `/api/v1/cron`：**正常**（无配置状态），返回 `items: [], note: "no cron configuration found"`，降级处理合理。
- `/api/v1/search`：**正常**，搜索响应时间约 39ms，结果按 agent/task/session 分组展示，功能完整。
- `/healthz`：**异常**，HTTP 404。后端任务 checklist 里有此接口验收项（`GET /healthz`），但实际未暴露。
- `/api/v1/wiring-status`（无 settings 前缀）：**异常**，HTTP 404。路径命名与设置页的实际调用路径不一致，存在 API 路由命名不统一风险。

---

## 界面结构

- **总览（Overview）页面结构完整**：KPI 网格（5 个 KPI 卡）、系统状态 badge、工作区活动、告警摘要、健康状态面板均存在对应 HTML 结构，无空占位符。
- **Agents 页面有一大段 HTML 被注释掉**：`#agents-working-zone`、`#agents-idle-zone`、`#agents-blocked-zone` 的完整分区 HTML 全部用 `<!--...-->` 注释掉，用户看到的是由 JS 动态填充的 `#agents-zones-container`。若 JS 渲染失败，该页面将完全空白。另有一个 `display:none` 的旧版 agent 列表面板（"备用"），说明存在两套实现并存的问题。
- **Settings 页面有双重 loading state**：存在两个 loading 状态容器（`#config-state` 和 `#config-state-inline`），用户可能看到两处"加载中"提示同时出现，视觉上重复且混乱。
- **Tasks 页面结构较完整**：有 Quick Filter Chips、Segment Switch 列表/看板切换、看板三栏视图。结构清晰，功能模块齐全。
- **搜索触发按钮**：label 为"搜索 agent/任务/会话..."，说明清楚，有 ⌘K 快捷键提示，对办公用户友好。
- **Inspector 侧边栏**：包含系统状态、今日用量、活跃 Agent、待处理事项四个摘要项，结构合理，但依赖 `/api/v1/status` 接口（存在 404 问题）。
- **顶部状态栏**：有 SSE 连接状态 pill、只读模式 pill、健康状态 pill 和刷新计时器，信息密度适中，对办公用户来说略显技术化（"SSE"这个术语对普通用户不友好）。

---

## 视觉动效

- **Primary button**：✅ 有 `transition: filter/transform`，hover 亮度提升，active 缩放 0.98，动效自然。
- **Ghost button**：✅ 有 `transition` 规则，hover 状态有颜色变化，体验完整。
- **Nav-link 导航按钮**：✅ 有 `transition` 规则，hover 有背景色变化，active 状态有左侧指示条（::before 伪元素）。
- **KPI 卡片 / Agent 卡片 / list-card**：✅ 均有 hover 时边框色和背景色过渡，动效一致。
- **页面切换动效**：⚠️ **仅有淡入无淡出**。CSS 在 `.page.active` 上定义了 `animation: pageIn`，但页面切换时只是切换 `display:none/grid`，离开的页面没有淡出过渡。对用户而言，切换体验会有一次突兀的跳变（旧页面消失 → 新页面淡入）。
- **搜索浮层**：✅ 有 `transition: opacity`，打开/关闭有淡入淡出效果，体验顺滑。
- **Task 卡片**：✅ hover 时有边框色和 translateY(-1px) 上浮效果，交互感良好。
- **段落切换（Segment Switch）**：✅ 有 `transition` 规则，active item 背景色切换有过渡效果。
- **断点/布局**：CSS 在 780px 以下有移动端响应式规则（sidebar 变为顶部 icon 导航），PC 端布局未发现明显断点问题。

---

## 交互逻辑

- **导航切换**：通过 `classList.toggle('active')` 切换页面显示，无 loading 中间态，速度快但缺少平滑感（见视觉动效章节）。切换时会触发对应页面的数据刷新函数（如 `refreshAgents()`），数据加载中有 `state-box loading` 状态提示，逻辑合理。
- **按钮点击反馈**：✅ 实现了 `setButtonLoading()` 函数，点击后按钮禁用并显示"刷新中…"文字，操作有防重复机制，体验良好。
- **数据刷新机制**：✅ 使用 SSE（Server-Sent Events）替代 setInterval 轮询。监听了 `agent-update`、`task-update`、`file-change` 三种事件，数据变化时自动刷新对应页面。SSE 断连时有 reconnecting 状态 pill 提示。
- **Toast 通知**：✅ 已实现，支持 success/error 类型，多条堆叠，3 秒后自动消失（error 类型不消失）。
- **搜索功能**：✅ Cmd+K / Ctrl+K 触发搜索浮层，Esc 关闭，搜索结果实时显示（后端响应 39ms），体验流畅。
- **Inspector 侧边栏折叠**：✅ 有折叠/展开功能，宽屏（<1400px）时自动折叠，状态持久化逻辑存在。
- **任务状态变更**：系统处于只读模式（READONLY_MODE=true），任务状态变更操作（`POST /api/v1/tasks/:id/status`）在只读模式下被禁止，但界面上的"变更状态"按钮仍然显示，用户点击后才会收到错误，缺少提前的禁用提示或视觉灰化。

---

## 问题汇总

| 问题 | 严重程度 | 建议修复角色 |
|------|---------|-------------|
| `/api/v1/status` 路由 404，首页系统状态永远"等待检查" | 🔴 严重 | backend-leona |
| `/healthz` 路由 404，后端 checklist 验收项未实现 | 🟠 中 | backend-leona |
| Agents 页面核心分区 HTML 被注释掉，JS 渲染失败时页面完全空白 | 🟠 中 | frontend-ezreal |
| 页面切换仅有淡入无淡出，切换体验有跳变感 | 🟡 低 | frontend-ezreal |
| Settings 页面双重 loading state（`config-state` + `config-state-inline`） | 🟡 低 | frontend-ezreal |
| 只读模式下任务状态变更按钮未灰化，用户点击后才报错 | 🟠 中 | frontend-ezreal |
| 飞书通知未配置（feishu not_configured），设置页显示 not_configured | 🟡 低 | 运维/配置 |
| 大量历史任务 checklistProgress=0 且 status=active，任务列表信噪比低 | 🟡 低 | backend-leona |
| 顶栏"SSE"术语对普通办公用户不友好，可改为"实时连接"或中文描述 | 🟡 低 | frontend-ezreal |

**合计发现问题：9 个**（🔴 严重 1 个，🟠 中 3 个，🟡 低 5 个）

---

## 测试员补充说明

从第一次打开控制台的真实用户角度来看，整体界面结构清晰、导航逻辑合理、数据实时性好（SSE 实现到位）。主要痛点集中在：**首屏的系统状态不可用**（最影响第一印象）和**只读模式下的操作提示不够主动**（会让用户困惑为什么点了没反应）。其余问题属于体验精修级别，不影响核心功能使用。

建议优先修复：
1. `backend-leona` 补充 `/api/v1/status` 路由
2. `frontend-ezreal` 修复只读模式下按钮的禁用状态展示
