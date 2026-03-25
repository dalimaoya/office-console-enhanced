# 深度架构对比分析报告

- **作者**: Jax（architect-jax）
- **日期**: 2026-03-17 UTC
- **类型**: 架构对比分析
- **参考项目**: [openclaw-control-center](https://github.com/TianyiDataScience/openclaw-control-center)（以下简称 **CC**）
- **当前项目**: office-dashboard-adapter（以下简称 **ODA**）

---

## 一、项目基本定位对比

| 维度 | CC（参考项目） | ODA（我们） |
|------|--------------|-------------|
| 定位 | 安全优先、本地优先的 OpenClaw 运营控制中心 | 办公场景增强控制台（适配层） |
| 目标用户 | 非技术运营者 / 团队管理者 | 办公团队 / 多 agent 协作场景 |
| 成熟度 | 25+ Phase 迭代，功能丰富 | 6 Iter 迭代，MVP+ 阶段 |
| 依赖 | 零外部依赖（纯 Node.js） | Express + js-yaml |
| 模块类型 | CommonJS | ESModule |
| 代码规模 | src/runtime + src/ui 两大模块，60+ 文件 | ~50 源文件，结构紧凑 |

---

## 二、逐维度架构对比

### 1. 数据获取架构

**CC 的做法：**
- **主路径**：通过 Gateway WebSocket（`ws://127.0.0.1:18789`）调用 `sessions_list`、`sessions_history`、`session_status`、`cron` 等官方 JSON-RPC API
- **补充路径**：直接读取本地运行时文件（`runtime/projects.json`、`runtime/tasks.json`、`runtime/budgets.json`、`runtime/timeline.log` 等）
- **Agent Roster**：best-effort 读取 `~/.openclaw/openclaw.json`，回退合并运行时信号
- **订阅数据**：多路径探测（`runtime/subscription-snapshot.json`、`~/.openclaw/subscription.json`、`~/.openclaw/billing/*.json`）
- **Monitor 模式**：定期快照 + 增量 diff，写入 `runtime/last-snapshot.json` 和 `runtime/timeline.log`
- **不使用** CLI 子进程调用

**ODA 的做法：**
- **主路径（Iter-1+）**：`FileReader` 直读 `~/.openclaw` 下的文件（`openclaw.json`、agent sessions、workspace 文件）
- **增强路径**：`GatewayWsClient` 通过 WebSocket JSON-RPC 2.0 连接 Gateway（非阻塞，连接失败不影响主服务）
- **回退路径**：保留 `OpenClawCliAdapter`（通过 `execFile('openclaw', ...)` 子进程调用），用 `USE_FILE_READER` 开关控制
- **项目文件**：`FileWatcher` + `fs.watch()` 监控项目目录变更

**对比判断：**

| 能力 | ODA | CC | 判断 |
|------|-----|-----|------|
| Gateway WebSocket 连接 | ✅ | ✅ | 我们有 ✅ |
| 本地文件直读 | ✅ | ✅ | 我们有 ✅ |
| CLI 子进程回退 | ✅ | ❌ | 我们有而他没有 |
| sessions_list / sessions_history API | ❌ | ✅ | 他有而我们没有 |
| session_status / cron API | ❌ | ✅ | 他有而我们没有 |
| 定期快照 + diff 机制 | ❌ | ✅ | 他有而我们没有 |
| 多路径订阅数据探测 | ❌ | ✅ | 他有而我们没有 |
| Agent Roster 合并（config + runtime） | ⚠️ 部分 | ✅ 完整 | 我们不同 ⚠️ |

---

### 2. 后端服务结构

**CC 的做法：**
- **入口**：`src/index.ts` 统一入口，支持 monitor / UI / command 三种模式
- **运行时模块**：`src/runtime/` 下按职责拆分（`monitor.ts`、`agent-roster.ts`、`task-store.ts`、`project-store.ts`、`budget-engine.ts` 等）
- **UI 模块**：`src/ui/` 下处理 HTTP 路由和页面渲染
- **命令模式**：`APP_COMMAND` 环境变量触发一次性命令（`backup-export`、`import-validate`、`acks-prune`）
- **脚本层**：`scripts/` 下大量辅助脚本（dod-check、evidence-gate、health-snapshot、watchdog 等）
- **路由数量**：50+ 端点
- **无 Express 依赖**，直接使用 Node.js 内置 HTTP

**ODA 的做法：**
- **入口**：`src/server.ts` → `src/app.ts`
- **分层明确**：
  - `src/controllers/`：8 个控制器（dashboard、agent、template、health、events、tasks、docs、collaboration、usage、memory、settings）
  - `src/services/`：7 个服务层（dashboard、agent、health、template、config-apply、cached-resource、audit、feishu-notifier）
  - `src/middleware/`：3 个中间件（request-logger、error-handler、security）
  - `src/data/`：4 个数据层模块（file-reader、gateway-ws-client、sse-hub、file-watcher）
  - `src/adapters/`：1 个适配器（openclaw-cli-adapter）
  - `src/routes/`：统一 API 路由
- **路由数量**：~15 端点，统一挂在 `/api/v1/` 前缀下
- **使用 Express** 框架

**对比判断：**

| 能力 | ODA | CC | 判断 |
|------|-----|-----|------|
| Controller/Service/Data 三层分离 | ✅ 清晰 | ⚠️ runtime+ui 两层 | 我们有而他没有（更清晰的分层） |
| Express 框架（生态支撑） | ✅ | ❌ 原生 HTTP | 我们不同 ⚠️ |
| 命令模式（一次性运维操作） | ❌ | ✅ | 他有而我们没有 |
| 辅助脚本体系 | ❌ | ✅ 丰富 | 他有而我们没有 |
| 路由覆盖面 | ⚠️ 15个 | ✅ 50+ | 他有而我们没有（数量差距大） |
| 类型系统 | ✅ | ✅ | 两者都有 |
| 统一 API 版本前缀 | ✅ `/api/v1/` | ⚠️ 混合路径 | 我们有而他没有 |

---

### 3. 前端架构

**CC 的做法：**
- **渲染方式**：服务端生成 HTML + 内联 CSS/JS（`src/ui/` 模块）
- **导航**：URL query 参数路由（`?section=overview&lang=zh`）
- **国际化**：双语支持（中/英），query `lang` 切换
- **分区**：总览、用量、员工、协作、任务、文档、记忆、设置 — 8 大分区
- **视觉**：pixel-office 风格，tokenized 设计系统（颜色/间距/圆角/阴影），响应式
- **搜索**：内联搜索接 `/api/search/*`
- **无 SPA 框架**，无构建步骤，纯服务端渲染

**ODA 的做法：**
- **渲染方式**：静态 `index.html` + 原生 JS（`src/public/app.js`，1700+ 行）
- **导航**：JS 内部状态路由（`state.route`），URL hash 或 JS 切换
- **分区**：overview、agents、templates、health、tasks、docs、collaboration、usage、memory、settings — 10 大分区
- **视觉**：CSS 暗色主题（`src/public/styles.css`），设计系统由 ui-lux 交付
- **SSE 实时更新**：前端通过 EventSource 监听 `/api/v1/events`
- **无 SPA 框架**，无构建步骤

**对比判断：**

| 能力 | ODA | CC | 判断 |
|------|-----|-----|------|
| 国际化（双语） | ❌ | ✅ | 他有而我们没有 |
| SSE 实时推送到前端 | ✅ | ❌ 依赖刷新 | 我们有而他没有 |
| 分区导航 | ✅ 10 分区 | ✅ 8 分区 | 我们有 ✅ |
| 内联搜索 | ❌ | ✅ | 他有而我们没有 |
| 设计系统成熟度 | ⚠️ 初期 | ✅ 成熟 | 我们不同 ⚠️ |
| 响应式布局 | ⚠️ 基础 | ✅ 完善 | 他有而我们没有 |
| SPA 框架 | ❌ | ❌ | 两者都没有 |
| Markdown 渲染 | ✅ 前端实现 | ✅ 服务端实现 | 我们不同 ⚠️ |

---

### 4. 实时通信机制

**CC 的做法：**
- **Gateway WebSocket**：作为数据采集通道，不直接推送到浏览器
- **Monitor 模式**：`MONITOR_CONTINUOUS=true` 启用持续监控，定期重采 + diff
- **前端刷新**：依赖手动或定时 HTTP 请求拉取最新数据
- **无 SSE / 无 WebSocket 到浏览器**

**ODA 的做法：**
- **Gateway WebSocket**：`GatewayWsClient` 后台连接 Gateway，接收实时推送
- **SSE Hub**：`SseHub` 管理所有浏览器 SSE 连接，支持心跳保活
- **FileWatcher**：`fs.watch()` 监控本地文件变更
- **事件透传链路**：Gateway push → SseHub → 浏览器 EventSource
- **文件变更链路**：FileWatcher change → SseHub → 浏览器 EventSource
- **飞书告警**：Gateway push 中检测 agent offline/error、task blocked → FeishuNotifier

**对比判断：**

| 能力 | ODA | CC | 判断 |
|------|-----|-----|------|
| SSE 浏览器实时推送 | ✅ | ❌ | 我们有而他没有 |
| 文件变更实时感知 | ✅ | ⚠️ 定期快照 | 我们有而他没有 |
| Gateway → 浏览器透传 | ✅ | ❌ | 我们有而他没有 |
| SSE 心跳保活 | ✅ | ❌ | 我们有而他没有 |
| 飞书告警通知 | ✅ | ❌ | 我们有而他没有 |
| Monitor 快照 + diff | ❌ | ✅ | 他有而我们没有 |
| 定期摘要 digest | ❌ | ✅ | 他有而我们没有 |

---

### 5. 安全架构

**CC 的做法：**
- **READONLY_MODE**：默认 `true`，所有写操作默认拦截
- **LOCAL_TOKEN_AUTH_REQUIRED**：默认 `true`，受保护路由需 `LOCAL_API_TOKEN`（header `x-local-token` 或 `Authorization: Bearer`）
- **APPROVAL_ACTIONS_ENABLED**：默认 `false`，审批操作硬开关
- **APPROVAL_ACTIONS_DRY_RUN**：默认 `true`，审批操作模拟执行
- **IMPORT_MUTATION_ENABLED**：默认 `false`，live import 默认关闭
- **操作审计**：`runtime/operation-audit.log`、`runtime/approval-actions.log` JSONL 审计
- **Request ID 关联**：入站 `x-request-id` → 全链路传播
- **安全开关分层**：env 级 → 路由级 → 操作级，三层守卫
- **不修改** `~/.openclaw/openclaw.json`

**ODA 的做法：**
- **READONLY_MODE**：默认 `true`，`readonlyGuard` 中间件拦截非 GET 写操作
- **Token 鉴权**：`OC_CONSOLE_TOKEN`，支持 Bearer header / `x-console-token` header / query `token`
- **IP 白名单**：`OC_ALLOWED_WRITE_ORIGINS`，默认仅 localhost（`127.0.0.1,::1`）
- **Dry-run 默认**：`OC_DRY_RUN_DEFAULT=true`，写操作需显式 `dryRun=false`
- **WriteGate**：写操作审计 + dry-run 判断
- **审计服务**：`auditService` 记录 token 验证、只读拒绝、IP 拒绝、写操作
- **Request ID**：`requestLogger` 中间件生成

**对比判断：**

| 能力 | ODA | CC | 判断 |
|------|-----|-----|------|
| 只读模式默认开启 | ✅ | ✅ | 我们有 ✅ |
| Token 鉴权 | ✅ | ✅ | 我们有 ✅ |
| IP 白名单 | ✅ | ❌ | 我们有而他没有 |
| Dry-run 默认 | ✅ | ✅ | 我们有 ✅ |
| 审批操作硬开关 | ❌ | ✅ | 他有而我们没有 |
| Import mutation 开关 | ❌ | ✅ | 他有而我们没有 |
| JSONL 审计日志 | ⚠️ 有审计服务 | ✅ 完整 JSONL | 我们不同 ⚠️ |
| Request ID 全链路传播 | ⚠️ 中间件级 | ✅ 全链路 | 我们不同 ⚠️ |
| 安全开关分层（3 层） | ⚠️ 2 层 | ✅ 3 层 | 他有而我们没有 |
| 安全风险摘要面板 | ❌ | ✅ | 他有而我们没有 |

---

### 6. 扩展性设计

**CC 的做法：**
- **模块化程度**：`src/runtime/` 按职责独立模块（monitor、task-store、budget-engine、agent-roster 等）
- **通知策略引擎**：`runtime/notification-policy.json`，支持静默时段、严重级别映射
- **预算治理引擎**：多维度 scope（agent/project/task），可配置阈值
- **Pixel 数据适配器**：为未来 Gameboy 风格 UI 预留 `rooms/entities/links` 数据模型
- **Mission Control 模板**：`docs/mission-control-template-v2.md`
- **命令扩展**：`APP_COMMAND` 模式可添加新命令
- **插件系统**：无正式插件机制

**ODA 的做法：**
- **模板系统**：YAML 模板（`src/templates/`），支持模板列表、详情、应用
- **缓存服务**：`CachedResourceService` 统一缓存 + stale 降级
- **飞书通知**：`FeishuNotifier` Webhook 推送
- **数据层抽象**：`FileReader` / `GatewayWsClient` / `CliAdapter` 三路可切换
- **服务层分离**：controller → service → data 三层，易于替换实现
- **插件系统**：无正式插件机制

**对比判断：**

| 能力 | ODA | CC | 判断 |
|------|-----|-----|------|
| YAML 模板系统 | ✅ | ❌ | 我们有而他没有 |
| 数据源可切换（3 路） | ✅ | ⚠️ 1 路 | 我们有而他没有 |
| 通知策略引擎 | ❌ | ✅ | 他有而我们没有 |
| 预算治理引擎 | ❌ | ✅ | 他有而我们没有 |
| 缓存 + stale 降级 | ✅ | ⚠️ 手动快照 | 我们有 ✅ |
| 飞书 Webhook 通知 | ✅ | ❌ | 我们有而他没有 |
| Pixel 数据适配器 | ❌ | ✅ | 他有而我们没有 |
| 命令模式扩展 | ❌ | ✅ | 他有而我们没有 |
| 三层架构（controller/service/data） | ✅ | ❌ | 我们有而他没有 |

---

### 7. 部署与配置

**CC 的做法：**
- **环境变量**：`.env.example` 提供完整模板，14+ 配置项
- **启动方式**：`npm run dev:ui`（UI 模式）、`npm run dev`（monitor 一次）、`npm run dev:continuous`（持续监控）
- **PM2 支持**：`ecosystem.config.cjs` 提供 PM2 生产部署配置
- **热更新**：无（需要重启）
- **构建步骤**：`tsc -p tsconfig.json`
- **端口**：默认 4310，可配置 `UI_PORT`
- **绑定地址**：默认 localhost，可选 `UI_BIND_ADDRESS=0.0.0.0`
- **安装向导**：提供 `INSTALL_PROMPT.md`，可让 OpenClaw 自动完成首次接入

**ODA 的做法：**
- **环境变量**：`src/config/env.ts` 硬编码默认值，20+ 配置项
- **启动方式**：`npm start`（`tsx src/server.ts`）、`npm run dev`（`tsx watch` 热重载）
- **热更新**：✅ `tsx watch` 支持开发时文件变更自动重启
- **构建步骤**：无需构建（tsx 直接运行 TypeScript）
- **端口**：默认 3014，可配置 `PORT`
- **绑定地址**：默认 `0.0.0.0`
- **PM2 支持**：无
- **安装向导**：无

**对比判断：**

| 能力 | ODA | CC | 判断 |
|------|-----|-----|------|
| .env 模板文件 | ❌ | ✅ | 他有而我们没有 |
| 开发热重载（tsx watch） | ✅ | ❌ | 我们有而他没有 |
| PM2 生产部署 | ❌ | ✅ | 他有而我们没有 |
| 安装向导文档 | ❌ | ✅ | 他有而我们没有 |
| 零构建运行 | ✅ tsx 直运行 | ❌ 需 tsc 构建 | 我们有而他没有 |
| 多启动模式 | ⚠️ 2 种 | ✅ 4+ 种 | 他有而我们没有 |
| 环境变量丰富度 | ✅ 20+ | ✅ 14+ | 我们有 ✅ |

---

## 三、差异汇总

### 我们有而他没有（ODA 优势）

1. **SSE 实时推送到浏览器** — 完整的 Gateway → SseHub → EventSource 链路
2. **文件变更实时感知** — FileWatcher + 防抖 → SSE 广播
3. **飞书告警通知** — FeishuNotifier Webhook，agent 异常 / task blocked 自动推送
4. **三路数据源可切换** — FileReader / GatewayWsClient / CliAdapter，`USE_FILE_READER` 开关
5. **YAML 模板系统** — 预置办公模板，一键应用配置
6. **IP 白名单** — 写操作按来源 IP 控制
7. **Controller/Service/Data 三层架构** — 分层清晰，耦合度低
8. **统一 API 版本前缀** — `/api/v1/` 规范
9. **零构建运行** — tsx 直接运行 TypeScript
10. **开发热重载** — `tsx watch` 文件变更自动重启

### 他有而我们没有（CC 优势）

1. **Sessions API 全量接入** — `sessions_list`、`sessions_history`、`session_status` 深度集成
2. **定期快照 + diff 机制** — monitor 模式，状态变化追踪
3. **预算治理引擎** — 多维度 scope（agent/project/task），阈值告警
4. **通知策略引擎** — 静默时段、严重级别路由
5. **任务 / 项目本地存储** — `runtime/tasks.json`、`runtime/projects.json` 持久化
6. **导入 / 导出 / 备份体系** — dry-run 验证 + live import + timestamped 备份
7. **审批操作系统** — 硬开关 + dry-run + 审计日志
8. **Cron 任务总览** — 定时任务健康状态面板
9. **搜索 API** — tasks/projects/sessions/exceptions 子串搜索
10. **国际化** — 中英双语全站切换
11. **回放索引** — timeline/digest/export 的时间窗口过滤
12. **安全风险摘要面板** — 给非技术用户的风险概览
13. **PM2 生产部署** — ecosystem.config.cjs
14. **安装向导** — INSTALL_PROMPT.md
15. **Done Checklist** — readiness 评分体系
16. **Pixel Office 视觉系统** — 成熟的 tokenized 设计系统

---

## 四、总体差距评估

### 架构成熟度评分（5 分制）

| 维度 | ODA | CC | 差距 |
|------|-----|-----|------|
| 数据获取架构 | 3.5 | 4.5 | -1.0 |
| 后端服务结构 | 4.0 | 3.5 | +0.5 |
| 前端架构 | 2.5 | 4.0 | -1.5 |
| 实时通信机制 | 4.5 | 2.5 | +2.0 |
| 安全架构 | 3.5 | 4.5 | -1.0 |
| 扩展性设计 | 3.0 | 4.0 | -1.0 |
| 部署与配置 | 2.5 | 4.0 | -1.5 |
| **综合** | **3.4** | **3.9** | **-0.5** |

### 关键发现

1. **我们的核心优势在实时通信**：SSE + FileWatcher + Gateway 透传的链路是 CC 完全没有的。这是我们的差异化竞争力。

2. **我们的后端架构更现代**：三层分离（controller/service/data）比 CC 的 runtime+ui 二层更清晰，利于后续扩展。

3. **CC 的功能覆盖面远超我们**：50+ API 端点 vs 15 个，涵盖预算、审批、搜索、回放、导入导出等我们尚未触及的领域。

4. **前端差距显著**：CC 有成熟的 pixel-office 设计系统、国际化、搜索等，我们的前端仍是原始 JS + 基础 CSS。

5. **运维体系缺失**：CC 有 PM2 部署、安装向导、命令模式、Done Checklist；我们缺少生产就绪的运维支撑。

6. **治理能力缺失**：预算引擎、通知策略引擎、审批系统、任务持久化等治理能力是 CC 的核心价值，我们尚未起步。

### 总结

**综合差距约 0.5 分（5 分制），但差距分布不均**：

- 🟢 **领先**：实时通信（+2.0）、后端结构（+0.5）
- 🟡 **持平**：数据获取、安全
- 🔴 **落后**：前端（-1.5）、部署（-1.5）、安全细节（-1.0）、扩展性（-1.0）、数据获取深度（-1.0）

**优先补齐建议**（按影响排序）：
1. Sessions API 深度集成（提升数据获取能力）
2. 前端设计系统升级 + 国际化
3. 任务/项目持久化存储
4. .env 模板 + PM2 + 安装向导（生产就绪）
5. 预算治理 + 通知策略引擎

---

*报告完成时间: 2026-03-17T05:32 UTC*
*下一步: 由 Teemo 评审并决定补齐优先级*
