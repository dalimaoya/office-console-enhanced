# 项目状态机设计 V1

**作者**：贾克斯（架构师）  
**日期**：2026-03-19  
**状态**：二期基准  
**上游依赖**：  
- `2026-03-19-project-adjustment-v1.md`（方向收口，二期要求）  
- `file-schema-v1.md`（文件契约，对象注册表）

---

## 1. 项目阶段定义

项目生命周期由 5 个有序阶段 + 1 个横切状态组成：

| 阶段 | 标识 | 含义 | 典型活动 |
|------|------|------|---------|
| 启动 | `init` | 项目已创建，正在组建团队、定义目标和范围 | 创建 brief、分配角色、确认范围 |
| 执行 | `active` | 主体开发/工作进行中 | 编码、文档编写、设计、交接 |
| 审查 | `review` | 主体工作完成，进入评审验收 | QA 验收、代码审查、用户验收测试 |
| 收口 | `closing` | 评审通过，处理收尾事项 | 文档归档、注册表更新、复盘总结 |
| 归档 | `archived` | 项目已归档，不再产生新活动 | 只读，历史查阅 |

横切状态：

| 状态 | 标识 | 含义 |
|------|------|------|
| 阻塞 | `blocked` | 任何阶段都可进入；恢复后回到进入阻塞前的阶段 |

---

## 2. 状态转移规则

### 2.1 允许的正向转移路径

```
init → active → review → closing → archived
```

**约束**：不允许跳过阶段。`init` 不能直接到 `review`，`active` 不能直接到 `closing`。

### 2.2 允许的回退路径

| 回退 | 条件 | 说明 |
|------|------|------|
| `review` → `active` | 评审未通过，需要返工 | 常见场景 |
| `closing` → `review` | 收口阶段发现遗漏，需重新评审 | 较少见 |

**约束**：回退仅允许回退一个阶段，不允许跨阶段回退（如 `review` → `init`）。

### 2.3 阻塞状态

- **进入**：任何阶段（`init`/`active`/`review`/`closing`）都可进入 `blocked`
- **恢复**：恢复时自动回到进入阻塞前的阶段（`previous_stage`）
- **存储**：阻塞时需记录 `previous_stage` 和 `block_reason`
- **约束**：`archived` 阶段不可进入 `blocked`（已归档项目不存在阻塞）

### 2.4 完整转移矩阵

| 当前 ↓ → 目标 → | init | active | review | closing | archived | blocked |
|------------------|------|--------|--------|---------|----------|---------|
| **init** | — | ✅ | ❌ | ❌ | ❌ | ✅ |
| **active** | ❌ | — | ✅ | ❌ | ❌ | ✅ |
| **review** | ❌ | ✅ 回退 | — | ✅ | ❌ | ✅ |
| **closing** | ❌ | ❌ | ✅ 回退 | — | ✅ | ✅ |
| **archived** | ❌ | ❌ | ❌ | ❌ | — | ❌ |
| **blocked** | 恢复 | 恢复 | 恢复 | 恢复 | ❌ | — |

> blocked 行的"恢复"表示只能恢复到 `previous_stage`，不能跳到其他阶段。

---

## 3. 每个阶段的进入/退出条件

### 3.1 init（启动）

- **进入条件**：项目被创建（默认初始阶段）
- **退出条件**：
  - 至少有一个 brief 对象状态为 `active`
  - 至少分配了一个 owner 角色
  - 项目目标和范围已定义（`status/CURRENT.md` 存在）

### 3.2 active（执行）

- **进入条件**：从 `init` 正向转移，或从 `review` 回退
- **退出条件**：
  - 主要交付物清单中的 artifact 已产出
  - 所有 P0 级 brief 状态为 `done`
  - owner 主动发起 review 请求

### 3.3 review（审查）

- **进入条件**：从 `active` 正向转移
- **退出条件**：
  - 至少一份 review 对象 verdict 为 `pass` 或 `conditional_pass`
  - 所有 `critical` 级 finding 已解决
  - 评审角色确认可进入收口

### 3.4 closing（收口）

- **进入条件**：从 `review` 正向转移
- **退出条件**：
  - 注册表中所有活跃对象状态已更新
  - 复盘文档已产出
  - 无未关闭的 blocker

### 3.5 archived（归档）

- **进入条件**：从 `closing` 正向转移
- **退出条件**：不可退出（终态）

### 3.6 blocked（阻塞）

- **进入条件**：存在无法在当前阶段自行解决的阻塞项（外部依赖/关键决策待定/资源不可用）
- **退出条件**：阻塞项已解决，恢复到 `previous_stage`

---

## 4. 状态机触发方式

### 4.1 API 触发（主要方式）

```
POST /api/v1/projects/transition
Body: { "nextStage": "active", "reason": "Brief 已就绪，团队已分配" }
```

返回：
- 成功：200 + 新状态 JSON
- 非法转移：400 + 错误说明

### 4.2 手动触发

通过修改 `status/CURRENT.md` 中的阶段字段 + 提交 git。适用于无服务运行时的离线场景。

### 4.3 查询接口

```
GET /api/v1/projects/status
```

返回当前阶段、阻塞信息（如有）、上次转移时间和原因。

---

## 5. 状态持久化

### 5.1 存储位置

```
{adapter_data}/project-state.json
```

格式：
```json
{
  "projectId": "office-console-enhanced",
  "currentStage": "active",
  "previousStage": null,
  "blockReason": null,
  "lastTransition": {
    "from": "init",
    "to": "active",
    "reason": "一期基准完成，进入二期执行",
    "timestamp": "2026-03-19T16:00:00Z",
    "actor": "orchestrator-teemo"
  },
  "history": [
    {
      "from": "init",
      "to": "active",
      "reason": "...",
      "timestamp": "...",
      "actor": "..."
    }
  ]
}
```

### 5.2 事件日志集成

每次状态转移，通过 `event-log-service` 记录一条 `object.status_changed` 事件：

```json
{
  "event_type": "object.status_changed",
  "source_role": "architect-jax",
  "description": "项目阶段转移: init → active",
  "object_id": "project-office-console-enhanced",
  "prev_state": { "stage": "init" },
  "next_state": { "stage": "active" },
  "context": { "reason": "一期基准完成" }
}
```

---

## 6. 错误处理

| 场景 | 响应 |
|------|------|
| 非法转移（如 `init` → `review`） | 400, `INVALID_TRANSITION`, 说明允许的目标阶段 |
| 已归档项目尝试转移 | 400, `PROJECT_ARCHIVED`, 归档项目不可变更 |
| 阻塞恢复时目标不匹配 | 400, `BLOCKED_RESTORE_MISMATCH`, 只能恢复到阻塞前阶段 |
| 状态文件损坏/缺失 | 自动初始化为 `init` 阶段 |

---

## 7. 一期/二期边界

| 能力 | 期次 | 说明 |
|------|------|------|
| 状态转移 + 合法性检查 | **二期** | 本文档范围 |
| API 查询 + 触发 | **二期** | 本文档范围 |
| 事件日志记录 | **二期** | 复用一期 event-log-service |
| 进入/退出条件自动校验 | **三期** | 二期由调用方自行确认条件是否满足 |
| 多项目状态机 | **三期** | 二期只支持单项目 |
| 状态变更飞书通知 | **三期** | 二期由调用方自行发通知 |

---

*本文档由贾克斯（架构师）输出，作为二期项目状态机的设计基准。*  
*文档路径：`docs/state-machine-v1.md`*
