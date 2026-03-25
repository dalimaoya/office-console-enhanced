# Plan A 暖色结构化 — 前端落地记录

**执行角色**：伊泽瑞尔 Ezreal（frontend-ezreal）  
**日期**：2026-03-20  
**设计来源**：拉克丝 Lux（`/root/.openclaw/workspace-agent-ui-lux/docs/design/v2/plan-a-warm-structured.html`）  
**产品评审**：艾克 Ekko（3项改进建议均已落入）

---

## 改动摘要

### 1. CSS 主题重构（`style.css`）

**从** Professional Dark Navy → **到** Warm Structured Light

| 变量 | 旧值 | 新值 |
|------|------|------|
| `--bg` | `#0d0d1a` | `#FCFCFD` |
| `--panel` | `#1a1a2e` | `#FFFFFF` |
| `--primary` | `#d4a574` | `#F97316` |
| `--text` | `#e5e5e5` | `#0F172A` |
| `color-scheme` | `dark` | `light` |
| `--shadow-md` | 深色高光阴影 | 轻量光影（rgba 0.08） |
| KPI 卡片顶条 | 蓝/浅蓝渐变 | 橙/暖橙渐变 |
| 侧栏 hover | 暗色 | `#FFF7ED`（暖橙浅色） |
| 徽章/标签 | 暗底亮字 | 亮底彩字（`#DCFCE7` ok, `#FEF3C7` warn, etc.） |

### 2. 新增 Plan A 专用样式类（CSS 末尾追加）

- `.kpi-grid-plan-a` — 5 列 KPI 响应式网格
- `.kpi-card-a` — 暖色卡片，含 icon 区域
- `.kpi-sparkline-a` — miniature sparkline 趋势条（Ekko #3）
- `.heartbeat-indicator` / `.heartbeat-dot` — 系统在线心跳指示灯（Ekko #3）
- `.topbar-search-btn` — 搜索框按钮样式，支持 `/` 快捷键（Ekko #3）
- `.quickstart-card` / `.quickstart-body.collapsed` — 可折叠快速上手（Ekko #1）
- `.overview-2col` — 主区 + 380px 右栏双列布局
- `.mobile-bottom-nav-a` — 移动端底部导航（响应式）
- `.blocker-card-a` / `.bar-track-a` / `.timeline-a` — 右栏子组件

### 3. index.html 结构重组

#### 侧栏品牌 Logo
- 新增 `F97316` 橙色品牌图标 + 标题组合布局

#### 顶栏（Topbar）重构
- **移除** dark theme 状态 strip 重复元素
- **新增** 心跳指示灯 `#heartbeat-indicator`（Ekko #3）
- **新增** 搜索按钮 `.topbar-search-btn`，替换旧 `.search-trigger-btn`（Ekko #3）
- 保留：通知铃铛、SSE状态pill、刷新按钮

#### 总览页 KPI（Ekko建议 #2）
- **从** 4 卡（活跃Agent / 进行中任务 / 今日用量 / Gateway 状态）
- **到** 5 卡（活跃Agent / 进行中任务 / **阻塞项** / **Token 用量** / Gateway 状态）
- 旧"待处理事项"复用 ID `kpi-queue` → 改为"阻塞项"卡（左边框红色强调）
- 新"Token 用量"卡替换"本周完成率"，ID 保持 `kpi-usage`
- 每张 KPI 卡附带 sparkline 迷你趋势图（Ekko #3）

#### 总览页布局重构（Ekko建议 #1）
- **新增** `.overview-2col` 双栏容器
- **左栏**（主区）：活跃对象注册表 → 冷启动快照 → 系统概览 → 工作区活动 → **快速上手（移至底部）**
- **右栏**（380px）：需要关注/阻塞项聚合（顶部红色强调线） → 项目阶段 → 事件日志
- 快速上手从"黄金位置顶部"下移至主区底部（Ekko #1）

#### 快速上手可折叠（Ekko建议 #1）
- 新 `.quickstart-card` 组件，带进度条 + 展开/收起按钮
- JS `toggleQuickStart()` 支持手动折叠，状态存入 `localStorage`
- 步骤视觉区分：done（绿勾划线）/ active（橙框）/ pending（灰边）

#### 移动端适配
- `@media (max-width: 768px)`：sidebar 隐藏，shell 单列
- `.mobile-bottom-nav-a`：固定底部导航（总览/Agent/任务/用量/设置）
- 任务 tab 显示阻塞项数量角标，JS 自动同步 `kpi-queue` 值

---

## Ekko 3 项改进落入情况

| # | 改进内容 | 落入方式 | 状态 |
|---|---------|---------|------|
| 1 | 快速上手下移 + 可折叠 | 移至左栏底部，新增折叠组件 | ✅ 已落入 |
| 2 | KPI 增加 Token 用量卡 | 第 4 张卡改为 Token 用量，替换本周完成率 | ✅ 已落入 |
| 3 | Sparkline + / 搜索 + 心跳灯 | 三项全部实现 | ✅ 已落入 |

---

## 文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/public/style.css` | 修改 | 主题全面替换为 Plan A 暖色结构化 |
| `src/public/index.html` | 修改 | 顶栏/KPI/总览布局重构 |
| `src/public/style.css.bak-v2-before-plan-a` | 新增 | 旧 dark theme 备份 |
| `src/public/index.html.bak-before-plan-a` | 新增 | 旧 HTML 备份 |

---

## 验收建议

1. **场景走查（产品标准）**：李琪打开控制台，10 秒内能看到：角色状态（KPI#1）、阻塞项（KPI#3 左红边框）、Token 消耗（KPI#4）、最近操作（右栏事件日志）
2. **PC 端**：1920px / 1440px / 1280px 三档分辨率检查双列布局和 KPI 5 卡排列
3. **移动端**：768px 以下检查底部导航显示、KPI 2列折叠
4. **快速上手**：确认展开/收起功能正常，`localStorage` 状态持久化
5. **心跳灯**：SSE 连接后绿色脉冲动画显示
6. **/ 快捷键**：非输入框状态下按 `/` 触发搜索弹层
7. **对比度**：暖白背景下文字色彩（`#0F172A` 主色，`#64748B` 次色）对比度应 ≥ 4.5:1

---

*实现：Ezreal（frontend-ezreal）· 2026-03-20*
