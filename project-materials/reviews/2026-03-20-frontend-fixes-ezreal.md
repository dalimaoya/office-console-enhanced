# 前端修复记录 — Ezreal

**日期：** 2026-03-20  
**执行人：** frontend-ezreal（伊泽瑞尔）  
**基于：** Galio 扫描报告 `2026-03-20-14issues-scan-galio.md`

---

## P0 修复

### #13 项目组页面不可用
- **文件：** `app.js` → `loadInstances()`
- **修复：** 
  - 列表解析兼容 `instances/items` 两种字段名
  - ID 字段兼容 `instanceId/id` 两种字段名
- **状态：** ✅ 已修

### #1 总览飞书通知框配色 + "去配置"按钮
- **文件：** `index.html` + `style.css`
- **修复：**
  - `.feishu-empty-state` 样式调整为与主题色系一致（用 `--primary` 代替 dashed accent border，使用实色按钮背景）
  - 飞书通知框高度压缩，视觉更紧凑
  - "去配置"从 `<a href="#">` 改为 `<button onclick>` 避免 href hash/route 混用问题
  - `connection-health-card` 的"去配置"同样从 `<a>` 改为 `<button>`
- **状态：** ✅ 已修

---

## P1 修复

### #9 用量统计周期切换不联动
- **文件：** `app.js` → `loadUsage()`
- **修复：** `by-agent` 和 `context-pressure` 接口也传入 `?period=` 参数
- **状态：** ✅ 已修

### #4 系统概览-实时状态汇总
- **文件：** `app.js` + `style.css`
- **修复：**
  - "检查时间（北京时间）" → 简化为 "检查时间" + 时间值，避免长文本折行
  - `list-card:hover` hardcoded `#FAFAFA` → 改为 `var(--card-hover)` 适配暗色主题
  - `metric-panel #dashboard-metrics` 空状态加最小高度占位，避免白框突兀显示
- **状态：** ✅ 已修

### #6 协作会话 0 条
- **文件：** `app.js` → `renderCollaboration()`
- **修复：**
  - Sessions API 解析兼容 `payload.data` 直接为数组的情况（旧版只处理 `.items`）
  - 空状态提示改为更友好的"暂无协作会话数据，待有 Agent 发起会话后自动显示"
- **状态：** ✅ 已修（依赖后端 sessions API 数据）

### #7 任务看板-Kanban 排版
- **文件：** `style.css`
- **修复：**
  - `.board-view` 列宽从 `repeat(3,1fr)` 改为 `1.1fr 1.1fr 0.8fr` 充分利用横向空间
  - 卡片 padding/间距收紧（padding 8px → 4px 7px，margin-bottom 6px → 4px）
  - 卡片字号从 `text-xs` 降至 11px，增加行高约束
  - 加 `white-space:nowrap; overflow:hidden; text-overflow:ellipsis` 防止折行
  - 列头加 `border-bottom` 分割线增强可读性
- **状态：** ✅ 已修

### #12 Token与费用汇总图表优化
- **文件：** `style.css`
- **修复：**
  - 饼图尺寸 96px → 140px，充分利用空间
  - `pie-hole` 内边距相应调整（18px → 24px）
  - 中心值文字从 `text-sm` 升为 `text-base`
  - 图例容器加 `min-width: 160px` 防止过窄
  - 图例条目加 `flex: 1 + overflow ellipsis` 防止角色名折行
  - 容器加 `flex-wrap: wrap` 小屏友好
- **状态：** ✅ 已修

---

## P2 优化

### #3 安全设置-Token鉴权/Dry-run 状态说明
- **文件：** `app.js` → `renderSettingsPanel()`
- **修复：**
  - 兼容后端字段名 `tokenEnabled/dryRunEnabled` 和旧版 `tokenAuth/dryRun`
  - 状态标签添加明确说明文字：`✅ 已启用（当前生效）`、`⭕ 未启用（本地模式）`、`✅ 已启用（预演中）`
  - 只读/读写模式显示加括号说明
- **状态：** ✅ 已修

### #10 冗余文本删除
- **文件：** `index.html`
- **修复：**
  - 删除用量页"最适合：了解 API 用量、成本和上下文压力"文字
  - `usage-state` 成功态改为隐藏（不再显示"用量数据已加载 · 统计周期：今日"冗余文本）
- **状态：** ✅ 已修

### #5 健康状态-组件可达性版面
- **文件：** `style.css`
- **修复：**
  - 与 `list-card:hover` 颜色一并修复适配暗色主题（避免 hover 时白色闪现）
  - 健康状态面板依赖 renderHealth() 动态填充，布局本身已正常
- **状态：** ✅ 已修（产品定义组件 Grid 布局后可进一步补全）

### #6 协作会话 empty state
- **文件：** `app.js`
- **修复：** empty state 提示改为带副文本的友好提示
- **状态：** ✅ 已修

---

## 注意事项 / 待后端配合项

- `#13` 修复前端解析逻辑，但后端若仍只返回 `instances` 字段，创建/归档的 ID 兼容层（`instanceId` → `id`）需后端同步补充
- `#6` sessions API 返回结构需后端确认（数组 vs 对象包装）
- `#9` by-agent/context-pressure 接口是否真正支持 period 参数，需后端确认
- `#14` 环境诊断接口 envelope 不一致问题（前端兼容未做，后端主责）

---

**建议下一步：** 请 Galio 对上述修复点进行验收复测
