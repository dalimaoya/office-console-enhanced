# 贾克斯架构层对标草稿

> 对标对象：[TianyiDataScience/openclaw-control-center](https://github.com/TianyiDataScience/openclaw-control-center)
> 日期：2026-03-19
> 作者：architect-jax

---

## 对方技术架构概览

### 技术栈
- **语言**：TypeScript（CommonJS）
- **运行时**：Node.js，使用 `tsx` 做 TS 直运行
- **HTTP 层**：原生 `node:http`（无框架），手写路由分发
- **Gateway 接入**：WebSocket (`ws://127.0.0.1:18789`) 长连接
- **UI 服务**：内嵌于同一进程，同端口 4310 提供 HTML/JSON
- **依赖**：零运行时依赖（devDependencies 仅 `@types/node`, `cross-env`, `tsx`, `typescript`）
- **状态存储**：本地 JSON 文件（`runtime/projects.json`, `runtime/tasks.json`, `runtime/budgets.json`, `runtime/acks.json` 等）

### 架构分层
```
src/
├── adapters/         # OpenClaw 只读适配器（snapshot 读模型）
├── clients/          # 工厂模式 ToolClient（封装 Gateway 通信）
├── contracts/        # 工具契约定义
├── mappers/          # 原始数据 → 领域模型映射
├── runtime/          # ~40+ 独立功能模块（各自独立文件）
├── ui/               # HTTP server + 内嵌前端
├── config.ts         # 集中配置（env 驱动）
├── types.ts          # 全局类型
└── index.ts          # 入口/启动编排
```

### 核心设计特点
1. **安全优先**：默认 `READONLY_MODE=true`、`APPROVAL_ACTIONS_ENABLED=false`、本地 token 认证、mutation 路由默认关闭
2. **读模型快照**：`OpenClawReadonlyAdapter` 做智能增量轮询（仅查询 active/new session）
3. **模块爆炸式拆分**：`runtime/` 下 40+ 独立 `.ts` 文件，每个功能一个文件
4. **操作审计**：所有 mutation 操作写入 `operation-audit.log`、approval 写入独立 log
5. **运维工具链**：lockfile 管理、stall 自愈、watchdog 编排、evidence gate、DoD 检查等 10+ 运维脚本

---

## 对方架构比我们更优的点

### 1. 安全治理体系（显著优势）
- **多层安全门控**：ReadOnly → LocalTokenAuth → ApprovalActions → ImportMutation → DryRun，五层递进
- 我们仅有基础安全中间件（helmet/cors），缺少操作粒度的安全门控
- 每个 mutation 端点独立受控，默认全部关闭
- 审计追踪完整：approval-actions.log + operation-audit.log + timeline.log

### 2. 零依赖运行时
- 对方无 `express`、无运行时 npm 依赖，直接 `node:http`
- 我们依赖 `express` + `js-yaml`，虽然轻量但仍有供应链风险面
- 对方方案在安全敏感场景（本地控制台）更合理

### 3. 增量轮询策略
- `OpenClawReadonlyAdapter` 区分 active/inactive session，只对活跃 session 做状态轮询
- 缓存上一轮 session keys 和 active keys，避免全量重查
- 我们采用固定 TTL 缓存，不区分数据活跃度

### 4. 运维工具链成熟度
- lockfile 管理（acquire/renew/release）
- stall 自动检测与自愈
- watchdog 编排器
- evidence gate（执行证据收集与验证）
- DoD（Definition of Done）自动检查
- health snapshot 定期采集
- 我们仅有基础 diagnose 脚本和 PM2 进程管理

### 5. 领域模型完整度
- 项目（project）→ 任务（task）→ 会话（session）→ 审批（approval）全链路建模
- 预算治理三级 scope（agent/project/task）+ warn/over 阈值
- 通知策略引擎（quiet hours、severity routing）
- 我们目前只覆盖了 dashboard → agents → templates 三个核心接口

---

## 我们架构比对方更优的点

### 1. 分层清晰度（MVC + 中间件）
- 我们采用 Express + Controller/Service/Adapter 标准三层
- 中间件栈明确：request-id → security → logger → routes → error-handler
- 对方 `ui/server.ts` 是一个巨大的单文件路由处理器（import 50+ 模块），分层边界模糊
- 对方 `runtime/` 下 40+ 文件虽然功能解耦，但缺少中间的 service/controller 组织层

### 2. API 契约规范性
- 我们有明确的 `/api/v1/*` 版本化 REST 路径
- 有独立的 API 定义文档和 Agent IO 规格
- 对方路由混合了页面路由（`/audit`, `/cron`, `/digest/latest`）和 API 路由（`/api/*`），风格不统一

### 3. 降级策略
- 我们实现了 stale 快照回退 + 503 降级的完整路径
- 有 `data/cache-snapshots.json` 做持久化快照
- 对方虽有 snapshot 机制，但降级是隐式的，缺少面向前端的明确降级协议

### 4. SSE 实时推送
- 我们的 events-controller 提供 SSE 实时事件流
- 对方采用轮询模式（`POLLING_INTERVALS_MS` 配置），无服务端推送
- 在多人操作台场景，SSE 实时性优于轮询

### 5. 部署便利性
- 一键安装脚本、PM2 生态配置、环境诊断工具
- 对方虽有 ecosystem.config.cjs，但安装流程更偏开发者导向

---

## 建议借鉴的架构能力（P0/P1/P2）

### P0（强烈建议尽快引入）

| 能力 | 对方实现 | 建议方式 |
|------|----------|----------|
| **安全门控分层** | 5 层递进式安全门控 | 在我们的 security 中间件基础上，增加 ReadOnly 模式开关 + 操作级 DryRun 门控。核心思路：默认一切可写端点关闭，逐步开放 |
| **操作审计日志** | 每个 mutation 操作写入独立审计 log | 在 error-handler 和 mutation controller 中增加审计中间件，写入结构化操作日志 |

### P1（建议在 MVP 后尽快补齐）

| 能力 | 对方实现 | 建议方式 |
|------|----------|----------|
| **增量轮询** | 区分 active/inactive session 做差异化轮询 | 改造 memory-cache，按数据类型设置不同 TTL，对活跃数据缩短刷新间隔 |
| **预算治理** | agent/project/task 三级 scope + warn/over | 在 usage-controller 基础上扩展预算策略配置和阈值告警 |
| **Replay/审计时间线** | timeline.log + replay index + audit API | 增加事件采集层，为未来回放和审计提供基础 |

### P2（长期可选）

| 能力 | 对方实现 | 建议方式 |
|------|----------|----------|
| **Stall 自愈** | watchdog + auto-heal 脚本 | 当我们进入多 agent 协作场景后再考虑 |
| **Evidence Gate** | 执行证据收集与验证 | 适合 CI/CD 集成场景，当前优先级不高 |
| **Pixel State 适配** | Gameboy 风格可视化数据适配 | 创意方向，可作为差异化探索 |
| **通知策略引擎** | quiet hours + severity routing | 在通知需求明确后引入 |
| **DoD 自动检查** | 脚本化 Definition of Done 验证 | 适合成熟阶段引入 |

---

## 不建议照搬的点及原因

### 1. 原生 `node:http` 替代 Express
- **原因**：对方选择零依赖是因为安全敏感的本地控制台场景。我们的适配层面向多前端接入，需要中间件栈、路由组织、错误处理等 Express 提供的工程便利。手写 HTTP 处理器会显著增加维护成本且收益有限。
- **结论**：保持 Express，但可考虑安全中间件加固。

### 2. 单文件巨型路由 (`ui/server.ts`)
- **原因**：对方 `ui/server.ts` import 了 50+ 模块，所有路由注册在一个函数中。随着功能增长，这种模式的可维护性急剧下降。
- **结论**：保持我们的 controller 分文件模式。

### 3. 本地 JSON 文件作为状态存储
- **原因**：对方用 `runtime/*.json` 存储项目、任务、预算、通知等所有状态。在单用户本地场景可行，但在多用户/多实例场景存在并发写冲突、数据一致性和备份恢复问题。
- **结论**：我们的缓存快照机制已满足当前需求，未来应考虑更正式的存储方案。

### 4. CommonJS 模块系统
- **原因**：对方使用 `"type": "commonjs"`，而我们已采用 ESM (`"type": "module"`)。ESM 是 Node.js 的未来方向，不应倒退。
- **结论**：保持 ESM。

### 5. 40+ 文件平铺 runtime 目录
- **原因**：对方 `runtime/` 下 40+ 文件全部平铺，没有子目录分组。虽然单文件职责清晰，但导航和认知负载随规模增长会恶化。
- **结论**：我们按 controllers/services/middleware/adapters 分层更合理，保持现有组织。

---

## 总结

对方项目是一个面向运维操作员的**本地控制中心**，在安全治理、运维工具链和领域模型完整度方面显著领先。核心值得借鉴的两点：

1. **安全门控分层**：默认关闭一切可写路径、操作级 DryRun、分层递进开放，这是面向企业/团队场景的基础能力
2. **操作审计**：每个 mutation 留痕，构建完整的操作时间线，为事后回溯和合规提供支撑

我们在 API 规范性、分层架构、实时推送（SSE）和部署便利性上有自身优势，不应照搬对方的零框架和单文件路由模式。
