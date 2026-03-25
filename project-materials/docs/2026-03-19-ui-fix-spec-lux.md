# UI 整改设计方案
**作者**: 设计师拉克丝（ui-lux）  
**日期**: 2026-03-19  
**版本**: v1.0  
**触发**: 产品经理艾克 PC UI 规范（`2026-03-19-pc-ui-spec-ekko.md`）  
**下游**: 前端伊泽瑞尔（frontend-ezreal）直接执行 CSS 修改清单

---

## 1. 当前 CSS 现状诊断

实际读取文件路径：`artifacts/office-dashboard-adapter/src/public/style.css`（共约 2472 行）

### 1.1 布局结构现状

| 元素 | 当前值 | 问题 |
|------|--------|------|
| `body` min-width | **未设置** | 根本原因：无最小宽度限制 |
| `.shell` min-width | **未设置** | 同上 |
| `--sidebar-w` | `240px` ✅ | 初始值正确 |
| `--inspector-w` | `256px` | 规范要求 260px，差 4px（次要问题） |
| `--content-pad-x` | `28px` | 规范要求 32px，差 4px |
| `.main` min-width | `min-width: 0`（flex 收缩） | 无 640px 保护 |

### 1.2 响应式断点现状（核心问题区）

文件中存在**两套并列的响应式断点**，相互独立，部分规则冲突：

**第一套（第 2056~2104 行，Section 41）：**
```css
@media (max-width: 1400px) { --inspector-w: 220px; }
@media (max-width: 1200px) { --sidebar-w: 200px; /* 布局强制单列 */ }
@media (max-width: 900px)  { --inspector-w: 0px; .inspector-sidebar { display: none; } }
@media (max-width: 720px)  { /* ⚠️ 手机模式：sidebar 变顶栏，隐藏文字 */ }
```

**第二套（第 2456~2470 行，Section CC-53）：**
```css
@media (max-width: 1440px) { --layout-inspector-w: 220px; --inspector-w: 220px; }
@media (max-width: 1200px) { --layout-sidebar-w: 200px; --sidebar-w: 200px; }
@media (max-width: 900px)  { --layout-inspector-w: 0px; --inspector-w: 0px; }
```

**问题一览**：
- `720px` 断点存在：sidebar 变成横向顶栏，`.nav-label { display: none; }`——这是手机模式，PC 绝对不能触发
- 两套断点同时存在，`1200px` 都会触发 `--sidebar-w: 200px` 缩减（规范要求 1280px+ 保持 240px）
- `900px` 断点隐藏 inspector（规范要求应在 1280px 以下折叠，不是 900px）
- 第一套和第二套的 inspector 断点触发点不同（1400px vs 1440px），对同一个 `--inspector-w` 变量产生竞争

### 1.3 KPI 网格现状

```css
.kpi-grid {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}
```
- 使用 `minmax(180px, 1fr)` ——在 1440px 宽度下理论上能展示 4~5 个，数值基本满足
- 但规范建议最小值 200px（更合适的 PC 卡片宽度）

### 1.4 配色现状

颜色系统（`:root` 中定义）整体为深色主题，CSS 变量体系完整，一致性较好：
- 主色 `--primary: #5b96ff` ✅
- 背景三层 `--bg` / `--panel` / `--panel-alt` ✅
- 语义状态色 5 种 ✅
- 另有 tokens.css 引入的 CC 兼容变量（`--semantic-*`、`--color-*`）——**存在两套命名体系**

**配色问题**：
- 颜色变量存在 CC Token（`--semantic-*`、`--color-*`）和本体系（`--status-*`、`--primary` 等）**双套并行**，个别组件混用两套变量，无法通过单一变量统一调整
- 规范要求"颜色系统不超过 3 套命名体系"——当前存在 `--status-*`、`--color-*`、`--semantic-*` 三套，触碰上限

---

## 2. 与产品规范的差距分析

对照艾克规范（`2026-03-19-pc-ui-spec-ekko.md`）逐条比对：

### 2.1 强制宽度约束（§2.2）

| 规范要求 | 当前实现 | 满足状态 |
|----------|----------|----------|
| `body` / `.shell` `min-width: 1280px` | **未设置** | ❌ 不满足 |
| 侧边栏 240px 固定 | 初始 240px，但 ≤1200px 会缩减为 200px | ⚠️ 部分满足 |
| 检查器 260px | `--inspector-w: 256px` | ⚠️ 差 4px |
| 主内容区 `min-width: 640px` | `min-width: 0` | ❌ 不满足 |
| 主内容区内边距 `24px 32px` | `24px 28px` | ⚠️ 横向差 4px |
| 内容区不加 `max-width` 居中限制 | 无全局 `max-width` | ✅ 满足 |

### 2.2 侧边栏规范（§2.3）

| 规范要求 | 当前实现 | 满足状态 |
|----------|----------|----------|
| `height: 100vh; position: sticky; top: 0` | ✅ 已实现 | ✅ 满足 |
| 导航项高度 44px | `padding: 8px 10px`（高度约 37px） | ⚠️ 偏低 |
| 文字标签 1280px+ 可见 | `@media (max-width: 720px)` 隐藏文字 | ⚠️ 720px 触发时不满足（PC 缩放可能触发） |
| PC 下不折叠为图标栏 | `720px` 断点会折叠 | ❌ 不满足 |

### 2.3 响应式策略（§3.2）

| 规范断点规则 | 当前实现 | 满足状态 |
|-------------|----------|----------|
| ≥1600px：检查器展开，侧边栏 240px | 触发 1440px 收缩 inspector | ⚠️ 触发点偏早 |
| 1400px~1599px：检查器 220px | 1400px 收缩（基本对应）| ✅ 可接受 |
| 1280px~1399px：检查器折叠，侧边栏 240px | 900px 才折叠检查器 | ❌ 不满足 |
| <1280px：允许横向滚动 | 1200px 开始单列压缩 | ⚠️ 策略方向相反 |

### 2.4 明确废除行为（§3.3）

| 废除要求 | 当前状态 | 满足状态 |
|----------|----------|----------|
| 删除 `@media (max-width: 720px)` 手机断点 | **仍存在** | ❌ 不满足 |
| 删除导航文字隐藏 | `.nav-label { display: none; }` 存在 | ❌ 不满足 |
| 1100px 以下才单列（而非 1200px） | 1200px 触发单列 | ⚠️ 可调整 |

### 2.5 信息密度（§4.1）

| 规范要求 | 当前状态 | 满足状态 |
|----------|----------|----------|
| KPI 一行 4~5 个 | `minmax(180px)` 在 1440px 下可达 | ✅ 基本满足 |
| Agent 卡片每行 2~3 | `minmax(280px)` 在 1440px 下约 3~4 个 | ✅ 满足 |
| 任务行高 ≤48px | `padding: 10px 14px`（约 40px+行高） | ✅ 满足 |
| 侧边栏文字始终可见 | 720px 断点隐藏 | ❌ 不满足 |
| 导航项高度 44px | 实际约 37px | ⚠️ 偏低 |

### 2.6 字号层级（§4.2）

| 规范要求 | 当前状态 | 满足状态 |
|----------|----------|----------|
| 正文 13~14px | `--text-base: 14px` | ✅ 满足 |
| KPI 数值 28~32px | `32px` | ✅ 满足 |
| 面板标题 14px 700 | 已实现 | ✅ 满足 |
| 辅助文字 12px | `--text-sm: 12px` | ✅ 满足 |
| 禁止正文 >16px | `--text-md: 16px` 存在但用于次要场景 | ✅ 满足 |

### 2.7 总结评分

| 类别 | 满足数 | 不满足/需修改数 |
|------|--------|-----------------|
| 布局宽度约束 | 2/6 | 4 项需修改 |
| 响应式策略 | 1/6 | 5 项需修改 |
| 信息密度 | 3/5 | 2 项需改善 |
| 视觉/颜色 | 大部分满足 | 双套命名体系需整合 |

---

## 3. 具体整改设计方案

### 3.1 布局结构调整

#### 3.1.1 最小宽度强制规则（P0）

**整改目标**：在任何窗口缩放或 PC 低分辨率下，不允许页面布局坍缩为手机比例。

**设计决策**：
```
body      → 增加 min-width: 1280px
.shell    → 增加 min-width: 1280px
.main     → 增加 min-width: 640px（替换现有 min-width: 0）
```

说明：`min-width: 1280px` 设置在 `body` 上后，浏览器窗口宽度低于此值时将出现横向滚动条，而不是压缩布局。这是 PC 专属工具的正确行为。

#### 3.1.2 侧边栏宽度修正

**整改目标**：侧边栏在 1280px+ 下保持 240px 固定宽度，不因窗口缩小而缩减。

**设计决策**：
- `--sidebar-w` 默认值保持 `240px`
- 删除所有对 `--sidebar-w` 的媒体查询缩减规则（当前 `≤1200px` 缩减到 200px 的规则删除）
- 1280px 以下允许出现横向滚动，不再压缩侧边栏

#### 3.1.3 检查器宽度修正

**整改目标**：检查器在 ≥1280px 时展开，1280px~1399px 时折叠隐藏。

**设计决策**：
- `--inspector-w` 调整为 `260px`（规范值，当前 256px）
- 检查器折叠断点从 `900px` 改为 `1280px`（前移 380px）

#### 3.1.4 内容区内边距修正

**整改目标**：横向内边距从 28px 调整为 32px，符合规范。

**设计决策**：
- `--content-pad-x: 28px` → `--content-pad-x: 32px`

---

### 3.2 响应式策略修改（PC 优先断点重写）

#### 3.2.1 废除手机断点（P0）

**删除以下整个断点块**（位于 Section 41，约第 2077~2104 行）：
```css
/* 全部删除 */
@media (max-width: 720px) { ... }
```

该块包含：
- sidebar 变顶部横栏
- `.nav-label { display: none; }`
- `.main { padding: 14px; }`
- 等手机专属样式——**全部删除**

#### 3.2.2 重写响应式断点体系

**废除当前两套并存的断点体系**，合并为一套统一规则：

**新断点规则**（仅保留 PC 场景）：

| 断点 | 规则 | 说明 |
|------|------|------|
| ≥ 1600px | 检查器 260px，侧边栏 240px | 理想态，`--inspector-w: 260px` |
| 1400px ~ 1599px | 检查器 220px，侧边栏 240px | `--inspector-w: 220px` |
| 1280px ~ 1399px | 检查器折叠隐藏，侧边栏 240px，内容区撑满 | `--inspector-w: 0px` + `display:none` |
| < 1280px | 不保证，出现横向滚动条 | 不添加任何压缩规则 |

**内容区两列变单列断点**：
- 当前在 `≤1200px` 触发，改为 `≤1100px` 触发（仅针对内容区内部布局，与外部三栏无关）

---

### 3.3 配色问题具体修正点

#### 3.3.1 双套颜色变量体系整合

**问题**：当前存在 `--status-*`（本体系）和 `--color-*`/`--semantic-*`（CC Token 体系）三套命名并行，个别组件使用不同套变量。

**整改方案**：
- 保持 `:root` 中的 `--color-*` 桥接变量（映射到本体系），维持现有做法
- 不引入第四套命名
- 清查有无组件直接硬编码颜色（如 `color: #3ecf8e` 直写而不走变量）
- **优先级**：P1，视觉效果已基本正确，整合是代码健康问题

#### 3.3.2 需确认的具体颜色值

根据规范 §4.3，深度差验证：
```
--bg:       #070c18  ← 页面底色
--panel:    #0d1629  ← 面板色（差值约 +6 亮度，✅ 有层次）
--panel-alt: #111e38 ← 次级面板（比 panel 再亮，✅ 三层存在）
```
三层深度差满足，颜色系统层次**已符合规范**。

**需修正的颜色点**：

| 问题点 | 当前值 | 建议值 | 原因 |
|--------|--------|--------|------|
| `.nav-link.active` 文字色 | `#a0c0ff` | `#c8daff` | 增强激活项可读性，当前偏暗 |
| `--primary` 对比度 | `#5b96ff` on `#070c18` | 保持，对比度约 5.2:1 ✅ | 满足规范 4.5:1 要求 |
| 纯白文字 | 已用 `#e4ebff` 代替 `#fff` ✅ | 保持 | 满足规范 |

---

### 3.4 信息密度改进

#### 3.4.1 导航项高度

**问题**：当前 `.nav-link` 使用 `padding: 8px 10px`，实际高度约 37px，低于规范 44px。

**整改方案**：
```css
.nav-link {
  padding: 10px 10px;  /* 上下各增加 2px，达到约 41px，接近规范 44px */
}
```
或直接设置 `min-height: 44px`。

#### 3.4.2 KPI 网格最小卡片宽度

**问题**：当前 `minmax(180px, 1fr)`，规范建议 200px 起。

**整改方案**：
```css
.kpi-grid {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
```
说明：1440px 宽度下，去掉 240px 侧边栏和 260px 检查器，剩余约 940px 内容区，minmax(200px) 可放 4 个卡片（940÷200=4.7），满足规范"4~5 个横排"。

#### 3.4.3 内容区单列触发断点后移

**问题**：当前 `≤1200px` 触发 `.two-up` 等两列变单列，但规范要求 `≤1100px` 才变单列。

**整改方案**：
```css
@media (max-width: 1100px) {  /* 从 1200px 改为 1100px */
  .two-up, .config-layout, .summary-grid, .metrics { 
    grid-template-columns: 1fr; 
  }
}
```

---

## 4. CSS 修改清单（供伊泽瑞尔直接执行）

以下是完整的 CSS 修改清单，按优先级排列，标注文件位置。

---

### 🔴 P0 – 立即修复（手机比例根本原因）

#### MOD-01：`body` 增加 `min-width`

**位置**：第 124~134 行，`body { ... }` 规则块内  
**操作**：在 `body {}` 中追加一行

```css
body {
  /* 现有属性保持不变 */
  font-family: ...;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  line-height: 1.5;
  font-size: var(--text-base);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  
  /* ✅ 新增以下一行 */
  min-width: 1280px;
}
```

---

#### MOD-02：`.shell` 增加 `min-width`

**位置**：第 159~165 行，`.shell { ... }` 规则块  
**操作**：追加 `min-width: 1280px`

```css
.shell {
  display: grid;
  grid-template-columns: var(--sidebar-w) 1fr var(--inspector-w);
  min-height: 100vh;
  position: relative;
  
  /* ✅ 新增以下一行 */
  min-width: 1280px;
}
```

---

#### MOD-03：`.main` 修改 `min-width`

**位置**：第 290~296 行，`.main { ... }` 规则块  
**操作**：将 `min-width: 0` 改为 `min-width: 640px`

```css
.main {
  background: linear-gradient(160deg, var(--bg-subtle) 0%, var(--bg) 100%);
  padding: var(--content-pad-y) var(--content-pad-x);
  min-height: 100vh;
  overflow-y: auto;
  
  /* ✅ 修改：0 → 640px */
  min-width: 640px;
}
```

---

#### MOD-04：删除 `@media (max-width: 720px)` 整个断点块

**位置**：约第 2077~2104 行（Section 41 中）  
**操作**：删除以下**整个 media query 块**（共约 27 行）

```css
/* ⛔ 删除以下全部内容 */
@media (max-width: 720px) {
  .shell { grid-template-columns: 1fr; }
  .sidebar {
    position: static;
    height: auto;
    flex-direction: row;
    flex-wrap: wrap;
    padding: 10px 12px;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
  .sidebar-header { flex: 1 1 100%; }
  .nav { flex-direction: row; flex-wrap: wrap; flex: 1 1 100%; padding: 6px 0; gap: 4px; }
  .nav-label { display: none; }
  .nav-icon  { font-size: 17px; }
  .nav-link  { justify-content: center; padding: 8px; min-width: 40px; }
  .topbar    { flex-direction: column; align-items: flex-start; }
  .main      { padding: 14px; }
}
```

---

### 🟡 P1 – 断点体系重写（手机比例问题的完整修复）

#### MOD-05：重写 Section 41 响应式断点（第 2056~2076 行）

**操作**：将 Section 41 的三个断点全部替换为以下内容

```css
/* ── 41. Responsive (PC-first, no mobile support) ─────────────────────────── */

/* ≥1600px: 检查器全展开（默认态，无需媒体查询） */

/* 1400px ~ 1599px: 检查器轻微压缩 */
@media (max-width: 1599px) {
  :root { --inspector-w: 220px; }
}

/* 1280px ~ 1399px: 检查器折叠隐藏，侧边栏保持 240px，内容区撑满 */
@media (max-width: 1399px) {
  :root { --inspector-w: 0px; }
  .inspector-sidebar { display: none; }
  .inspector-toggle  { display: none; }
  .shell { grid-template-columns: var(--sidebar-w) 1fr; }
}

/* 内容区两列变单列（≤1100px，与外部三栏布局无关）*/
@media (max-width: 1100px) {
  .two-up, .config-layout, .summary-grid, .metrics { 
    grid-template-columns: 1fr; 
  }
  .docs-layout { grid-template-columns: 260px 1fr; }
  .tasks-board { grid-template-columns: 1fr; }
  .wiring-grid { grid-template-columns: 1fr; }
}

/* <1280px: 不保证正确显示，允许出现横向滚动条 */
/* 注意：此处不添加任何布局压缩规则，依赖 min-width: 1280px 产生横向滚动 */
```

---

#### MOD-06：同步删除 Section CC-53 中的冲突断点（约第 2456~2470 行）

**操作**：将 Section CC-53 整个响应式块替换为注释说明

```css
/* ─── CC-53. 响应式断点（已统一到 Section 41，此处不重复定义）──────────── */
/* 断点规则见 Section 41。CC Token 变量 --layout-sidebar-w / --layout-inspector-w
   在 Section 41 的断点中同步更新 */
```

---

### 🟡 P1 – 尺寸数值修正

#### MOD-07：修正 `--inspector-w` 初始值

**位置**：第 107 行，`:root { --inspector-w: 256px; }`  
**操作**：256px → 260px

```css
--inspector-w:   260px;  /* 修改：256px → 260px，对齐规范 */
```

#### MOD-08：修正 `--content-pad-x` 初始值

**位置**：第 109 行，`:root { --content-pad-x: 28px; }`  
**操作**：28px → 32px

```css
--content-pad-x: 32px;  /* 修改：28px → 32px，对齐规范 24px/32px 内边距 */
```

#### MOD-09：修正 KPI 网格最小卡片宽度

**位置**：第 404 行，`.kpi-grid { grid-template-columns: ... }`  
**操作**：`minmax(180px, 1fr)` → `minmax(200px, 1fr)`

```css
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));  /* 180px → 200px */
  gap: var(--space-sm);
}
```

---

### 🟢 P2 – 信息密度改善

#### MOD-10：导航项高度提升到接近 44px

**位置**：约第 244~256 行，`.nav-link { ... }`  
**操作**：增加 `min-height: 44px`，或将 padding 从 `8px 10px` 调整为 `10px 10px`

```css
.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 10px;     /* 修改：8px 10px → 10px 10px */
  min-height: 44px;       /* 新增：保证最低触控/点击高度 */
  border-radius: var(--radius-md);
  /* 其余属性保持不变 */
}
```

#### MOD-11：激活导航项文字色增强

**位置**：约第 257~262 行，`.nav-link.active { ... }`  
**操作**：`color: #a0c0ff` → `color: #c8daff`

```css
.nav-link.active {
  background: var(--primary-dim);
  border-color: var(--primary-border);
  color: #c8daff;  /* 修改：#a0c0ff → #c8daff（增强激活项可读性） */
  border-left: 3px solid var(--primary, #5b96ff);
  padding-left: calc(var(--space-sm) - 1px);
}
```

#### MOD-12：Section CC-53 中侧边栏缩减规则修正

**位置**：约第 2460~2465 行（CC-53）  
**操作**：若保留该段（不选择 MOD-06 完全删除路线），则修改为：

```css
@media (max-width: 1100px) {
  :root {
    /* 注意：sidebar-w 不再缩减，保持 240px */
    --layout-content-pad-x: 28px; --content-pad-x: 28px;  /* 适当压缩内边距 */
  }
}
```

---

## 5. 修改优先级汇总表

| 编号 | 修改点 | 优先级 | 预期解决问题 |
|------|--------|--------|-------------|
| MOD-01 | body 增加 min-width: 1280px | 🔴 P0 | 消除手机比例根本原因 |
| MOD-02 | .shell 增加 min-width: 1280px | 🔴 P0 | 同上 |
| MOD-03 | .main min-width: 0 → 640px | 🔴 P0 | 防止内容区过窄 |
| MOD-04 | 删除 720px 手机断点 | 🔴 P0 | 消除侧边栏变顶栏/文字消失 |
| MOD-05 | 重写 Section 41 断点体系 | 🟡 P1 | PC 正确响应式策略 |
| MOD-06 | 删除 CC-53 冲突断点 | 🟡 P1 | 消除双套断点竞争 |
| MOD-07 | inspector-w: 256px → 260px | 🟡 P1 | 规范对齐 |
| MOD-08 | content-pad-x: 28px → 32px | 🟡 P1 | 规范对齐 |
| MOD-09 | KPI minmax: 180px → 200px | 🟡 P1 | 信息密度规范 |
| MOD-10 | 导航项 min-height: 44px | 🟢 P2 | 信息密度提升 |
| MOD-11 | 激活导航项文字色增强 | 🟢 P2 | 视觉可读性 |
| MOD-12 | 删除 1200px 侧边栏缩减规则 | 🟡 P1 | 包含在 MOD-05 中 |

---

## 6. 执行顺序建议（给伊泽瑞尔）

建议按以下顺序执行，每步完成后在 1440px 浏览器宽度下验证：

```
Step 1: 执行 MOD-01 + MOD-02 + MOD-03（min-width 三件套）
        → 验证：缩窗口出现横向滚动条而非布局坍缩

Step 2: 执行 MOD-04（删除 720px 断点）
        → 验证：缩到 720px 后侧边栏仍为竖排，文字仍可见

Step 3: 执行 MOD-05 + MOD-06（重写断点体系）
        → 验证：1440px 下三栏可见，1300px 下检查器折叠，侧边栏 240px

Step 4: 执行 MOD-07 + MOD-08 + MOD-09（尺寸微调）
        → 验证：KPI 在 1440px 下呈 4+ 横排

Step 5: 执行 MOD-10 + MOD-11（信息密度/视觉提升）
        → 验证：导航项高度和激活态可读性
```

---

## 7. 验收对照（艾克规范 §5 清单）

| 验收项 | 对应本方案修改 | 预期通过 |
|--------|---------------|---------|
| L1: 1440px 三栏均可见 | MOD-01/02/05 | ✅ |
| L2: 1280px 两栏正常 | MOD-05（1399px 以下折叠检查器）| ✅ |
| L3: 收起检查器后内容区撑满 | 现有 `.shell.inspector-hidden` 已正确处理 | ✅ |
| L4: 无断点触发侧边栏横排 | MOD-04 | ✅ |
| L5: 1280px 下无横向滚动条 | MOD-01/02 + 不压缩布局 | ✅ |
| D1: KPI 4+ 横排 | MOD-09 | ✅ |
| D2: Agent 卡片每行 2+ | 现有 `minmax(280px)` 在 1440px 约 3 个 | ✅ |
| D3: 任务行高 ≤48px | 现有约 40px | ✅ |
| D4: 侧边栏文字 1280px+ 可见 | MOD-04 | ✅ |
| T1: body/shell min-width: 1280px | MOD-01/02 | ✅ |
| T2: 无 ≤768/720px 布局断点 | MOD-04 | ✅ |
| T3: 颜色全用 CSS 变量 | 需二次检查硬编码（低风险）| ⚠️ 待查 |

---

*本文档为设计层面整改方案，不含代码实现。CSS 修改清单中的代码片段仅作规范参考，伊泽瑞尔在实现时应以实际文件行号为准，执行前建议备份原文件。*

*如有设计层面疑问，联系拉克丝（ui-lux）。*
