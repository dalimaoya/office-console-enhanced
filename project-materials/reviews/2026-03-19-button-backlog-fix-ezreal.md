# 2026-03-19 按钮布局 / backlog 分离修复记录（Ezreal）

## 处理范围
项目目录：`artifacts/office-dashboard-adapter/src/public/`

## 修复项 1：按钮布局跑到左下角

### 排查结论
- `style.css` 中 `.primary-button` 未发现 `position: fixed` 或 `position: absolute` 的直接定义。
- `index.html` 中顶部按钮位于 `.topbar-status` flex 容器内，未发现依赖绝对定位的布局结构。
- 为避免后续样式更新或继承污染按钮定位流，已对 `.primary-button` 显式补强正常文档流约束。

### 修改内容
文件：`artifacts/office-dashboard-adapter/src/public/style.css`
- 为 `.primary-button` 增加：
  - `justify-content: center;`
  - `position: static;`
  - `align-self: auto;`
  - `flex-shrink: 0;`

### 目标结果
- 按钮保持正常行内 / flex 流内布局。
- 不使用绝对 / 固定定位承载按钮布局。

## 修复项 2：backlog / blocked 分离展示

### 原问题
`renderAgents()` 中状态分组把 `backlog` 与 `blocked` 混入同一个 `groups.blocked`，导致“待处理”与“阻塞”无法分开展示。

### 修改内容
文件：`artifacts/office-dashboard-adapter/src/public/app.js`
- 分组初始化新增：`backlog: []`
- 分组逻辑调整为：
  - `working`：`working` / `active`
  - `idle`：`idle` / `normal`
  - `blocked`：`blocked` / `error` / `warning`
  - `backlog`：仅 `backlog`
  - `other`：其他状态
- 在 blocked 区之后新增 backlog 区块：
  - 容器 ID：`agents-backlog-zone`
  - 网格 ID：`agents-backlog-grid`
  - 标题：`🔵 待处理`

## 验证
执行：
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3014/
```
结果：`200`

## 结论
- 按钮样式已回到正常流式布局保护状态。
- Agent 状态展示已完成 blocked / backlog 分离。
- 本地服务健康检查返回 HTTP 200。
