# 办公控制台增强项目 MVP API Contract（对齐版）

## 文档信息
- **文档名**：Office Dashboard MVP API Contract
- **版本**：v1.1-aligned
- **更新时间**：2026-03-14
- **对齐依据**：
  1. `briefs/2026-03-14-mvp-scope-brief-ekko.md`
  2. `handoffs/2026-03-14-mvp-design-constraints-jax.md`
  3. `handoffs/2026-03-14-mvp-backend-execution-leona.md`
  4. `decisions/2026-03-14-cache-fallback-decision.md`
- **状态**：已按当前 MVP 基线收口，供前后端联调使用

---

## 1. 适用范围

本契约仅覆盖当前 MVP 必实现接口：

| 接口 | 方法 | 用途 |
|------|------|------|
| `/api/v1/dashboard` | GET | 状态总览首页聚合数据 |
| `/api/v1/agents` | GET | Agent 列表与状态 |
| `/api/v1/config/templates` | GET | 配置模板列表 |
| `/api/v1/config/templates/:id` | GET | 单模板详情与只读预览 |
| `/api/v1/config/templates/:id/apply` | POST | 将模板应用到指定 Agent |
| `/api/v1/health` | GET | 本地服务与 Gateway 健康检查 |

**MVP 明确不包含：**
- JWT / Bearer 认证
- WebSocket 实时推送
- 自动轮询/后台异步刷新
- Agent 详情接口
- 模板编辑、版本控制、回滚
- 环境诊断、Skill 管理、飞书配置等非 MVP 接口

---

## 2. 全局契约约束

### 2.1 路径与版本
- 统一使用 **`/api/v1/*`** 前缀。
- MVP 不做版本协商，仅通过路径做版本区分。

### 2.2 认证约束
- **MVP 不做认证。**
- 请求头中 **不要求** `Authorization: Bearer ...`。
- 若后续版本引入认证，应通过新决策与新版本契约补充，不回写到当前 MVP 契约。

### 2.3 统一响应格式

所有接口必须使用统一包装格式，无例外。

#### 成功响应
```json
{
  "success": true,
  "data": {}
}
```

#### 失败响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "detail": "Optional detail"
  }
}
```

### 2.4 缓存降级规则

依据 `decisions/2026-03-14-cache-fallback-decision.md`：

1. **Gateway 不可用 + 有缓存** → 返回 `200 OK`
```json
{
  "success": true,
  "data": {},
  "cached": true,
  "stale": true,
  "warning": {
    "type": "gateway_unreachable",
    "message": "使用最近一次缓存数据，Gateway 当前不可用"
  }
}
```

2. **Gateway 不可用 + 无缓存** → 返回 `503`
```json
{
  "success": false,
  "error": {
    "code": "GATEWAY_UNAVAILABLE",
    "message": "Unable to connect to OpenClaw Gateway"
  }
}
```

3. **禁止** `503 + cachedData` 混合模式。
4. 前端应以 `stale: true` 进入降级展示流，而不是错误流。

### 2.5 缓存 TTL 基线

| 数据类型 | TTL |
|----------|-----|
| dashboard | 30s |
| agents | 60s |
| templates.list | 300s |
| health | 15s |

### 2.6 请求刷新模式
- MVP 仅支持**用户手动刷新**触发重新请求。
- 本契约**不要求**服务端后台异步刷新，也不要求前端自动轮询。

### 2.7 错误码最小集

| code | HTTP | 说明 |
|------|------|------|
| `BAD_REQUEST` | 400 | 参数缺失或格式错误 |
| `TEMPLATE_NOT_FOUND` | 404 | 模板不存在 |
| `AGENT_NOT_FOUND` | 404 | 目标 Agent 不存在 |
| `TEMPLATE_INVALID` | 422 | 模板 YAML 非法或缺字段 |
| `GATEWAY_UNAVAILABLE` | 503 | Gateway 不可达且无缓存 |
| `GATEWAY_TIMEOUT` | 504 | Gateway 超时且无缓存 |
| `TEMPLATE_APPLY_FAILED` | 500 | 模板应用执行失败 |
| `INTERNAL_ERROR` | 500 | 未归类内部错误 |

---

## 3. 接口定义

## 3.1 GET `/api/v1/dashboard`

### 目的
提供办公控制台首页聚合数据，支撑 MVP 单一总览页。

### 请求
```http
GET /api/v1/dashboard
Accept: application/json
```

### 成功响应示例（fresh 或普通命中）
```json
{
  "success": true,
  "data": {
    "system": {
      "status": "normal",
      "uptime": "12h 34m",
      "version": "OpenClaw v1.x.x",
      "lastCheck": "2026-03-14T00:10:00Z",
      "performance": {
        "avgResponseMs": 1200,
        "health": "healthy"
      }
    },
    "agents": {
      "total": 7,
      "active": 5,
      "statusBreakdown": {
        "normal": 3,
        "warning": 2,
        "error": 1,
        "unknown": 1
      },
      "quickStats": [
        {
          "name": "Task Success Rate",
          "value": "94%",
          "trend": "stable"
        },
        {
          "name": "Avg Response Time",
          "value": "1.2s",
          "trend": "improving"
        }
      ]
    },
    "workspaces": {
      "activeCount": 3,
      "recentActivity": [
        {
          "name": "Project Alpha",
          "status": "active",
          "agentCount": 2,
          "lastUpdated": "5 min ago"
        }
      ]
    },
    "alerts": [
      {
        "level": "warning",
        "type": "agent_health",
        "message": "Agent 'doc-processor' response time elevated",
        "suggestion": "Check recent task load",
        "timestamp": "2026-03-14T00:05:00Z"
      }
    ]
  },
  "cached": true
}
```

### 降级响应示例（Gateway 不可用但有缓存）
```json
{
  "success": true,
  "data": {
    "system": {
      "status": "warning",
      "uptime": "12h 34m",
      "version": "OpenClaw v1.x.x",
      "lastCheck": "2026-03-14T00:10:00Z",
      "performance": {
        "avgResponseMs": 1200,
        "health": "degrading"
      }
    },
    "agents": {
      "total": 7,
      "active": 5,
      "statusBreakdown": {
        "normal": 3,
        "warning": 2,
        "error": 1,
        "unknown": 1
      },
      "quickStats": []
    },
    "workspaces": {
      "activeCount": 3,
      "recentActivity": []
    },
    "alerts": []
  },
  "cached": true,
  "stale": true,
  "warning": {
    "type": "gateway_unreachable",
    "message": "使用最近一次缓存数据，Gateway 当前不可用"
  }
}
```

### 失败响应示例
```json
{
  "success": false,
  "error": {
    "code": "GATEWAY_UNAVAILABLE",
    "message": "Unable to connect to OpenClaw Gateway"
  }
}
```

### 字段说明
- `system`：系统整体状态与基础性能信息
- `agents`：Agent 数量、状态分布和简化统计
- `workspaces`：工作空间/配置侧的简化活动信息
- `alerts`：面向办公用户的异常摘要，不暴露底层技术细节
- `cached`：当前响应是否来自缓存
- `stale`：当前缓存是否已进入降级态

---

## 3.2 GET `/api/v1/agents`

### 目的
提供 Agent 列表与基础状态，供总览页或配置选择器使用。

### 请求
```http
GET /api/v1/agents
```

### 成功响应示例
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "agent-backend-leona",
        "name": "backend-leona",
        "status": "normal",
        "lastActive": "2026-03-14T05:30:00Z",
        "summaryTags": ["backend", "available"]
      }
    ],
    "total": 1
  },
  "cached": false
}
```

### 降级规则
- Gateway 不可用且有缓存：`200 + success:true + cached:true + stale:true`
- Gateway 不可用且无缓存：`503 + success:false`

---

## 3.3 GET `/api/v1/config/templates`

### 目的
返回 5 个预置模板的卡片列表。

### 请求
```http
GET /api/v1/config/templates
```

### 成功响应示例
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "doc-processor",
        "name": "文档处理助手",
        "description": "聚焦 docx/pdf 转换",
        "version": "1.0.0",
        "category": "office"
      },
      {
        "id": "collab-assistant",
        "name": "协作沟通助手",
        "description": "飞书文档/表格协同",
        "version": "1.0.0",
        "category": "office"
      },
      {
        "id": "office-basic",
        "name": "基础办公助手",
        "description": "通用办公技能组合",
        "version": "1.0.0",
        "category": "office"
      },
      {
        "id": "tech-bridge",
        "name": "技术对接助手",
        "description": "技术类技能组合",
        "version": "1.0.0",
        "category": "tech"
      },
      {
        "id": "blank",
        "name": "空模板",
        "description": "用户自定义起点",
        "version": "1.0.0",
        "category": "starter"
      }
    ],
    "total": 5
  },
  "cached": true
}
```

### 说明
- 数据源为本地 YAML 模板文件。
- 该接口返回**元信息列表**，不返回完整配置体。

---

## 3.4 GET `/api/v1/config/templates/:id`

### 目的
返回单个模板详情与只读 YAML 预览。

### 请求
```http
GET /api/v1/config/templates/office-basic
```

### 成功响应示例
```json
{
  "success": true,
  "data": {
    "id": "office-basic",
    "name": "基础办公助手",
    "description": "通用办公技能组合",
    "version": "1.0.0",
    "category": "office",
    "config": {
      "skills": [],
      "model": {}
    },
    "rawYaml": "id: office-basic\nname: 基础办公助手\n..."
  }
}
```

### 失败响应示例
```json
{
  "success": false,
  "error": {
    "code": "TEMPLATE_NOT_FOUND",
    "message": "Template 'office-basic' not found"
  }
}
```

---

## 3.5 POST `/api/v1/config/templates/:id/apply`

### 目的
将模板应用到指定 Agent。

### 请求
```http
POST /api/v1/config/templates/office-basic/apply
Content-Type: application/json
```

```json
{
  "targetAgentId": "agent-backend-leona"
}
```

### 成功响应示例
```json
{
  "success": true,
  "data": {
    "templateId": "office-basic",
    "targetAgentId": "agent-backend-leona",
    "appliedAt": "2026-03-14T05:00:00Z",
    "message": "Template applied successfully",
    "appliedFields": ["model", "skills"],
    "effectiveScope": "agent_config",
    "runtimeEffect": "validated_config_updated"
  }
}
```

### 失败响应示例

#### 参数错误
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "targetAgentId is required"
  }
}
```

#### Agent 不存在
```json
{
  "success": false,
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "Target agent not found"
  }
}
```

#### 模板非法
```json
{
  "success": false,
  "error": {
    "code": "TEMPLATE_INVALID",
    "message": "Template YAML is invalid"
  }
}
```

#### 应用失败
```json
{
  "success": false,
  "error": {
    "code": "TEMPLATE_APPLY_FAILED",
    "message": "Template apply failed"
  }
}
```

### MVP 实现口径（已收口）
本接口在 MVP 中已收口为：**对 OpenClaw 配置中目标 `agents.list[]` 条目的受控更新**。

后端执行必须遵循以下步骤：
1. 读取本地 YAML 模板并校验元数据与 `config` 结构
2. 校验目标 Agent 存在（例如通过 `openclaw agents list` 或 `openclaw config get agents.list`）
3. 读取当前 `agents.list`
4. 定位 `targetAgentId` 对应的 agent 条目
5. 仅对允许覆盖的 agent 级白名单字段执行 merge / replace
6. 通过 OpenClaw 官方配置 CLI 完成写入：`openclaw config set`
7. 执行 `openclaw config validate`
8. 仅在写入成功且校验通过后返回成功

### 允许覆盖范围（MVP 白名单）
MVP 仅允许模板覆盖目标 agent 条目中的受控字段：
- `model`
- `skills`
- `identity`（仅当模板明确提供且 schema 支持时）

### 明确不在本接口假设范围内的字段/能力
MVP 不允许通过模板应用覆盖：
- `workspace`
- `agentDir`
- `bindings`
- channel 级配置
- gateway 级配置
- 任意跨 agent / 根级全局配置

### 成功语义
本接口返回成功，表示：
- 模板合法
- 目标 Agent 存在
- 白名单字段已写入目标 agent 配置
- `openclaw config validate` 已通过

**MVP 不承诺当前所有进行中会话即时切换到新配置。**
运行时效果以 Gateway 配置热加载能力和后续新会话生效为准。

### 保留边界（不能假设）
以下能力不得写入实现说明或测试口径：
- 不得虚构 `openclaw gateway call templates.apply`、`config.applyTemplate`、`agents.update` 等不存在命令
- 不得绕过官方配置 CLI 直接改写 OpenClaw 内部运行时私有状态
- 不得把“配置已更新并通过校验”夸大为“所有运行态即时强一致重配”

---

## 3.6 GET `/api/v1/health`

### 目的
返回本地服务状态与 Gateway 可达性。

### 请求
```http
GET /api/v1/health
```

### 成功响应示例
```json
{
  "success": true,
  "data": {
    "service": {
      "status": "ok"
    },
    "gateway": {
      "status": "ok"
    },
    "checkedAt": "2026-03-14T05:40:00Z"
  },
  "cached": false
}
```

### 说明
- 该接口用于健康探测与前端状态标识。
- 可使用短 TTL（15s）。
- 若 Gateway 探测失败且无缓存，可返回 `503 + success:false`。

---

## 4. 前后端联调执行口径

### 前端按以下规则接入
1. 所有接口以 `/api/v1/*` 为准。
2. 不传 JWT，不依赖认证头。
3. 遇到 `success:true + stale:true`，按**降级可展示**处理。
4. 只有 `success:false` 才进入错误展示流。
5. 模板应用请求体仅要求 `targetAgentId`。
6. 模板应用成功只表示“配置已更新并通过校验”，不要把成功态解释为当前进行中会话已全部即时切换。

### 后端按以下规则实现
1. Controller 只做参数提取、调用 Service、返回统一格式。
2. Gateway CLI/RPC 调用只允许出现在 Adapter 层。
3. 所有依赖 Gateway 的接口都必须覆盖缓存降级路径。
4. 不返回未包装的业务对象。
5. `POST /api/v1/config/templates/:id/apply` 只允许通过官方配置 CLI 写入：`openclaw config set` + `openclaw config validate`。
6. `apply` 仅允许更新目标 `agents.list[]` 条目的白名单字段，不得扩展为全局配置重写。
7. `apply` 若校验失败，不得返回半成功结果。

---

## 5. 本次对齐结论

本契约已完成以下收口：
- 路径统一到 `/api/v1/*`
- 删除 MVP 范围外认证要求
- 删除后台异步刷新假设，改为手动刷新口径
- 响应改为统一 `{success,data,error}` 包装
- 缓存降级统一为 `200 + stale:true`
- 将模板应用底层写入口径收口为 `openclaw config set + validate` 的目标 agent 白名单配置更新
- 保留不能假设的边界，不虚构专用模板 RPC 或私有写入协议

---

## 6. 状态跟踪
- [x] 路径版本口径对齐
- [x] 认证口径对齐
- [x] 缓存降级口径对齐
- [x] 响应格式口径对齐
- [x] MVP 必做接口范围收口
- [x] 模板应用写入口径已收口为可执行方案
- [x] 底层模板写入命令面确认（`openclaw config set + validate`）
- [ ] 前后端联调验证
