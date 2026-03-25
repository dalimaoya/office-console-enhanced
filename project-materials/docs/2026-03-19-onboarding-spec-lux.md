# 引导组件设计规范 · ui-lux

**文档版本：** 1.0  
**日期：** 2026-03-19  
**作者：** 拉克丝（ui-lux）  
**背景来源：** 艾克 UX 测试报告 + 杰斯 UX 测试报告

---

## 设计背景

UX 测试发现两个关键引导缺失：

1. **飞书空状态断路**：飞书未配置时，用户完全不知道如何建立通知链路，办公推送直接失效
2. **控制台零引导**：首次打开时无任何帮助提示，用户不知道从哪里开始

本文档为伊泽瑞尔提供完整实现规范，包含 HTML 结构、CSS class 名称、JS 逻辑和文案。

---

## 1. 飞书空状态引导组件（Feishu Empty State）

### 1.1 使用场景

以下任一条件满足时显示：
- Settings 页面的飞书配置区 token/webhook 均为空
- 通知区检测到飞书未连接（`window.feishuConfigured === false`）

### 1.2 视觉规格

| 属性 | 值 |
|------|-----|
| 背景 | `bg-secondary`（当前暗色主题次级背景） |
| 边框 | 虚线描边，颜色用 `--color-accent`（金色） |
| 图标颜色 | `--color-accent`（金色） |
| 图标 | 🔔 或飞书 SVG（推荐使用内联 SVG） |
| 圆角 | `border-radius: var(--radius-md)` |
| 内边距 | `padding: 2rem` |
| 布局 | 垂直居中 flex column |

### 1.3 HTML 结构

```html
<!-- 飞书空状态引导组件 -->
<div class="feishu-empty-state" id="feishu-empty-state">
  <div class="feishu-empty-state__icon">
    <!-- 飞书铃铛 SVG 或 emoji 替代 -->
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
         xmlns="http://www.w3.org/2000/svg" class="feishu-empty-state__svg">
      <path d="M12 2C8.13 2 5 5.13 5 9v4l-2 2v1h18v-1l-2-2V9c0-3.87-3.13-7-7-7z"
            fill="currentColor"/>
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z" fill="currentColor"/>
    </svg>
  </div>

  <div class="feishu-empty-state__body">
    <p class="feishu-empty-state__title">飞书通知未配置</p>
    <p class="feishu-empty-state__desc">
      连接飞书后可接收 Agent 工作通知，及时掌握任务进展
    </p>
  </div>

  <button class="feishu-empty-state__cta btn btn--accent"
          onclick="navigateTo('settings')">
    去配置
  </button>
</div>
```

### 1.4 CSS Class 规范

```css
/* ── 飞书空状态引导组件 ── */
.feishu-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem 1.5rem;
  background: var(--color-bg-secondary);
  border: 1.5px dashed var(--color-accent);
  border-radius: var(--radius-md);
  text-align: center;
  min-height: 180px;
}

.feishu-empty-state__svg {
  color: var(--color-accent);    /* 金色图标 */
  opacity: 0.85;
}

.feishu-empty-state__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.feishu-empty-state__desc {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 280px;
  line-height: 1.5;
}

.feishu-empty-state__cta {
  margin-top: 0.5rem;
  /* 复用现有 btn btn--accent；若无则追加下方样式 */
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  background: transparent;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.feishu-empty-state__cta:hover {
  background: var(--color-accent);
  color: var(--color-bg-primary);
}
```

### 1.5 显示/隐藏逻辑（JS）

```js
// 在 app.js 中调用，判断飞书是否已配置
function updateFeishuEmptyState() {
  const el = document.getElementById('feishu-empty-state');
  if (!el) return;

  // 根据实际配置字段判断（示例：检查 localStorage 或全局状态）
  const token = localStorage.getItem('feishu_token') || '';
  const webhook = localStorage.getItem('feishu_webhook') || '';
  const configured = token.trim() !== '' || webhook.trim() !== '';

  el.style.display = configured ? 'none' : 'flex';
}

// 初始化 + settings 保存后均需调用
document.addEventListener('DOMContentLoaded', updateFeishuEmptyState);
```

### 1.6 嵌入位置建议

**方案 A（推荐）**：放在 Settings 页飞书配置卡片顶部，配置完成后隐藏。

```html
<!-- 在 #settings-page 内，飞书 token 输入框之前 -->
<div id="feishu-empty-state" class="feishu-empty-state">
  <!-- 内容见上 -->
</div>
<div class="settings-feishu-form">
  <!-- 原有 token/webhook 输入框 -->
</div>
```

**方案 B（备选）**：在通知区/侧边栏的飞书状态指示处显示简化版。

---

## 2. Onboarding 首次引导横幅（Onboarding Banner）

### 2.1 设计原则

- **不打断**：顶部横幅，不遮挡内容，不阻塞操作
- **可关闭**：右侧有 × 按钮，关闭后写 localStorage，永不再现
- **轻量**：纯 HTML + CSS + 几行 JS，不依赖第三方库

### 2.2 视觉规格

| 属性 | 值 |
|------|-----|
| 位置 | 主内容区顶部（`#main-content` 第一个子元素）|
| 背景 | `var(--color-bg-secondary)` |
| 边框 | 左侧 3px 实线 `var(--color-accent)`（暗金色强调） |
| 文字颜色 | `var(--color-text-secondary)` |
| 关闭按钮 | 右侧 × ，`var(--color-text-muted)` |
| 动画 | 关闭时 `slideUp` 200ms + `opacity 0` |

### 2.3 HTML 结构

```html
<!-- Onboarding 引导横幅（首次显示） -->
<div class="onboarding-banner" id="onboarding-banner" role="banner" aria-label="使用引导">
  <div class="onboarding-banner__steps">
    <span class="onboarding-banner__label">快速上手：</span>
    <ol class="onboarding-banner__list">
      <li>① 查看实时 Agent 状态</li>
      <li>→</li>
      <li>② 在飞书接收任务通知</li>
      <li>→</li>
      <li>③ 在任务页管理工作队列</li>
    </ol>
  </div>

  <button class="onboarding-banner__close"
          id="onboarding-banner-close"
          aria-label="关闭引导">
    ×
  </button>
</div>
```

### 2.4 CSS Class 规范

```css
/* ── Onboarding 引导横幅 ── */
.onboarding-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.625rem 1.25rem;
  background: var(--color-bg-secondary);
  border-left: 3px solid var(--color-accent);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  margin-bottom: 1rem;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  transition: opacity 0.2s ease, max-height 0.2s ease;
  overflow: hidden;
}

.onboarding-banner.is-hidden {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-bottom: 0;
  pointer-events: none;
}

.onboarding-banner__steps {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.onboarding-banner__label {
  font-weight: 600;
  color: var(--color-accent);
  white-space: nowrap;
}

.onboarding-banner__list {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  list-style: none;
  margin: 0;
  padding: 0;
  flex-wrap: wrap;
}

.onboarding-banner__list li {
  white-space: nowrap;
}

/* → 分隔符用较淡颜色 */
.onboarding-banner__list li:nth-child(even) {
  color: var(--color-text-muted, #666);
}

.onboarding-banner__close {
  background: none;
  border: none;
  color: var(--color-text-muted, #888);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.25rem;
  flex-shrink: 0;
  transition: color 0.15s;
}

.onboarding-banner__close:hover {
  color: var(--color-text-primary);
}
```

### 2.5 JS 逻辑

```js
// ── Onboarding Banner 逻辑 ──
(function initOnboardingBanner() {
  const STORAGE_KEY = 'oc_onboarding_dismissed';
  const banner = document.getElementById('onboarding-banner');
  const closeBtn = document.getElementById('onboarding-banner-close');

  if (!banner) return;

  // 已关闭过：直接隐藏，不做动画
  if (localStorage.getItem(STORAGE_KEY) === '1') {
    banner.style.display = 'none';
    return;
  }

  // 显示横幅
  banner.style.display = 'flex';

  // 关闭逻辑
  closeBtn && closeBtn.addEventListener('click', function () {
    banner.classList.add('is-hidden');
    // 等动画结束后彻底移除
    banner.addEventListener('transitionend', function () {
      banner.style.display = 'none';
    }, { once: true });
    // 写入 localStorage，永不再显示
    localStorage.setItem(STORAGE_KEY, '1');
  });
})();
```

### 2.6 嵌入位置

将横幅插入到 `#main-content`（或主页面容器）的最顶部，在所有页面 `.page` 之前：

```html
<div id="main-content">
  <!-- Onboarding Banner 放在这里 -->
  <div class="onboarding-banner" id="onboarding-banner" ...>...</div>

  <!-- 原有页面内容 -->
  <div class="page" id="page-agents">...</div>
  <div class="page" id="page-tasks">...</div>
  ...
</div>
```

---

## 3. CSS 变量扩展（tokens.css 追加）

如果 `tokens.css` 中尚未定义以下变量，需追加：

```css
/* ── 新增：引导组件相关 tokens ── */
:root {
  /* 次级背景（如已存在请核对值是否一致） */
  --color-bg-secondary: #1a1a1a;       /* 暗色次级背景 */

  /* 文字层级（如已存在跳过） */
  --color-text-muted: #666666;         /* 低强调文字，用于 → 分隔符、关闭按钮 */

  /* 圆角（如已存在跳过） */
  --radius-sm: 4px;
  --radius-md: 8px;

  /* 说明：--color-accent 应已存在（金色）；如没有请追加 */
  /* --color-accent: #c9a227; */
}
```

> **注意**：请先检查 `tokens.css` 中已有的变量，避免重复定义覆盖已有值。仅追加缺失项。

---

## 4. 实现优先级说明

### 优先级排序

| 优先级 | 组件 | 原因 |
|--------|------|------|
| 🔴 P0 | **飞书空状态引导组件** | 直接影响核心推送链路；用户完全不知道怎么配置飞书，断路立刻可见 |
| 🟡 P1 | **Onboarding 首次引导横幅** | 影响新用户上手体验，但不阻塞现有功能 |

### 建议实现顺序

**伊泽瑞尔应当先实现飞书空状态引导（P0）**，理由：

1. 飞书配置是控制台"办公推送"的核心链路；未配置时 Agent 通知完全断路，用户会认为功能坏了
2. 实现相对独立，只需在 Settings 页插入一个条件渲染 div + 约 20 行 CSS
3. Onboarding Banner 只需补充新用户认知，不影响现有用户的核心功能

**飞书引导完成后立刻实现 Onboarding 横幅（P1）**，两者可在同一次前端 PR 中交付。

---

## 5. 文案定稿

### 飞书空状态组件

| 位置 | 文案 |
|------|------|
| 标题 | 飞书通知未配置 |
| 说明 | 连接飞书后可接收 Agent 工作通知，及时掌握任务进展 |
| 按钮 | 去配置 |

### Onboarding 横幅

| 位置 | 文案 |
|------|------|
| 标签 | 快速上手： |
| 步骤 | ① 查看实时 Agent 状态 → ② 在飞书接收任务通知 → ③ 在任务页管理工作队列 |

---

## 6. 验收标准（供加里奥参考）

### 飞书空状态引导

- [ ] 飞书 token 和 webhook 均为空时，`#feishu-empty-state` 显示（`display: flex`）
- [ ] 配置任意一项后，组件隐藏（`display: none`）
- [ ] 点击"去配置"跳转到 Settings 页或飞书配置区
- [ ] 暗色风格：虚线金色边框、金色图标、次级背景

### Onboarding 横幅

- [ ] 首次打开控制台时，横幅显示在主内容区顶部
- [ ] 点击 × 后横幅平滑消失（opacity + max-height 动画）
- [ ] 关闭后刷新页面不再显示（`localStorage.getItem('oc_onboarding_dismissed') === '1'`）
- [ ] 移动端横幅文字可换行，不溢出

---

*设计：拉克丝（ui-lux） · 2026-03-19*
