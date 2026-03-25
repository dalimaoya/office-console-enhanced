# 视觉风格与设计系统对比分析报告

- **作者**：Lux（ui-lux）
- **日期**：2026-03-17
- **阶段**：UI 改进前置分析
- **对比参考**：openclaw-control-center（pixel-office 设计系统）

---

## 一、当前设计系统成熟度评估

### 1.1 CSS Token 系统现状

当前项目在 `styles.css` 的 `:root` 中定义了基础 token，具体覆盖情况如下：

| Token 类别 | 是否存在 | 说明 |
|---|---|---|
| 颜色 - 背景层 | ✅ 有 | `--bg`, `--panel`, `--panel-alt`, `--sidebar-bg`, `--card` |
| 颜色 - 边框 | ✅ 有 | `--border`, `--border-hover` |
| 颜色 - 文字 | ✅ 有 | `--text`, `--muted`, `--dim` |
| 颜色 - 品牌 | ✅ 有 | `--primary`, `--accent`（互为别名） |
| 颜色 - 语义状态 | ✅ 有 | `--status-active/blocked/done/error/idle/warning/info` |
| 字号比例 | ❌ 缺失 | 全部硬编码，分散 15+ 种尺寸 |
| 行高比例 | ❌ 缺失 | 无 |
| 间距比例 | ❌ 缺失 | padding/gap 全部硬编码 |
| 圆角比例 | ❌ 缺失 | 用了 9 种不同圆角值（8/9/10/11/12/13/14/16/18px）|
| 阴影比例 | ❌ 缺失 | 每处各写，无复用 |
| 动效时长 | ✅ 部分 | `--ease-fast`, `--ease-smooth`, `--ease-spring` |
| 布局 | ✅ 部分 | `--sidebar-w` |
| Z-index 层级 | ❌ 缺失 | 无 |

**评分：3/10**（token 覆盖仅限颜色，缺少 typography/spacing/radius 三大支柱）

### 1.2 颜色体系

- 主色调一致（`--primary: #68a1ff`），深色背景系有层次感
- **问题**：部分颜色直接硬编码，游离于 token 体系之外：
  - `.eyebrow` → `color: #6a8fd8`（应用 `--dim` 或新增 token）
  - `.md-preview code` → `color: #aad8ff`
  - `.debug-chip code` → `color: #c8d8ff`
  - `.primary-button` → `color: #06101e`
  - 多处 `#d9e3ff` 等颜色未入 token
- **仅有深色主题**，无浅色模式（pixel-office 支持双模式）

### 1.3 字体排印

- 字体栈定义在 `body`：`Inter, "PingFang SC", "Microsoft YaHei", sans-serif`（合理）
- **问题**：字号分散，无比例约束。现存尺寸如下：
  - `10.5px`（eyebrow）、`11px`（计时器）、`11.5px`（部分 meta）、`12px`（pill）
  - `12.5px`（副标题）、`13px`（通用正文）、`13.5px`（导航 / 状态框）
  - `14px`（部分标签）、`14.5px`（panel-head h3）、`15.5px`（安全模式值）
  - `16px`（sidebar h1）、`18px`（md-preview h1）、`24px`（topbar h2）
  - `26px`（metric-value, usage-total-value）、`52px`（coming-soon icon）
  - **共 15+ 种字号，无系统比例，视觉层级混乱**
- 无 `font-weight` 规范 token；加粗值 600/700 各处分散

---

## 二、视觉风格一致性问题

### 2.1 圆角不一致（高危）

| 值 | 使用场景 |
|---|---|
| 8px | skeleton, select, code |
| 9px | nav-link, button, debug-chip |
| 10px | memory-file-card, collab-session, usage-agent-row, debug-meta |
| 11px | task-card, doc-file-card, task-preview-box |
| 12px | metric-card, list-card, alert-card, state-box, empty-box |
| 13px | usage-total-card |
| 14px | task-col |
| 16px | panel |
| 18px | coming-soon-section |
| 20px/100px | period-tab, pill |

**9 种圆角值混用**，无层级语义。建议收敛为 3-4 个 token（sm/md/lg/full）。

### 2.2 导航图标

- 使用 Unicode Emoji（🏠🤖🔗📋📊🧠📄⚙️）作为导航图标
- Emoji 在不同操作系统/浏览器中渲染差异大（Windows/macOS 风格不同）
- 无法精确控制尺寸、颜色（无法配合激活态变色）
- pixel-office 使用 SVG 图标系统，可控性更强

### 2.3 交互状态

- 大部分卡片有 `border-color + background` hover 效果 ✅
- 部分元素缺少 `transform` 微动（如 `.doc-file-card` 有 `translateX(2px)`，`.task-card` 有 `translateY(-1px)`，但其他卡片无）
- **完全缺失 `focus-visible` 样式**（键盘导航体验差，可及性不达标）
- 按钮 active 态设计不完整（仅 `primary-button` 有 `filter: brightness(0.97)`）

### 2.4 间距一致性

- padding 值：`8px`、`9px`、`10px`、`11px`、`13px`、`14px`、`15px`、`16px`、`18px`、`20px`、`22px`、`24px`、`28px`……共 12+ 种
- 组件间 gap 无规律：`3px`、`4px`、`6px`、`7px`、`8px`、`9px`、`10px`、`12px`、`14px`、`16px`、`18px`……
- 缺少统一间距尺阶（如 4px 基础网格）

---

## 三、缺少的设计细节

### 3.1 加载与空状态

| 能力 | 现状 |
|---|---|
| 文字加载提示 | ✅ 有 state-box.loading |
| Skeleton 占位符 | ✅ 定义了 `.skeleton` 类，但**几乎没有实际使用** |
| 加载 Spinner | ✅ state-box::after 有旋转圆圈 |
| 空状态插图 | ❌ 仅文字提示，无 empty state 视觉设计 |
| 错误状态 | ✅ error card 存在 |
| 骨架屏覆盖度 | ❌ 各页面初始加载缺少骨架屏 |

### 3.2 动画过渡

| 能力 | 现状 |
|---|---|
| 页面切换 | ✅ `page-in` (0.18s, fade + translateY) |
| 状态 pill 脉冲 | ✅ `pulse-subtle` / `pulse-warning` |
| 按钮加载旋转 | ✅ `spin` |
| Skeleton shimmer | ✅ 已定义但未广泛使用 |
| 路由过渡 | ❌ 仅靠 display:none/grid 切换，无渐变 |
| 卡片展开/折叠 | ❌ 无 |
| 侧边栏折叠 | ❌ 无折叠功能 |
| Toast/通知弹出 | ❌ 无 Toast 动画系统 |

### 3.3 响应式

- 有 2 个断点：1100px 和 780px（基础可用）
- 移动端 780px 以下侧边栏变为横向导航条（隐藏文字标签）
- **缺失**：
  - 768px - 1100px 之间平板视图适配不够精细
  - 主内容区无 `max-width` 限制，超宽屏下布局过于延展
  - 暗色模式已是唯一主题，无法响应系统级 `prefers-color-scheme`

### 3.4 组件缺口

| 组件 | 现状 |
|---|---|
| Toast 通知 | ❌ 无 |
| Tooltip | ❌ 无 |
| Modal / 抽屉 | ❌ 无（task-detail 用面板展开替代）|
| Badge / Tag | 部分（pill 系） |
| 进度条 | 仅 usage-bar-fill |
| Breadcrumb | ❌ 无 |
| Dropdown | ❌ 无（用 `<select>` 代替）|
| Avatar | ❌ 无（agent 用文字 + emoji）|

---

## 四、参考项目（pixel-office）有而当前没有的能力

| 能力维度 | pixel-office | 当前项目 |
|---|---|---|
| 双主题（深/浅色模式） | ✅ | ❌ 仅深色 |
| 完整 typography 比例 | ✅ | ❌ |
| 间距尺阶（4px 网格） | ✅ | ❌ |
| 圆角规范 token | ✅ | ❌ |
| 阴影规范 token | ✅ | ❌ |
| SVG 图标系统 | ✅ | ❌（用 emoji）|
| 骨架屏覆盖 | ✅ | ❌（定义但未用）|
| Toast / 通知系统 | ✅ | ❌ |
| Focus-visible 可及性 | ✅ | ❌ |
| `prefers-color-scheme` 响应 | ✅ | ❌ |
| 组件隔离 / 模块化 CSS | ✅ | ❌（单文件 styles.css）|
| 设计 token 文档 | ✅ | ❌ |

---

## 五、设计改进建议清单

### P0 — 必须修复（影响一致性/可用性）

**P0-1：建立间距尺阶 token**
```css
--space-1:  4px;
--space-2:  8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
```
用 4px 为基础网格，将所有 padding/gap 替换为 token 引用。

**P0-2：建立字号比例 token**
```css
--text-xs:   11px;   /* meta, 标签 */
--text-sm:   12.5px; /* 次要信息 */
--text-base: 13.5px; /* 正文 */
--text-md:   15px;   /* 组件标题 */
--text-lg:   18px;   /* 页面副标题 */
--text-xl:   24px;   /* 页面标题 */
--text-2xl:  28px;   /* 大数字指标 */
```
收敛 15 种字号为 7 级比例。

**P0-3：建立圆角比例 token**
```css
--radius-sm:   6px;   /* 小 tag / badge */
--radius-md:  10px;   /* 普通卡片 */
--radius-lg:  14px;   /* 面板 / 看板列 */
--radius-xl:  18px;   /* 大区块 */
--radius-full: 9999px; /* pill / 圆形按钮 */
```
将 9 种圆角值收敛为 5 个 token。

**P0-4：补全 focus-visible 样式**
```css
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```
当前完全缺失，键盘用户体验为零。

---

### P1 — 应该修复（影响视觉质量）

**P1-1：清理游离硬编码颜色**
- 将 `#6a8fd8`、`#d9e3ff`、`#aad8ff`、`#c8d8ff`、`#06101e` 等纳入 token
- 建议新增：`--text-accent: #d9e3ff`（淡蓝强调文字）、`--text-code: #aad8ff`（代码高亮）

**P1-2：建立阴影 token**
```css
--shadow-sm: 0 2px 8px rgba(0,0,0,0.18);
--shadow-md: 0 8px 24px rgba(0,0,0,0.22);
--shadow-lg: 0 16px 40px rgba(0,0,0,0.32);
```

**P1-3：广泛使用 Skeleton 占位符**
- 已有 `.skeleton` 和 shimmer 动画，但实际页面加载时几乎都是文字 loading
- 应为 metric-card、agent-card、task-card 等添加对应骨架屏

**P1-4：引入 Toast 通知系统**
- 当前"强制重新加载"等操作反馈只靠 state-box，体验割裂
- 添加轻量 Toast 组件，用于操作成功/失败的即时反馈

**P1-5：替换导航 Emoji 为 SVG 图标**
- 引入 SVG sprite 或 CSS icon font（推荐 Lucide / Heroicons）
- 激活状态可配合 CSS `color` 变化实现颜色同步

**P1-6：统一卡片 hover 微动**
- 规范所有交互卡片的 hover 动效：统一使用 `transform: translateY(-1px)` + `box-shadow var(--ease-fast)`

---

### P2 — 建议改进（提升体验层级）

**P2-1：增加浅色主题支持**
```css
@media (prefers-color-scheme: light) {
  :root {
    color-scheme: light;
    --bg: #f4f6fb;
    --panel: #ffffff;
    /* ... */
  }
}
```
或通过 `data-theme` 属性实现手动切换。

**P2-2：主内容区添加最大宽度约束**
```css
.main { max-width: 1440px; margin: 0 auto; }
```
防止超宽屏布局过度延展。

**P2-3：CSS 按功能模块拆分**
- 当前 `styles.css` 为单文件（约 700+ 行），建议拆分：
  - `tokens.css` — 设计 token
  - `layout.css` — shell / sidebar / topbar
  - `components.css` — panel / card / button / pill
  - `pages/*.css` — 各分区专用样式

**P2-4：添加侧边栏折叠功能**
- 在移动端以下/中等屏幕提供折叠侧边栏，释放主内容区空间
- 过渡使用 `transition: width var(--ease-smooth)`

**P2-5：建立 UI 风格方向文档**
- 整理当前色彩哲学（深色科技感 + 蓝色品牌调性）为简短设计原则文档
- 说明组件命名约定，方便后续开发者与 AI 角色对齐

---

## 六、UI 风格方向建议

当前项目已建立了良好的**深色科技感**基调（深蓝背景 + `#68a1ff` 品牌蓝 + 绿色 success），但缺乏精细打磨。

建议下一轮 UI 改进沿以下方向推进：

1. **科技感 + 轻盈感结合**：在保留深色系基础上，增加细腻的渐变层次和毛玻璃效果（`backdrop-filter: blur`）局部应用
2. **内容密度中等偏低**：控制台类产品容易过于紧凑，适当增加呼吸感（间距 +15%）
3. **数据可视化准备**：为 Usage 分区的图表化改造预留样式空间（引入颜色渐变系统）
4. **中文优化**：`PingFang SC` / `Microsoft YaHei` 在小字号（11-13px）下已有处理，确保行高不低于 1.5

---

## 七、总结

| 维度 | 当前得分 | 目标得分 |
|---|---|---|
| CSS Token 完整度 | 3/10 | 8/10 |
| 颜色一致性 | 6/10 | 9/10 |
| 字体排印规范 | 3/10 | 8/10 |
| 间距一致性 | 3/10 | 8/10 |
| 圆角一致性 | 2/10 | 9/10 |
| 交互细节 | 5/10 | 8/10 |
| 加载/空状态 | 5/10 | 8/10 |
| 响应式 | 5/10 | 7/10 |
| 可及性 | 1/10 | 7/10 |
| **综合** | **3.7/10** | **8.0/10** |

**最高优先级行动**：P0-1（间距 token）+ P0-2（字号 token）+ P0-3（圆角 token）+ P0-4（focus-visible）—— 这 4 项可系统性解决当前视觉不一致问题，且不依赖功能重构进度，可并行推进。
