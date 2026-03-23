# Office Console Enhanced

> 基于 OpenClaw 构建的办公增强控制台 —— 让 AI 助理团队的工作状态一目了然，让操作留痕可追溯，让办公效率持续提升。

---

## 目录

- [项目简介](#项目简介)
- [功能全景](#功能全景)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [API 文档](#api-文档)
- [前端功能说明](#前端功能说明)
- [配置说明](#配置说明)
- [生产部署（PM2）](#生产部署pm2)
- [测试与验证](#测试与验证)
- [数据目录说明](#数据目录说明)
- [常见问题](#常见问题)

---

## 项目简介

**Office Console Enhanced** 是一套面向 [OpenClaw](https://github.com/openclaw/openclaw) 多 Agent 团队的办公增强控制台，提供统一的 Web 管理界面与后端适配层。

### 核心定位

- **目标用户**：有 AI 应用能力、愿意折腾、用 AI 提升效率的专业用户
- **主战场**：桌面端 Web 后台（最小宽度 1200px，PC 优先布局）
- **核心价值**：从「只能看」升级为「可写、可搜、可控制」的专业工具

### 解决的问题

| 痛点 | 解法 |
|------|------|
| Agent 状态散落在命令行 | 统一 Web 控制台，6 种精确状态实时展示 |
| 操作无留痕 | 完整审计日志 + Timeline 事件流 |
| 任务管理混乱 | Tasks 分区：读取、创建、状态变更 |
| 高危操作无保护 | 安全门控 DryRun（REQUIRE_DRYRUN_CONFIRM） |
| 飞书消息分散 | 铃铛通知中心，统一 ACK/Snooze |
| 成本不透明 | Token 归因、上下文压力图、预算告警 |

---

## 功能全景

### 控制台分区

| 分区 | 读取 | 写操作 | 搜索 | 实时 | 核心能力 |
|------|------|--------|------|------|----------|
| **Overview** | ✅ | — | — | ✅ SSE | 待办/异常聚合面板、全局状态一览 |
| **Agents** | ✅ 6 种状态 | — | ✅ | ✅ | working / idle / blocked / backlog / error / offline |
| **Tasks** | ✅ | ✅ POST/PATCH | ✅ | ✅ | 状态流转，写操作 Toast 反馈 |
| **Docs** | ✅ | — | ✅ | ✅ | 文件目录树，Markdown 渲染 |
| **Collaboration** | ✅ | — | ✅ | ✅ | 父子关系树，会话详情侧边栏（400px 滑动面板） |
| **Memory** | ✅ | ✅ Gate 保护 | ✅ | ✅ | workspace 文件查看与编辑 |
| **Usage** | ✅ | — | — | — | Token 归因，上下文压力图，成本估算 |
| **Settings** | ✅ | ✅ dry-run | — | — | Cron 健康，接线诊断，PM2 一键启动 |

### 全局增强能力

| 能力 | 说明 |
|------|------|
| **全站搜索**（搜索框 + `Cmd/Ctrl+K`） | 按 agent / 任务 / 会话分组展示结果 |
| **Toast 通知系统** | 4 种类型，右上角堆叠，自动消失，重写/搜索/SSE 事件接入 |
| **SSE 实时推送** | 指数退避重连（1→2→4→8→30s），页面可见性感知自动重连 |
| **铃铛通知中心** | 持久化通知，支持 ACK（已读）/ Snooze（稍后处理） |
| **Timeline 事件流** | 完整操作事件采集，支持按时间线回溯 |
| **审计日志** | 所有写操作落盘，可查询、可导出 |
| **安全门控 DryRun** | 高危操作需二次确认，环境变量 `REQUIRE_DRYRUN_CONFIRM=true` 开启 |
| **快照导出/导入** | 一键导出全量状态快照，支持跨环境还原 |
| **差量摘要** | 两次快照之间的变化 diff，自动生成摘要报告 |
| **预算告警** | 自定义阈值，超限飞书告警 + 铃铛通知 |
| **飞书告警扩展** | context 压力 ≥ 80%、agent 空闲超 2h，异步防重告警 |
| **明暗主题切换** | `data-theme` + `localStorage` 持久化 |
| **玻璃拟态视觉** | `backdrop-filter` 毛玻璃效果，Inspector 侧边栏三栏布局 |
| **设计 Token 系统** | 间距 4 级 / 字号 7 级 / 圆角 5 级 / 颜色 8 项 / 阴影 3 级 |
| **生产部署** | PM2 ecosystem 配置，一键启动/停止/日志查看 |

---

## 技术架构

```
┌─────────────────────────────────────────────────┐
│              浏览器（Web 控制台）                  │
│  index.html + app.js + style.css                 │
│  SSE 实时更新 | 全站搜索 | Toast | 铃铛通知中心     │
└─────────────────────┬───────────────────────────┘
                      │ HTTP / SSE
┌─────────────────────▼───────────────────────────┐
│           office-dashboard-adapter               │
│              Node.js + Express                   │
│                                                  │
│  Controllers  →  Services  →  Adapters           │
│  ├── agent          ├── usage-service            │
│  ├── tasks          ├── notification-service     │
│  ├── timeline       ├── budget-service           │
│  ├── notifications  ├── diff-service             │
│  ├── search         └── ...                      │
│  ├── snapshot                                    │
│  └── settings                                    │
│                                                  │
│  Cache Layer（分层 TTL + stale 降级）              │
└──────────────┬──────────────────────────────────┘
               │ Gateway API / CLI / 文件
┌──────────────▼──────────────────────────────────┐
│              OpenClaw Gateway                    │
│  :18789  |  openclaw gateway call ...            │
│  agents / sessions / config / tasks / memory     │
└─────────────────────────────────────────────────┘
```

### 技术栈

| 层次 | 技术 |
|------|------|
| 运行时 | Node.js v22 + TypeScript |
| Web 框架 | Express 4 |
| 前端 | 原生 HTML/CSS/JS（无前端框架依赖） |
| 实时通信 | Server-Sent Events (SSE) |
| 进程管理 | PM2 |
| 数据持久化 | 本地 JSON / NDJSON 文件 |

### 缓存策略

| 数据类型 | Fresh TTL | Stale TTL |
|----------|-----------|-----------|
| health | 15s | 60s |
| dashboard | 30s | 120s |
| agents | 60s | 300s |
| templates.list | 300s | 900s |

**降级逻辑**：
- Gateway 可用 → 返回实时数据
- Gateway 不可用 + stale 快照存在 → 返回 `200 + cached:true + stale:true + warning`
- Gateway 不可用 + 无快照 → 返回 `503 + error.code=GATEWAY_UNAVAILABLE`

---

## 快速开始

### 环境要求

- Node.js >= 18
- OpenClaw Gateway 运行在 `127.0.0.1:18789`（或自定义 `GATEWAY_BASE_URL`）

### 本地开发启动

```bash
# 克隆仓库
git clone https://github.com/dalimaoya/office-console-enhanced.git
cd office-console-enhanced

# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 生产模式
npm start
```

默认端口：**3014**

浏览器访问：`http://localhost:3014`

### 一键安装脚本（Linux）

```bash
bash <(curl -sL https://raw.githubusercontent.com/dalimaoya/office-console-enhanced/main/scripts/install.sh)
```

### 环境诊断

```bash
npm run diagnose
```

诊断脚本会检查：Node.js 版本、端口占用情况、Gateway 连通性、数据目录权限等。

---

## API 文档

### 基础路径

```
http://localhost:3014/api/v1/
```

> 当前版本不做认证。不需要 `Authorization` / `Bearer` / `JWT` 请求头。

### 响应格式

**成功**：
```json
{
  "success": true,
  "data": { ... }
}
```

**失败**：
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "描述信息"
  }
}
```

**stale 降级**：
```json
{
  "success": true,
  "data": { ... },
  "cached": true,
  "stale": true,
  "warning": { "type": "gateway_unreachable" }
}
```

### 核心接口列表

#### Dashboard & Overview
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/dashboard` | 控制台总览数据 |
| GET | `/api/v1/health` | 健康检查 |
| GET | `/api/v1/action-queue` | 待办/异常聚合 |

#### Agents
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/agents` | Agent 列表（含 6 种精确状态） |
| GET | `/api/v1/agents/:id` | 单个 Agent 详情 |

#### Tasks
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/tasks` | 任务列表 |
| POST | `/api/v1/tasks` | 创建任务 |
| PATCH | `/api/v1/tasks/:id` | 更新任务状态 |

#### Timeline & 审计
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/timeline` | 事件时间线 |
| GET | `/api/v1/events` | 操作事件日志 |

#### 通知中心
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/notifications` | 通知列表 |
| POST | `/api/v1/notifications/:id/ack` | 标记已读 |
| POST | `/api/v1/notifications/:id/snooze` | 稍后处理 |

#### 搜索
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/search?q=关键词` | 全站搜索（agents / tasks / sessions 分组） |

#### Memory & Docs
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/memory` | Memory 文件列表 |
| GET | `/api/v1/memory/:path` | 读取文件内容 |
| PUT | `/api/v1/memory/:path` | 写入文件（Gate 保护） |
| GET | `/api/v1/docs` | 文档目录树 |

#### Collaboration & Sessions
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/sessions` | 会话列表（含父子关系） |
| GET | `/api/v1/sessions/:id` | 会话详情（消息摘要） |

#### Usage & 预算
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/usage` | Token 用量归因 |
| GET | `/api/v1/usage/context-pressure` | 上下文压力指标 |
| GET | `/api/v1/budget/alerts` | 预算告警配置 |
| PUT | `/api/v1/budget/alerts` | 更新预算阈值 |

#### Settings & 系统
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/settings/wiring-status` | 接线状态诊断 |
| GET | `/api/v1/cron` | Cron 健康监控 |
| POST | `/api/v1/settings/dryrun` | 安全门控 DryRun 执行 |

#### 快照 & 差量
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/snapshot/export` | 导出全量状态快照 |
| POST | `/api/v1/snapshot/import` | 导入快照（还原） |
| GET | `/api/v1/snapshot/diff` | 生成差量摘要报告 |

#### 实时推送
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/events/stream` | SSE 实时事件流 |

---

## 前端功能说明

### 全站搜索

- 点击搜索框 或 按 `Cmd/Ctrl+K` 打开搜索面板
- 结果按 agent / 任务 / 会话三组展示
- 支持键盘方向键导航 + `Enter` 确认

### 实时更新（SSE）

- 自动建立 SSE 长连接，服务端推送状态变更
- 断线后指数退避重连：1s → 2s → 4s → 8s → 30s（上限）
- 页面不可见时暂停重连，页面重新可见后立即恢复

### 通知中心

- 右上角铃铛图标显示未读数
- 点击展开通知列表
- 每条通知可独立 ACK（已读）或 Snooze（8小时后提醒）

### 主题切换

- 右上角切换明/暗主题
- 偏好自动保存到 `localStorage`，刷新后保持

### Inspector 侧边栏

- 三栏布局：导航栏 | 内容区 | Inspector 面板
- 1280~1399px：Inspector 可手动展开/收起
- ≥1400px：Inspector 默认展开
- 点击 Agent/Task/Session 条目自动打开对应详情

### 快照导出

- Settings 页点击「导出快照」按钮
- 下载包含当前全量状态的 JSON 文件
- 可在其他环境通过「导入快照」按钮还原

---

## 配置说明

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3014` | 服务监听端口 |
| `GATEWAY_BASE_URL` | `http://127.0.0.1:18789` | OpenClaw Gateway 地址 |
| `REQUIRE_DRYRUN_CONFIRM` | `false` | 开启安全门控 DryRun |
| `MOCK_GATEWAY_MODE` | — | `offline` 模拟 Gateway 离线（用于测试） |
| `MOCK_CONFIG_APPLY_FAILURE` | — | `verify-hook` 强制触发 apply 失败（QA 用） |

### 配置文件

```
src/config/
├── index.ts          # 全局配置入口
└── templates/        # 配置模板目录（YAML）
```

---

## 生产部署（PM2）

### 安装 PM2

```bash
npm install -g pm2
```

### 启动

```bash
npm run start:pm2
# 等同于: pm2 start ecosystem.config.js
```

### 查看日志

```bash
npm run logs:pm2
# 等同于: pm2 logs office-console
```

### 停止

```bash
npm run stop:pm2
# 等同于: pm2 stop office-console
```

### ecosystem.config.js 说明

```js
// 关键配置项
{
  name: 'office-console',
  script: 'src/server.ts',
  interpreter: 'tsx',
  watch: false,             // 生产环境关闭热重载
  max_memory_restart: '512M',
  env: {
    NODE_ENV: 'production',
    PORT: 3014
  }
}
```

### 设置开机自启

```bash
pm2 startup
pm2 save
```

---

## 测试与验证

### 运行验证脚本

```bash
npm run verify
```

验证脚本覆盖：

- ✅ 成功响应使用 `{ success, data }` 格式
- ✅ agents stale 降级：本地快照 + `MOCK_GATEWAY_MODE=offline` 稳定复现
- ✅ `AGENT_NOT_FOUND`：不存在的 `targetAgentId` 触发
- ✅ `TEMPLATE_INVALID`：非白名单字段模板触发
- ✅ `TEMPLATE_APPLY_FAILED`：`MOCK_CONFIG_APPLY_FAILURE` 钩子触发

### 安全性验证

```bash
npm run verify-security
```

### 基准测试

```bash
npm run benchmark
```

### 手动复现 stale 降级

```bash
# 以 Gateway 离线模式启动
MOCK_GATEWAY_MODE=offline npm start
# 访问 /api/v1/agents，应返回 200 + stale:true
curl http://localhost:3014/api/v1/agents
```

### 手动复现 apply 失败

```bash
MOCK_CONFIG_APPLY_FAILURE=verify-hook npm start
# 对任意合法模板执行 apply，返回 500 + TEMPLATE_APPLY_FAILED
```

---

## 数据目录说明

```
data/
├── cache-snapshots.json     # 各接口缓存快照（stale 降级数据源）
├── cold-start-snapshot.json # 冷启动快照（首次可用数据）
├── events.ndjson            # SSE 事件日志（NDJSON 格式，逐行追加）
├── operation-audit.log      # 写操作审计日志
└── timeline.log             # Timeline 事件流日志
```

> **注意**：`data/` 目录为运行时产物，不建议手动修改。如需迁移环境，使用快照导出/导入功能。

---

## 常见问题

**Q：控制台页面显示 "Gateway 不可用"？**

A：检查 OpenClaw Gateway 是否正在运行：
```bash
openclaw gateway status
# 若未运行，启动它：
openclaw gateway start
```

**Q：端口 3014 被占用？**

A：通过环境变量修改端口：
```bash
PORT=3015 npm start
```

**Q：如何查看历史操作记录？**

A：在控制台点击左侧「Timeline」分区，或直接查看 `data/timeline.log` 和 `data/operation-audit.log`。

**Q：预算告警如何配置？**

A：在控制台「Usage」页面的「预算告警」卡片中设置阈值，或通过 API：
```bash
curl -X PUT http://localhost:3014/api/v1/budget/alerts \
  -H "Content-Type: application/json" \
  -d '{"dailyTokenLimit": 100000, "notifyOnExceed": true}'
```

**Q：如何开启 DryRun 安全保护？**

A：设置环境变量后重启服务：
```bash
REQUIRE_DRYRUN_CONFIRM=true npm start
```
开启后，所有写操作（任务创建/状态变更/配置应用）会先执行 dry-run 预检，展示影响范围后等待用户二次确认。

---

## 项目结构

```
office-dashboard-adapter/
├── src/
│   ├── server.ts           # 服务入口
│   ├── app.ts              # Express 应用配置
│   ├── controllers/        # 路由控制器（25+个）
│   ├── services/           # 业务逻辑层
│   ├── adapters/           # Gateway 适配层
│   ├── cache/              # 缓存层（分层 TTL）
│   ├── middleware/         # 中间件（审计、安全门控）
│   ├── routes/             # 路由注册
│   ├── dto/                # 数据传输对象类型定义
│   ├── types/              # 全局类型定义
│   ├── utils/              # 工具函数
│   ├── public/             # 前端静态文件
│   │   ├── index.html      # 控制台主页面
│   │   ├── app.js          # 前端逻辑
│   │   └── style.css       # 样式（含设计 Token）
│   └── templates/          # 配置模板
├── data/                   # 运行时数据（缓存/日志/快照）
├── scripts/                # 辅助脚本（安装/诊断/卸载）
├── reviews/                # 阶段性评审文档
├── ecosystem.config.js     # PM2 生产配置
├── ecosystem.config.cjs    # PM2 CJS 兼容配置
├── package.json
└── tsconfig.json
```

---

## License

Private — 内部项目，暂未开源。

---

*由「办公增强控制台执行团队」构建 · 提莫队长统筹 · 多 Agent 协作产出*
