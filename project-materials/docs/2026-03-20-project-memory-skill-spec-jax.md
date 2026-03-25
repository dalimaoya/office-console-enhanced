# project-memory Skill 设计规范

> 作者：Jax (architect-jax)  
> 日期：2026-03-20  
> 状态：Draft — 待 Ryze 审核补充  

---

## 1. 设计约束（来自三票条件）

| 约束 | 来源 | 设计体现 |
|------|------|----------|
| 路径不硬编码，运行时动态解析 | Jax | 所有路径基于 `$PROJECT_ROOT` 环境变量或运行时推断 |
| MVP 先做会话摘要 + 共享索引 | Ekko | MVP 范围严格限定为两个能力 |
| 与 OpenClaw 原生 memory 明确边界 | Ryze | 职责分离表 + 双向不侵入原则 |

---

## 2. Skill 目录结构

```
project-memory/
├── SKILL.md                    # 触发条件、工作流程、输出规范
├── scripts/
│   ├── resolve-project-root.sh # 运行时动态解析项目根路径
│   ├── write-session-summary.sh# 追加写会话摘要
│   └── update-index.sh         # 更新共享索引文件
└── references/
    └── schema.md               # 文件格式规范（摘要/索引的字段定义）
```

### 文件职责说明

- **SKILL.md**：skill 入口，定义何时触发、agent 该做什么
- **resolve-project-root.sh**：按优先级解析项目根路径（见 §4），返回绝对路径，失败则退出并输出错误
- **write-session-summary.sh**：接收摘要内容，按规范追加写入当日摘要文件
- **update-index.sh**：扫描摘要目录，重建或追加更新索引文件
- **schema.md**：数据格式的权威定义，供 agent 参考

---

## 3. SKILL.md 内容骨架

```yaml
---
name: project-memory
description: >
  跨角色共享的项目过程沉淀。自动写入会话摘要、维护共享索引。
  触发条件：会话结束时、agent 完成阶段任务时、被明确要求"记录/沉淀"时。
  不触发：个人笔记、与特定项目无关的对话、MEMORY.md 范畴的内容。
---
```

### 触发条件（When to activate）

1. **会话结束**：agent 完成当前任务、即将返回结果前
2. **阶段交付**：agent 产出成果物（文档/代码/设计）写入项目目录后
3. **显式指令**：用户或 orchestrator 说"记录这个" / "沉淀到项目"
4. **不触发**：闲聊、个人偏好记录、与当前项目无关的内容

### 工作流程（Workflow）

```
1. 解析项目根路径 → resolve-project-root.sh
2. 确定当前日期 → YYYY-MM-DD
3. 写入会话摘要 → write-session-summary.sh
   - 追加到 {project_root}/.project-memory/sessions/YYYY-MM-DD.md
4. 更新索引 → update-index.sh
   - 追加到 {project_root}/.project-memory/INDEX.md
5. 输出确认（一行日志，不打断主流程）
```

### 输出规范

- 每次写入后，向调用方返回一行确认：`[project-memory] 已写入 {文件路径}`
- 不产生额外对话、不打断主流程

---

## 4. 存储规范

### 4.1 项目根路径解析（运行时动态，不硬编码）

`resolve-project-root.sh` 按以下优先级解析：

1. 环境变量 `$PROJECT_MEMORY_ROOT`（最高优先级，显式指定）
2. 环境变量 `$PROJECT_ROOT`（通用项目根）
3. 从当前工作目录向上查找包含 `.project-memory/` 目录的祖先
4. 从当前工作目录向上查找包含 `docs/` 或 `.git/` 的祖先（启发式）
5. 以上均失败 → 退出码 1，输出错误信息，不创建任何文件

**原则**：宁可失败也不猜错路径。

### 4.2 数据目录结构（项目内）

```
{project_root}/
└── .project-memory/
    ├── INDEX.md              # 共享索引（全局摘要目录）
    └── sessions/
        ├── 2026-03-20.md     # 当日会话摘要（可能多条）
        ├── 2026-03-21.md
        └── ...
```

### 4.3 写入规则

| 规则 | 说明 |
|------|------|
| **追加写，不覆盖** | 所有写入操作都是 append，永远不覆盖已有内容 |
| **幂等标识** | 每条摘要带唯一 ID（`{agent}-{timestamp}`），防止重复写入 |
| **原子性** | 先写临时文件，再 append 到目标文件（避免写入中断导致文件损坏） |
| **编码** | UTF-8，Unix 换行符 |

### 4.4 文件命名规则

- 会话文件：`sessions/YYYY-MM-DD.md`（按自然日聚合）
- 索引文件：`INDEX.md`（单文件，追加更新）

### 4.5 会话摘要格式

```markdown
---
id: architect-jax-20260320T085100Z
agent: architect-jax
timestamp: 2026-03-20T08:51:00Z
task: 设计 project-memory skill 规范
---

### 摘要
- 完成了 project-memory skill 的架构设计规范
- 定义了存储规范、路径解析策略、与原生 memory 的边界

### 产出物
- `/docs/2026-03-20-project-memory-skill-spec-jax.md`

### 决策记录
- 选择 `.project-memory/` 作为项目内存储目录（而非全局目录），原因：项目隔离天然实现
- 选择追加写而非覆盖写，原因：日志性质，不应丢失历史

---
```

### 4.6 INDEX.md 格式

```markdown
# Project Memory Index

| 日期 | Agent | 任务摘要 | 摘要文件 |
|------|-------|----------|----------|
| 2026-03-20 | architect-jax | 设计 project-memory skill 规范 | sessions/2026-03-20.md |
```

### 4.7 项目隔离机制

- **隔离单位**：每个项目的 `{project_root}/.project-memory/` 目录
- **天然隔离**：数据存储在项目目录内，不同项目的 `.project-memory/` 物理隔离
- **不需要额外的 namespace 或 project-id 机制**——目录即隔离
- **跨项目查询**：MVP 不支持。未来可通过全局索引聚合，但不在 v1 范围

---

## 5. 与 OpenClaw 原生 Memory 系统的边界

### 5.1 职责分离表

| 维度 | project-memory (本 skill) | OpenClaw 原生 memory |
|------|---------------------------|---------------------|
| **归属** | 项目级，跟项目走 | Agent 级，跟 agent 走 |
| **存储位置** | `{project_root}/.project-memory/` | `{agent_workspace}/memory/` + `MEMORY.md` |
| **内容类型** | 项目决策、任务摘要、阶段产出记录 | 个人偏好、工具配置、跨项目记忆 |
| **生命周期** | 随项目存在，项目结束可归档 | 随 agent 存在，长期持久 |
| **访问范围** | 同一项目的所有角色可读写 | 仅该 agent 自己读写 |
| **写入时机** | 任务完成时、阶段交付时 | 会话中随时、heartbeat 整理时 |
| **格式** | 结构化（YAML frontmatter + Markdown） | 自由格式 Markdown |

### 5.2 双向不侵入原则

1. **project-memory 不写入 agent workspace**：不碰 `memory/`、`MEMORY.md`、`HEARTBEAT.md`
2. **原生 memory 不写入项目目录**：不碰 `.project-memory/`
3. **交叉引用可以有**：agent 在 `MEMORY.md` 中可以写"参见 project-memory 中的 XX"，但不复制内容
4. **无数据同步**：两个系统之间不存在自动同步机制，避免一致性问题

### 5.3 配合方式

```
agent 完成任务
  ├─→ project-memory: 写入项目级摘要（"做了什么、决策了什么"）
  └─→ 原生 memory: 写入个人级笔记（"学到了什么、下次注意什么"）
```

**简单判断规则**：
- 其他角色需要知道的 → project-memory
- 只有自己需要知道的 → 原生 memory

### 5.4 与 memory-manager skill 的关系

- `memory-manager` 管理的是 agent 个人的三层记忆（episodic/semantic/procedural）
- `project-memory` 管理的是项目级共享沉淀
- 两者独立运行，不冲突
- 如果 agent 同时安装了两个 skill，按上述判断规则分流即可

---

## 6. MVP 范围（v0.1）

### 包含（Must Have）

| 能力 | 说明 |
|------|------|
| **会话摘要写入** | 任务完成时，追加写入当日 sessions 文件 |
| **共享索引维护** | 每次写入摘要后，同步更新 INDEX.md |
| **路径动态解析** | resolve-project-root.sh 实现四级优先级解析 |
| **SKILL.md** | 完整的触发条件和工作流程定义 |

### 不包含（Deferred）

| 能力 | 推迟原因 | 计划版本 |
|------|----------|----------|
| 每日聊天记录全量保存 | 存储量大，MVP 先验证摘要模式 | v0.2 |
| 跨项目全局搜索 | 需要全局索引聚合机制 | v0.3 |
| 自动压缩/归档 | 需要存储策略，MVP 数据量不足以触发 | v0.3 |
| Web UI 浏览 | 非核心能力 | v1.0+ |
| 语义搜索 | 需要嵌入模型支持 | v1.0+ |

### MVP 验收标准

1. agent 执行 `resolve-project-root.sh` 能正确返回项目路径（或明确失败）
2. 任务完成后，`.project-memory/sessions/YYYY-MM-DD.md` 中能看到格式正确的摘要
3. `INDEX.md` 与 sessions 目录内容一致
4. 两个不同项目的 `.project-memory/` 数据完全隔离
5. 不影响 `memory/` 和 `MEMORY.md` 的正常使用

---

## 7. 风险与备选方案

| 风险 | 影响 | 缓解策略 |
|------|------|----------|
| 多 agent 同时写入同一文件 | 内容交错或丢失 | 追加写 + 幂等 ID；未来可加文件锁 |
| 项目根路径解析错误 | 数据写入错误位置 | 宁可失败不猜测；显式报错 |
| 摘要质量参差不齐 | 索引价值降低 | schema.md 定义必填字段；后续可加校验 |
| 与原生 memory 边界模糊 | 数据重复或遗漏 | 明确判断规则："别人需要知道" vs "只有自己需要" |

---

## 8. 开放问题（待 Ryze 或团队确认）

1. **摘要写入是否需要 orchestrator 审批？** 当前设计为 agent 自主写入，无审批流。
2. **INDEX.md 增长到一定规模后是否需要分页？** MVP 暂不处理。
3. **`.project-memory/` 目录是否需要加入 `.gitignore`？** 建议不加——项目沉淀应该随代码版本管理。

---

*本文档为 Jax 的架构视角输出，待 Ryze 从代码实现和运行时细节角度补充完善。*
