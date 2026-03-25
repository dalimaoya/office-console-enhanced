# 字体设计规范 v1.0

**文档类型：** 设计规范  
**作者：** ui-lux（拉克丝）  
**日期：** 2026-03-19  
**项目：** 办公控制台增强（Office Console Enhanced）  
**背景：** 用户反馈当前控制台字体"不够厚重，没有层次感"，需补全字体规范以支撑专业 admin dashboard 的权威克制叙事感。

---

## 设计目标

> 深蓝黑背景 `#0d0d1a` × 金色强调 `#d4a574` 的暗色叙事型界面，需要配套一套**厚重、克制、有层次感**的字体系统。

- **厚重**：关键信息用 700–800 字重，确保在暗色背景下视觉冲击力足够
- **层次感**：至少 5 个字号层级，大小对比比例不低于 1.25×
- **叙事感**：标题使用有个性的衬线/等宽风格字体，数字使用 tabular-nums 保证对齐
- **克制**：正文不滥用粗体，保持阅读舒适性

---

## 1. 字体栈（font-family）

### 1.1 标题 / Display 字体 — `--font-family-display`

```css
"Inter", "DM Sans", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

**选择理由：**
- **Inter**（Google Fonts 首选）：专为屏幕设计，字重 400–900 全覆盖，800/900 字重在暗色背景下极具冲击力；字形几何感强，符合"权威克制"调性
- **DM Sans**（备选）：字形更圆润，带轻叙事感，适合副标题
- **SF Pro Display / system-ui**：macOS/iOS 系统回退，确保 Apple 设备渲染质量
- 所有字体均支持 `font-feature-settings: "tnum"` 等 OpenType 特性

**Google Fonts 引入方式：**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### 1.2 正文字体 — `--font-family-body`

```css
"Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif
```

**选择理由：**
- 与标题字体统一使用 Inter，减少字体加载数量
- 正文使用 400–500 字重，行高宽松，保证长文本可读性
- 中文回退链：PingFang SC（macOS）→ 微软雅黑（Windows），确保中文环境正常渲染

### 1.3 数字 / KPI 专用字体 — `--font-family-mono`

```css
"JetBrains Mono", "Fira Code", "SF Mono", "Cascadia Code", "Consolas", "Courier New", monospace
```

**选择理由：**
- **JetBrains Mono**：等宽字体中颜值最高，700 字重厚重有力，天然 tabular-nums
- 所有等宽字体默认支持 `font-variant-numeric: tabular-nums`，KPI 数字对齐无需额外处理
- 在深蓝黑背景下，等宽字体的数字比无衬线字体更有"仪表盘"质感

**Google Fonts 引入方式（可选）：**
```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
```

---

## 2. 层级规范

> 共 6 个层级，覆盖从首页 Hero 到 meta 信息的完整视觉链条。

| 层级 | 用途 | font-size | font-weight | color | letter-spacing | line-height |
|------|------|-----------|-------------|-------|----------------|-------------|
| **display** | Hero 大标题、首屏叙事标题 | `48px` | `800` | `#d4a574`（金色） | `-0.03em` | `1.1` |
| **page-title** | 页面主标题（如"系统概览"） | `24px` | `700` | `#e5e5e5` | `-0.02em` | `1.2` |
| **section-title** | 区块标题、分组标题 | `18px` | `600` | `#e5e5e5` | `-0.01em` | `1.3` |
| **card-title** | 卡片标题、面板标题 | `15px` | `600` | `#e5e5e5` | `0em` | `1.4` |
| **body** | 正文、描述文案、列表内容 | `13px` | `400` | `#e5e5e5` | `0em` | `1.6` |
| **meta** | 时间戳、版本号、辅助说明 | `12px` | `400` | `#a3a3a3`（muted） | `0.04em` | `1.5` |
| **kpi** | 数字大值（专用等宽） | `36px` | `700` | `#d4a574`（金色） | `-0.02em` | `1.0` |

**层级对比说明：**
- display → page-title：`48px → 24px`，比例 2.0×，制造强烈视觉落差
- page-title → section-title：`24px → 18px`，比例 1.33×，清晰分区
- section-title → card-title：`18px → 15px`，比例 1.2×，卡片内层次清晰
- card-title → body：`15px → 13px`，比例 1.15×，正文密度适中
- body → meta：`13px → 12px`，颜色降级（→ muted）比字号降级更重要

---

## 3. CSS 变量扩展

> 以下变量可直接追加到 `tokens.css` 的 `:root {}` 中。

```css
/* ═══════════════════════════════════════════════════════════════════════════
   字体系统 Token v1.0 — typography-spec-lux
   Author: ui-lux  |  2026-03-19
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── 字体族 ─────────────────────────────────────────────────────────────── */
--font-family-display: "Inter", "DM Sans", "SF Pro Display", -apple-system,
  BlinkMacSystemFont, "Segoe UI", sans-serif;

--font-family-body: "Inter", "SF Pro Text", -apple-system,
  BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB",
  "Microsoft YaHei", sans-serif;

--font-family-mono: "JetBrains Mono", "Fira Code", "SF Mono",
  "Cascadia Code", "Consolas", monospace;

/* ── 字重 ────────────────────────────────────────────────────────────────── */
--font-weight-regular: 400;
--font-weight-medium:  500;
--font-weight-semibold: 600;
--font-weight-bold:    700;
--font-weight-heavy:   800;

/* ── 字号 ────────────────────────────────────────────────────────────────── */
--font-size-display:    48px;   /* Hero / 首屏叙事大标题 */
--font-size-page-title: 24px;   /* 页面主标题 */
--font-size-section:    18px;   /* 区块标题 */
--font-size-card-title: 15px;   /* 卡片/面板标题 */
--font-size-body:       13px;   /* 正文 */
--font-size-meta:       12px;   /* 时间戳/辅助信息 */
--font-size-kpi:        36px;   /* KPI 数字大值（升至36px，厚重感↑） */

/* ── 行高 ────────────────────────────────────────────────────────────────── */
--line-height-tightest: 1.1;   /* display 专用 */
--line-height-tight:    1.2;   /* 标题系列 */
--line-height-snug:     1.4;   /* 卡片标题 */
--line-height-normal:   1.5;   /* meta / 通用 */
--line-height-relaxed:  1.6;   /* 正文，阅读舒适 */

/* ── 字间距 ──────────────────────────────────────────────────────────────── */
--letter-spacing-tightest: -0.03em;  /* display 超大标题 */
--letter-spacing-tight:    -0.02em;  /* page-title / kpi */
--letter-spacing-snug:     -0.01em;  /* section-title */
--letter-spacing-normal:    0em;     /* card-title / body */
--letter-spacing-wide:      0.04em;  /* meta 辅助文字 */
--letter-spacing-wider:     0.06em;  /* 全大写标签、badge */

/* ── KPI 专用数字渲染 ────────────────────────────────────────────────────── */
--font-feature-numeric: "tnum" 1, "lnum" 1;   /* tabular + lining nums */
```

---

## 4. 关键组件字体应用指南

### 4.1 页面标题（Page Title）

```css
.page-title {
  font-family: var(--font-family-display);
  font-size: var(--font-size-page-title);   /* 24px */
  font-weight: var(--font-weight-bold);      /* 700 */
  color: var(--color-text-primary);
  letter-spacing: var(--letter-spacing-tight); /* -0.02em */
  line-height: var(--line-height-tight);    /* 1.2 */
}
```

**原则：** 页面标题是用户进入页面的第一个视觉锚点，必须使用最粗字重之一（700）。配合 `-0.02em` 字间距，在深色背景上字形更收紧、更有力量感。

---

### 4.2 KPI 数值（KPI Value）

```css
.kpi-value {
  font-family: var(--font-family-mono);     /* JetBrains Mono */
  font-size: var(--font-size-kpi);          /* 36px */
  font-weight: var(--font-weight-bold);      /* 700 */
  color: var(--accent);                      /* #d4a574 金色 */
  letter-spacing: var(--letter-spacing-tight); /* -0.02em */
  line-height: var(--line-height-tight);    /* 1.0 */
  font-variant-numeric: tabular-nums;        /* 数字等宽对齐 */
  font-feature-settings: var(--font-feature-numeric);
}
```

**原则：** KPI 数字是 dashboard 的视觉核心。等宽字体保证数字列对齐，36px + 700 字重 + 金色，在暗色背景上具有强烈的"仪表盘权威感"。

---

### 4.3 区块标题（Section Title）

```css
.section-title {
  font-family: var(--font-family-display);
  font-size: var(--font-size-section);      /* 18px */
  font-weight: var(--font-weight-semibold);  /* 600 */
  color: var(--color-text-primary);
  letter-spacing: var(--letter-spacing-snug); /* -0.01em */
  line-height: var(--line-height-tight);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide); /* 0.04em，全大写时增加间距 */
}
```

**原则：** 区块标题建议全大写处理，配合宽字间距，形成"章节感"。600 字重在 18px 下足够厚重，同时不与页面标题争夺注意力。

---

### 4.4 卡片标题（Card Title）

```css
.card-title {
  font-family: var(--font-family-display);
  font-size: var(--font-size-card-title);   /* 15px */
  font-weight: var(--font-weight-semibold);  /* 600 */
  color: var(--color-text-primary);
  letter-spacing: var(--letter-spacing-normal); /* 0 */
  line-height: var(--line-height-snug);     /* 1.4 */
}
```

**原则：** 卡片标题在密集 dashboard 中大量出现，用 600 字重 + 15px 既保持存在感，又不与区块标题竞争。不使用全大写，保留阅读友好性。

---

### 4.5 正文 / 描述（Body）

```css
.body-text {
  font-family: var(--font-family-body);
  font-size: var(--font-size-body);         /* 13px */
  font-weight: var(--font-weight-regular);   /* 400 */
  color: var(--color-text-primary);
  letter-spacing: var(--letter-spacing-normal); /* 0 */
  line-height: var(--line-height-relaxed);  /* 1.6 */
}
```

**原则：** 正文克制用 400 字重，宽行高（1.6）保证密集信息下的可读性。在暗色背景上，正文不需要用字重制造层次，颜色和字号本身已足够区分。

---

### 4.6 状态标签 / Meta（Status Badge / Meta）

```css
.meta-text {
  font-family: var(--font-family-body);
  font-size: var(--font-size-meta);         /* 12px */
  font-weight: var(--font-weight-regular);   /* 400 */
  color: var(--muted);                       /* #a3a3a3 */
  letter-spacing: var(--letter-spacing-wide); /* 0.04em */
  line-height: var(--line-height-normal);   /* 1.5 */
}

.status-badge {
  font-family: var(--font-family-body);
  font-size: var(--font-size-meta);         /* 12px */
  font-weight: var(--font-weight-medium);    /* 500 */
  letter-spacing: var(--letter-spacing-wider); /* 0.06em */
  text-transform: uppercase;
}
```

**原则：** meta 信息用颜色降级（muted #a3a3a3）而非字号降级来制造层次，这样在小字号下仍然可读。status badge 全大写 + 宽字间距，在暗色面板上形成徽章感。

---

## 5. 厚重感提升：关键技巧总结

| 场景 | 当前问题 | 改进方案 |
|------|----------|----------|
| KPI 数值 | 字号偏小（原 28px），字重不足 | 升至 36px + 700 字重 + 等宽字体 + 金色 |
| 页面标题 | 默认字重（可能 400/500） | 强制 700 + `-0.02em` 字间距 |
| 区块标题 | 与卡片标题视觉差异不明显 | 全大写 + `0.04em` 字间距 + semibold |
| 正文 | 行高过紧导致密度感强 | 行高升至 1.6，字重保持 400 |
| 数字列对齐 | 数字宽度不一，报表难看 | 全部使用 `font-variant-numeric: tabular-nums` |

---

## 6. 实现优先级

| 优先级 | 组件 | 变更内容 |
|--------|------|----------|
| P0 | KPI 数值 | 字号 → 36px，字重 → 700，字体 → JetBrains Mono |
| P0 | 页面标题 | 字重 → 700，字间距 → -0.02em |
| P1 | 区块标题 | 全大写，字间距 → 0.04em |
| P1 | tokens.css | 追加全部字体 CSS 变量 |
| P2 | 正文 | 行高 → 1.6 |
| P2 | Meta / Badge | 宽字间距，颜色降级 |

---

## 7. 下一步

- **伊泽瑞尔（frontend-ezreal）**：按照本规范追加字体 CSS 变量到 `tokens.css`，并逐组件应用 `font-family`、`font-weight`、`letter-spacing`
- **重点验证**：KPI 数值区域、侧边栏导航标题、数据表格数字列
- **可选优化**：引入 JetBrains Mono 字体资源（Google Fonts CDN），否则系统等宽字体回退也可接受

---

*文档路径：`/root/.openclaw/workspace/projects/office-console-enhanced/docs/2026-03-19-typography-spec-lux.md`*  
*关联 Token 文件：`artifacts/office-dashboard-adapter/src/public/tokens.css`*
