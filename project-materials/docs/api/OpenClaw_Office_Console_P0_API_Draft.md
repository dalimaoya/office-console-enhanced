# OpenClaw Office Console（Windows 版）P0 版本前后端接口草案
> 基于 MVP 架构稿继续细化的接口层设计文档

---

## 1. 文档目的

本文档用于定义 **OpenClaw Office Console（Windows 版）P0 版本** 的前后端接口草案。

目标包括：

- 统一前端页面与本地服务层的数据契约
- 约束首批核心功能的接口边界
- 为后续开发拆分提供基础
- 为 OpenClaw 兼容层设计输入输出结构
- 降低后续重构成本

本文档中的“后端”默认指：

> **Office Console 本地服务层**

而不是远程云服务。

---

## 2. 接口设计原则

### 2.1 本地优先
P0 版本优先假设所有接口均在本地调用，不依赖云端中台。

### 2.2 控制台后端与 OpenClaw 后端分层
接口分为两层：

1. **Console Local APIs**
   - 面向前端页面
   - 聚合、封装、格式化本地状态

2. **OpenClaw Adapter APIs**
   - 面向 OpenClaw 原生实例
   - 做兼容与适配
   - 尽量隐藏底层复杂度

### 2.3 返回结构统一
所有接口建议统一使用：

- `success`
- `data`
- `error`

### 2.4 页面以“可展示字段”为导向
接口优先返回页面需要的结构化字段，而不是原始底层对象。

---

## 3. 通用返回结构

## 3.1 成功返回

```json
{
  "success": true,
  "data": {}
}
```

## 3.2 失败返回

```json
{
  "success": false,
  "error": {
    "code": "ERR_CODE",
    "message": "错误描述",
    "detail": "详细说明"
  }
}
```

---

## 4. 核心接口分组

第一版建议按以下模块组织：

```text
1. App / Boot
2. Environment Check
3. Configuration
4. Console Summary
5. Agent Management
6. Task Management
7. Diagnostics
8. Skill / Capability Pack
9. OpenClaw Adapter
```

---

# 5. App / Boot 接口

## 5.1 获取应用基础信息

### 接口
`GET /api/app/info`

### 用途
首页、欢迎页、设置页展示应用基础信息。

### 返回字段
```json
{
  "success": true,
  "data": {
    "app_name": "OpenClaw Office Console",
    "version": "0.1.0",
    "platform": "windows",
    "mode": "desktop",
    "first_launch": true
  }
}
```

---

## 5.2 检测是否存在已有 OpenClaw 实例

### 接口
`GET /api/app/detect-openclaw`

### 用途
首启流程判断“新安装”还是“关联已有实例”。

### 返回字段
```json
{
  "success": true,
  "data": {
    "detected": true,
    "instance_path": "C:\\OpenClaw\\workspace",
    "instance_status": "valid"
  }
}
```

### `instance_status` 枚举
- `valid`
- `partial`
- `not_found`

---

## 5.3 关联已有实例

### 接口
`POST /api/app/link-instance`

### 请求体
```json
{
  "instance_path": "C:\\OpenClaw\\workspace"
}
```

### 返回字段
```json
{
  "success": true,
  "data": {
    "linked": true,
    "workspace_path": "C:\\OpenClaw\\workspace"
  }
}
```

---

# 6. Environment Check 接口

## 6.1 获取全部环境检测结果

### 接口
`GET /api/env/checks`

### 用途
环境检测页、首页状态摘要、Console Agent 输入来源。

### 返回字段
```json
{
  "success": true,
  "data": {
    "checks": [
      {
        "check_id": "system.os_version",
        "category": "system",
        "name": "操作系统版本",
        "status": "pass",
        "summary": "当前系统满足运行要求",
        "detail": "Windows 11 x64",
        "impact_level": "P0",
        "suggested_action": "无需处理",
        "action_type": "none",
        "last_checked_at": "2026-03-09T10:00:00"
      }
    ]
  }
}
```

---

## 6.2 重新执行全部检测

### 接口
`POST /api/env/checks/retry`

### 用途
环境检测页“重新检测”按钮。

### 返回字段
同 `/api/env/checks`

---

## 6.3 执行单项检测

### 接口
`POST /api/env/checks/run`

### 请求体
```json
{
  "check_id": "browser.connection"
}
```

### 返回字段
```json
{
  "success": true,
  "data": {
    "check_id": "browser.connection",
    "status": "fail",
    "summary": "浏览器能力不可用",
    "detail": "未检测到可连接浏览器",
    "suggested_action": "重新检测或重启浏览器"
  }
}
```

---

# 7. Configuration 接口

## 7.1 获取全部配置摘要

### 接口
`GET /api/config/summary`

### 用途
首页状态摘要、配置中心首页。

### 返回字段
```json
{
  "success": true,
  "data": {
    "model": {
      "configured": true,
      "provider": "kimi",
      "model_name": "kimi-latest",
      "test_status": "pass"
    },
    "feishu": {
      "configured": false,
      "auth_status": "unknown",
      "write_test_status": "unknown"
    },
    "browser": {
      "status": "pass"
    },
    "workspace": {
      "path": "C:\\OpenClaw\\workspace",
      "writable": true
    }
  }
}
```

---

## 7.2 获取模型配置

### 接口
`GET /api/config/model`

### 返回字段
```json
{
  "success": true,
  "data": {
    "provider": "kimi",
    "api_key_masked": "sk-****",
    "base_url": "https://...",
    "model_name": "kimi-latest",
    "last_test_status": "pass",
    "last_tested_at": "2026-03-09T10:00:00"
  }
}
```

---

## 7.3 保存模型配置

### 接口
`POST /api/config/model`

### 请求体
```json
{
  "provider": "kimi",
  "api_key": "xxx",
  "base_url": "https://...",
  "model_name": "kimi-latest"
}
```

### 返回字段
```json
{
  "success": true,
  "data": {
    "saved": true
  }
}
```

---

## 7.4 测试模型连接

### 接口
`POST /api/config/model/test`

### 请求体
```json
{
  "provider": "kimi",
  "api_key": "xxx",
  "base_url": "https://...",
  "model_name": "kimi-latest"
}
```

### 返回字段
```json
{
  "success": true,
  "data": {
    "test_status": "pass",
    "latency_ms": 1240,
    "message": "连接测试成功"
  }
}
```

---

## 7.5 获取飞书配置

### 接口
`GET /api/config/feishu`

### 返回字段
```json
{
  "success": true,
  "data": {
    "configured": true,
    "app_id": "cli_xxx",
    "app_secret_masked": "****",
    "tenant_key": "tenant_xxx",
    "space": "知识空间A",
    "auth_status": "pass",
    "write_test_status": "warn",
    "last_tested_at": "2026-03-09T10:00:00"
  }
}
```

---

## 7.6 保存飞书配置

### 接口
`POST /api/config/feishu`

### 请求体
```json
{
  "app_id": "cli_xxx",
  "app_secret": "xxx",
  "tenant_key": "tenant_xxx",
  "space": "知识空间A"
}
```

### 返回字段
```json
{
  "success": true,
  "data": {
    "saved": true
  }
}
```

---

## 7.7 测试飞书授权

### 接口
`POST /api/config/feishu/test-auth`

### 返回字段
```json
{
  "success": true,
  "data": {
    "auth_status": "pass",
    "message": "飞书授权有效"
  }
}
```

---

## 7.8 测试飞书写入

### 接口
`POST /api/config/feishu/test-write`

### 返回字段
```json
{
  "success": true,
  "data": {
    "write_test_status": "pass",
    "target_space": "知识空间A",
    "message": "已成功写入测试文档"
  }
}
```

---

## 7.9 获取工作空间设置

### 接口
`GET /api/config/workspace`

### 返回字段
```json
{
  "success": true,
  "data": {
    "workspace_path": "C:\\OpenClaw\\workspace",
    "output_dir": "C:\\OpenClaw\\workspace\\outputs",
    "logs_dir": "C:\\OpenClaw\\workspace\\logs",
    "default_template": "default"
  }
}
```

---

## 7.10 保存工作空间设置

### 接口
`POST /api/config/workspace`

### 请求体
```json
{
  "workspace_path": "C:\\OpenClaw\\workspace",
  "output_dir": "C:\\OpenClaw\\workspace\\outputs",
  "logs_dir": "C:\\OpenClaw\\workspace\\logs",
  "default_template": "default"
}
```

---

# 8. Console Summary 接口

## 8.1 获取首页状态摘要

### 接口
`GET /api/console/summary`

### 用途
首页顶部状态栏。

### 返回字段
```json
{
  "success": true,
  "data": {
    "model_status": {
      "configured": true,
      "test_status": "pass",
      "model_name": "kimi-latest"
    },
    "feishu_status": {
      "configured": false,
      "auth_status": "unknown"
    },
    "browser_status": {
      "status": "pass"
    },
    "workspace_status": {
      "path": "C:\\OpenClaw\\workspace",
      "writable": true
    },
    "agent_health": {
      "total": 4,
      "healthy": 3,
      "abnormal": 1
    },
    "task_summary": {
      "today_success": 3,
      "today_failed": 1
    }
  }
}
```

---

## 8.2 获取 Console Agent 建议摘要

### 接口
`GET /api/console/agent-summary`

### 用途
首页 Console Agent 建议区。

### 返回字段
```json
{
  "success": true,
  "data": {
    "current_summary": "模型已连接，浏览器正常，飞书尚未配置。",
    "problems": [
      "飞书知识助手当前不可用。"
    ],
    "recommended_next_step": {
      "text": "先完成飞书配置并测试写入。",
      "action_type": "goto_config",
      "target": "feishu"
    },
    "updates": [
      "新增：文档初稿助手已支持需求规格说明书模板。"
    ]
  }
}
```

---

# 9. Agent Management 接口

## 9.1 获取 Agent 列表

### 接口
`GET /api/agents`

### 用途
Agent 中心列表、首页 Agent 卡片。

### 返回字段
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "agent_id": "feishu_knowledge",
        "name": "飞书知识助手",
        "type": "knowledge",
        "description": "整理内容并写入飞书知识空间",
        "status": "needs_config",
        "prerequisites": {
          "model": true,
          "feishu": false
        },
        "last_run_at": null,
        "last_result_summary": "尚未运行"
      }
    ]
  }
}
```

### `status` 枚举
- `available`
- `needs_config`
- `running`
- `abnormal`
- `disabled`

---

## 9.2 获取单个 Agent 详情

### 接口
`GET /api/agents/{agent_id}`

### 返回字段
```json
{
  "success": true,
  "data": {
    "agent_id": "doc_draft",
    "name": "文档初稿助手",
    "type": "document",
    "description": "快速生成结构化文档初稿",
    "input_schema": [
      {
        "field": "topic",
        "type": "string",
        "required": true
      }
    ],
    "output_description": "Markdown 文档初稿",
    "status": "available",
    "prerequisites": {
      "model": true
    },
    "last_run_at": "2026-03-09T10:10:00",
    "last_result_summary": "已生成一份 Markdown 初稿"
  }
}
```

---

## 9.3 启用 / 禁用 Agent

### 接口
`POST /api/agents/{agent_id}/toggle`

### 请求体
```json
{
  "enabled": true
}
```

### 返回字段
```json
{
  "success": true,
  "data": {
    "agent_id": "doc_draft",
    "enabled": true
  }
}
```

---

## 9.4 启动 Agent 任务

### 接口
`POST /api/agents/{agent_id}/run`

### 请求体示例
```json
{
  "input": {
    "topic": "智慧园区平台部署教程"
  }
}
```

### 返回字段
```json
{
  "success": true,
  "data": {
    "task_id": "task_001",
    "status": "running"
  }
}
```

---

# 10. Task Management 接口

## 10.1 获取任务列表

### 接口
`GET /api/tasks`

### 支持查询参数
- `status`
- `agent_id`
- `limit`

### 返回字段
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "task_id": "task_001",
        "name": "生成智慧园区部署教程",
        "agent_id": "doc_draft",
        "agent_name": "文档初稿助手",
        "status": "running",
        "current_step": "正在生成章节结构",
        "created_at": "2026-03-09T10:10:00",
        "last_action_summary": "已完成输入分析"
      }
    ]
  }
}
```

---

## 10.2 获取当前运行任务摘要

### 接口
`GET /api/tasks/current`

### 用途
首页当前任务卡片。

### 返回字段
```json
{
  "success": true,
  "data": {
    "task_id": "task_001",
    "name": "生成智慧园区部署教程",
    "agent_name": "文档初稿助手",
    "status": "running",
    "current_step": "正在生成章节结构",
    "completed_steps": [
      "读取输入资料",
      "提取主题信息"
    ],
    "pending_steps": [
      "生成正文",
      "保存结果"
    ]
  }
}
```

---

## 10.3 获取任务详情

### 接口
`GET /api/tasks/{task_id}`

### 返回字段
```json
{
  "success": true,
  "data": {
    "task_id": "task_001",
    "name": "生成智慧园区部署教程",
    "agent_id": "doc_draft",
    "agent_name": "文档初稿助手",
    "status": "running",
    "stage": "content_generation",
    "input_summary": {
      "topic": "智慧园区部署教程"
    },
    "steps": [
      {
        "step_name": "读取输入资料",
        "status": "done",
        "started_at": "2026-03-09T10:10:00",
        "finished_at": "2026-03-09T10:10:10"
      },
      {
        "step_name": "生成章节结构",
        "status": "running",
        "started_at": "2026-03-09T10:10:10"
      }
    ],
    "recent_logs": [
      "已完成输入解析",
      "正在生成章节结构"
    ],
    "error": null,
    "result": null
  }
}
```

---

## 10.4 重试任务

### 接口
`POST /api/tasks/{task_id}/retry`

### 返回字段
```json
{
  "success": true,
  "data": {
    "task_id": "task_001",
    "status": "running"
  }
}
```

---

## 10.5 取消任务（可选，P0 可保留预留）
### 接口
`POST /api/tasks/{task_id}/cancel`

---

# 11. Diagnostics 接口

## 11.1 获取错误列表

### 接口
`GET /api/diagnostics/errors`

### 返回字段
```json
{
  "success": true,
  "data": {
    "errors": [
      {
        "error_id": "ERR_FEISHU_WRITE_FAILED",
        "error_type": "FEISHU_ERROR",
        "error_level": "high",
        "title": "飞书写入测试失败",
        "summary": "测试写入未成功",
        "affected_module": "feishu",
        "created_at": "2026-03-09T10:20:00"
      }
    ]
  }
}
```

---

## 11.2 获取单个错误详情

### 接口
`GET /api/diagnostics/errors/{error_id}`

### 返回字段
```json
{
  "success": true,
  "data": {
    "error_id": "ERR_FEISHU_WRITE_FAILED",
    "error_type": "FEISHU_ERROR",
    "error_level": "high",
    "title": "飞书写入测试失败",
    "summary": "测试写入未成功",
    "detail": "可能是授权范围不足、目标空间不可写或配置参数错误。",
    "affected_module": "feishu",
    "recommended_action": "重新测试授权与写入，必要时重新选择目标空间。",
    "action_type": "goto_config",
    "created_at": "2026-03-09T10:20:00"
  }
}
```

---

## 11.3 获取诊断摘要

### 接口
`GET /api/diagnostics/summary`

### 用途
日志与诊断页顶部摘要、Console Agent 输入来源。

### 返回字段
```json
{
  "success": true,
  "data": {
    "critical_count": 1,
    "high_count": 2,
    "medium_count": 1,
    "latest_error_title": "飞书写入测试失败"
  }
}
```

---

## 11.4 执行推荐修复动作（可选，P0 可只做跳转不自动执行）
### 接口
`POST /api/diagnostics/actions/run`

### 请求体
```json
{
  "action_type": "retry_check",
  "target": "browser.connection"
}
```

---

# 12. Skill / Capability Pack 接口

## 12.1 获取已安装能力包 / Skill 列表

### 接口
`GET /api/skills`

### 返回字段
```json
{
  "success": true,
  "data": {
    "skills": [
      {
        "skill_id": "console_agent",
        "name": "Console Agent",
        "type": "core",
        "installed": true,
        "enabled": true,
        "version": "0.1.0"
      }
    ]
  }
}
```

---

## 12.2 获取推荐安装能力列表

### 接口
`GET /api/skills/recommended`

### 返回字段
```json
{
  "success": true,
  "data": {
    "skills": [
      {
        "skill_id": "feishu_knowledge",
        "name": "飞书知识助手",
        "description": "整理内容并写入飞书知识空间",
        "installed": false
      },
      {
        "skill_id": "doc_draft",
        "name": "文档初稿助手",
        "description": "快速生成结构化文档初稿",
        "installed": true
      }
    ]
  }
}
```

---

## 12.3 安装 Skill

### 接口
`POST /api/skills/install`

### 请求体
```json
{
  "skill_id": "feishu_knowledge"
}
```

### 返回字段
```json
{
  "success": true,
  "data": {
    "skill_id": "feishu_knowledge",
    "installed": true
  }
}
```

---

## 12.4 启用 / 禁用 Skill

### 接口
`POST /api/skills/toggle`

### 请求体
```json
{
  "skill_id": "feishu_knowledge",
  "enabled": true
}
```

---

# 13. OpenClaw Adapter 接口

这一层接口主要供本地服务层内部使用，也可选择不直接暴露给前端。

## 13.1 获取 OpenClaw 健康状态

### 接口
`GET /api/openclaw/health`

### 返回字段
```json
{
  "success": true,
  "data": {
    "reachable": true,
    "version": "x.y.z",
    "workspace_path": "C:\\OpenClaw\\workspace"
  }
}
```

---

## 13.2 获取 OpenClaw 原始日志入口信息

### 接口
`GET /api/openclaw/logs-info`

### 返回字段
```json
{
  "success": true,
  "data": {
    "logs_dir": "C:\\OpenClaw\\workspace\\logs",
    "open_supported": true
  }
}
```

---

## 13.3 打开原始后台

### 接口
`POST /api/openclaw/open-original-console`

### 返回字段
```json
{
  "success": true,
  "data": {
    "opened": true
  }
}
```

---

# 14. 前端页面与接口映射关系

## 14.1 欢迎页
- `GET /api/app/info`
- `GET /api/app/detect-openclaw`
- `POST /api/app/link-instance`

## 14.2 环境检测页
- `GET /api/env/checks`
- `POST /api/env/checks/retry`
- `POST /api/env/checks/run`

## 14.3 模型配置页
- `GET /api/config/model`
- `POST /api/config/model`
- `POST /api/config/model/test`

## 14.4 飞书配置页
- `GET /api/config/feishu`
- `POST /api/config/feishu`
- `POST /api/config/feishu/test-auth`
- `POST /api/config/feishu/test-write`

## 14.5 首页总览
- `GET /api/console/summary`
- `GET /api/console/agent-summary`
- `GET /api/tasks/current`
- `GET /api/agents`

## 14.6 Agent 中心
- `GET /api/agents`
- `GET /api/agents/{agent_id}`
- `POST /api/agents/{agent_id}/toggle`
- `POST /api/agents/{agent_id}/run`

## 14.7 任务中心
- `GET /api/tasks`
- `GET /api/tasks/{task_id}`
- `POST /api/tasks/{task_id}/retry`

## 14.8 日志与诊断页
- `GET /api/diagnostics/summary`
- `GET /api/diagnostics/errors`
- `GET /api/diagnostics/errors/{error_id}`

---

# 15. P0 版本接口最小集合

如果严格收敛 MVP，建议第一批必须实现以下接口：

## 必须有
- `GET /api/app/info`
- `GET /api/app/detect-openclaw`
- `POST /api/app/link-instance`
- `GET /api/env/checks`
- `POST /api/env/checks/retry`
- `GET /api/config/summary`
- `GET /api/config/model`
- `POST /api/config/model`
- `POST /api/config/model/test`
- `GET /api/config/feishu`
- `POST /api/config/feishu`
- `POST /api/config/feishu/test-auth`
- `POST /api/config/feishu/test-write`
- `GET /api/console/summary`
- `GET /api/console/agent-summary`
- `GET /api/agents`
- `POST /api/agents/{agent_id}/run`
- `GET /api/tasks/current`
- `GET /api/tasks`
- `GET /api/tasks/{task_id}`
- `POST /api/tasks/{task_id}/retry`
- `GET /api/diagnostics/errors`
- `GET /api/diagnostics/errors/{error_id}`
- `GET /api/skills`
- `GET /api/skills/recommended`
- `POST /api/skills/install`

---

# 16. 后续扩展注意事项

## 16.1 返回结构尽量稳定
后续新增字段尽量追加，不轻易改已有字段语义。

## 16.2 状态枚举尽量统一
例如：
- 检测状态
- Agent 状态
- 任务状态
- 错误等级

应统一枚举，减少前端映射复杂度。

## 16.3 Adapter 层不要直接泄漏底层复杂接口
前端应尽量只消费控制台本地服务层整理后的结构。

---

## 17. 总结

P0 接口设计最重要的不是“接口很多”，而是三点：

1. 页面需要的字段结构清晰
2. 状态模型统一
3. 适配层把 OpenClaw 的复杂度隔离掉

只要这三点成立，后续你无论加：

- 文档工厂高级模式
- 更多 Agent
- 更多能力包
- 更多平台支持

都不会把第一版接口体系推倒重来。
