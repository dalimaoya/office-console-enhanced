# OpenClaw Gateway API 可用性验证报告（任务1）

- 负责人：backend-leona
- 协作：architect-jax（待架构侧补充对接边界）
- 验证时间：2026-03-13 UTC
- 验证环境：本机 OpenClaw Gateway，`127.0.0.1:18789`
- Gateway 版本：`2026.3.11`

## 1. 验证范围与结论摘要

本轮按任务要求验证了 4 类目标能力，但实际发现：**当前 Gateway 对外主能力是 WebSocket/RPC，而不是预期中的 REST `/api/v1/*` 路由集合**。

### 总结论

1. `GET /api/v1/agents/status`：**未提供**（404）
   - 可替代能力：`openclaw gateway call status`
2. `GET /api/v1/agents/{agentId}/runtime`：**未提供**（未发现对应 REST/RPC 单方法）
   - 部分近似能力：`status` 中的 recent sessions、`config.get` 中的 agent/workspace 配置、`system-presence`
3. `GET /api/v1/skills`：**未提供**（404）
   - 可替代能力：`openclaw skills list`（CLI），未发现稳定 Gateway RPC `skills.list`
4. Workspace 配置读取：**可通过配置读取能力获取**
   - 可替代能力：`openclaw gateway call config.get`
   - CLI 也可通过 `openclaw config get agents/gateway` 读取

**结论：若项目要求“直接对接 REST `/api/v1/*` Gateway API”，当前版本不可直接满足；若允许改为对接现有 Gateway RPC/CLI 能力，则可行，但需要一层适配封装。**

---

## 2. 接口探测记录

### 2.1 HTTP 路由探测

| 路径 | 结果 | 说明 |
|---|---:|---|
| `/` | 200 | 返回 OpenClaw Control HTML 页面 |
| `/health` | 200 | 返回 `{"ok":true,"status":"live"}` |
| `/openapi.json` | 404 | 未提供 OpenAPI |
| `/swagger.json` | 404 | 未提供 Swagger |
| `/api` | 404 | 未提供 REST API 根 |
| `/api/v1` | 404 | 未提供 REST v1 根 |
| `/api/v1/agents/status` | 404 | 目标接口不存在 |
| `/api/v1/skills` | 404 | 目标接口不存在 |

### 2.2 Gateway/RPC 调用探测

已验证可调用：

- `openclaw gateway call health`
- `openclaw gateway call status`
- `openclaw gateway call agents.list`
- `openclaw gateway call system-presence`
- `openclaw gateway call config.get`
- `openclaw gateway call cron.list`

验证失败（unknown method）：

- `agents.status`
- `agents.runtime`
- `skills.list`
- `workspace.get`
- `session_status`

---

## 3. 响应格式与数据结构记录

### 3.1 健康状态：`/health` 或 `gateway call health`

#### HTTP `/health`
```json
{"ok":true,"status":"live"}
```

#### RPC `health`
核心结构包括：
- `ok`
- `ts`
- `durationMs`
- `channels`
  - 按渠道分组（本机为 `feishu`）
  - 含 `configured / running / probe / accounts`
- `agents`
  - 每个 agent 的 `agentId / heartbeat / sessions`
- `sessions`
  - 会话路径、数量、recent

**办公友好度评价**：
- 优点：状态信息完整，适合后台运维和配置核对。
- 不足：字段层级深，直接给办公人员展示会偏技术化，需要二次整理为“渠道是否可用 / 账号是否就绪 / Agent 在线摘要”。

### 3.2 Agent 状态：`gateway call status`

核心结构包括：
- `runtimeVersion`
- `heartbeat.agents[]`
- `channelSummary[]`
- `queuedSystemEvents[]`
- `sessions.paths / count / defaults / recent[]`

`sessions.recent[]` 内可见：
- `agentId`
- `key`
- `sessionId`
- `updatedAt`
- `modelProvider`
- `model`
- `deliveryContext`
- 部分 token 数据

**评估**：
- 可以替代“agents status 总览”需求。
- 但**不能等价替代单 agent runtime 明细接口**，因为缺少按 `agentId` 直接读取统一 runtime 对象的稳定入口。

### 3.3 Agent 列表：`gateway call agents.list`

核心结构包括：
- `defaultId`
- `mainKey`
- `scope`
- `agents[]`
  - `id`
  - `name`
  - `identity.name`

**评估**：
- 可用于 agent 下拉选择、身份映射。
- 信息偏轻，不足以支撑运行态监控页。

### 3.4 Skills 元信息：`openclaw skills list`

输出为表格型 CLI 结果，包含：
- `Status`（ready/missing）
- `Skill`
- `Description`
- `Source`

本机结果：**72 个 skill 中 29 个 ready**。

**评估**：
- 元信息充足，适合“办公控制台技能目录”。
- 但目前是 CLI 表格输出，不是标准 JSON Gateway API；若前端要直接消费，需要新增适配层或改用其他内部接口。

### 3.5 Workspace / 配置读取：`gateway call config.get`

返回结构包括：
- `path`
- `exists`
- `raw`
- `parsed`

`parsed` 内已验证包含：
- `agents.defaults`
- `agents.list[].workspace`
- `bindings`
- `channels`
- `gateway`
- `plugins`

**评估**：
- 这已经能满足“workspace 配置读取（如存在）”的验证目标。
- 但能力是**配置全集读取**，不是精简的 workspace 专用接口。
- 对办公控制台使用方而言，建议下沉成只读 DTO，避免把完整配置直接暴露给前台。

---

## 4. 性能测试记录

### 4.1 测试方法

- 工具：`curl`、`openclaw gateway call`、`openclaw skills list`
- 次数：每个目标 10 次串行采样
- 指标：成功率、最小/平均/P95/最大响应时间

### 4.2 结果

| 能力 | 样本数 | 成功率 | Avg(ms) | P95(ms) | 结论 |
|---|---:|---:|---:|---:|---|
| HTTP `/health` | 10 | 100% | 463.33 | 569.80 | 达标 |
| RPC `health` | 10 | 100% | 4935.46 | 5264.05 | **不达标** |
| RPC `status` | 10 | 100% | 4743.75 | 4817.50 | **不达标** |
| RPC `agents.list` | 10 | 100% | 5374.13 | 7292.82 | **不达标** |
| CLI `skills list` | 10 | 100% | 6426.93 | 8705.07 | **不达标** |

### 4.3 对成功标准的对照

目标成功标准：
- 核心接口成功率 ≥95%
- 响应时间 P95 ≤2秒
- 数据格式与预期一致率 ≥90%

实际结果：
- **成功率**：对于已存在可替代能力，均为 100%
- **时延**：除 `/health` 外，其余关键能力的 P95 **均明显超过 2 秒**
- **格式一致率**：若按“原任务中给出的 REST 接口与字段预期”评估，**不达标**；若按“存在可替代 Gateway 能力”评估，则部分达标

---

## 5. 办公友好度评估

### 5.1 正向评价

1. **健康/状态数据完整**：对系统管理者友好。
2. **agent / channel / account / session 关系清楚**：适合做管理后台聚合视图。
3. **workspace 与 agent 配置可读**：有利于控制台做对象映射。

### 5.2 风险与不足

1. **接口形态不友好**：当前更像运维/CLI/RPC 内部接口，不是稳定 REST 产品接口。
2. **数据过深、过原始**：办公用户难以直接理解，需要 DTO 规整。
3. **技能元信息缺少标准 JSON API**：当前更适合终端，不适合前端直接接入。
4. **运行态明细缺少单 Agent 查询接口**：不利于办公控制台展示“某个角色当前状态/最近活跃/运行模式”。
5. **性能偏慢**：如果控制台每次页面加载都直接串调 Gateway，体验会较差。

### 5.3 办公控制台建议展示字段

建议从现有数据中抽象以下办公友好字段：
- Gateway 是否在线
- 渠道是否配置正常
- 机器人账号是否可用
- Agent 名称 / 角色 / workspace
- 最近活跃时间
- 最近会话渠道
- 当前模型
- 可用 skill 数 / ready skill 数
- 风险提示（缺失能力、配置异常、最近调用失败）

---

## 6. 可行性结论

### 6.1 直接按原方案对接：**不可行/高风险**

原因：
- 目标 REST 接口 `/api/v1/agents/status`、`/api/v1/agents/{agentId}/runtime`、`/api/v1/skills` 当前未提供。
- 关键能力只能通过 RPC 或 CLI 间接获取。
- 时延不满足 P95 ≤ 2 秒目标。

### 6.2 调整为“适配层对接 Gateway”：**可行**

建议方案：
1. 后端新增 **Gateway Adapter Service**
2. 统一包装以下能力：
   - `health` → `/office/gateway/health`
   - `status + agents.list + config.get` 聚合 → `/office/agents/overview`
   - `skills list` 解析/缓存 → `/office/skills`
   - workspace 抽取 → `/office/workspaces`
3. 增加缓存层（建议 15s~60s）
4. 输出办公友好 DTO，屏蔽底层复杂结构

**结论等级**：
- 原始 Gateway 直连：**不建议**
- 经后端适配层封装后：**建议推进**

---

## 7. 降级方案（验证失败时）

若后续仍需在 D1-D2 内快速给前端/产品演示，建议启用模拟数据生成器：

### 7.1 Mock 生成器范围

- Agent 状态总览
- 单 Agent 活跃度/最近运行信息
- Skill 元信息列表
- Workspace 映射配置

### 7.2 Mock 数据结构建议

```json
{
  "gatewayOnline": true,
  "agents": [
    {
      "agentId": "agent-backend-leona",
      "displayName": "雷欧娜",
      "workspace": "/root/.openclaw/workspace-agent-backend-leona",
      "lastActiveAt": 1773394291982,
      "lastChannel": "feishu",
      "model": "openai-codex/gpt-5.4",
      "status": "idle"
    }
  ],
  "skills": {
    "ready": 29,
    "total": 72
  }
}
```

### 7.3 降级使用原则

- 演示阶段使用 Mock
- 联调阶段切真实适配层
- 保持字段契约不变，避免前端返工

---

## 8. 最终结论

**本轮验证结论：OpenClaw Gateway 当前版本“可提供底层状态/配置/技能相关能力”，但“不可按原任务中的 REST API 形式直接对接办公控制台”。**

若项目允许：
- 调整目标接口为 RPC/CLI + 后端适配层
- 引入缓存与办公友好 DTO
- 对缺失的 `agent runtime`、`skills JSON API` 做二次封装

则 **Gateway 对接总体可行**；否则按原 REST 假设推进会产生较高实现风险与联调阻塞。
