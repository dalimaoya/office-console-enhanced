# 三期前端任务实现摘要 — 伊泽瑞尔（frontend-ezreal）

- **时间**：2026-03-20 UTC
- **角色**：frontend-ezreal
- **阶段**：三期 — 多项目视图 + 一键实例化 + 冷启动快照

---

## 任务1：多项目视图（Projects 导航页）

### 实现内容
- 新增 `projects` 路由，已加入 `ROUTES` 对象（icon: 🗂️，label: 项目组）
- 侧边栏导航新增「项目组」按钮（位于「文档」与「设置」之间）
- 新增 `<section id="projects-page">` 页面结构
- 从 `GET /api/v1/instances` 获取实例列表，每项展示：实例名、状态徽标（活跃/已归档）、创建时间、ID
- 活跃实例提供「归档」按钮，调用 `POST /api/v1/instances/:id/archive`，归档前有二次确认
- 加载失败时显示错误状态提示

### 关键函数
- `loadInstances()` — 拉取实例列表并渲染
- `archiveInstance(id)` — 归档指定实例

---

## 任务2：一键实例化 UI

### 实现内容
- Projects 页顶部放置「新建项目组」按钮
- 点击弹出 Modal 表单（项目名称必填校验）
- 确认后调用 `POST /api/v1/instances`（JSON body `{ name }`）
- 创建成功后自动关闭 Modal，显示 toast 通知，刷新实例列表
- Modal 支持点击背景关闭、ESC 按钮关闭
- 提交过程中按钮 disabled 防重复点击

### 关键函数
- `openNewInstanceModal()` / `closeNewInstanceModal()`
- `confirmNewInstance()`

---

## 任务3：冷启动快照展示

### 实现内容
- Overview 页新增「快速上下文」卡片（`#cold-start-panel`）
- 从 `GET /api/v1/cold-start` 拉取快照，展示：
  - 当前项目阶段（phase）
  - 活跃对象数（activeObjects）
  - 最近1条事件（type + message + timestamp）
  - 阻塞项列表（blockers，若有，以红色高亮展示）
- 首次加载随 overview 路由数据一并拉取
- 定时器每 5 分钟自动刷新（`startColdStartTimer()`）
- 顶部提供手动「刷新」按钮
- 接口不可用时降级显示"暂不可用"提示

### 关键函数
- `loadColdStart()` — 拉取并渲染快照
- `startColdStartTimer()` — 5分钟轮询定时器

---

## 质量验证

```
node --check src/public/app.js
# 通过，无语法错误
```

- 新增功能以纯追加方式实现，未修改任何既有函数逻辑
- Modal CSS 追加至 `style.css` 末尾，不影响现有样式

---

## 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/public/index.html` | 修改 | 新增 projects 导航项、projects 页面 HTML、cold-start 卡片 HTML |
| `src/public/app.js` | 修改 | 新增 ROUTES.projects、loadColdStart、loadInstances、archiveInstance、Modal 交互函数 |
| `src/public/style.css` | 追加 | Modal 组件样式 |
| `reviews/2026-03-20-phase3-frontend-ezreal.md` | 新增 | 本文档 |
