# 二期前端实现摘要

**时间**：2026-03-20  
**角色**：frontend-ezreal（伊泽瑞尔）  
**阶段**：Phase 2 — 皮肤包 + 二期新接口前端视图

---

## 任务1：皮肤包机制

### 实现内容

**文件**：`src/public/app.js`

- 新增 `ROLE_SKIN` 常量（9个角色的内外双名映射）
- 封装 `getRoleDisplayName(roleId)` 函数：
  - 读取 `localStorage('oc-display-name-mode')`，默认 `external`
  - `external` 模式：优先 ROLE_SKIN → fallback AGENT_CHINESE_NAMES
  - `internal` 模式：AGENT_CHINESE_NAMES（LoL代号）
- `renderAgentCard()` 中的角色名显示已改为调用 `getRoleDisplayName()`
- `initDisplayNameToggle()` 函数绑定 Settings 页下拉选项，切换时实时 Toast 提示
- Settings 页新增"显示名称 — 皮肤包"卡片（`<select id="display-name-mode-toggle">`）

---

## 任务2：二期新接口前端视图

### 2a. 项目状态机视图

- **接口**：`GET /api/v1/projects/status`
- **位置**：Overview 页，KPI 网格下方，"需要关注"前
- **实现**：
  - `projectStatusState` 状态对象
  - `loadProjectStatus()` / `renderProjectStatus()` 函数
  - 5种阶段 badge（init/active/review/closing/archived）颜色区分
  - 显示当前阶段 + 中文描述 + 上次变更时间
  - HTML：`#project-status-panel`，`#project-status-card-body`

### 2b. 环境诊断视图

- **接口**：`GET /api/v1/diagnostic`
- **位置**：Settings 页（接线状态诊断之前）
- **实现**：
  - `diagnosticState` 状态对象
  - `loadDiagnostic()` / `renderDiagnostic()` 函数
  - 显示所有检查项 pass/fail/warn 状态（icon + badge）
  - "重新诊断"按钮（`#btn-run-diagnostic`）触发重新调用
  - 进入 settings 页时自动执行一次诊断
  - HTML：`#diagnostic-section`，`#diagnostic-results`

### 2c. 告警阈值配置 UI

- **接口**：`GET /api/v1/settings`（读取 `alertThresholds`），`POST /api/v1/settings/alerts`（保存）
- **位置**：Settings 页，告警通知卡片附近（显示名称卡片之后）
- **实现**：
  - `loadAlertThresholds()` 函数：进入 settings 时自动从接口填充当前值
  - `saveAlertThresholds()` 函数：读取三个输入框，POST 到 `/api/v1/settings/alerts`
  - 三个输入项：
    - 上下文压力告警阈值（%），默认 80
    - Agent 空闲告警阈值（分钟），默认 120
    - 每日费用告警（USD），默认 100
  - 保存状态实时反馈（Toast + inline state-box）
  - HTML：`#alert-thresholds-section`，`#btn-save-alert-thresholds`

---

## 质量验证

- `node --check src/public/app.js` ✅ 通过（无语法错误）
- 所有新增功能通过独立 panel/section，不影响已有页面结构
- 新接口加载均在对应页面的 `loadRouteData()` 分支中调用（按需加载）

---

## 文件变更

- `src/public/app.js` — 主要逻辑（皮肤包 + 三组 Phase2 函数 + 事件绑定）
- `src/public/index.html` — 新增 4 个 HTML 区块（项目阶段卡片、显示名称切换、告警阈值配置、环境诊断）
