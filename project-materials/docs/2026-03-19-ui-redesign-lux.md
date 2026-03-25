# UI 全面美化报告
**负责人**: 设计师拉克丝（ui-lux）  
**日期**: 2026-03-19  
**触发原因**: 李琪反馈"页面的 UI 和排版很糟糕"  

---

## 问题诊断

原有样式存在以下问题：
1. **样式文件混乱**：`index.html` 引用 `/assets/styles.css`（不存在），导致主样式未正确加载
2. **大量内联覆盖**：HTML 头部 `<style>` 块包含 60+ 行临时深色覆盖，与外部 CSS 冲突
3. **颜色系统割裂**：`style.css` 同时包含浅色（CC 组件系统）和深色（原始系统）两套，相互覆盖
4. **排版无层次**：标题/正文/标签字号混乱，letter-spacing 不统一
5. **圆角不统一**：从 `4px` 到 `20px` 混用，视觉碎片化
6. **阴影不统一**：`shadow-sm/md/lg` 参数各处不同

---

## 改造内容

### 1. 文件链接修复
- **删除** `<link rel="stylesheet" href="/assets/styles.css" />`（文件不存在，改为引用实际存在的 `style.css`）
- **新增** `<link rel="stylesheet" href="style.css" />`
- **删除** HTML 头部全部内联 `<style>` 覆盖块（60+ 行），改为由 `style.css` 统一处理

### 2. 颜色系统重建（Dark Theme，贯通到底）

| Token | 旧值 | 新值 | 用途 |
|-------|------|------|------|
| `--bg` | `#080d1a` | `#070c18` | 页面底色 |
| `--panel` | `#0f1628` | `#0d1629` | 卡片/面板 |
| `--panel-alt` | `#171f36` | `#111e38` | 次级面板 |
| `--sidebar-bg` | `#060b16` | `#060c18` | 侧边栏 |
| `--primary` | `#68a1ff` | `#5b96ff` | 主色（更饱和） |
| `--text` | `#edf2ff` | `#e4ebff` | 主文字 |
| `--muted` | `#8fa0c7` | `#8ba0c8` | 次要文字 |
| `--dim` | `#5c6e96` | `#4e6089` | 弱化文字 |
| `--border` | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.07)` | 统一边框 |

新增 Token：
- `--bg-subtle`: 渐变过渡色
- `--panel-hover`: 悬停态面板色
- `--card-hover`: 悬停态卡片色
- `--text-sub`: 副标题文字色
- `--border-sub`: 内部分隔线色
- `--primary-dim`: 主色浅背景
- `--primary-border`: 主色边框

### 3. 字体层次规范化

```
h1 (page title) : 24px, weight 800, letter-spacing -0.025em
h2/h3 (panel)   : 14px, weight 700, letter-spacing -0.01em
.eyebrow        : 10-11px, weight 700, letter-spacing 0.14em, UPPERCASE
.muted          : 13px, color --muted
.dim            : 12px, color --dim
.kpi-value      : 32px, weight 800, tabular-nums
```

### 4. 组件统一

#### KPI 卡片
- 统一 `border-radius: 12px`
- 顶部 2px 渐变色条（蓝/绿/橙/红四种 tone）
- hover 有轻微 box-shadow 反馈
- `font-variant-numeric: tabular-nums` 数字等宽

#### 导航栏
- active 状态：`primary-dim` 背景 + `primary-border` 边框
- hover：`rgba(255,255,255,0.05)` 背景
- active icon：蓝色 glow 效果
- 消除了原来的 `translateX(1px)` 跳动感

#### 面板（Panel）
- 统一 `border-radius: 16px`（`--radius-xl`）
- `panel-head` 增加 `border-bottom: 1px solid --border-sub` 分隔
- hover 时 border 轻微加亮
- `box-shadow: --shadow-md` 默认开启

#### 卡片/列表
- 统一 `border-radius: 12px`（`--radius-lg`）
- hover 统一用 `--border-hover` + `--card-hover`
- 过渡时长统一 `120ms`（`--dur-fast`）

#### 按钮
- `.primary-button`：深色文字（`#06101e`）配亮蓝背景，hover `brightness(1.1)` 
- `.ghost-button`：透明背景，hover 时轻填充
- `.btn-secondary`：`panel-alt` 背景
- 统一 `border-radius: 8px`（`--radius-md`）

### 5. 间距规范化

```
--space-xs: 4px
--space-sm: 8px
--space-md: 16px
--space-lg: 24px
--space-xl: 32px
--space-2xl: 48px
```

内容区 padding：`24px 28px`（`--content-pad-y / --content-pad-x`）

### 6. 阴影规范化

```
--shadow-sm: 0 1px 3px rgba(0,0,0,.30), 0 1px 2px rgba(0,0,0,.20)
--shadow-md: 0 4px 12px rgba(0,0,0,.35), 0 2px 4px rgba(0,0,0,.20)
--shadow-lg: 0 8px 24px rgba(0,0,0,.40), 0 4px 8px rgba(0,0,0,.25)
--shadow-xl: 0 20px 48px rgba(0,0,0,.50)   # search overlay 专用
```

### 7. 动效规范化

```
--dur-fast:  120ms   # hover 反馈
--dur-base:  200ms   # 过渡动画
--dur-slow:  320ms   # 大幅状态变化
--ease-out:  cubic-bezier(0.22,1,0.36,1)
--ease-spring: cubic-bezier(0.34,1.56,0.64,1)
```

### 8. 响应式断点

```
max-width: 1400px → inspector-w: 220px
max-width: 1200px → sidebar-w: 200px, 单列布局
max-width:  900px → 隐藏 inspector
max-width:  720px → 移动端 sidebar 折叠为顶栏
```

---

## 文件变更

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/public/style.css` | 完全重写 | 全新设计系统，~1700行，统一暗色主题 |
| `src/public/index.html` | 修改 | 修复样式链接，删除冲突内联样式 |

---

## 视觉提升对比

| 维度 | 改造前 | 改造后 |
|------|--------|--------|
| 颜色一致性 | 三套系统混用，浅色/深色混搭 | 单一深色主题，全局 CSS 变量 |
| 字体层次 | 随机字号，无规律 | 7级字号 scale，层次清晰 |
| 圆角统一性 | 4px～20px 混用 | 5级标准（xs/sm/md/lg/xl）|
| 阴影统一性 | 各处随机参数 | 4级标准阴影 |
| 交互动效 | 部分有/部分无 | 全面 120ms/200ms 统一 |
| 数字展示 | 无等宽处理 | `font-variant-numeric: tabular-nums` |
| 样式加载 | 主样式文件未正确加载 | 修复链接，正确加载 |

---

## 保留内容

- ✅ 8 分区页面结构（overview/agents/collaboration/tasks/usage/memory/docs/settings）
- ✅ 全部 JS 功能（app.js 未修改）
- ✅ Inspector 侧边栏及折叠逻辑
- ✅ 搜索浮层
- ✅ KPI 网格、看板、文档列表等布局
- ✅ 所有 CSS 类名（向后兼容，BEM 别名保留）
