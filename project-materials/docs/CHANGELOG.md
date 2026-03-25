
## 2026-03-20 — Ezreal

### Fix: 手机端「快速上手」横幅显示截断

**根因**
`.onboarding-banner` 设有 `max-height: 96px` + `overflow: hidden`，用于支持折叠动画（`is-hidden` 状态）。
移动端（≤720px）flex 内容换行后，实际高度超过 96px，导致内容被 CSS 裁剪，产生显示不完全的现象。

**修复**
在 `@media (max-width: 720px)` 媒体查询中，对非 `is-hidden` 状态的 `.onboarding-banner` 覆盖为：
- `max-height: none`
- `overflow: visible`

折叠动画（`.is-hidden`）仍保留 `overflow: hidden` 以保证动画正常。

**改动文件**
- `artifacts/office-dashboard-adapter/src/public/style.css`（~第 2703 行媒体查询）

**验收方式**
用手机（或 Chrome DevTools 切换到移动端视图，宽度 ≤ 720px）访问控制台首页，
确认「快速上手：① 查看实时 Agent 状态 → ② 在飞书接收任务通知 → ③ 在任务页管理工作队列」横幅完整展示，内容无截断。
关闭按钮（×）点击后横幅正常折叠消失。
