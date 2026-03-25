# 文件契约 Schema + 对象注册表 V1

**作者**：贾克斯（架构师）  
**日期**：2026-03-19  
**状态**：一期基准，待团队确认  
**上游依赖**：  
- `2026-03-19-project-adjustment-v1.md`（方向收口）  
- `product-scope-v1.md`（产品边界）

---

## 1. 核心对象类型定义

### 1.1 通用字段约定

所有对象共享以下元数据字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 对象唯一标识，格式见各类型定义 |
| `type` | enum | ✅ | `brief` / `handoff` / `review` / `artifact` |
| `project` | string | ✅ | 归属项目标识，如 `office-console-enhanced` |
| `owner` | string | ✅ | 对象归属责任人字段，记录该对象当前责任角色代号；一期默认与创建者一致，如 `architect-jax` |
| `status` | enum | ✅ | `draft` / `active` / `done` / `archived` |
| `created_at` | string | ✅ | ISO 8601 格式，如 `2026-03-19T15:00:00Z` |
| `updated_at` | string | 可选 | 最后更新时间 |
| `tags` | string[] | 可选 | 自由标签，如 `["P0", "一期"]` |

### 1.2 对象 ID 引用锚点规则（P0 修订补充，2026-03-19）

> **对象 ID 是全项目唯一引用锚点。** 任何跨文档引用（包括事件日志 `object_id` 字段、交接文档 `artifacts` 列表、评审 `target_refs` 等）在引用已注册对象时，**必须直接使用注册表中该对象的 ID 原值**，格式必须完全一致，不得使用缩写、别名或自定义格式。
>
> - 合法引用示例：`artifact-20260319-01-event-log`（与注册表 ID 完全一致）
> - 非法引用示例：`artifact:event-log-v1`（冒号分隔格式未在 ID 规则中定义）
>
> 对于尚未注册为正式对象的系统级实体（如网关、项目本身），使用 `project` 字段标注归属即可，`object_id` 可填 `system-gateway`、`project-office-console-enhanced` 等，采用与对象 ID 相同的 **连字符分隔** 风格，不使用冒号。

### 1.2A 角色字段命名统一规则（P0 修订补充，2026-03-19）

- **`owner`**：仅用于对象类文档与注册表，表示该对象的**归属责任人**。
- **`source_role`**：仅用于事件日志，表示该事件的**来源角色/来源组件**。
- 二者不是同义词，不互相替代；控制台聚合时，**对象看 `owner`，事件看 `source_role`**。
- 两个字段的取值都应复用同一套角色代号风格，统一采用 **`{domain}-{codename}`** 或等价稳定连字符风格，例如 `architect-jax`、`product-ekko`、`backend-leona`、`orchestrator-teemo`、`system-gateway`。

### 1.3 Brief（任务摘要/工作简报）  

**用途**：启动一个任务时，由指挥官或上游角色创建，描述"要做什么、为什么、交给谁"。

**ID 规则**：`brief-{YYYYMMDD}-{序号}-{简称}`  
**示例**：`brief-20260319-01-file-schema`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | 任务标题 |
| `objective` | string | ✅ | 任务目标（一句话） |
| `background` | string | ✅ | 背景与上下文（为什么需要这个任务） |
| `scope` | string | ✅ | 范围边界（做什么 + 不做什么） |
| `assignee` | string | ✅ | 接收角色代号 |
| `due_date` | string | 可选 | 期望完成日期 |
| `dependencies` | string[] | 可选 | 前置依赖对象 ID 列表 |
| `deliverables` | string[] | ✅ | 期望交付物清单（文件路径或描述） |
| `acceptance_criteria` | string[] | 可选 | 验收标准 |
| `upstream_refs` | string[] | 可选 | 参考文档路径或对象 ID |
| `priority` | enum | 可选 | `P0` / `P1` / `P2` |

**状态流转**：`draft` → `active`（接收方确认后）→ `done`（交付物完成后）→ `archived`

---

### 1.4 Handoff（正式交接文档）

**用途**：一个角色完成阶段工作后，创建交接文档移交给下一个角色。替代消息传递，确保交接信息完整、可追溯。

**ID 规则**：`handoff-{YYYYMMDD}-{序号}-{from}-to-{to}`  
**示例**：`handoff-20260319-01-jax-to-leona`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | 交接标题 |
| `from_role` | string | ✅ | 交出方角色代号 |
| `to_role` | string | ✅ | 接收方角色代号 |
| `summary` | string | ✅ | 阶段工作摘要（做了什么、达成什么） |
| `artifacts` | string[] | ✅ | 本阶段产出物列表（文件路径或对象 ID） |
| `decisions` | string[] | 可选 | 本阶段做出的关键决策 |
| `open_issues` | string[] | 可选 | 未解决问题/已知风险 |
| `next_steps` | string[] | ✅ | 接收方需要做什么（具体行动项） |
| `context_refs` | string[] | 可选 | 接收方需要阅读的参考文档 |
| `blockers` | string[] | 可选 | 当前阻塞项（如有） |
| `brief_id` | string | 可选 | 关联的 brief 对象 ID |

**状态流转**：`draft` → `active`（正式发出交接）→ `done`（接收方确认接收）→ `archived`

---

### 1.5 Review（验收/评审报告）

**用途**：验收角色（通常是加里奥或提莫）对交付物进行评审，输出结论。

**ID 规则**：`review-{YYYYMMDD}-{序号}-{简称}`  
**示例**：`review-20260319-01-schema-v1`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | 评审标题 |
| `reviewer` | string | ✅ | 评审角色代号 |
| `target_refs` | string[] | ✅ | 被评审对象 ID 或文件路径 |
| `verdict` | enum | ✅ | `pass` / `conditional_pass` / `fail` / `needs_revision` |
| `summary` | string | ✅ | 评审总结 |
| `findings` | object[] | 可选 | 发现项列表，每项含 `severity`（`critical`/`major`/`minor`）、`description`、`suggestion` |
| `conditions` | string[] | 可选 | 条件通过时的附带条件 |
| `action_items` | string[] | 可选 | 需要修正的具体行动项 |
| `brief_id` | string | 可选 | 关联的 brief 对象 ID |

**状态流转**：`draft` → `active`（评审发出）→ `done`（结论生效）→ `archived`

---

### 1.6 Artifact（交付物）

**用途**：最终产出物的元数据登记。实际内容是文件本身（代码、文档、配置、方案），artifact 对象是它的"身份证"。

**ID 规则**：`artifact-{YYYYMMDD}-{序号}-{简称}`  
**示例**：`artifact-20260319-01-file-schema`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | 交付物标题 |
| `description` | string | ✅ | 交付物说明 |
| `file_paths` | string[] | ✅ | 实际文件路径列表（相对于项目根目录） |
| `format` | string | ✅ | 文件格式/类型，如 `markdown` / `json` / `typescript` / `yaml` |
| `version` | string | ✅ | 版本号，如 `v1` / `v1.1` |
| `author` | string | ✅ | 作者角色代号 |
| `brief_id` | string | 可选 | 关联的 brief 对象 ID |
| `review_id` | string | 可选 | 关联的 review 对象 ID（如已评审） |
| `supersedes` | string | 可选 | 本版本替代的旧版本 artifact ID |
| `changelog` | string | 可选 | 版本变更说明 |

**状态流转**：`draft` → `active`（正式发布）→ `done`（通过评审）→ `archived`（被新版本替代）

---

## 2. 对象注册表 V1

### 2.1 注册表文件位置

```
{project_root}/registry/objects.md
```

当前项目：`/root/.openclaw/workspace/projects/office-console-enhanced/registry/objects.md`

### 2.2 注册表字段

每条记录包含以下信息：

| 字段 | 说明 |
|------|------|
| 对象 ID | 唯一标识，遵循各类型 ID 规则 |
| 类型 | `brief` / `handoff` / `review` / `artifact` |
| 标题 | 简要标题 |
| 归属项目 | 项目标识 |
| Owner | 创建者角色代号 |
| 状态 | `draft` / `active` / `done` / `archived` |
| 创建时间 | ISO 8601 |
| 文件路径 | 对象文件的相对路径 |

### 2.3 注册表格式

使用 Markdown 表格，人机均可读。每个对象一行：

```markdown
| 对象 ID | 类型 | 标题 | 项目 | Owner | 状态 | 创建时间 | 文件路径 |
|---------|------|------|------|-------|------|---------|---------|
| artifact-20260319-01-adjustment | artifact | 项目调整方案V1 | office-console-enhanced | orchestrator-teemo | done | 2026-03-19 | docs/2026-03-19-project-adjustment-v1.md |
```

### 2.4 新增记录约定

1. 创建对象文件，按目录规范放入对应目录
2. 在 `registry/objects.md` 表格末尾追加一行
3. 初始状态设为 `draft`，由 owner 在发出时改为 `active`
4. 不需要向注册中心"申请"——写入即注册

### 2.5 查询活跃对象

- **全量查询**：直接读取 `registry/objects.md`
- **按状态筛选**：查找状态列为 `active` 的行
- **按角色筛选**：查找 Owner 列匹配的行
- **按类型筛选**：查找类型列匹配的行

一期不提供程序化查询接口，直接读文件 + grep 即可。

---

## 3. 目录结构规范

### 3.1 项目根目录结构

```
projects/{project-name}/
├── docs/                    # 文档类交付物
│   ├── briefs/              # brief 对象
│   ├── handoffs/            # handoff 对象
│   ├── reviews/             # review 对象
│   └── *.md                 # 一般文档（artifact 类型）
├── registry/                # 对象注册表
│   └── objects.md           # 注册表文件
├── src/                     # 源代码（如适用）
├── config/                  # 配置文件（如适用）
└── logs/                    # 事件日志（如适用）
```

### 3.2 必须目录

每个项目**必须**有的目录：

| 目录 | 用途 |
|------|------|
| `docs/` | 存放所有文档类对象 |
| `docs/briefs/` | brief 对象专属目录 |
| `docs/handoffs/` | handoff 对象专属目录 |
| `docs/reviews/` | review 对象专属目录 |
| `registry/` | 对象注册表 |

### 3.3 文件命名规则

**通用格式**：`{YYYY-MM-DD}-{简称}-{角色}-{类型}.md`

各类型具体规则：

| 类型 | 命名格式 | 示例 |
|------|---------|------|
| brief | `{YYYY-MM-DD}-{简称}-brief.md` | `2026-03-19-file-schema-brief.md` |
| handoff | `{YYYY-MM-DD}-{from}-to-{to}-handoff.md` | `2026-03-19-jax-to-leona-handoff.md` |
| review | `{YYYY-MM-DD}-{简称}-review-{角色}.md` | `2026-03-19-schema-review-galio.md` |
| artifact | `{YYYY-MM-DD}-{简称}-{角色}.md` | `2026-03-19-file-schema-jax.md` |
| 一般文档 | `{简称}-v{版本}.md` | `product-scope-v1.md` |

**规则**：
- 日期前缀确保按时间排序
- 角色代号使用简称（`jax`/`ekko`/`leona` 等），不用全名
- 版本号用 `v1`、`v2` 等，不用小数点（一期简化）
- 文件名全小写，用 `-` 连接

### 3.4 历史文档兼容

当前 `docs/` 下已有大量文档未按此规范命名。**一期不做迁移**，新文件从即日起遵循新规范，旧文件保持不动。

---

## 4. 复用性设计说明

### 4.1 三层归属

| 层级 | 内容 | 说明 |
|------|------|------|
| **通用层** | 4 类对象 Schema（brief/handoff/review/artifact）、ID 规则、状态枚举、注册表格式、目录结构规范、文件命名规则 | 可被任何 OpenClaw 项目直接使用，不含项目特定信息 |
| **可迁移层** | 注册表查询约定、对象间关联规则（brief_id 引用）、交接协议（from/to 角色约定） | 稍作配置（替换角色名、项目名）即可用于新项目 |
| **李琪项目专属** | 具体角色代号（jax/ekko/teemo 等）、飞书群 ID、当前已注册的具体对象实例、历史文档的兼容策略 | 仅在当前项目有效 |

### 4.2 通用设计要点

以下设计决策是**刻意为通用性做出的**：

1. **对象 ID 不含项目名**：ID 里有日期和序号，项目归属通过 `project` 字段记录。这样同一 ID 格式可跨项目使用。
2. **状态枚举统一为 4 个**：`draft/active/done/archived` 覆盖所有对象生命周期，不为特定对象类型增加特殊状态。
3. **注册表是纯文本 Markdown**：不依赖数据库、不依赖特定工具，任何文本编辑器都能读写。
4. **目录结构只规定骨架**：`src/` / `config/` / `logs/` 标记为"如适用"，不强制创建。

### 4.3 李琪项目专属内容

1. 角色代号沿用 LoL 体系（提莫/艾克/贾克斯等），通用层只规定"有 owner 字段"，不规定 owner 必须是什么。
2. 飞书群通知渠道是项目级配置，不写入 Schema。
3. 历史文档（`docs/` 下已有的 30+ 文件）的兼容策略是"新遵旧不改"，这是项目特定决策。

---

## 5. 一期不需要做的

以下能力明确列为**二期或更后**，一期只需约定格式：

| 能力 | 为什么推迟 | 预计期次 |
|------|-----------|---------|
| **Schema 自动验证** | 一期文件数量少，人工检查足够；自动验证需要写解析代码 | 二期 |
| **版本冲突检测** | 一期角色串行调度，不会出现并发写入同一文件 | 二期 |
| **并发写入保护（文件锁）** | 同上，串行调度规避 | 二期 |
| **对象状态自动流转** | 一期靠角色手动更新状态字段；自动流转需要事件触发机制 | 二期 |
| **注册表程序化查询 API** | 一期直接 grep 文件，够用；API 是控制台集成时的需求 | 二期 |
| **跨项目注册表聚合** | 当前只有一个项目，无"跨"的需求 | 三期 |
| **对象关联图谱可视化** | brief→handoff→review→artifact 的链路追踪，属于控制台高级功能 | 三期 |
| **对象模板（创建时自动填充）** | 有价值但非必要，一期角色直接写 Markdown | 二期 |
| **历史文档迁移** | 30+ 旧文档改名/移目录成本大于收益，不动 | 不做/按需 |
| **注册表变更日志** | 注册表本身的修改历史，一期靠 git log 追溯 | 二期 |

**一期的原则**：约定大于自动化。人能遵守的，不写代码强制。

---

## 附录 A：对象 Markdown 模板

### Brief 模板

```markdown
---
id: brief-YYYYMMDD-NN-{简称}
type: brief
project: {项目标识}
owner: {角色代号}
status: draft
created_at: YYYY-MM-DDTHH:MM:SSZ
---

# {任务标题}

## 目标
{一句话任务目标}

## 背景
{为什么需要这个任务}

## 范围
**做**：
- ...

**不做**：
- ...

## 接收方
{角色代号}

## 交付物
- [ ] {交付物1}
- [ ] {交付物2}

## 验收标准
- {标准1}
- {标准2}

## 参考文档
- {路径或链接}

## 优先级
{P0/P1/P2}
```

### Handoff 模板

```markdown
---
id: handoff-YYYYMMDD-NN-{from}-to-{to}
type: handoff
project: {项目标识}
owner: {交出方角色代号}
status: draft
created_at: YYYY-MM-DDTHH:MM:SSZ
---

# 交接：{标题}

## 交出方 → 接收方
{from_role} → {to_role}

## 阶段工作摘要
{做了什么、达成了什么}

## 产出物清单
- {文件路径或对象ID}

## 关键决策
- {决策1}

## 未解决问题
- {问题1}

## 接收方行动项
- [ ] {行动1}
- [ ] {行动2}

## 参考文档
- {路径}
```

### Review 模板

```markdown
---
id: review-YYYYMMDD-NN-{简称}
type: review
project: {项目标识}
owner: {评审角色代号}
status: draft
created_at: YYYY-MM-DDTHH:MM:SSZ
---

# 评审：{标题}

## 评审对象
- {对象ID或文件路径}

## 结论
{pass / conditional_pass / fail / needs_revision}

## 总结
{评审总结}

## 发现项
| 严重度 | 描述 | 建议 |
|--------|------|------|
| {critical/major/minor} | {描述} | {建议} |

## 条件（如有）
- {条件1}

## 行动项
- [ ] {行动1}
```

### Artifact 模板

```markdown
---
id: artifact-YYYYMMDD-NN-{简称}
type: artifact
project: {项目标识}
owner: {作者角色代号}
status: draft
created_at: YYYY-MM-DDTHH:MM:SSZ
version: v1
---

# {交付物标题}

## 说明
{交付物描述}

## 文件清单
- {相对路径1}
- {相对路径2}

## 格式
{markdown / json / typescript / yaml}

## 变更说明
{版本变更内容，首版可写"初始版本"}
```

---

*本文档由贾克斯（架构师）输出，作为一期文件契约和对象注册表的基准规范。*  
*变更需经提莫（项目指挥官）确认后生效。*  
*文档路径：`docs/file-schema-v1.md`*
