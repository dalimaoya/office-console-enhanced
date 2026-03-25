# 航海舰队故事线 v2 — 身份映射规范

> **作者**：Jax（architect-jax）  
> **日期**：2026-03-20  
> **状态**：正式生效（提莫+艾克+瑞兹三票通过）  
> **适用范围**：文档展示层与故事线命名，不影响运行时配置

---

## 1. 三层身份模型

瑞兹约束：agentId / accountId / 展示名 **三层必须分开，不能混用**。

| 层 | 用途 | 命名空间 | 示例 |
|----|------|----------|------|
| **agentId** | 技术配置标识，OpenClaw runtime 使用 | `agent-{role}-{name}` | `agent-orchestrator-teemo` |
| **accountId** | 飞书账号身份，消息发送鉴权 | `{role}-{name}` | `orchestrator-teemo` |
| **展示名** | 故事线叙事名称，群聊/文档中使用 | 自由文本（中/英） | 晨星号指挥官·提莫 |

**规则**：
- agentId 和 accountId 是**技术标识**，不随故事线切换而改变
- 展示名是**叙事层**，可随故事线版本演进
- 文档中引用角色时，优先使用展示名；配置/代码中使用 agentId

---

## 2. 舰队层级体系

| 层级 | 名称 | 职责 | 约束 |
|------|------|------|------|
| **L0** | 远洋公会 | 全局巡检、平台治理、跨船队协调 | **仅做治理，不滑成隐性总控层** |
| **L1** | 船队指挥官 | 项目总控、任务分派、阶段收口 | 每船队一位指挥官 |
| **L2** | 专业船员 | 具体执行：架构/产品/前端/后端/QA/设计/运维 | 对 L1 负责 |

---

## 3. 晨星号（Morning Star）完整映射

**船队 slug**：`morning-star`（全局唯一）

### L1 — 指挥官

| agentId | accountId | 展示名 | 职称 | 故事线命名 |
|---------|-----------|--------|------|------------|
| `agent-orchestrator-teemo` | `orchestrator-teemo` | 晨星号指挥官·提莫 | 指挥官 | `morning-star-commander` |

### L2 — 专业船员

| agentId | accountId | 展示名 | 职称 | 故事线命名 | 职责 |
|---------|-----------|--------|------|------------|------|
| `agent-pm-ekko` | `pm-ekko` | 领航员·艾克 | 领航员 | `morning-star-navigator` | 产品规划、需求分析、优先级 |
| `agent-architect-jax` | `architect-jax` | 船匠·贾克斯 | 船匠 | `morning-star-shipwright` | 模块划分、技术边界、架构设计 |
| `agent-frontend-ezreal` | `frontend-ezreal` | 帆手·伊泽瑞尔 | 帆手 | `morning-star-sailmaster` | 前端开发、UI 实现 |
| `agent-backend-leona` | `backend-leona` | 轮机长·雷欧娜 | 轮机长 | `morning-star-engineer` | 后端开发、API、数据层 |
| `agent-qa-galio` | `qa-galio` | 瞭望员·加里奥 | 瞭望员 | `morning-star-lookout` | 质量保障、验收测试 |
| `agent-design-lux` | `design-lux` | 海图师·拉克丝 | 海图师 | `morning-star-chartmaker` | UI 设计、设计规范 |
| `agent-aioffice-jayce` | `aioffice-jayce` | 补给官·杰斯 | 补给官 | `morning-star-quartermaster` | 办公提效、AI 办公工具调度 |
| `agent-devops-ryze` | `devops-ryze` | 灯塔守望者·瑞兹 | 灯塔守望者 | `morning-star-keeper` | 运维、部署、平台治理 |

### 职称标识对照

| 中文职称 | 英文标识 | 对应技术角色 |
|----------|----------|-------------|
| 指挥官 | commander | orchestrator |
| 领航员 | navigator | pm |
| 船匠 | shipwright | architect |
| 帆手 | sailmaster | frontend |
| 轮机长 | engineer | backend |
| 瞭望员 | lookout | qa |
| 海图师 | chartmaker | design |
| 补给官 | quartermaster | aioffice |
| 灯塔守望者 | keeper | devops |

---

## 4. L0 远洋公会角色定义

| 角色 | 职责范围 | 约束 |
|------|----------|------|
| 公会巡检使 | 跨船队健康巡检、异常上报 | 只读巡检，不下发执行指令 |
| 公会裁决官 | 跨船队资源冲突仲裁 | 仅在冲突时介入，不参与日常调度 |
| 公会记录员 | 全局日志归档、审计 | 被动记录，不主动干预 |

**红线**：L0 远洋公会**不可**：
- 绕过 L1 指挥官直接向 L2 船员下达任务
- 替代 L1 做任务分派或阶段收口
- 持有任何船队的项目上下文或决策权

---

## 5. 命名规则与 Slug 规范

### 船队 slug
- 格式：`{english-kebab-case}`，全局唯一
- 示例：`morning-star`、`iron-tide`、`silver-wave`
- 注册方式：在本文档或后续船队注册表中登记

### 故事线命名
- 格式：`{船队slug}-{职称标识}`
- 示例：`morning-star-navigator`、`iron-tide-commander`

### 一岗多人后缀规则
当同一船队同一职称需要多人时：
- 按专长后缀：`morning-star-sailmaster-api`、`morning-star-sailmaster-ui`
- 按序号后缀：`morning-star-engineer-01`、`morning-star-engineer-02`
- 优先用专长后缀，语义更清晰

---

## 6. 多船队扩展配置模板

新建船队时，复制以下模板并填写：

```markdown
## {船队中文名}（{Ship Name}）

**船队 slug**：`{slug}`
**项目**：{关联项目名}

### L1 — 指挥官
| agentId | accountId | 展示名 | 故事线命名 |
|---------|-----------|--------|------------|
| `agent-{role}-{name}` | `{role}-{name}` | {船队名}指挥官·{角色名} | `{slug}-commander` |

### L2 — 船员
| agentId | accountId | 展示名 | 职称 | 故事线命名 |
|---------|-----------|--------|------|------------|
| ... | ... | ... | ... | `{slug}-{职称标识}` |
```

---

## 7. 变更历史

| 日期 | 变更 | 决策人 |
|------|------|--------|
| 2026-03-20 | 航海舰队故事线 v2 正式落地，替代英雄联盟体系 | 提莫+艾克+瑞兹 投票通过 |

---

_本文档由 Jax（architect-jax / 船匠·贾克斯）编制，经舰队投票通过后生效。_
