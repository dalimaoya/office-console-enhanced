# 事件日志 + 对象注册表前端视图实现摘要

- **时间：** 2026-03-20
- **角色：** 伊泽瑞尔（frontend-ezreal）
- **任务：** Iter-5 — 事件日志 + 对象注册表前端视图

## 实现内容

### 1. 事件日志视图（`#eventlog-panel`）
- 位置：Overview 页，底部独立卡片
- 调用接口：`GET /api/v1/events/log?limit=20&type=<filter>`
- 展示字段：北京时间、事件类型 badge（按分类着色）、来源角色、描述
- 过滤：顶部 `<select>` 支持按 system/role/object/security 过滤
- 空状态：「暂无事件日志」友好展示
- 事件类型 badge 颜色映射：
  - system → `badge--blue`
  - role → `badge--violet`
  - object → `badge--yellow`
  - security → `badge--red`

### 2. 对象注册表视图（`#registry-panel`）
- 位置：Overview 页，事件日志上方独立卡片
- 调用接口：`GET /api/v1/registry?status=active&limit=20`
- 展示字段：object_id（等宽字体）、类型 badge + icon、owner、状态、创建时间
- 空状态：「暂无活跃对象」友好展示

### 3. 集成
- `loadEventLogView()` 和 `loadRegistryView()` 注入到 `loadRouteData('overview')` 的并行 Promise.all
- 两个函数均挂载到 `window` 供 HTML onclick 调用

### 4. 样式
- 新增 `.eventlog-row` / `.registry-row` 组件类，沿用暗色 CSS 变量
- 不引入任何外部依赖

## 验证结果
- `node --check src/public/app.js` ✅ 无错误
- `curl http://localhost:3014/api/v1/events/log` ✅ 有数据，页面可展示
- `curl http://localhost:3014/api/v1/registry?status=active` ✅ 有数据，页面可展示
- 两个视图在 Overview 页可见，不影响现有功能

## 文件变更
- `src/public/index.html` — 新增 `#registry-panel` 和 `#eventlog-panel` 两个 section
- `src/public/app.js` — 新增 `loadEventLogView()`、`loadRegistryView()` 函数；Overview 路由并行加载
- `src/public/style.css` — 新增 `.eventlog-row`、`.registry-row` 样式组件

## 完成状态
✓ 已交付
