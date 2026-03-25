# 重构架构方案：办公增强控制台 Phase 10

- 时间：2026-03-17 UTC
- 角色：architect-jax
- 类型：重构架构方案
- 决策基础：用户选 A——继续当前项目主线，以 openclaw-control-center 为参照重构，不 fork
- 产品定位：面向有 AI 应用能力、愿意折腾的效率型用户
- 主战场：Web 后台（桌面端视图），飞书仅做轻量通知

---

## 〇、执行摘要

本方案将 office-dashboard-adapter 从 MVP 适配层升级为完整的办公增强控制台。核心变化：

1. **数据层**：从 CLI 子进程调用 → 文件直读 + WebSocket 实时推送
2. **功能层**：从单一 Dashboard → 8 大功能分区（Overview/Agents/Collaboration/Tasks/Usage/Memory/Docs/Settings）
3. **安全层**：引入 READONLY_MODE + Token 鉴权 + 写操作 Gate
4. **前端层**：从 550 行单文件 app.js → 模块化分区 SPA
5. **集成层**：飞书轻量通知 + 文件落地强化

采用**渐进式迁移**策略，分 6 个迭代，每个迭代独立可用。

---

## 一、架构升级路径

### 1.1 当前架构（问题分析）

```
[浏览器] → [Express Server] → [CLI execFile] → [openclaw gateway call] → [Gateway WS]
                                    ↑
                              性能瓶颈所在
                              每次调用 spawn 子进程
                              序列化/反序列化开销
                              超时不可控
```

**核心问题**：
- `execFile('openclaw', ['gateway', 'call', ...])` 每次请求 spawn 一个 Node.js 子进程
- 子进程启动开销 200-500ms，加上 CLI 解析、WebSocket 连接建立
- 无法复用连接，无法接收实时推送
- 超时控制粗糙（只有进程级 timeout）

### 1.2 目标架构

```
┌─────────────────────────────────────────────────────────┐
│                    浏览器（SPA）                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Overview  │  │  Agents  │  │  Tasks   │  ...8 分区   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       └──────────────┼──────────────┘                    │
│              SSE / fetch / WS                            │
└───────────────┬─────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────┐
│              Office Console Server                       │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Auth Guard   │  │ Route Layer  │  │ SSE Push Hub  │  │
│  │ (Token+RO)   │  │ (Express)    │  │ (EventEmitter)│  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                │                    │          │
│  ┌──────▼────────────────▼────────────────────▼──────┐  │
│  │              Service Layer                         │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │  │
│  │  │ overview │ │  agents  │ │  tasks   │  ...      │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘          │  │
│  └───────┼────────────┼────────────┼─────────────────┘  │
│          │            │            │                     │
│  ┌───────▼────────────▼────────────▼─────────────────┐  │
│  │            Data Access Layer                       │  │
│  │                                                    │  │
│  │  ┌────────────────┐  ┌─────────────────────────┐  │  │
│  │  │ FileReader      │  │ GatewayWsClient         │  │  │
│  │  │ (直读运行时文件) │  │ (复用单连接，实时推送)   │  │  │
│  │  └────────┬───────┘  └──────────┬──────────────┘  │  │
│  │           │                      │                 │  │
│  └───────────┼──────────────────────┼─────────────────┘  │
└──────────────┼──────────────────────┼────────────────────┘
               │                      │
       ┌───────▼───────┐      ┌───────▼────────┐
       │ OpenClaw 运行时│      │ Gateway WS     │
       │ 文件系统       │      │ :18789         │
       │ ~/.openclaw/   │      │                │
       └───────────────┘      └────────────────┘
```

### 1.3 迁移策略：渐进式

**不做一次性重写**。理由：
- 当前 adapter 已能运行，渐进式可保证每步都有可用系统
- 团队可并行推进不同模块
- 降低风险，每步可验证

**迁移路线图**：

| 迭代 | 变更 | adapter 旧代码处置 |
|------|------|-------------------|
| Iter-1 | 新增 FileReader + GatewayWsClient 数据层 | 保留 CLI adapter 作为 fallback |
| Iter-2 | 服务层逐个切换到新数据层 | 标记 CLI adapter 为 deprecated |
| Iter-3 | 引入安全框架 | 无影响 |
| Iter-4 | 前端分区化改造 | 替换 app.js |
| Iter-5 | 新增功能分区（Tasks/Docs/Memory 等） | N/A |
| Iter-6 | 移除 CLI adapter，清理旧代码 | 删除 |

### 1.4 新数据层详细设计

#### 1.4.1 FileReader 模块

直接读取 OpenClaw 运行时文件，零网络开销：

```typescript
// src/data/file-reader.ts

import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

export interface FileReaderConfig {
  openclawRoot: string;  // 默认 ~/.openclaw
}

export class OpenClawFileReader {
  private root: string;

  constructor(config: FileReaderConfig) {
    this.root = config.openclawRoot;
  }

  // 核心配置
  async readConfig(): Promise<any> {
    return this.readJson(join(this.root, 'openclaw.json'));
  }

  // Agent 列表 & 状态
  async listAgents(): Promise<string[]> {
    return readdir(join(this.root, 'agents'));
  }

  async readAgentConfig(agentId: string): Promise<any> {
    // 从 openclaw.json 的 agents.list 读取
    const config = await this.readConfig();
    return config.agents?.list?.find((a: any) => a.id === agentId);
  }

  // Agent workspace 文件
  async readWorkspaceFile(agentId: string, relativePath: string): Promise<string> {
    const config = await this.readAgentConfig(agentId);
    if (!config?.workspace) throw new Error(`No workspace for ${agentId}`);
    return readFile(join(config.workspace, relativePath), 'utf-8');
  }

  // Session 数据
  async listSessions(agentId: string): Promise<any[]> {
    const sessionsDir = join(this.root, 'agents', agentId, 'sessions');
    const files = await readdir(sessionsDir).catch(() => []);
    return files;
  }

  // Memory 数据
  async readMemory(agentId: string): Promise<any> {
    const memDir = join(this.root, 'memory');
    // memory 可能在 agent 目录或全局 memory 目录
    return readdir(memDir).catch(() => []);
  }

  // 项目文件（核心 —— 文件落地原则）
  async readProjectFile(projectPath: string): Promise<string> {
    return readFile(projectPath, 'utf-8');
  }

  async listProjectDir(dirPath: string): Promise<string[]> {
    return readdir(dirPath);
  }

  // 通用
  private async readJson(filePath: string): Promise<any> {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }
}
```

#### 1.4.2 GatewayWsClient 模块

复用单个 WebSocket 连接，支持实时推送：

```typescript
// src/data/gateway-ws-client.ts

import WebSocket from 'ws';  // 或 Node.js 22 内置 WebSocket
import { EventEmitter } from 'node:events';

export interface GatewayWsConfig {
  url: string;          // 默认 ws://127.0.0.1:18789
  token?: string;       // 鉴权 token
  reconnectMs: number;  // 重连间隔，默认 3000
}

export class GatewayWsClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private pendingCalls = new Map<string, { resolve: Function; reject: Function; timer: NodeJS.Timeout }>();
  private callId = 0;

  constructor(private config: GatewayWsConfig) {
    super();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.config.url);
      if (this.config.token) url.searchParams.set('token', this.config.token);
      
      this.ws = new WebSocket(url.toString());
      this.ws.on('open', () => {
        this.emit('connected');
        resolve();
      });
      this.ws.on('message', (data) => this.handleMessage(data));
      this.ws.on('close', () => this.scheduleReconnect());
      this.ws.on('error', (err) => {
        this.emit('error', err);
        reject(err);
      });
    });
  }

  // RPC 调用（替代 CLI execFile）
  async call<T>(method: string, params: Record<string, unknown> = {}, timeoutMs = 10000): Promise<T> {
    const id = String(++this.callId);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingCalls.delete(id);
        reject(new Error(`Gateway call ${method} timed out`));
      }, timeoutMs);

      this.pendingCalls.set(id, { resolve, reject, timer });
      this.ws?.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }));
    });
  }

  private handleMessage(raw: WebSocket.Data) {
    try {
      const msg = JSON.parse(raw.toString());
      
      // RPC 响应
      if (msg.id && this.pendingCalls.has(msg.id)) {
        const { resolve, reject, timer } = this.pendingCalls.get(msg.id)!;
        clearTimeout(timer);
        this.pendingCalls.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
        return;
      }
      
      // 实时推送事件
      if (msg.method) {
        this.emit('push', { method: msg.method, params: msg.params });
        this.emit(`push:${msg.method}`, msg.params);
      }
    } catch { /* ignore parse errors */ }
  }

  private scheduleReconnect() {
    setTimeout(() => this.connect().catch(() => {}), this.config.reconnectMs);
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}
```

#### 1.4.3 SSE Push Hub（服务端推送到浏览器）

```typescript
// src/data/sse-hub.ts

import type { Response } from 'express';

export class SseHub {
  private clients = new Set<Response>();

  addClient(res: Response) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    this.clients.add(res);
    res.on('close', () => this.clients.delete(res));
  }

  broadcast(event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      client.write(payload);
    }
  }

  get clientCount() { return this.clients.size; }
}
```

---

## 二、8 大功能分区实现方案

### 2.1 总览（Overview）

**数据来源**：FileReader（openclaw.json + agent 目录）+ GatewayWsClient（status）
**保留**：当前 dashboard-service 的聚合逻辑
**升级**：
- 系统状态改为从文件直读 + WS status 组合
- 新增：运行时版本、Gateway 连接状态、磁盘用量
- 新增：最近 24h 活动时间线（从 session 文件聚合）
- 新增：快速操作入口（跳转到其他 7 个分区）

**实现文件**：
```
src/services/overview-service.ts     — 聚合逻辑
src/routes/overview.ts               — GET /api/v1/overview
```

### 2.2 Agent 状态（Agents）

**数据来源**：FileReader（openclaw.json agents.list + workspace 目录）
**保留**：当前 agent-service 的状态推导逻辑
**升级**：
- 从 CLI 切到文件直读 agent 配置
- 新增：每个 agent 的 workspace 文件树预览
- 新增：agent 最近 session 列表
- 新增：agent 模型配置和 fallback 链展示
- 新增：agent 角色描述（读取 workspace 的 SOUL.md/IDENTITY.md）
- 操作：重启 agent heartbeat（需写操作权限）

**实现文件**：
```
src/services/agent-service.ts        — 重构，切换数据源
src/routes/agents.ts                 — GET /api/v1/agents, GET /api/v1/agents/:id
```

### 2.3 协作/会话接力（Collaboration）

**数据来源**：FileReader（session 目录）+ GatewayWsClient（sessions_list）
**全新模块**：当前无此功能
**实现**：
- 展示活跃会话列表（来源、目标 agent、状态、时长）
- 父子会话关系树（subagent spawn 链）
- 会话消息预览（读取 session 文件）
- 跨 agent 协作路径可视化

**实现文件**：
```
src/services/collaboration-service.ts
src/routes/collaboration.ts          — GET /api/v1/sessions, GET /api/v1/sessions/:id
```

### 2.4 任务（Tasks）

**数据来源**：FileReader（项目目录 tasks/）
**全新模块**，但直接对接我们已有的项目任务文件体系
**实现**：
- 读取 `/root/.openclaw/workspace/projects/office-console-enhanced/tasks/` 目录
- 解析 markdown 任务文件，提取结构化元信息（标题、状态、责任人、日期）
- 任务看板视图（按状态分组：待处理/进行中/已完成/阻塞）
- 任务详情展示（渲染 markdown）
- **关键**：写操作需通过 Gate 保护（见安全框架）

**实现文件**：
```
src/services/task-service.ts
src/services/task-parser.ts          — markdown 元信息解析
src/routes/tasks.ts                  — GET /api/v1/tasks, GET /api/v1/tasks/:id
```

### 2.5 用量/成本（Usage）

**数据来源**：GatewayWsClient（usage/billing 数据）+ FileReader（日志聚合）
**全新模块**
**实现**：
- Token 消耗统计（按 agent、按模型、按时间段）
- 成本估算（基于模型定价表）
- 上下文窗口压力分析
- 趋势图（日/周/月）
- 预算阈值告警配置

**实现文件**：
```
src/services/usage-service.ts
src/routes/usage.ts                  — GET /api/v1/usage, GET /api/v1/usage/by-agent
```

### 2.6 记忆管理（Memory）

**数据来源**：FileReader（memory 目录 + agent workspace MEMORY.md 等）
**全新模块**
**实现**：
- 各 agent 的 memory 文件列表和内容预览
- workspace 内的 SOUL.md / USER.md / TOOLS.md 等核心文件查看
- memory 文件编辑（需写操作 Gate）
- memory 大小和使用情况统计

**实现文件**：
```
src/services/memory-service.ts
src/routes/memory.ts                 — GET /api/v1/memory/:agentId, PUT /api/v1/memory/:agentId/:file
```

### 2.7 文档工作台（Docs）

**数据来源**：FileReader（项目 docs/ 目录 + artifacts/ 目录）
**全新模块**，直接服务于"文件落地原则"
**实现**：
- 项目文档浏览器（docs/、status/、reviews/、protocols/、decisions/）
- Markdown 渲染预览
- 文档搜索（全文 grep）
- Artifact 浏览（代码文件树 + 预览）
- 文档创建/编辑（需写操作 Gate）

**实现文件**：
```
src/services/docs-service.ts
src/routes/docs.ts                   — GET /api/v1/docs, GET /api/v1/docs/*path
```

### 2.8 设置（Settings）

**数据来源**：FileReader（openclaw.json）+ 本地配置文件
**升级**：整合当前 template-service + config-apply-service
**实现**：
- OpenClaw 核心配置查看（agents、models、bindings、channels）
- YAML 模板管理（保留当前模板系统 —— 这是我们的差异化资产）
- 模板应用与校验
- 安全设置（READONLY_MODE 开关、Token 管理）
- Gateway 连接状态与诊断
- 写操作需 Gate 保护

**实现文件**：
```
src/services/settings-service.ts     — 新建，整合 config 操作
src/services/template-service.ts     — 保留并优化
src/routes/settings.ts               — GET/PUT /api/v1/settings/*
```

---

## 三、安全框架

### 3.1 READONLY_MODE

```typescript
// src/middleware/security.ts

export interface SecurityConfig {
  readonlyMode: boolean;     // 环境变量 READONLY_MODE=true
  localToken: string | null; // 环境变量 OC_CONSOLE_TOKEN
  allowedWriteOrigins: string[]; // 默认 ['127.0.0.1', '::1']
}

// 只读模式中间件
export function readonlyGuard(config: SecurityConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (config.readonlyMode && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return res.status(403).json({
        error: 'READONLY_MODE',
        message: '控制台当前处于只读模式，写操作已禁用',
      });
    }
    next();
  };
}
```

**行为**：
- `READONLY_MODE=true` 时，所有 POST/PUT/PATCH/DELETE 请求返回 403
- 默认**开启**只读模式（安全优先）
- 通过环境变量控制，不可通过 API 运行时切换

### 3.2 本地 Token 鉴权

```typescript
// Token 验证中间件
export function tokenAuth(config: SecurityConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!config.localToken) return next(); // 未配置 token 则跳过

    const provided = req.headers.authorization?.replace('Bearer ', '')
      || req.query.token as string;

    if (provided !== config.localToken) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Invalid or missing token',
      });
    }
    next();
  };
}
```

**行为**：
- 通过 `OC_CONSOLE_TOKEN` 环境变量设置
- 支持 Bearer token header 或 query parameter
- 未配置时不强制鉴权（本地开发友好）
- 建议生产部署时必须配置

### 3.3 写操作 Gate

所有写操作必须经过三层检查：

```
请求 → tokenAuth → readonlyGuard → writeGate → 业务逻辑
```

writeGate 的额外检查：
1. **dry-run 默认**：写操作默认 `dryRun=true`，客户端必须显式传 `dryRun=false` 才真正执行
2. **操作日志**：所有写操作记录到 `~/.openclaw/workspace/projects/office-console-enhanced/logs/write-audit.jsonl`
3. **范围限制**：只允许写入项目目录，不允许写 openclaw.json 或系统配置（模板应用除外，且模板应用自带 validate）

```typescript
export function writeGate() {
  return (req: Request, res: Response, next: NextFunction) => {
    // 默认 dry-run
    if (req.body?.dryRun !== false && req.query.dryRun !== 'false') {
      req.dryRun = true;
    }
    
    // 审计日志
    auditLog({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      dryRun: req.dryRun ?? false,
      ip: req.ip,
    });
    
    next();
  };
}
```

### 3.4 安全配置汇总

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `READONLY_MODE` | `true` | 只读模式，禁止写操作 |
| `OC_CONSOLE_TOKEN` | 无 | 本地鉴权 Token |
| `OC_CONSOLE_HOST` | `127.0.0.1` | 绑定地址（默认仅本地） |
| `OC_CONSOLE_PORT` | `13580` | 服务端口 |
| `OC_GATEWAY_TOKEN` | 读取 openclaw.json | Gateway 鉴权 Token |
| `OC_DRY_RUN_DEFAULT` | `true` | 写操作默认 dry-run |

---

## 四、文件落地原则强化方案

### 4.1 设计原则

> **所有角色间信息通过落地文件共享，不依赖会话记忆**

这在新架构中不仅保留，而且成为核心数据模型的基石：

1. **控制台直接读取项目文件**：所有数据展示的 source of truth 是磁盘文件
2. **控制台写入项目文件**：编辑操作直接写入项目目录，而不是写入数据库
3. **无独立数据库**：控制台不引入任何数据库，文件系统就是数据库
4. **文件变更推送**：通过 `fs.watch` 监控项目目录变更，通过 SSE 推送到浏览器

### 4.2 项目文件目录约定

控制台默认监控和展示的文件结构：

```
/root/.openclaw/workspace/projects/office-console-enhanced/
├── status/
│   └── CURRENT.md              → Overview 显示的项目状态
├── tasks/
│   └── *.md                    → Tasks 分区的数据源
├── docs/
│   └── *.md                    → Docs 分区的数据源
├── reviews/
│   └── *.md                    → 审核记录
├── protocols/
│   └── *.md                    → 协议/规范
├── decisions/
│   └── *.md                    → 决策记录
├── artifacts/
│   └── office-dashboard-adapter/  → 代码产出物
├── logs/
│   └── write-audit.jsonl       → 写操作审计日志（新增）
└── README.md
```

### 4.3 FileWatcher 实时感知

```typescript
// src/data/file-watcher.ts

import { watch } from 'node:fs';
import { EventEmitter } from 'node:events';

export class FileWatcher extends EventEmitter {
  private watchers: ReturnType<typeof watch>[] = [];

  watchDirectory(dir: string, recursive = true) {
    const watcher = watch(dir, { recursive }, (eventType, filename) => {
      if (filename && !filename.startsWith('.')) {
        this.emit('change', { eventType, filename, dir });
      }
    });
    this.watchers.push(watcher);
  }

  close() {
    this.watchers.forEach(w => w.close());
  }
}
```

**与 SSE 联动**：
```typescript
// 在 server 启动时
fileWatcher.watchDirectory(projectRoot);
fileWatcher.on('change', ({ filename }) => {
  sseHub.broadcast('file-change', { filename, timestamp: Date.now() });
});
```

### 4.4 跨角色文件协作的控制台视角

控制台提供"文件落地可视化"能力：
- **文件活动流**：按时间展示各角色写入的文件变更
- **文件归属标记**：通过文件名约定（如 `*-jax.md`、`*-ezreal.md`）展示文件归属角色
- **交接物追踪**：自动识别 handoff/review/status 类文件，展示交接状态

---

## 五、飞书集成轻量化方案

### 5.1 定位

飞书 = **通知渠道**，不是交互界面。类比 Telegram bot 的风格：

- ✅ 推送关键事件通知
- ✅ 通知里带跳转链接（指向 Web 控制台）
- ❌ 不在飞书里做复杂操作
- ❌ 不在飞书里展示完整报表

### 5.2 需要推送飞书的事件

| 事件类型 | 触发条件 | 消息模板 |
|---------|---------|---------|
| 任务状态变更 | 任务文件被修改，状态字段变化 | `📋 任务 [名称] 状态变更: [旧] → [新]` |
| 阻塞告警 | 检测到 blocker 类关键词 | `🚨 阻塞: [描述] → [Web控制台链接]` |
| Agent 异常 | Agent 状态从 normal 变为 error | `⚠️ Agent [名称] 状态异常` |
| 阶段完成 | 检测到 Phase 完成标记 | `✅ [Phase名] 已完成 → [详情链接]` |
| 安全事件 | 写操作审计中的异常 | `🔐 安全事件: [描述]` |
| 日报/周报 | 定时触发（cron） | `📊 项目日报 → [Web控制台链接]` |

### 5.3 实现方式

```typescript
// src/services/notification-service.ts

export class NotificationService {
  // 通过 OpenClaw 的 message 工具发送飞书消息
  // 控制台本身不直接调用飞书 API，而是通过 OpenClaw Gateway
  
  async notify(event: NotificationEvent) {
    // 写入通知队列文件
    await appendFile(
      join(projectRoot, 'logs', 'notifications.jsonl'),
      JSON.stringify({ ...event, timestamp: new Date().toISOString() }) + '\n'
    );
    
    // 通过 Gateway 发送（非阻塞）
    gatewayWsClient.call('message.send', {
      channel: 'feishu',
      target: 'oc_425a0058997fca9570391b562ba15efb',
      message: this.formatMessage(event),
    }).catch(err => log('warn', 'notification_failed', { err: err.message }));
  }
}
```

### 5.4 控制台内通知中心

Web 控制台中新增通知面板：
- 展示所有通知历史（读取 notifications.jsonl）
- 标记已读/未读
- 按类型过滤
- 这是飞书通知的"完整版"——飞书只推摘要+链接，控制台有完整详情

---

## 六、重构执行顺序

### Iteration 1：基础架构升级（Leona 主导，Ezreal 配合）

**目标**：替换数据层，建立新架构骨架

**后端（Leona）**：
1. 新建 `src/data/file-reader.ts` — OpenClaw 文件直读模块
2. 新建 `src/data/gateway-ws-client.ts` — Gateway WebSocket 客户端
3. 新建 `src/data/sse-hub.ts` — SSE 推送中心
4. 新建 `src/config/security.ts` — 安全配置模块
5. 重构 `src/services/dashboard-service.ts` — 切换到 FileReader + WsClient
6. 重构 `src/services/agent-service.ts` — 切换到 FileReader
7. 保留 `src/adapters/openclaw-cli-adapter.ts` 作为 fallback
8. 新建 `GET /api/v1/events` SSE 端点

**前端（Ezreal）**：
1. 建立 SSE 连接，替代轮询
2. Dashboard 页面接入实时数据

**验收标准（Galio）**：
- Dashboard 数据来源切换为文件直读 + WS，CLI 仅作 fallback
- 响应时间从 1-3s 降到 <200ms
- SSE 实时推送可用

**预计时间**：1-2 天

### Iteration 2：安全框架引入（Leona 主导）

**后端（Leona）**：
1. 新建 `src/middleware/security.ts` — readonlyGuard + tokenAuth + writeGate
2. 新建环境变量配置体系
3. 所有现有路由加上安全中间件
4. 写操作审计日志实现
5. dry-run 默认机制

**验收标准（Galio）**：
- READONLY_MODE=true 时所有写操作返回 403
- Token 鉴权正确拦截未授权请求
- 写操作有完整审计日志

**预计时间**：0.5-1 天

### Iteration 3：前端分区化改造（Ezreal 主导，Lux 配合）

**UI 设计（Lux）**：
1. 8 分区导航布局设计
2. 每个分区的骨架线框图
3. 响应式布局方案（桌面优先，最小宽度 1200px）
4. 配色/图标/排版规范

**前端（Ezreal）**：
1. 将 app.js 拆分为模块化 SPA（可用原生 JS module 或轻量框架）
2. 路由系统（hash-based: `#/overview`, `#/agents`, `#/tasks` 等）
3. 8 个分区骨架页面
4. 通用组件：数据表格、Markdown 渲染器、状态徽章、加载态
5. Overview 分区完成（基于 Iter-1 的数据）
6. Agents 分区完成

**验收标准（Galio）**：
- 8 个分区导航可切换
- Overview 和 Agents 分区数据正确
- 桌面端视图 ≥1200px 宽度下布局正常

**预计时间**：2-3 天

### Iteration 4：Tasks + Docs 分区（Ezreal + Leona 并行）

**后端（Leona）**：
1. `src/services/task-service.ts` — 任务文件解析
2. `src/services/task-parser.ts` — markdown 元信息提取
3. `src/services/docs-service.ts` — 文档浏览服务
4. `src/data/file-watcher.ts` — 文件变更监控
5. 对应路由

**前端（Ezreal）**：
1. Tasks 分区：看板视图 + 详情面板
2. Docs 分区：文件树 + Markdown 预览
3. 文件变更实时刷新（SSE 联动）

**验收标准（Galio）**：
- 任务看板正确展示项目 tasks/ 下的文件
- 文档浏览器可导航项目目录树
- Markdown 渲染正确
- 文件变更后 <2s 自动刷新

**预计时间**：2-3 天

### Iteration 5：Collaboration + Usage + Memory 分区（Ezreal + Leona 并行）

**后端（Leona）**：
1. `src/services/collaboration-service.ts` — 会话数据聚合
2. `src/services/usage-service.ts` — 用量统计
3. `src/services/memory-service.ts` — 记忆管理
4. 对应路由

**前端（Ezreal）**：
1. Collaboration 分区：会话列表 + 关系树
2. Usage 分区：图表 + 统计
3. Memory 分区：文件查看 + 编辑

**验收标准（Galio）**：
- 三个分区数据正确
- Memory 编辑需经过写操作 Gate
- Usage 图表渲染正确

**预计时间**：2-3 天

### Iteration 6：Settings + 飞书通知 + 清理（全员）

**后端（Leona）**：
1. `src/services/settings-service.ts` — 整合现有模板系统
2. `src/services/notification-service.ts` — 飞书通知
3. 移除 CLI adapter（确认所有服务已切换）
4. 清理废弃代码

**前端（Ezreal）**：
1. Settings 分区：配置查看 + 模板管理
2. 通知中心面板

**UI（Lux）**：
1. 最终视觉 polish
2. 确保设计一致性

**验收（Galio）**：
1. 全分区端到端测试
2. 安全框架回归测试
3. 性能基准测试

**预计时间**：1-2 天

---

## 七、技术选型决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| HTTP 框架 | 保留 Express | 团队已熟悉，迁移成本低，功能足够 |
| 前端框架 | 原生 JS + ES Module | 与 control-center 风格一致，零构建，快速迭代 |
| WebSocket 客户端 | Node.js 22 内置 WebSocket 或 `ws` | 零额外依赖 |
| Markdown 渲染 | `marked`（前端）| 轻量，无需服务端渲染 |
| 数据库 | 无 | 文件系统就是数据库，保持文件落地原则 |
| 实时推送 | SSE（服务端到浏览器）| 比 WS 简单，单向推送足够 |
| 模板系统 | 保留现有 YAML 模板 | 差异化资产，直接保留 |
| 包管理器 | 保留现有 | 不做无谓变更 |

---

## 八、风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| Gateway WS 连接不稳 | 中 | 实时数据中断 | 自动重连 + FileReader 作为 fallback |
| 文件系统权限问题 | 低 | 无法读取运行时文件 | 启动时检查权限，降级到 CLI |
| 前端单文件拆分复杂度 | 中 | 开发效率降低 | 用 ES Module 渐进拆分，不引入构建工具 |
| READONLY_MODE 误配置 | 低 | 写操作意外放开 | 默认 READONLY，必须显式关闭 |
| 大量文件 watch 内存压力 | 低 | 内存占用高 | 限制 watch 深度，定期清理 |

---

## 九、对已有工作的处置

| 已有资产 | 处置方式 |
|---------|---------|
| `openclaw-cli-adapter.ts` | Iter-1 保留为 fallback，Iter-6 移除 |
| `dashboard-service.ts` | Iter-1 重构数据源，保留聚合逻辑 |
| `agent-service.ts` | Iter-1 重构数据源 |
| `template-service.ts` | 保留，Iter-6 整合到 Settings |
| `config-apply-service.ts` | 保留，Iter-6 整合到 Settings |
| `cached-resource-service.ts` | Iter-1 简化（直读不需要重度缓存） |
| `health-service.ts` | 保留，纳入 Overview |
| `public/app.js` | Iter-3 拆分为模块化 SPA |
| `public/style.css` | Iter-3 由 Lux 重新设计 |
| `public/index.html` | Iter-3 改为 SPA 壳 |
| 可观测性响应头 | 保留并强化（已有优势） |
| benchmark.ts / verify.ts | 保留，Iter-6 扩展 |

---

## 十、成功标准

1. **性能**：Dashboard 聚合接口响应时间 < 200ms（当前 1-3s）
2. **功能**：8 大分区全部可用
3. **安全**：READONLY + Token + WriteGate + AuditLog 全部就位
4. **文件落地**：控制台不引入任何数据库，所有数据源自文件
5. **飞书通知**：关键事件 < 5s 推送到项目群
6. **可维护**：每个分区独立 service + route，互不耦合

---

**本方案已足够具体，各角色可直接按 Iteration 分配开始执行。**

— Jax（architect-jax）
2026-03-17 UTC
