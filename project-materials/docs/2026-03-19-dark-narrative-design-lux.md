# 暗色叙事型控制台 · 设计规范 v3.0
**Author:** ui-lux（拉克丝）  
**Date:** 2026-03-19  
**Style:** Dark Narrative Admin Dashboard  
**Status:** 待伊泽瑞尔实现

---

## 一、设计基调

> 权威、克制、带一点叙事感。不是游戏 UI，不是古风海报，是一套专业 Admin Dashboard。

- **背景基色**：深蓝黑 / 深紫黑，营造沉浸感而非压抑感
- **唯一强调色**：低饱和金色（`#d4a574`），用于焦点引导、active 态、KPI 数字
- **信息层级**：标题 → 关键数字 → 状态标签 → 正文，每层有明显视觉落差
- **装饰原则**：减法优先，不堆叠光效，不用拟物元素

---

## 二、配色 Token 表

### 2.1 完整 CSS 变量列表

| CSS 变量名 | 值 | 用途 |
|---|---|---|
| `--bg-primary` | `#0d0d1a` | 页面根底色，整体背景 |
| `--bg-secondary` | `#1a1a2e` | 卡片、面板、侧边栏 |
| `--bg-tertiary` | `#16213e` | 次级面板、嵌套容器、输入框背景 |
| `--text-primary` | `#e5e5e5` | 主要正文、标题 |
| `--text-secondary` | `#a3a3a3` | 次要说明、元信息、label |
| `--accent` | `#d4a574` | 唯一主强调色（金色），active 态、KPI 数字、按钮 |
| `--accent-hover` | `#c49464` | 金色 hover 态 |
| `--accent-dim` | `rgba(212,165,116,0.12)` | 金色背景衬底（selected/active 区域） |
| `--accent-border` | `rgba(212,165,116,0.30)` | 金色描边（active 导航项等） |
| `--accent-glow` | `0 0 12px rgba(212,165,116,0.18)` | 轻微金色光晕（card hover） |
| `--success` | `#22c55e` | 成功、运行中、绿色状态 |
| `--success-dim` | `rgba(34,197,94,0.12)` | 成功背景衬底 |
| `--success-border` | `rgba(34,197,94,0.30)` | 成功描边 |
| `--warning` | `#eab308` | 警告、黄色状态 |
| `--warning-dim` | `rgba(234,179,8,0.12)` | 警告背景衬底 |
| `--warning-border` | `rgba(234,179,8,0.30)` | 警告描边 |
| `--danger` | `#ef4444` | 危险、错误、红色状态 |
| `--danger-dim` | `rgba(239,68,68,0.12)` | 危险背景衬底 |
| `--danger-border` | `rgba(239,68,68,0.30)` | 危险描边 |
| `--info` | `#3b82f6` | 信息、活跃、蓝色状态 |
| `--info-dim` | `rgba(59,130,246,0.12)` | 信息背景衬底 |
| `--info-border` | `rgba(59,130,246,0.30)` | 信息描边 |
| `--border` | `rgba(255,255,255,0.07)` | 默认边框 |
| `--border-strong` | `rgba(255,255,255,0.14)` | 强调边框 |
| `--border-focus` | `rgba(212,165,116,0.45)` | 输入框 focus 态（金色） |

---

## 三、组件设计规范

### 3.1 侧边导航栏（Sidebar Nav）

**容器**
- 背景：`--bg-secondary`（`#1a1a2e`）
- 宽度：240px，固定定位，全高
- 右侧边框：`1px solid var(--border)`

**导航项 — 默认态**
- 文字：`--text-secondary`
- 背景：transparent
- 圆角：`8px`
- 内边距：`10px 16px`
- icon + 文字间距：`10px`

**导航项 — Hover 态**
- 背景：`rgba(212,165,116,0.06)`
- 文字：`--text-primary`
- 过渡：`background 150ms ease-out`

**导航项 — Active / Current 态**（关键规则）
```css
.nav-item.active {
  background: var(--accent-dim);           /* rgba(212,165,116,0.12) */
  color: var(--accent);                     /* #d4a574 */
  position: relative;
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--accent);               /* 金色强调条 */
  border-radius: 0 2px 2px 0;
}
```

**分区标题**
- 字号：`11px`，字重：600
- 颜色：`--text-secondary`，大写字母
- 上下内边距：`16px 16px 6px`

---

### 3.2 卡片 / 面板（Card / Panel）

**分层规则**
| 层级 | 背景色 | 使用场景 |
|---|---|---|
| L1（页面背景） | `--bg-primary` `#0d0d1a` | 最底层，页面根 |
| L2（标准卡片） | `--bg-secondary` `#1a1a2e` | KPI卡片、内容面板、图表容器 |
| L3（嵌套容器） | `--bg-tertiary` `#16213e` | 表格行 hover、筛选栏、代码块 |

**卡片基础样式**
```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;                     /* 统一 12px */
  padding: 20px 24px;
  transition: box-shadow 200ms ease-out, border-color 200ms ease-out;
}
.card:hover {
  border-color: var(--accent-border);      /* rgba(212,165,116,0.30) */
  box-shadow: var(--accent-glow);          /* 轻微金色光晕 */
}
```

**禁止**：不使用重阴影堆叠、不使用多层渐变装饰背景

---

### 3.3 按钮（Button）

**Primary 按钮**（使用金色）
```css
.btn-primary {
  background: var(--accent);               /* #d4a574 */
  color: #0d0d1a;                          /* 深色文字，对比度足够 */
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms ease-out;
}
.btn-primary:hover {
  background: var(--accent-hover);         /* #c49464 */
}
.btn-primary:active {
  opacity: 0.85;
}
```

**Secondary 按钮**（透明边框）
```css
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 150ms ease-out, background 150ms ease-out;
}
.btn-secondary:hover {
  border-color: var(--accent-border);
  background: var(--accent-dim);
  color: var(--accent);
}
```

**Ghost / Danger 按钮**
```css
.btn-danger {
  background: var(--danger-dim);
  color: var(--danger);
  border: 1px solid var(--danger-border);
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 500;
  transition: background 150ms ease-out;
}
.btn-danger:hover {
  background: rgba(239,68,68,0.20);
}
```

---

### 3.4 状态标签（Status Badge）

格式规则：背景用 `dim`，文字用对应亮色，描边用 `border`，统一圆角 `9999px`（胶囊）

| 状态 | 文案示例 | 背景 | 文字 | 描边 |
|---|---|---|---|---|
| success | 运行中 / 正常 / 已完成 | `--success-dim` | `#4ade80` | `--success-border` |
| warning | 告警 / 降级 / 待处理 | `--warning-dim` | `#facc15` | `--warning-border` |
| danger | 故障 / 失败 / 危险 | `--danger-dim` | `#f87171` | `--danger-border` |
| info | 同步中 / 活跃 / 信息 | `--info-dim` | `#60a5fa` | `--info-border` |
| neutral | 离线 / 未激活 / 未知 | `rgba(163,163,163,0.10)` | `#a3a3a3` | `rgba(163,163,163,0.25)` |

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 9px;
  border-radius: 9999px;
  border: 1px solid;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.6;
}
.badge-success { background: var(--success-dim); color: #4ade80; border-color: var(--success-border); }
.badge-warning { background: var(--warning-dim); color: #facc15; border-color: var(--warning-border); }
.badge-danger  { background: var(--danger-dim);  color: #f87171; border-color: var(--danger-border); }
.badge-info    { background: var(--info-dim);    color: #60a5fa; border-color: var(--info-border); }
```

---

### 3.5 KPI 数字卡片

**设计要点**
- 大数字（KPI 值）：使用 `--accent`（金色）`#d4a574`，字号 `32px`，字重 `700`
- 卡片标题：`--text-secondary`，`12px`，大写字母，字重 `600`
- 变化趋势（delta）：success/danger 色，`12px`
- 底部分割线：`1px solid var(--border)`

```css
.kpi-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px 24px;
}
.kpi-card__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}
.kpi-card__value {
  font-size: 32px;
  font-weight: 700;
  color: var(--accent);             /* 金色大数字 */
  line-height: 1.1;
}
.kpi-card__delta {
  font-size: 12px;
  font-weight: 500;
  margin-top: 6px;
}
.kpi-card__delta.up   { color: var(--success); }
.kpi-card__delta.down { color: var(--danger); }
```

---

### 3.6 数据表格（Table）

**原则**：可读性优先，装饰最小化

```css
.table-wrap {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.table thead th {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
}
.table tbody tr {
  border-bottom: 1px solid var(--border);
  transition: background 120ms ease-out;
}
.table tbody tr:hover {
  background: var(--bg-tertiary);   /* 轻微 L3 背景，不用阴影 */
}
.table tbody td {
  color: var(--text-primary);
  font-size: 13px;
  padding: 10px 16px;
}
```

---

### 3.7 图表配色建议

图表使用场景下，优先保证数据可读性，不用装饰性渐变。

| 用途 | 推荐色 |
|---|---|
| 主系列（首选） | `#d4a574`（金色 accent） |
| 第二系列 | `#3b82f6`（info 蓝） |
| 第三系列 | `#22c55e`（success 绿） |
| 第四系列 | `#eab308`（warning 黄） |
| 第五系列 | `#ef4444`（danger 红） |
| 辅助 / 参考线 | `rgba(255,255,255,0.12)` |
| 坐标轴 / 网格线 | `rgba(255,255,255,0.07)` |
| 坐标轴文字 | `--text-secondary` |
| 图例文字 | `--text-secondary` |
| tooltip 背景 | `--bg-secondary`，描边 `var(--border-strong)` |

**禁止**：不用高饱和霓虹（`#00ffff`、`#ff00ff`），不用发光描边图表

---

## 四、首页舞台模块（Hero Section）规范

### 设计思路

首页顶部设置一个"主题舞台模块"（hero 区域），作为整个控制台的叙事入口。不是装饰，而是状态总览的高层视角。

**结构**
```
[ Hero Section ]
  - 左侧：页面标题 + 副标题（系统名 + 当前时间/状态描述）
  - 右侧：全局核心 KPI 3~4 个（实时数字 + 状态标签）
  - 底部：一条水平分割线，过渡到下方内容区
```

**视觉实现**
- 背景：`--bg-secondary` 或轻微渐变（`linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)`），不使用图片背景
- 左上角可放置系统 logo 或代号（文字型，非图片型）
- 标题：`24px`，`font-weight: 700`，`--text-primary`
- 副标题 / 描述：`14px`，`--text-secondary`，克制不做动效
- KPI 数字：`32px`，金色 `--accent`
- 底部分割：`border-bottom: 1px solid var(--border)`
- 整体 padding：`32px 40px`

**不允许**：背景粒子、背景视频、全屏渐变、旋转动效、角色立绘

---

## 五、动效规范

| 场景 | 动效类型 | 时长 | 缓动 |
|---|---|---|---|
| 页面切换 | fade-in | 200ms | `ease-out` |
| 侧边栏展开/收起 | slide | 250ms | `ease-out` |
| 数据加载中 | skeleton pulse | 1500ms | `ease-in-out` 循环 |
| 状态更新 | fade | 150ms | `ease-out` |
| card hover 光晕 | box-shadow transition | 200ms | `ease-out` |

**禁止**：rotate、scale 弹跳、路径动画、粒子、光线扫描

---

## 六、完整新版 CSS 变量区块

**可直接复制替换 `style.css` 中的 `:root` 段落**

```css
:root {
  color-scheme: dark;

  /* ── 页面背景层级 ── */
  --bg-primary:    #0d0d1a;   /* 页面根底色 */
  --bg-secondary:  #1a1a2e;   /* 卡片/面板/侧边栏 */
  --bg-tertiary:   #16213e;   /* 次级面板/嵌套容器/表格hover */

  /* 向下兼容旧变量 */
  --bg:            var(--bg-primary);
  --panel:         var(--bg-secondary);
  --panel-alt:     var(--bg-tertiary);
  --sidebar-bg:    var(--bg-secondary);

  /* ── 文字层级 ── */
  --text-primary:   #e5e5e5;  /* 主文字、标题 */
  --text-secondary: #a3a3a3;  /* 次要文字、label、元信息 */
  --text-disabled:  #6b7280;  /* 禁用态文字 */
  --text-inverse:   #0d0d1a;  /* 反色文字（用于金色按钮内） */

  /* 向下兼容 */
  --text:     var(--text-primary);
  --text-sub: var(--text-secondary);
  --muted:    var(--text-secondary);
  --dim:      var(--text-disabled);

  /* ── 强调色 · 低饱和金色 ── */
  --accent:        #d4a574;
  --accent-hover:  #c49464;
  --accent-dim:    rgba(212,165,116,0.12);
  --accent-border: rgba(212,165,116,0.30);
  --accent-glow:   0 0 12px rgba(212,165,116,0.18);

  /* ── 语义状态色 ── */
  --success:        #22c55e;
  --success-dim:    rgba(34,197,94,0.12);
  --success-border: rgba(34,197,94,0.30);
  --success-fg:     #4ade80;

  --warning:        #eab308;
  --warning-dim:    rgba(234,179,8,0.12);
  --warning-border: rgba(234,179,8,0.30);
  --warning-fg:     #facc15;

  --danger:         #ef4444;
  --danger-dim:     rgba(239,68,68,0.12);
  --danger-border:  rgba(239,68,68,0.30);
  --danger-fg:      #f87171;

  --info:           #3b82f6;
  --info-dim:       rgba(59,130,246,0.12);
  --info-border:    rgba(59,130,246,0.30);
  --info-fg:        #60a5fa;

  /* 向下兼容旧语义色 */
  --primary:          var(--accent);
  --primary-dim:      var(--accent-dim);
  --primary-border:   var(--accent-border);
  --status-done:      var(--success);
  --status-warning:   var(--warning);
  --status-error:     var(--danger);
  --status-active:    var(--info);
  --status-idle:      #6b7280;
  --status-blocked:   var(--danger);

  /* CC 兼容别名 */
  --color-success:          var(--success);
  --color-success-subtle:   var(--success-dim);
  --color-success-border:   var(--success-border);
  --color-success-fg:       var(--success-fg);
  --color-warning:          var(--warning);
  --color-warning-subtle:   var(--warning-dim);
  --color-warning-border:   var(--warning-border);
  --color-warning-fg:       var(--warning-fg);
  --color-danger:           var(--danger);
  --color-danger-subtle:    var(--danger-dim);
  --color-danger-border:    var(--danger-border);
  --color-danger-fg:        var(--danger-fg);
  --color-info:             var(--info);
  --color-info-subtle:      var(--info-dim);
  --color-info-border:      var(--info-border);
  --color-info-fg:          var(--info-fg);
  --color-text-primary:     var(--text-primary);
  --color-text-secondary:   var(--text-secondary);
  --color-text-muted:       var(--text-secondary);
  --color-text-disabled:    var(--text-disabled);
  --color-text-inverse:     var(--text-inverse);
  --color-text-link:        var(--info-fg);
  --color-bg-base:          var(--bg-primary);
  --color-bg-subtle:        var(--bg-secondary);
  --color-bg-panel:         var(--bg-secondary);
  --color-bg-panel-alt:     var(--bg-tertiary);
  --color-bg-elevated:      var(--bg-tertiary);
  --color-bg-overlay:       rgba(0,0,0,0.72);
  --color-border:           var(--border);
  --color-border-subtle:    var(--border-subtle);
  --color-border-strong:    var(--border-strong);
  --color-border-focus:     var(--border-focus);

  /* ── 边框 ── */
  --border:        rgba(255,255,255,0.07);
  --border-subtle: rgba(255,255,255,0.04);
  --border-strong: rgba(255,255,255,0.14);
  --border-focus:  rgba(212,165,116,0.45);  /* 输入框 focus 金色 */
  --border-hover:  var(--accent-border);

  /* ── 圆角（统一基准 12px for 卡片） ── */
  --radius-xs:   3px;
  --radius-sm:   5px;
  --radius-md:   8px;
  --radius-lg:   12px;   /* ← 卡片/面板统一圆角 */
  --radius-xl:   16px;
  --radius-2xl:  20px;
  --radius-pill: 9999px;

  /* CC 兼容别名 */
  --radii-none: 0;
  --radii-sm:   var(--radius-sm);
  --radii-md:   var(--radius-md);
  --radii-lg:   var(--radius-lg);
  --radii-xl:   var(--radius-xl);
  --radii-full: var(--radius-pill);

  /* 卡片圆角便捷 Token */
  --card-radius-sm: var(--radius-md);   /* 8px 紧凑型 */
  --card-radius-md: var(--radius-lg);   /* 12px 标准型（首选） */
  --card-radius-lg: var(--radius-xl);   /* 16px 大型 */

  /* ── 投影 ── */
  --shadow-xs:  0 1px 2px rgba(0,0,0,0.3);
  --shadow-sm:  0 1px 4px rgba(0,0,0,0.4);
  --shadow-md:  0 4px 12px rgba(0,0,0,0.45);
  --shadow-lg:  0 8px 24px rgba(0,0,0,0.5);
  --shadow-xl:  0 20px 48px rgba(0,0,0,0.6);

  /* 辉光（克制使用） */
  --glow-accent:  0 0 12px rgba(212,165,116,0.18);  /* 金色卡片hover */
  --glow-success: 0 0 12px rgba(34,197,94,0.18);
  --glow-warning: 0 0 12px rgba(234,179,8,0.18);
  --glow-danger:  0 0 12px rgba(239,68,68,0.18);
  --glow-info:    0 0 12px rgba(59,130,246,0.18);
  /* 向下兼容 */
  --glow-primary: var(--glow-accent);
  --glow-brand:   var(--glow-accent);

  /* ── 字号 ── */
  --text-xs:   11px;
  --text-sm:   12px;
  --text-base: 14px;
  --text-md:   16px;
  --text-lg:   18px;
  --text-xl:   20px;
  --text-2xl:  24px;
  --text-3xl:  32px;
  --font-size-kpi:        32px;
  --font-size-page-title: 24px;

  /* 字重 */
  --font-normal:    400;
  --font-medium:    500;
  --font-semibold:  600;
  --font-bold:      700;
  --font-extrabold: 800;

  /* ── 间距（8px 网格） ── */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  32px;
  --space-2xl: 48px;

  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-7:  32px;
  --space-8:  40px;
  --space-9:  48px;
  --space-10: 64px;

  --spacing-xs:  var(--space-1);
  --spacing-sm:  var(--space-2);
  --spacing-md:  var(--space-4);
  --spacing-lg:  var(--space-6);
  --spacing-xl:  var(--space-7);
  --spacing-2xl: var(--space-9);
  --spacing-3xl: var(--space-10);

  /* ── 布局 ── */
  --layout-sidebar-w:     240px;
  --layout-topbar-h:      56px;
  --layout-content-pad-x: 28px;
  --layout-content-pad-y: 24px;
  --layout-gap:           16px;
  --layout-max-content:   1440px;
  --layout-hero-pad:      32px 40px;

  /* 向下兼容 */
  --sidebar-w:     var(--layout-sidebar-w);
  --topbar-h:      var(--layout-topbar-h);
  --content-pad-x: var(--layout-content-pad-x);
  --content-pad-y: var(--layout-content-pad-y);

  /* ── 卡片内边距 Token ── */
  --card-pad-sm:  10px 14px;
  --card-pad-md:  14px 20px;
  --card-pad-lg:  20px 24px;

  /* ── Badge Token ── */
  --badge-font-size:   var(--text-xs);
  --badge-font-weight: var(--font-semibold);
  --badge-pad-x:       9px;
  --badge-pad-y:       2px;
  --badge-radius:      var(--radius-pill);

  /* ── 动效 ── */
  --dur-instant: 80ms;
  --dur-fast:    120ms;
  --dur-base:    200ms;
  --dur-slow:    320ms;
  --dur-slower:  480ms;

  --ease-linear:  linear;
  --ease-in:      cubic-bezier(0.64,0,0.78,0);
  --ease-out:     cubic-bezier(0.22,1,0.36,1);
  --ease-in-out:  cubic-bezier(0.37,0,0.63,1);
  --ease-spring:  cubic-bezier(0.34,1.56,0.64,1);

  --transition-fast:   var(--dur-fast)  var(--ease-out);
  --transition-base:   var(--dur-base)  var(--ease-out);
  --transition-slow:   var(--dur-slow)  var(--ease-out);
  --transition-spring: var(--dur-base)  var(--ease-spring);

  /* ── Z-index ── */
  --z-base:    0;
  --z-raised:  10;
  --z-sticky:  50;
  --z-nav:     100;
  --z-overlay: 200;
  --z-modal:   300;
  --z-toast:   400;
  --z-tooltip: 500;
  --z-max:     9999;
}
```

---

## 七、变更对照表（与 v2.1 的主要差异）

| 维度 | v2.1（旧） | v3.0（新） |
|---|---|---|
| 页面底色 | `#070c18` | `#0d0d1a` |
| 卡片背景 | `rgba(255,255,255,0.025)` | `#1a1a2e` |
| 强调色 | `#5b96ff`（蓝） | `#d4a574`（低饱和金） |
| 主文字 | `#e4ebff` | `#e5e5e5` |
| 次文字 | `#8ba0c8` | `#a3a3a3` |
| 卡片圆角 | `8px (--radius-md)` | `12px (--radius-lg)` 统一 |
| 导航 active 色 | 蓝色 primary | 金色 accent + 左侧强调条 |
| focus 色 | 蓝色 `rgba(91,150,255,0.55)` | 金色 `rgba(212,165,116,0.45)` |
| hover glow | 蓝色辉光 | 轻微金色辉光（降低强度） |
| success | `#3ecf8e` | `#22c55e` |
| danger | `#ff6b81` | `#ef4444` |
| info | `#4d9fff` | `#3b82f6` |

---

*设计规范由 ui-lux 出具，v3.0 正式版，待伊泽瑞尔（frontend-ezreal）实现。*
