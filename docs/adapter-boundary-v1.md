# 适配层边界文档 v1

> office-dashboard-adapter 的职责边界定义

## 1. 适配层负责什么

| 领域 | 说明 |
|------|------|
| OpenClaw 数据适配 | 将 OpenClaw 运行时文件（registry、tasks、docs、状态机等）解析为结构化 JSON |
| 展示层接口 | 为前端 Dashboard 提供统一 REST API（`/api/v1/*`）和 SSE 实时推送 |
| 前端服务 | 托管静态资源、SPA 路由、健康检查端点 |
| 数据缓存 | 内存缓存层，降低文件 I/O 频率 |
| 项目实例管理 | 项目实例的创建/列表/归档（基于注册表） |
| 并发写保护 | 文件锁机制，保护注册表等共享文件的写入一致性 |

## 2. 适配层不负责什么

| 领域 | 说明 | 归属 |
|------|------|------|
| OpenClaw 核心能力 | Agent 运行时、Session 管理、Model 调用 | OpenClaw Gateway |
| Agent 调度 | Agent 的启停、负载均衡、优先级 | OpenClaw Gateway |
| 消息路由 | 飞书/Discord/Telegram 等渠道消息收发 | OpenClaw Channel Plugin |
| 数据持久化 | 底层文件系统的组织方式由 OpenClaw 定义 | OpenClaw Core |
| 权限认证 | 用户身份验证、OAuth 流程 | OpenClaw Auth |

## 3. API 稳定性分级

### 稳定接口（不随 OpenClaw 版本变动）

这些 API 的请求/响应格式由适配层自身定义，即使 OpenClaw 底层数据结构变化，适配层会做兼容转换。

| 端点 | 说明 |
|------|------|
| `GET /api/v1/dashboard` | 聚合仪表盘数据 |
| `GET /api/v1/instances` | 项目实例列表 |
| `POST /api/v1/instances` | 创建项目实例 |
| `POST /api/v1/instances/:id/archive` | 归档项目实例 |
| `GET /api/v1/registry` | 对象注册表查询 |
| `GET /api/v1/tasks` | 任务列表 |
| `GET /api/v1/docs` | 文档列表 |
| `GET /api/v1/timeline` | 时间线事件 |
| `GET /api/v1/notifications` | 通知列表 |
| `GET /api/v1/search` | 全站搜索 |
| `GET /api/v1/projects/status` | 项目状态机 |
| `GET /health` / `GET /healthz` | 健康检查 |

### 透传接口（会随 OpenClaw 版本变动）

这些 API 的数据直接来自 OpenClaw Gateway 或运行时文件，格式随 OpenClaw 版本可能变化。

| 端点 | 说明 | 数据来源 |
|------|------|----------|
| `GET /api/v1/agents` | Agent 列表与状态 | Gateway WS / 运行时文件 |
| `GET /api/v1/sessions` | Session 列表 | Gateway WS |
| `GET /api/v1/sessions/:id/messages` | Session 消息 | Gateway WS |
| `GET /api/v1/usage` | 用量统计 | OpenClaw 日志 |
| `GET /api/v1/memory` | Agent 记忆文件 | 运行时文件系统 |
| `GET /api/v1/cron` | Cron 任务状态 | OpenClaw Cron |
| `GET /api/v1/settings/wiring-status` | 接线状态 | Gateway 配置 |
| `GET /api/v1/events` (SSE) | 实时事件流 | Gateway WS + FileWatcher |

## 4. 版本兼容策略

- **稳定接口**：遵循语义化版本，Breaking Change 需要 Major 版本升级
- **透传接口**：不做版本承诺，前端应对字段缺失做防御性处理
- 适配层 README 中标注当前兼容的 OpenClaw 最低版本
