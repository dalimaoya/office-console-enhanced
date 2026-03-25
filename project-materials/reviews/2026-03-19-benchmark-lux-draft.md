# 拉克丝界面层对标草稿

> 对标项目：[openclaw-control-center](https://github.com/TianyiDataScience/openclaw-control-center)  
> 分析日期：2026-03-19  
> 分析角色：UI 设计师 拉克丝（ui-lux）  
> 我方参考：`office-dashboard-adapter/src/public/index.html`

---

## 对方界面风格概览

openclaw-control-center 是一个以 **Apple 生态美学** 为核心设计语言的控制台 UI，主要特征如下：

**布局结构**
- **三栏固定网格**：`grid-template-columns: 232px minmax(0, 1fr) 300px`
  - 左：导航侧边栏（品牌区 + 导航列表）
  - 中：主内容区（多 Section 页面切换）
  - 右：Inspector 侧边栏（300px，可收起）
- URL 路由通过 `?section=overview&lang=en` 管理，无需 SPA 路由库
- 内容区域最大宽度 1880px，居中对齐，padding 24px

**视觉风格**
- **Apple 玻璃拟态（Glassmorphism）**：大量使用 `backdrop-filter: blur(22px~56px) saturate(112%)`，半透明面板覆盖渐变背景
- **渐变光晕背景**：`radial-gradient` 多层叠加，亮模式柔和蓝灰，暗模式近纯黑（`#050608`）+ 极细微光晕
- **圆角系统**：`--radius-lg: 26px / --radius-md: 18px / --radius-sm: 12px`，整体圆润感强
- **阴影系统**：多层 box-shadow（soft/hard/float/press），深色模式阴影比亮模式更深沉
- 字体：`SF Pro Display / -apple-system / PingFang SC`，优先系统字体，中英双语无缝切换

**交互与动效**
- 页面进入动效：`panel-in` 动画（opacity + translateY）
- 页面离场：`.page-leave .app-shell { opacity: 0; transform: translateY(10px) scale(0.996); }` — 轻微缩放+下移
- 刷新时状态保存/恢复（input/scroll position 通过 sessionStorage 持久化）
- 双主题切换（light/dark）：localStorage 持久化 + 系统偏好检测（prefers-color-scheme）
- 双语切换（en/zh）：URL 参数驱动

**信息模块**
- Signal Cards：带颜色语义（ok/warn/over）的状态卡片
- Global Visibility Strip：顶部高密度一行状态条
- 右侧 Inspector 侧边栏：点击某个条目时在不切换页面的情况下展示详情
- Usage Cost、Context Pressure、Memory Status 等独立专项卡片
- 后端 SSR 渲染（TypeScript server.ts 直出 HTML），无前端框架依赖

---

## 对方界面比我们更好的点

| 维度 | 对方做法 | 我们现状 | 差距 |
|------|---------|---------|------|
| **三栏布局** | 左导航 + 主内容 + 右 Inspector 侧边栏 | 两栏（左侧边栏 + 主内容） | 缺少"不换页查看详情"的右侧面板 |
| **玻璃拟态质感** | 多层 backdrop-filter + 渐变 + 光晕，视觉层次丰富 | 基础 CSS 面板，无模糊效果 | 视觉质感有明显差距 |
| **暗色主题** | 接近纯黑底（#050608）+ 精细光晕渐变，暗模式极为精致 | 无暗色主题支持 | 缺失整套暗色体系 |
| **Design Token 完整度** | CSS 变量覆盖 shadow/radius/glass/border/color 全链路 | 有 tokens.css 但覆盖范围有限 | 设计系统不够系统化 |
| **页面过渡动效** | `panel-in` + `page-leave` 轻微缩放+位移，流畅克制 | 页面切换无动效 | 页面切换体验割裂 |
| **Inspector 侧边栏** | 右侧 300px 固定面板，可展示任意条目详情，可收起 | 部分页面有左右两栏，但非全局 | 没有全局性的详情侧边栏 |
| **刷新状态保存** | sessionStorage 保存表单+滚动位置，刷新后自动恢复 | 无此机制 | 刷新后用户状态丢失 |
| **语言切换** | URL 参数级别 en/zh 切换，全量双语 | 仅中文界面 | 无国际化能力 |

---

## 我们界面比对方更好的点

| 维度 | 我们做法 | 对方现状 | 优势说明 |
|------|---------|---------|---------|
| **Emoji 导航图标** | 🏠🤖🔗📋📊 等 Emoji 图标，直观亲切 | 无图标，纯文字导航 | 更低学习门槛，中文用户友好 |
| **新用户引导横幅** | Onboarding banner 三步引导（可关闭） | 无引导入口 | 首次使用体验更友好 |
| **任务看板视图** | Kanban 三栏 + Quick Filter Chips + Segment Switch | 任务呈现较扁平 | 任务管理维度更丰富 |
| **快捷键搜索入口** | `⌘K` 触发搜索框，展示 shortcut | 无全局搜索 | 高频操作更高效 |
| **SSE 实时状态** | 顶栏实时显示 SSE 连接状态（🟡/🟢） | 轮询刷新 | 实时性可感知性更强 |
| **KPI 网格** | 5个 KPI 卡片，一屏总览关键指标 | Overview 信息分散 | 总览页核心指标一览更聚焦 |

---

## 建议借鉴的交互/展示方式（P0/P1/P2）

### P0 — 强烈建议，影响体验核心

**1. 右侧 Inspector 侧边栏（三栏布局）**
- 对方实现：点击 Agent 卡片、任务条目时，在右侧 300px 固定面板展示详情，不切换页面不弹 Modal
- 我们现状：详情通过切换路由或内联 `task-detail-panel`（`display:none` 切换）实现，体验割裂
- 建议落点：在 `index.html` 现有两栏 `.shell` 外增加第三栏 `.inspector`，Agent 状态、任务、协作条目均可点击后注入该面板
- 优先级依据：**"不换页查看详情"是控制台类产品的核心交互范式**，当前方案缺失该能力导致操作流程断层

**2. Apple 玻璃拟态视觉语言 + 完整暗色主题**
- 对方实现：`backdrop-filter: blur` + 多层渐变背景 + 光晕 `radial-gradient`，light/dark 双套 CSS 变量
- 我们现状：纯白面板，无玻璃效果，无暗色模式
- 建议落点：
  - 在 `tokens.css` 中补充 `--glass-*` / `--page-bg` / `--page-glow` / `--shadow-*` 变量
  - `.panel` 增加 `backdrop-filter: blur(18px)` + `background: var(--glass-1)`
  - 增加 `html[data-theme="dark"]` 全局 CSS 变量覆盖层，通过 `<button>` 写 localStorage 切换
- 优先级依据：**视觉质感是控制台可信度的直接体现**，当前方案与对标有肉眼可见的档次差距

### P1 — 建议，提升品质感

**3. 页面过渡动效**
- 对方实现：`.page-leave { opacity:0; transform:translateY(10px) scale(0.996); transition: 140ms }` + `panel-in` 进场动画
- 建议落点：在 `style.css` 中为 `.page.active` 增加 `animation: panel-in 240ms ease both`，切换时加 `.page-leave` class 再 rAF 后移除
- 预期效果：页面切换从"闪现"变为"流动"，降低视觉跳变感

**4. 刷新状态保存（表单+滚动位置）**
- 对方实现：`sessionStorage` 在 `beforeunload` 时序列化所有 input 值和 scrollY，DOMContentLoaded 时恢复
- 建议落点：在我们现有的 `refresh-page` 按钮逻辑前插入状态序列化，刷新后自动恢复选中 tab、滚动位置
- 预期效果：强制重新加载后，用户不需要手动重新定位到之前的上下文

**5. 全局可见性 Strip（顶部高密度状态条）**
- 对方实现：一行横向排布多个 Signal（连接状态、安全风险、版本更新、预算压力），配色语义（ok/warn/over）
- 建议落点：在我们的 `.topbar` 下方新增一个 `.status-strip`，从现有 `health-pill` / `sse-status` 等状态指标迁移到这里，形成更一致的状态表达层

### P2 — 可选，逐步补齐

**6. Design Token 系统完整化**
- 补充 `--radius-xl / --glass-1 / --shadow-float / --card-shadow-hover` 等变量，形成完整的组件级 token 映射
- 按对方规范区分 `--shadow-soft / --shadow-hard / --shadow-press` 三档场景

**7. 主题切换按钮**
- 在顶栏增加 `🌙/☀️` 切换按钮，写入 localStorage + 修改 `html[data-theme]`

---

## 不建议照搬的点及原因

| 点 | 原因 |
|----|------|
| **纯服务端渲染（SSR）HTML** | 对方是 TypeScript server.ts 直接输出 HTML 字符串（18027 行），无前端框架。我们已有前后端分离架构，照搬会导致代码耦合倒退，维护成本极高 |
| **三栏固定 300px Inspector** | 对方 Inspector 宽度固定，移动端体验差。我们若引入三栏，建议 Inspector 做成可拖拽宽度 + 移动端自动收为底部 Sheet |
| **URL 参数路由（?section=xxx）** | 对方因为 SSR 必须用 URL 参数控制页面。我们已用 `data-route` 属性做客户端路由，无需改动路由机制 |
| **语言切换机制** | 对方语言切换需要全页刷新（URL 参数变化），体验欠佳。如果我们需要国际化，应优先考虑 i18n 库（如 i18next）实现无刷新切换 |
| **无前端框架的全量内联 CSS/JS** | 对方所有样式内联在 HTML template 字面量中，无法拆分复用。我们应继续保持 `style.css + tokens.css` 的文件分离模式 |

---

*草稿版本：v0.1 | 拉克丝（ui-lux） | 2026-03-19*
