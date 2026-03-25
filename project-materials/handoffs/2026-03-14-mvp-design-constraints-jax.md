# MVP 设计约束与架构确认

> 办公控制台增强项目 · 第二阶段交付物  
> 创建人：Architect-Jax  
> 创建时间：2026-03-14  
> 依赖前置：briefs/2026-03-14-mvp-scope-brief-ekko.md（需求收口）  
> 状态：已完成

---

## 一、系统边界与模块划分

### 1.1 整体系统边界

```
┌─────────────────────────────────────────────────────────────┐
│                    办公控制台增强系统（MVP）                    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │   前端层      │  │  适配层/BFF  │  │  本地服务层        │  │
│  │  (React SPA) │→│  (Express)   │→│  (配置/缓存/状态)  │  │
│  └──────────────┘  └──────┬───────┘  └───────────────────┘  │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │ Gateway CLI/RPC 调用
                            ↓
              ┌─────────────────────────────┐
              │   OpenClaw 原生系统（不可改） │
              │   Gateway / Agent / Model   │
              └─────────────────────────────┘
```

**关键边界约束：**

1. **控制台系统与 OpenClaw 原生系统之间有硬边界**
   - 控制台不侵入 OpenClaw 核心代码
   - 控制台不直接读写 OpenClaw 内部数据库或状态文件
   - 唯一交互通道：Gateway CLI/RPC 命令 + `/health` HTTP 探测
   - 不假设 Gateway 会提供 REST API（已验证不存在）

2. **控制台系统是独立可部署单元**
   - 可独立启停，不影响 OpenClaw 正常运行
   - 无外部云依赖，本地完整运行

3. **MVP 不含桌面壳层**
   - Tauri 桌面框架列入架构规划但 **不纳入 MVP 开发范围**
   - MVP 以浏览器可访问的 Web 应用交付
   - 桌面壳层待 MVP 验证通过后再启动

### 1.2 MVP 模块划分

| 模块 | 归属层 | MVP 职责 | MVP 不做 |
|------|--------|----------|----------|
| **状态总览页** | 前端 | 全局健康状态、任务概览、高频技能展示 | 历史趋势图、自动轮询、Agent 详情页 |
| **配置管理页** | 前端 | 模板浏览、预览、一键应用 | 模板编辑/创建、搜索/标签、版本控制 |
| **API 路由层** | 适配层 | 路由分发、请求验证、统一响应格式 | 复杂权限校验、限流（MVP 本地使用） |
| **OpenClaw 适配器** | 适配层 | CLI/RPC 命令封装、原始数据转换、错误标准化 | 批量命令、异步任务队列 |
| **缓存管理器** | 本地服务 | 内存缓存 + TTL + stale 标识 | Redis、分布式缓存、持久化缓存 |
| **配置管理器** | 本地服务 | 模板文件读取、YAML 解析、应用写入 | 云端同步、配置版本管理 |
| **DTO 转换层** | 适配层 | Gateway 原始数据 → 办公友好展示结构 | 复杂聚合计算、智能推荐 |

### 1.3 MVP 不存在的模块（明确排除）

以下模块在架构方案书中有规划，但 **MVP 阶段明确不实现**：

- ❌ WebSocket 实时推送
- ❌ Tauri 桌面壳层
- ❌ 系统托盘 / 开机自启
- ❌ JWT 认证中间件（MVP 本地单用户，无需认证）
- ❌ Prometheus 监控指标导出
- ❌ Console Agent 建议引擎
- ❌ 环境检测/诊断模块
- ❌ Skill 安装/管理模块

---

## 二、前后端职责边界

### 2.1 前端（Ezreal）职责范围

**做：**
- 页面渲染与交互逻辑
- UI 状态管理（Zustand）
- API 请求发起与响应处理
- 加载状态、错误状态、降级状态的视觉展示
- `stale: true` 降级提示的 UI 实现
- 手动刷新触发（MVP 不做自动轮询）

**不做：**
- 不直接调用 Gateway CLI/RPC
- 不做数据聚合或业务计算
- 不做 OpenClaw 原始数据解析
- 不持有业务状态的权威副本（权威数据在适配层）
- 不做前端侧缓存策略（缓存由适配层统一管理）

### 2.2 适配层/后端（Leona）职责范围

**做：**
- Gateway CLI/RPC 命令调用与结果解析
- 原始数据 → DTO 转换（办公友好化）
- 缓存管理（内存缓存 + TTL + 降级逻辑）
- 统一错误处理与错误码映射
- 配置模板文件管理（YAML 读取/验证/应用）
- API 契约实现（统一 `{success, data, error}` 格式）

**不做：**
- 不改 OpenClaw Gateway 代码
- 不直接操作 OpenClaw 内部文件（除通过 CLI 命令）
- 不做用户认证（MVP 本地单用户）
- 不做复杂业务编排（MVP 是薄聚合层）

### 2.3 职责边界判断规则

当遇到"这个逻辑放前端还是后端"的分歧时，遵循以下判断链：

1. **涉及 Gateway 调用？** → 后端
2. **涉及数据格式转换/聚合？** → 后端
3. **涉及缓存策略？** → 后端
4. **纯 UI 状态（展开/折叠/选中）？** → 前端
5. **纯展示格式化（时间显示、数字单位）？** → 前端可做简单格式化，但原始数据必须由后端提供完整字段
6. **不确定？** → 默认放后端，保持前端薄

---

## 三、接口与数据流约束

### 3.1 接口协议约束

#### 统一响应格式（硬约束）

所有 API 必须使用统一响应格式，无例外：

```typescript
// 成功
{ success: true, data: T }

// 失败
{ success: false, error: { code: string, message: string, detail?: string } }
```

#### 降级响应格式（硬约束）

基于已决策的缓存降级策略（decisions/2026-03-14-cache-fallback-decision.md）：

```typescript
// Gateway 不可用 + 有缓存：200 OK
{ success: true, data: T, cached: true, stale: true, warning: { type: string, message: string } }

// Gateway 不可用 + 无缓存：503
{ success: false, error: { code: "GATEWAY_UNAVAILABLE", message: "..." } }
```

**不允许**返回 `503 + cachedData` 的混合模式。此为已确认决策，不可回退。

#### API 版本策略

- MVP 使用 `/api/v1/` 前缀
- 不实现版本协商机制
- 后续版本通过路径区分（`/api/v2/`）

### 3.2 MVP 必实现接口最小集

根据 Ekko 需求收口和 P0 接口草案，MVP 第一批必须实现的接口：

| 接口 | 方法 | 用途 | 数据源 |
|------|------|------|--------|
| `/api/v1/dashboard` | GET | 状态总览首页聚合数据 | Gateway CLI 多命令聚合 |
| `/api/v1/agents` | GET | Agent 列表与状态 | `gateway call agents.list` |
| `/api/v1/config/templates` | GET | 配置模板列表 | 本地 YAML 文件 |
| `/api/v1/config/templates/:id` | GET | 单个模板详情（只读预览） | 本地 YAML 文件 |
| `/api/v1/config/templates/:id/apply` | POST | 应用模板到指定 Agent | 写入 OpenClaw 配置 |
| `/api/v1/health` | GET | 系统健康检查 | 本地 + Gateway `/health` |

**注意：** 
- P0 API 草案中列出的大量接口（环境检测、飞书配置、诊断、Skill 管理等）**不纳入 MVP 必实现范围**
- MVP 聚焦于 Ekko 收口的两个核心功能：运行状态可观测 + 配置模板应用
- 其他接口作为"已设计待实现"保留，不删除设计文档

### 3.3 数据流约束

#### 主数据流路径

```
用户操作 → 前端组件 → API Client (Axios) 
  → 适配层路由 → Controller → Service 
  → OpenClaw Adapter (CLI/RPC 调用) 
  → 缓存层（写入/读取）
  → DTO 转换 
  → 统一响应格式 
  → 前端渲染
```

#### 数据流硬规则

1. **单向数据获取**：前端 → 适配层 → Gateway，不允许反向推送（MVP 无 WebSocket）
2. **手动刷新**：用户点击刷新按钮触发重新获取，不自动轮询
3. **缓存透明**：前端通过响应中的 `cached` 和 `stale` 字段感知缓存状态，不自行判断
4. **错误不穿透**：Gateway 原始错误不直接暴露给前端，必须经过适配层错误标准化
5. **CLI 调用同步**：适配层调用 Gateway CLI 为同步阻塞调用，通过缓存 TTL 控制调用频率

#### 缓存 TTL 基准

| 数据类型 | TTL | 说明 |
|----------|-----|------|
| Dashboard 聚合数据 | 30s | 与已确认契约一致 |
| Agent 列表 | 60s | Agent 状态变化不频繁 |
| 配置模板列表 | 300s | 模板文件变化极少 |
| Health 检查 | 15s | 健康状态需相对及时 |

---

## 四、开发阶段必须遵守的设计/实现约束

### 4.1 技术栈约束（硬约束，不可协商）

| 层 | 技术选型 | 版本要求 | 说明 |
|----|----------|----------|------|
| 前端框架 | React + TypeScript | React 18.x, TS 5.x | 已验证 |
| 前端样式 | TailwindCSS | 3.x | 已验证 |
| 前端状态 | Zustand | 4.x | 轻量、TS 友好 |
| 前端构建 | Vite | 5.x | 已验证 |
| 前端请求 | Axios | 1.x | 统一 HTTP 客户端 |
| 后端框架 | Express | 4.x | 团队熟悉 |
| 后端语言 | TypeScript | 5.x | 前后端类型统一 |
| 缓存 | 内存缓存（node-cache 或自研） | - | MVP 不用 Redis |
| 配置格式 | YAML | - | 配置模板统一格式 |

### 4.2 代码组织约束

#### 前端项目结构（Ezreal 必须遵守）

```
src/
├── api/           # API 客户端、请求方法、类型定义
├── components/    # 可复用 UI 组件
│   ├── common/    # 按钮、卡片、标签等基础组件
│   └── features/  # 业务组件（状态卡片、模板卡片等）
├── pages/         # 页面级组件（仅两个）
│   ├── Dashboard/ # 状态总览页
│   └── Config/    # 配置管理页
├── stores/        # Zustand stores
├── hooks/         # 自定义 Hooks
├── types/         # 共享类型定义
├── utils/         # 工具函数
└── App.tsx        # 入口
```

**约束：**
- 不允许在 `components/` 中直接调用 API，API 调用只在 `pages/` 或 `hooks/` 中发生
- 类型定义必须放 `types/` 目录，不允许 inline 定义复杂类型
- 每个页面组件对应一个 store，不做全局单一 store

#### 后端项目结构（Leona 必须遵守）

```
src/
├── controllers/   # 路由处理器（薄层，只做参数提取和响应格式化）
├── services/      # 业务逻辑层
├── adapters/      # OpenClaw Gateway 适配器
├── cache/         # 缓存管理
├── dto/           # 数据传输对象定义
├── middleware/     # Express 中间件
├── config/        # 应用配置
├── templates/     # 预置模板 YAML 文件
├── types/         # 共享类型
├── utils/         # 工具函数
├── app.ts         # Express 应用
└── server.ts      # 启动入口
```

**约束：**
- Controller 层必须薄：只做参数提取 → 调 Service → 返回统一格式
- Gateway CLI 调用只允许在 `adapters/` 中发生，Service 层不直接 spawn 进程
- DTO 定义必须放 `dto/` 目录，不允许在 Controller 或 Service 中临时构造响应结构
- 模板 YAML 文件放 `templates/` 目录，通过 ConfigService 读取

### 4.3 接口实现约束

1. **错误码必须使用已定义的分类体系**（见 API 层设计草案 §3.2）
   - 4xxx = OpenClaw 系统错误
   - 5xxx = 内部系统错误
   - 不允许返回未编码的自由文本错误

2. **Gateway CLI 调用必须有超时控制**
   - 默认超时：10 秒
   - 超时后返回缓存数据（如有）或标准 503 错误
   - 不允许无限等待 CLI 响应

3. **所有接口必须有基本的请求日志**
   - 至少记录：时间、方法、路径、响应码、耗时
   - 使用结构化日志（JSON 格式）
   - MVP 不要求 ELK/Prometheus，但日志格式必须从一开始就是结构化的

4. **配置模板应用接口必须有基本验证**
   - 验证模板 YAML 格式合法性
   - 验证目标 Agent 存在
   - 应用结果必须有明确的成功/失败反馈

### 4.4 前端实现约束

1. **页面数量固定为 2 个**
   - 状态总览（Dashboard）
   - 配置管理（Config）
   - 导航结构：侧边栏切换，不做路由嵌套

2. **交互模式固定**
   - 数据刷新：仅手动刷新按钮
   - 操作反馈：Toast 或内联状态提示
   - 加载状态：Skeleton 或 Spinner
   - 错误状态：内联错误卡片 + 重试按钮
   - 降级状态：黄色警告横幅 + stale 说明文案

3. **不允许的前端行为**
   - ❌ `setInterval` 轮询 API
   - ❌ 直接拼接 Gateway CLI 命令
   - ❌ LocalStorage 缓存业务数据（缓存交给后端）
   - ❌ 在前端做数据聚合计算
   - ❌ 使用非 Axios 的 HTTP 库

### 4.5 已确认决策清单（不可重新讨论）

以下决策在技术验证阶段已确认，开发阶段直接执行，不可重新讨论：

| 决策编号 | 决策内容 | 决策来源 |
|----------|----------|----------|
| D-001 | 缓存降级返回 `200 + stale:true`，不用 `503 + cachedData` | decisions/2026-03-14-cache-fallback-decision.md |
| D-002 | 前端不直连 Gateway，必须经过适配层 | docs/2026-03-13-revised-gateway-validation-solution.md |
| D-003 | 适配层通过 CLI/RPC 调用 Gateway，不假设 REST API 存在 | 同上 |
| D-004 | 技术栈：React + Zustand + TailwindCSS + Vite + Express | 架构方案书已确认 |
| D-005 | MVP 不含 Tauri 桌面壳层 | 本文档 §1.1 |
| D-006 | MVP 不含 WebSocket 实时推送 | 本文档 §1.3 |
| D-007 | MVP 不含认证中间件 | 本文档 §1.3（本地单用户） |
| D-008 | 聚合未命中性能约 4.8s 为"已接受风险" | CURRENT.md 备注 |

### 4.6 已知风险与开发期应对

| 风险 | 等级 | 应对策略 | 责任人 |
|------|------|----------|--------|
| Gateway CLI 响应不稳定 | 中 | 10s 超时 + 缓存降级 + 重试 1 次 | Leona |
| 首次请求慢（~4.8s 无缓存） | 低 | 前端 Skeleton 等待 + 后续缓存生效 | Ezreal + Leona |
| 模板 YAML 格式不兼容 | 低 | 严格 Schema 验证 + 预置模板经过测试 | Leona |
| 前后端联调接口不对齐 | 中 | DTO 类型定义共享 + Mock 先行 | Ezreal + Leona |

### 4.7 MVP 开发阶段禁止事项

以下行为在 MVP 开发阶段明确禁止：

1. **禁止引入新技术栈**：不引入 Redux/MobX/SWR/TanStack Query 等非已确认技术
2. **禁止扩大功能范围**：不把"不做"列表中的功能偷偷加进来
3. **禁止跳过适配层**：前端不可直接调用 Gateway 任何接口
4. **禁止硬编码 Gateway 命令**：CLI 命令必须在 Adapter 层统一管理
5. **禁止忽略降级逻辑**：所有 API 调用路径必须覆盖 Gateway 不可用场景
6. **禁止自定义响应格式**：必须使用统一的 `{success, data, error}` 格式
7. **禁止无 TypeScript 类型的代码**：不允许 `any` 类型泛滥，核心接口必须有完整类型定义

---

## 五、配置模板系统设计约束

### 5.1 预置模板规格

MVP 包含 5 个预置模板（来自 Ekko 需求收口）：

| 模板 ID | 名称 | 用途 |
|---------|------|------|
| `doc-processor` | 文档处理助手 | docx/pdf 转换 |
| `collab-assistant` | 协作沟通助手 | 飞书文档/表格协同 |
| `office-basic` | 基础办公助手 | 通用办公技能组合 |
| `tech-bridge` | 技术对接助手 | 技术类技能组合 |
| `blank` | 空模板 | 用户自定义起点 |

### 5.2 模板 YAML 格式约束

```yaml
# template-meta 必须字段
id: string          # 模板唯一标识
name: string        # 显示名称
description: string # 简短描述
version: string     # 模板版本（semver）
category: string    # 分类标签

# 配置体必须为 OpenClaw 可识别格式
config:
  skills: []        # 技能列表
  model: {}         # 模型配置（可选覆盖）
  # ... 其他 OpenClaw agent 配置字段
```

### 5.3 模板应用流程约束

```
用户选模板 → 选目标 Agent → 确认应用
  → 后端验证模板合法性
  → 后端验证目标 Agent 存在
  → 后端执行配置写入
  → 返回成功/失败
  → 前端展示结果
```

- 不做配置 diff/merge
- 不做配置回滚（MVP 版本）
- 应用即覆盖，用户需自行确认

---

## 六、交付物检查清单

开发完成后，以下条件必须全部满足才算 MVP 交付完成：

- [ ] 状态总览页可正常展示 Agent 状态、任务数、健康指标
- [ ] 配置管理页可浏览 5 个预置模板、预览 YAML、一键应用
- [ ] 所有 API 返回格式符合统一规范
- [ ] Gateway 不可用时降级逻辑正常工作（200 + stale:true）
- [ ] Gateway 不可用且无缓存时返回 503
- [ ] 前端正确展示降级状态（黄色警告横幅）
- [ ] 结构化日志正常输出
- [ ] 无 TypeScript 编译错误
- [ ] 代码目录结构符合本文档约定

---

*文档版本：V1.0*  
*创建时间：2026-03-14*  
*创建人：Architect-Jax*  
*状态：已完成，可进入开发执行阶段*
