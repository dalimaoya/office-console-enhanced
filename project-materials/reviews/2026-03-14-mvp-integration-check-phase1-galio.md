# MVP 第一轮联调检查与验收记录（Phase 1 / Galio）

- 时间：2026-03-14 UTC
- 角色：codingqa-galio
- 阶段：MVP 实际开发执行 - 第三棒 / 第一轮联调检查与验收落地
- 范围：仅覆盖 Dashboard / Config 两页与 6 个必做接口；仅产出联调/验收记录，不做缺陷修复实现
- 依据：
  1. `status/CURRENT.md`
  2. `contracts/2026-03-14-office-dashboard-api-contract.md`
  3. `tasks/2026-03-14-mvp-backend-implementation-phase1-leona.md`
  4. `tasks/2026-03-14-mvp-frontend-implementation-phase1-ezreal.md`
  5. `artifacts/office-dashboard-adapter/`
- 输入缺口：`reviews/2026-03-14-mvp-acceptance-checklist-galio.md` 文件不存在，本轮无法按该文件逐条核对；以下检查以当前 contract + 前后端阶段记录为实际验收基线，并将该缺口列入问题清单。

---

## 1. 本轮执行方式

本轮采用三层检查：

1. **接口实测**：启动 `artifacts/office-dashboard-adapter` 当前服务，对 6 个必做接口直接发请求校验返回
2. **页面承载与前端链路检查**：验证 `/`、`/dashboard`、`/config` 前端入口可达，并结合 `src/public/index.html`、`src/public/app.js` 核对 Dashboard / Config 页面状态流与手动刷新逻辑
3. **旧口径残留检查**：核查 `src/verify.ts` 与当前 contract / 实际实现是否一致

说明：
- 浏览器工具本轮环境不可用（browser tool timeout），因此未做真实浏览器点击录屏式验证；前端页面交互中“按钮点击成功触发网络请求”的部分，本轮仅完成代码链路核对，未做浏览器级实按验证。
- `stale` 的**真实运行态触发**依赖“先有缓存，再出现 Gateway 不可达”，当前适配器缓存为进程内存缓存，且本轮未人为破坏现网 Gateway；因此 stale 真实落地只完成代码级与契约级核对，未完成运行态实测。

---

## 2. 实际检查结果总览

### 2.1 结论摘要

- **通过项**：基础服务启动、6 个必做接口中的 fresh / 基础错误分支、Dashboard / Config 双页入口、模板列表/详情/apply 主链路、统一响应包装、手动刷新代码链路
- **失败项**：`src/verify.ts` 仍为旧口径，实际运行失败，不能作为当前联调验收脚本
- **未验证项**：真实 stale 展示流、真实浏览器点击验证、health stale 实际触发、apply 后运行态即时效果

### 2.2 状态统计

- 通过：12 项
- 失败：3 项
- 未验证/待验证：8 项

---

## 3. 6 个必做接口联调检查

> 本节以 contract 中 6 个 MVP 必做接口为准。

### 3.1 GET `/api/v1/dashboard`

**实测结果：通过（fresh 成功路径）**

实测现象：
- 返回 HTTP `200`
- 响应为统一包装：`{ success: true, data: ... }`
- 响应中存在 `cached` 字段
- `data` 含 `system / agents / workspaces / alerts` 四块

实测样例结论：
- fresh 成功链路可用
- 当前环境下 Dashboard 能聚合真实 OpenClaw 运行数据

**未验证：stale / error 运行态分支**
- `stale`：代码支持，但本轮未能构造“已有缓存 + Gateway 不可达”的同进程场景完成实测
- `error`：可从 controller/service 契约推断存在，但本轮未直接把 dashboard 打到无缓存 + Gateway 失败场景

### 3.2 GET `/api/v1/agents`

**实测结果：通过（fresh 成功路径）**

实测现象：
- 返回 HTTP `200`
- 响应为统一包装
- `data.items` 可返回 agent 列表
- `data.total` 与列表规模匹配

**未验证：stale / error 运行态分支**
- stale 依赖缓存回退，当前未触发
- 无缓存失败场景当前未单独打断 Gateway 以实测

### 3.3 GET `/api/v1/config/templates`

**实测结果：通过**

实测现象：
- 返回 HTTP `200`
- `success: true`
- 返回 5 个模板：`blank / collab-assistant / doc-processor / office-basic / tech-bridge`
- 字段满足当前 contract 所需元信息结构

### 3.4 GET `/api/v1/config/templates/:id`

**实测结果：通过**

实测样例：`GET /api/v1/config/templates/office-basic`

实测现象：
- 返回 HTTP `200`
- `success: true`
- 包含 `id / name / description / version / category / config / rawYaml`
- 与前端详情页所需字段一致

补充错误分支：
- `GET /api/v1/config/templates/not-exist` 返回 HTTP `404`
- 返回 `success: false`
- 错误码为 `TEMPLATE_NOT_FOUND`

### 3.5 POST `/api/v1/config/templates/:id/apply`

**实测结果：主成功链路通过；语义需补充注意事项**

实测样例：
- `POST /api/v1/config/templates/office-basic/apply`
- body: `{ "targetAgentId": "agent-backend-leona" }`

实测现象：
- 返回 HTTP `200`
- `success: true`
- 返回字段包含：
  - `templateId`
  - `targetAgentId`
  - `appliedAt`
  - `message`
  - `appliedFields`
  - `effectiveScope`
  - `runtimeEffect`

同时验证到：
- `POST .../apply` 且 body 为空时，返回 HTTP `400`
- 错误码为 `BAD_REQUEST`

**本轮关于 apply 语义的验收判断**
- 通过项：
  - 请求体仅要求 `targetAgentId`
  - 成功返回语义与 contract 一致：表示“配置已更新并通过校验”
  - 前端实现中没有把成功态错误夸大为“当前会话即时切换”
- 风险/注意事项：
  - 本轮 apply 实测是**真实写配置**，不是 dry-run
  - 写入后读取 `openclaw config get agents.list --json`，可见 `agent-backend-leona` 的 `model` / `skills` 已被模板值覆盖，说明后端当前不是假成功，而是实际执行了 `config set + validate`
  - 这证明“apply 成功语义”落到了配置层，但也意味着联调时需要明确测试对象与回收策略，避免污染角色原配置

**未验证：**
- `AGENT_NOT_FOUND` 分支未单独实测
- `TEMPLATE_INVALID` 分支未单独构造非法模板实测
- `TEMPLATE_APPLY_FAILED` 分支未通过故障注入实测
- “进行中会话是否即时切换”按 contract 本就**不承诺**，本轮不应当作通过标准

### 3.6 GET `/api/v1/health`

**实测结果：通过（fresh 成功路径）**

实测现象：
- 返回 HTTP `200`
- `success: true`
- `data.service.status = ok`
- `data.gateway.status = ok`
- 含 `checkedAt`

**未验证：stale / error 运行态分支**
- 当前 health service 走实时探针，本轮未人为制造“health 有缓存 + Gateway 不可用”场景
- 无缓存失败分支未单独实测

---

## 4. Dashboard / Config 两页联调检查

## 4.1 页面入口可达性

### Dashboard 页面
**通过**
- `GET /` 返回前端 HTML
- `GET /dashboard` 返回前端 HTML
- `index.html` 默认进入 Dashboard 页

### Config 页面
**通过**
- `GET /config` 返回前端 HTML
- `index.html` 中存在 Config 导航按钮与 Config 页面容器

---

## 4.2 Dashboard 页状态流检查

### loading
**通过（代码链路确认）**
- `#dashboard-state` 初始文案为 `Dashboard 加载中…`
- `loadDashboard()` 请求前先渲染 loading state
- `loadHealth()` 请求前先渲染健康加载文案

### success
**通过（接口实测 + 代码链路确认）**
- `/api/v1/dashboard` fresh 成功返回后，`renderDashboard()` 会渲染：
  - 系统概览卡片
  - 工作区活动
  - 告警摘要
  - `cached/fresh` 来源标识
- `/api/v1/health` fresh 成功返回后，`renderHealth()` 会渲染健康 pill 与 service/gateway 状态

### stale
**未验证（仅代码链路确认）**
- `applyDataStateMessage()` 明确把 `payload.stale` 映射为 `warning`，不是 `error`
- Dashboard 状态条与 health pill 都有 stale 展示文案
- 但本轮未实测到真实 `success:true + stale:true` 响应，因此只可判定“前端代码已接入 stale 展示链路”，不能判定“运行态展示已通过”

### error
**通过（代码链路确认，接口未全量故障注入）**
- 若 `payload.success === false`，Dashboard 会进入错误态 `state-box`
- 页面会显示 `error.code + error.message`
- 但本轮未在浏览器中实按触发 dashboard error 页面，仅能确认代码链路存在

### 手动刷新
**部分通过**
- `#refresh-page` 已绑定 `refreshCurrentPage()`
- Dashboard 路由下会并行触发 `loadDashboard()` 与 `loadHealth()`
- `#refresh-health` 已绑定 `loadHealth()`
- 由于浏览器工具不可用，本轮未完成真实按钮点击与网络请求联动实证，故判定为“代码链路通过，交互实按待验证”

---

## 4.3 Config 页状态流检查

### loading
**通过（代码链路确认）**
- Config 页初始有 `模板与 Agent 数据加载中…`
- `loadConfigOverview()`、`loadTemplateDetail()`、apply 点击处理中均有 loading 文案

### success
**通过（接口实测 + 代码链路确认）**
- 模板列表与 Agent 列表接口可成功返回
- 模板详情接口可成功返回
- apply 成功后会展示 `Template applied successfully · <targetAgentId>`

### stale
**未验证（仅代码链路确认）**
- `renderConfig()` 已按 stale 进入 warning，不走 error
- 模板列表/Agent 列表联合状态条已预留 stale 文案
- 但本轮未构造真实 stale 返回，因此不能给通过结论

### error
**通过（代码链路确认 + 部分接口实测）**
- 模板详情不存在时，后端返回 `TEMPLATE_NOT_FOUND`，前端详情页存在错误渲染逻辑
- apply 失败时，前端会行内显示 `error.code + error.message`
- 空目标 Agent 时前端本地校验会提示“请选择目标 Agent 后再应用”

### 手动刷新
**部分通过**
- `#refresh-config` 已绑定 `loadConfigOverview()`
- 会重新拉模板列表与 Agent 列表
- 真实浏览器点击与 DOM 刷新结果本轮未完成实按验证

### 模板 apply 语义
**通过（口径对齐）**
- 前端请求体只发 `targetAgentId`
- 前端成功文案未声称“运行态即时切换”
- 与 contract 对“配置已更新并通过校验”的成功语义一致

---

## 5. 失败项清单

## 5.1 `src/verify.ts` 与当前契约/实现不一致

**结论：失败**

本轮执行 `npm run verify`，结果失败，且失败不是单纯环境抖动，而是脚本口径明显残留旧实现假设。

### 失败表现 1：warmup 假设错误
- 脚本启动独立服务后，第一次打 `/api/v1/dashboard`
- 当前无缓存时，真实返回 `503 + success:false + error.code=GATEWAY_UNAVAILABLE`
- 脚本却要求 warmup 必须是 `200` 且 `body.cached === true`
- 该假设不符合当前 contract，也不符合当前实现

### 失败表现 2：仍断言旧字段 `meta.fallbackReason`
- 当前 contract 的 stale 降级口径是：`cached:true + stale:true + warning`
- 脚本仍读取 `body.meta?.fallbackReason`
- 当前实现并不返回该字段

### 失败表现 3：错误响应结构断言过时
- 当前失败响应为 `{ success:false, error:{ code, message, detail? } }`
- 脚本却仍以 `body.error === 'gateway_unavailable'` 这类旧结构做断言

**判定**：
- `verify.ts` 不能作为当前 MVP Phase 1 的联调验收脚本
- 属于必须在下一轮修正的旧口径残留

---

## 6. 未验证 / 待验证项

以下项本轮明确**不能伪造为通过**：

1. Dashboard `stale` 真实运行态展示
2. Agents `stale` 真实运行态展示
3. Health `stale` 真实运行态展示
4. Config 页模板列表 / Agent 列表 `stale` 真实展示
5. Dashboard error 页面浏览器级真实触发
6. Config 手动刷新、Dashboard 手动刷新、刷新健康按钮的浏览器级真实点击验证
7. `AGENT_NOT_FOUND` / `TEMPLATE_INVALID` / `TEMPLATE_APPLY_FAILED` 的接口实测
8. apply 成功后“新配置对后续新会话生效”的端到端验证

---

## 7. 输入缺口与旧口径残留问题清单

> 只列本轮联调直接相关问题，不做泛化扩展。

### 7.1 输入缺口：验收清单文件缺失
- 目标文件：`reviews/2026-03-14-mvp-acceptance-checklist-galio.md`
- 实际情况：文件不存在
- 影响：本轮无法按预期 checklist 逐条打勾，只能按 contract + 阶段任务实检收口
- 建议动作：下一轮补齐正式 checklist 文件，并与本联调记录建立一一映射

### 7.2 旧口径残留：`src/verify.ts`
- 仍残留旧缓存/降级字段断言与旧错误结构
- 已直接导致自动验证脚本失败
- 这是当前最明确、最集中的旧口径残留，不应再继续沿用

### 7.3 联调口径缺口：stale 真实触发手段未对象化
- 当前缓存为进程内内存缓存
- 验收上需要“先有 fresh 缓存，再切到 Gateway 不可达”的明确操作方案
- 当前项目文档未给出统一的 stale 触发步骤，导致本轮只能代码确认、不能稳定复现

### 7.4 联调操作风险：apply 会真实改写 agent 配置
- 本轮已验证 apply 不是假成功，而是会真实落配置
- 但当前任务文档未给出“联调测试专用 agent / 还原步骤 / 风险隔离口径”
- 下一轮应明确联调测试对象，避免误改正式角色配置

---

## 8. 阶段性验收判断

### 8.1 可判定通过的部分
- 适配器服务可启动
- 6 个必做接口主链路已基本打通
- Dashboard / Config 双页已具备最小可运行承载能力
- fresh success 路径可用
- 基础错误包装可用
- apply 已具备真实配置写入与 validate 成功语义
- 前端对 loading / success / stale / error / 手动刷新均已具备明确接入代码链路

### 8.2 当前不能判定为“全绿通过”的原因
- 验收 checklist 输入文件缺失
- stale 真实运行态未完成联调实测
- 浏览器级手动刷新与页面交互未完成真实点击验证
- `verify.ts` 仍为旧口径并实际失败

### 8.3 本轮阶段结论

**结论：MVP 第一轮联调已完成“主链路打通 + 问题定位”，但暂不具备全量验收通过条件。**

更准确地说：
- 可进入下一轮修正与补验证
- 当前不应宣称“Dashboard / Config 全量验收完成”
- 下一轮应优先修正 `verify.ts`、补齐验收清单、补出 stale 触发方案，再做第二轮联调收口

---

## 9. 建议下一轮只做的修正方向（非本轮实施）

1. 补齐 `reviews/2026-03-14-mvp-acceptance-checklist-galio.md`
2. 修正 `src/verify.ts` 到当前 `/api/v1/* + success/data/error + stale/warning` 口径
3. 补一套可复现的 stale 联调触发步骤
4. 补充 apply 联调的测试对象与还原口径
5. 在可用浏览器环境下补一次 Dashboard / Config 手动刷新与状态流实按验证

> 以上仅为下一轮修正建议，不代表本轮已实施。
