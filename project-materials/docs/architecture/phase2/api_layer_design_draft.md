# 办公增强控制台API层设计草案
> 第二阶段架构收敛 - API层详细设计（针对聚合API层方案）

## 1. API层概述

### 1.1 API层定位
API层是办公增强控制台的核心中间层，负责：
- 前端请求路由和响应适配
- OpenClaw系统API的适配和聚合
- 业务逻辑处理和状态管理
- 监控、日志和错误处理

### 1.2 设计原则

1. **一致性原则**：
   - 所有API采用统一响应格式
   - 错误处理方式一致
   - 认证和授权机制统一

2. **适配性原则**：
   - 将OpenClaw原始API转换为前端友好格式
   - 屏蔽后端复杂度，提供稳定接口

3. **聚合性原则**：
   - 支持多个API调用合并为单个请求
   - 减少前端请求次数
   - 提供业务场景优化的响应结构

4. **监控可观测性**：
   - 所有API调用都有完整日志
   - 性能指标监控
   - 错误跟踪和告警

## 2. API层架构设计

### 2.1 整体架构

```
┌──────────────────────────────────────────────┐
│                前端层 (Frontend)             │
│  • React + TypeScript                       │
│  • Zustand状态管理                          │
│  • Axios HTTP客户端                         │
└────────────────────────┬─────────────────────┘
                         │ HTTP/HTTPS (REST API)
┌────────────────────────┴─────────────────────┐
│            聚合API层 (API Gateway)            │
│  ┌─────────────────────────────────────────┐ │
│  │         路由和分发层 (Router)            │ │
│  │  • URL路由匹配                         │ │
│  │  • 请求参数解析                        │ │
│  │  • 中间件管道                          │ │
│  └────────────────┬────────────────────────┘ │
│                   │                          │
│  ┌────────────────┴────────────────────────┐ │
│  │         业务逻辑层 (Services)           │ │
│  │  • OpenClaw适配器                      │ │
│  │  • 数据聚合器                          │ │
│  │  • 缓存管理器                          │ │
│  │  • 状态同步器                          │ │
│  └────────────────┬────────────────────────┘ │
│                   │                          │
│  ┌────────────────┴────────────────────────┐ │
│  │        数据仓库层 (Repositories)        │ │
│  │  • OpenClaw API客户端                   │ │
│  │  • 本地数据库连接器                     │ │
│  │  • 缓存存储                             │ │
│  └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 2.2 核心组件职责

| 组件 | 职责 | 实现技术 |
|------|------|----------|
| **中间件层** | 认证、日志、限流、请求解析 | Express Middleware |
| **控制器层** | 接收请求、调用服务、返回响应 | Express Router |
| **服务层** | 业务逻辑、数据聚合、缓存策略 | TypeScript Classes |
| **适配器层** | OpenClaw API调用和适配 | Axios + 适配器模式 |
| **存储层** | 本地状态存储、缓存管理 | Redis/内存缓存 |

## 3. API设计规范

### 3.1 通用响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {
    // 实际业务数据
  },
  "meta": {
    "timestamp": "2026-03-13T10:30:00Z",
    "request_id": "req_123456",
    "version": "1.0"
  }
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERR_INVALID_INPUT",
    "message": "输入参数无效",
    "details": {
      "field": "model_name",
      "reason": "不能为空"
    }
  },
  "meta": {
    "timestamp": "2026-03-13T10:30:00Z",
    "request_id": "req_123456",
    "version": "1.0"
  }
}
```

### 3.2 错误码规范

#### 错误码分类
```
1xxx: 认证和授权错误
2xxx: 输入验证错误  
3xxx: 业务逻辑错误
4xxx: OpenClaw系统错误
5xxx: 内部系统错误
```

#### 常用错误码
```typescript
const ErrorCodes = {
  // 认证相关
  AUTH_INVALID_TOKEN: '1001',
  AUTH_TOKEN_EXPIRED: '1002',
  AUTH_PERMISSION_DENIED: '1003',
  
  // 输入验证
  VALIDATION_REQUIRED: '2001',
  VALIDATION_INVALID_FORMAT: '2002',
  VALIDATION_OUT_OF_RANGE: '2003',
  
  // 业务逻辑
  BUSINESS_AGENT_NOT_FOUND: '3001',
  BUSINESS_TASK_NOT_FOUND: '3002',
  BUSINESS_CONFIG_INVALID: '3003',
  
  // OpenClaw系统
  OPENCLAW_CONNECTION_FAILED: '4001',
  OPENCLAW_API_ERROR: '4002',
  OPENCLAW_AGENT_UNAVAILABLE: '4003',
  
  // 内部错误
  INTERNAL_SERVER_ERROR: '5001',
  INTERNAL_DATABASE_ERROR: '5002',
  INTERNAL_CACHE_ERROR: '5003'
}
```

## 4. API端点设计

### 4.1 健康检查API

#### GET /health
检查API层健康状态

**响应示例**：
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2026-03-13T10:30:00Z",
    "uptime_seconds": 86400,
    "services": {
      "openclaw": "connected",
      "cache": "connected",
      "database": "connected"
    }
  }
}
```

### 4.2 首页聚合API

#### GET /api/v1/summary
获取首页所需的所有聚合数据

**请求示例**：
```json
GET /api/v1/summary
```

**响应结构**：
```json
{
  "success": true,
  "data": {
    "config_summary": {
      "model": {
        "configured": true,
        "tested": true,
        "provider": "kimi",
        "model_name": "kimi-latest"
      },
      "feishu": {
        "configured": false,
        "tested": false
      },
      "browser": {
        "available": true
      },
      "workspace": {
        "writable": true,
        "path": "/path/to/workspace"
      }
    },
    "agent_summary": {
      "total_count": 4,
      "available_count": 3,
      "agents": [
        {
          "id": "console_agent",
          "name": "Console Agent",
          "status": "available",
          "description": "控制台中枢解释层"
        }
        // ...其他Agent
      ]
    },
    "task_summary": {
      "total_today": 5,
      "failed_today": 1,
      "running_now": 1,
      "current_tasks": [
        {
          "id": "task_001",
          "name": "生成部署指南",
          "agent_name": "文档初稿助手",
          "status": "running",
          "progress_percentage": 60,
          "current_step": "正在生成正文"
        }
      ]
    },
    "console_agent_suggestions": {
      "current_summary": "模型已连接，浏览器正常，飞书未配置。",
      "priority_problems": [
        {
          "id": "feishu_not_configured",
          "title": "飞书未配置",
          "description": "飞书知识助手当前不可用",
          "severity": "high",
          "suggested_action": {
            "type": "goto_config",
            "target": "feishu",
            "label": "去配置飞书"
          }
        }
      ],
      "recommended_next": {
        "title": "完整飞书配置",
        "description": "建议先完成飞书配置，然后体验飞书知识助手",
        "action": {
          "type": "start_guide",
          "guide_id": "feishu_setup",
          "label": "开始配置指南"
        }
      },
      "recent_updates": [
        "新增：文档初稿助手已支持需求规格说明书模板",
        "优化：Console Agent建议准确度提升"
      ]
    },
    "diagnostics_summary": {
      "errors_last_24h": 2,
      "warnings_last_24h": 5,
      "critical_errors": [
        {
          "id": "error_001",
          "type": "MODEL_CONNECTION_ERROR",
          "title": "模型连接失败",
          "occurred_at": "2026-03-13T09:15:00Z"
        }
      ]
    }
  }
}
```

### 4.3 Agent管理API

#### GET /api/v1/agents
获取Agent列表

**请求参数**：
```json
{
  "status": "available",  // 可选：available, needs_config, disabled
  "category": "document" // 可选：document, knowledge, browser, etc.
}
```

**响应结构**：
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "doc_draft",
        "name": "文档初稿助手",
        "description": "快速生成结构化文档初稿",
        "category": "document",
        "status": "available",
        "prerequisites": ["model"],
        "input_schema": [
          {
            "field": "topic",
            "type": "string",
            "required": true,
            "description": "文档主题"
          },
          {
            "field": "template",
            "type": "string",
            "required": false,
            "default": "default",
            "description": "模板类型"
          }
        ],
        "last_run": {
          "task_id": "task_001",
          "status": "completed",
          "finished_at": "2026-03-13T09:30:00Z",
          "result_summary": "生成了部署指南初稿"
        }
      },
      {
        "id": "feishu_knowledge",
        "name": "飞书知识助手",
        "description": "整理内容并写入飞书知识空间",
        "category": "knowledge",
        "status": "needs_config",
        "prerequisites": ["model", "feishu"],
        "missing_prerequisites": ["feishu"],
        "input_schema": [
          {
            "field": "content",
            "type": "string",
            "required": true,
            "description": "要写入的内容"
          }
        ],
        "last_run": null
      }
    ],
    "total_count": 2,
    "available_count": 1
  }
}
```

#### POST /api/v1/agents/{agent_id}/run
启动Agent任务

**请求示例**：
```json
{
  "input": {
    "topic": "智慧园区部署教程",
    "template": "deployment_guide"
  },
  "options": {
    "timeout_seconds": 300,
    "notify_on_complete": true
  }
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "task_id": "task_002",
    "agent_id": "doc_draft",
    "agent_name": "文档初稿助手",
    "status": "pending",
    "created_at": "2026-03-13T10:30:00Z",
    "estimated_duration_seconds": 120,
    "progress_url": "/api/v1/tasks/task_002"
  }
}
```

### 4.4 任务管理API

#### GET /api/v1/tasks
获取任务列表

**请求参数**：
```json
{
  "status": "failed",      // 可选：pending, running, completed, failed
  "agent_id": "doc_draft", // 可选
  "limit": 50,            // 可选，默认50
  "offset": 0,            // 可选，默认0
  "from_date": "2026-03-01", // 可选
  "to_date": "2026-03-13"   // 可选
}
```

#### GET /api/v1/tasks/{task_id}
获取任务详情

**响应示例**：
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "task_002",
      "name": "生成智慧园区部署教程",
      "agent_id": "doc_draft",
      "agent_name": "文档初稿助手",
      "status": "running",
      "created_at": "2026-03-13T10:30:00Z",
      "started_at": "2026-03-13T10:30:05Z",
      "finished_at": null,
      "progress_percentage": 60,
      "time_elapsed_seconds": 120,
      "input_summary": {
        "topic": "智慧园区部署教程",
        "template": "deployment_guide"
      }
    },
    "steps": [
      {
        "id": "step_1",
        "name": "解析输入要求",
        "status": "completed",
        "started_at": "2026-03-13T10:30:05Z",
        "finished_at": "2026-03-13T10:30:30Z",
        "duration_seconds": 25,
        "result_summary": "识别为部署指南类型"
      },
      {
        "id": "step_2",
        "name": "收集参考材料",
        "status": "completed",
        "started_at": "2026-03-13T10:30:30Z",
        "finished_at": "2026-03-13T10:31:00Z",
        "duration_seconds": 30,
        "result_summary": "找到3个相关示例"
      },
      {
        "id": "step_3",
        "name": "生成章节结构",
        "status": "completed",
        "started_at": "2026-03-13T10:31:00Z",
        "finished_at": "2026-03-13T10:31:45Z",
        "duration_seconds": 45,
        "result_summary": "生成6个章节结构"
      },
      {
        "id": "step_4",
        "name": "撰写正文内容",
        "status": "running",
        "started_at": "2026-03-13T10:31:45Z",
        "finished_at": null,
        "duration_seconds": 20,
        "current_substep": "撰写第3章",
        "progress_percentage": 40
      },
      {
        "id": "step_5",
        "name": "格式化和保存",
        "status": "pending",
        "started_at": null,
        "finished_at": null
      }
    ],
    "recent_activity": [
      {
        "timestamp": "2026-03-13T10:31:45Z",
        "message": "开始撰写正文内容",
        "level": "info"
      },
      {
        "timestamp": "2026-03-13T10:31:30Z",
        "message": "章节结构生成完成",
        "level": "info"
      },
      {
        "timestamp": "2026-03-13T10:31:00Z",
        "message": "参考材料收集完成",
        "level": "info"
      }
    ],
    "estimated_time_remaining_seconds": 80,
    "result": null
  }
}
```

#### POST /api/v1/tasks/{task_id}/retry
重试失败的任务

#### POST /api/v1/tasks/{task_id}/cancel
取消正在运行的任务（可选）

### 4.5 配置管理API

#### GET /api/v1/config/summary
获取配置摘要

#### POST /api/v1/config/model
保存模型配置

**请求示例**：
```json
{
  "provider": "kimi",
  "api_key": "sk-abc123",
  "base_url": "https://api.moonshot.cn/v1",
  "model_name": "kimi-latest"
}
```

#### POST /api/v1/config/model/test
测试模型连接

#### POST /api/v1/config/sync
同步配置到OpenClaw系统

### 4.6 监控和诊断API

#### GET /api/v1/diagnostics/summary
获取诊断摘要

#### GET /api/v1/diagnostics/errors
获取错误列表

#### POST /api/v1/diagnostics/errors/{error_id}/resolve
标记错误为已解决

### 4.7 WebSocket实时更新接口

#### WebSocket连接
```
WebSocket URL: ws://{host}/ws/v1/events
```

#### 订阅消息（客户端 → 服务器）
```json
{
  "action": "subscribe",
  "subscriptions": ["tasks", "agents", "config", "errors"],
  "client_id": "frontend_001"
}
```

#### 事件消息（服务器 → 客户端）
```json
{
  "type": "task_status_update",
  "event_id": "event_123",
  "timestamp": "2026-03-13T10:35:00Z",
  "payload": {
    "task_id": "task_002",
    "new_status": "running",
    "previous_status": "pending",
    "progress_percentage": 10,
    "current_step": "解析输入要求"
  }
}
```

## 5. OpenClaw适配器设计

### 5.1 适配器模式设计

```typescript
// OpenClaw适配器接口
interface OpenClawAdapter {
  // Agent相关
  listAgents(): Promise<RawAgent[]>
  getAgent(agentId: string): Promise<RawAgent>
  runAgent(agentId: string, input: any): Promise<RawTask>
  
  // 任务相关
  listTasks(params: TaskQueryParams): Promise<RawTask[]>
  getTask(taskId: string): Promise<RawTask>
  getTaskLogs(taskId: string): Promise<RawTaskLog[]>
  
  // 配置相关
  getModelConfig(): Promise<RawModelConfig>
  setModelConfig(config: ModelConfig): Promise<void>
  testModelConnection(config: ModelConfig): Promise<TestResult>
  
  // 工具相关
  checkBrowserAvailability(): Promise<BrowserCheckResult>
  testFeishuConnection(config: FeishuConfig): Promise<FeishuTestResult>
}

// 实现类（隐藏OpenClaw的API细节）
class OpenClawHttpAdapter implements OpenClawAdapter {
  private baseUrl: string
  private token: string
  
  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl
    this.token = token
  }
  
  async listAgents(): Promise<RawAgent[]> {
    // 调用OpenClaw的原始API，并转换格式
    const response = await this.request('GET', '/api/agents')
    return this.transformAgents(response.data)
  }
  
  private async request(method: string, path: string, data?: any) {
    // 统一的请求处理，包括错误处理、重试等
  }
  
  private transformAgents(rawAgents: any): RawAgent[] {
    // 转换OpenClaw原始数据到内部格式
  }
}
```

### 5.2 数据转换示例

#### OpenClaw原始响应 → 聚合层内部格式
```typescript
// OpenClaw原始Agent响应
const rawOpenClawAgent = {
  agent_id: "feishu-knowledge-assistant",
  name: "飞书知识助手",
  enabled: true,
  health: "normal",
  last_executed: "2026-03-13T09:30:00Z"
}

// 转换后内部格式
const internalAgent = {
  id: "feishu_knowledge",
  name: "飞书知识助手",
  status: "available",
  health_details: {
    last_executed: "2026-03-13T09:30:00Z",
    enabled: true
  }
}
```

## 6. 缓存策略设计

### 6.1 缓存层次设计

| 缓存级别 | 缓存方式 | 有效期 | 适用场景 |
|----------|----------|--------|----------|
| **内存缓存** | 内存对象缓存 | 5-30分钟 | 频繁访问的热点数据 |
| **Redis缓存** | Redis分布式缓存 | 30分钟-24小时 | 跨进程共享数据 |
| **持久化缓存** | 本地文件存储 | 长期 | 配置、模板等静态数据 |

### 6.2 具体缓存策略

#### Agent列表缓存
- **缓存位置**：内存缓存
- **有效期**：5分钟
- **刷新时机**：Agent状态变化时
- **缓存键**：`agents:list:${timestamp}`

#### 任务状态缓存  
- **缓存位置**：Redis缓存
- **有效期**：1分钟（高频刷新）
- **刷新时机**：WebSocket事件触发
- **缓存键**：`task:${task_id}:status`

#### 配置数据缓存
- **缓存位置**：持久化缓存
- **有效期**：用户修改时失效
- **刷新时机**：配置修改时
- **缓存键**：`config:${config_type}`

## 7. 监控和日志设计

### 7.1 结构化日志格式

```json
{
  "timestamp": "2026-03-13T10:30:00Z",
  "level": "info",
  "message": "Agent任务启动成功",
  "request_id": "req_123456",
  "user_id": "user_001",
  "component": "agent_service",
  "context": {
    "agent_id": "doc_draft",
    "task_id": "task_002",
    "input_summary": "部署指南生成"
  },
  "metrics": {
    "duration_ms": 120,
    "memory_mb": 256
  }
}
```

### 7.2 监控指标

| 指标类型 | 指标名称 | 描述 |
|----------|----------|------|
| **性能指标** | `api_request_duration_seconds` | API请求响应时间 |
| **业务指标** | `agent_run_total` | Agent执行总数 |
| **业务指标** | `task_completion_rate` | 任务完成率 |
| **系统指标** | `server_memory_usage_bytes` | 内存使用量 |
| **系统指标** | `openclaw_connection_status` | OpenClaw连接状态 |

## 8. 安全性设计

### 8.1 认证机制

#### 令牌设计
```typescript
interface AuthToken {
  // JWT令牌结构
  userId: string
  sessionId: string
  permissions: string[]
  issuedAt: number
  expiresAt: number
  app: 'office_console_v1'
}
```

#### 令牌获取流程
1. 前端从本地存储获取令牌
2. 如无令牌，向OpenClaw申请令牌
3. 令牌过期时自动刷新
4. 所有API调用携带令牌

### 8.2 授权控制

#### 权限模型
```typescript
enum Permission {
  AGENT_RUN = 'agent:run',
  AGENT_MANAGE = 'agent:manage',
  CONFIG_READ = 'config:read',
  CONFIG_WRITE = 'config:write',
  TASK_VIEW_ALL = 'task:view_all',
  TASK_VIEW_OWN = 'task:view_own'
}
```

### 8.3 API安全措施

1. **HTTPS强制**：生产环境强制使用HTTPS
2. **请求限流**：防止API滥用
3. **输入验证**：所有输入参数严格验证
4. **SQL注入防护**：使用参数化查询
5. **CORS配置**：限制跨域访问源
6. **安全头设置**：Helmet中间件提供基础防护

## 9. 部署架构

### 9.1 部署模式选择

#### 模式A：本地独立部署（MVP推荐）
```
用户桌面 → Tauri App(本地) → 聚合API层(本地) → OpenClaw(本地)
```

#### 模式B：服务端部署（未来可选）
```
用户浏览器 → 静态前端(CDN) → 聚合API层(服务器) → OpenClaw(服务器)
```

### 9.2 部署配置示例

```yaml
# config/default.yml
server:
  port: 3000
  host: localhost
  
openclaw:
  base_url: http://localhost:9090
  token: ${OPENCLAW_TOKEN}
  
security:
  jwt_secret: ${JWT_SECRET}
  token_expiry_hours: 24
  
cache:
  redis_url: redis://localhost:6379
  memory_cache_ttl_minutes: 5
  
logging:
  level: info
  format: json
  
monitoring:
  enabled: true
  prometheus_path: /metrics
```

## 10. 实施路线图

### 阶段一：基础框架搭建（第1周）
- [ ] Express基础项目结构
- [ ] 中间件框架（认证、日志、错误处理）
- [ ] 基础路由和控制器
- [ ] 健康检查API实现

### 阶段二：核心适配器开发（第2周）
- [ ] OpenClaw适配器实现
- [ ] Agent相关API实现
- [ ] 任务相关API实现
- [ ] 基础缓存策略

### 阶段三：聚合能力开发（第3周）
- [ ] 首页摘要聚合API
- [ ] Console Agent建议引擎
- [ ] 配置同步机制
- [ ] WebSocket实时更新

### 阶段四：优化和监控（第4周）
- [ ] 性能监控集成
- [ ] 错误处理和重试机制
- [ ] 安全加固
- [ ] 文档和测试

---
*设计草案版本：V1.0*
*更新时间：2026-03-13*
*更新人：Architect-Jax*
*状态：已完成API层详细设计，待评审*