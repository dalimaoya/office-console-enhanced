# 项目组工厂（Project Factory）PRD 草稿

**作者：** Ekko（领航员·艾克）  
**日期：** 2026-03-20  
**状态：** 草稿，待架构评估  
**版本：** v0.1

---

## 1. Executive Summary

当前晨星号（Morning Star）团队已验证了 AI 多角色协作的可行性，但从零搭建一支新船队仍需手动配置大量文件（SOUL.md / IDENTITY.md / AGENTS.md / TOOLS.md / 飞书账号 / cron 等）。**项目组工厂**旨在将「创建一支 AI 协作船队」从手工活变为自动化流程——用户选择模板、填写参数、一键生成可运行的项目组实例。

**核心价值**：将新项目组的搭建时间从 2-4 小时缩短到 5 分钟以内。

---

## 2. Problem Statement

**Who**：想使用 OpenClaw 多角色协作系统的团队管理者或个人开发者。

**What**：当前创建新项目组需要：
1. 手动为每个角色创建 workspace 目录和配置文件（SOUL.md / IDENTITY.md / AGENTS.md / TOOLS.md / USER.md）
2. 手动配置飞书账号映射（accountId 绑定）
3. 手动设置角色间调度规则（L1→L2 subagent 配置）
4. 手动配置飞书群通知目标
5. 手动调整故事线命名和展示名
6. 缺乏标准化——每次从头写，质量参差不齐

**Why painful**：
- 配置文件多且相互关联，容易遗漏或不一致
- 新用户没有参考标准，不知道「好的角色定义」长什么样
- 无法快速复制已验证的团队结构给其他项目
- 故事线/皮肤切换需逐个文件修改，成本高

**Evidence**：晨星号团队已有 9 个角色 × 至少 5 个配置文件 = 45+ 个文件需要维护一致性。

---

## 3. Target Users & Personas

### Primary Persona：团队管理者（自建项目）
- 已了解 OpenClaw 基础能力
- 想为自己的新项目快速搭建 AI 协作团队
- 关注效率和一致性
- **JTBD**：「我想在 5 分钟内为新项目启动一支配置好的 AI 团队」

### Secondary Persona：平台运营者（给别人用）
- 管理多个项目组，需要标准化模板
- 关注可复用性和治理
- **JTBD**：「我想让新加入的团队能自助创建规范化的项目组」

### 非目标用户（v1 不考虑）
- 完全不了解 OpenClaw 的纯新手（需先有 Getting Started 引导）
- 需要高度定制化角色行为逻辑的高级用户（v2 考虑）

---

## 4. Strategic Context

**与现有架构的关系**：

| 现有文档 | 覆盖了什么 | 项目组工厂要补什么 |
|----------|-----------|-------------------|
| 三层架构（Jax） | L0/L1/L2 职责定义、通信规则 | 自动化实例化这些层的配置 |
| 身份映射规范（Jax） | agentId/accountId/展示名三层模型、命名规范 | 自动生成符合规范的 ID 和配置文件 |
| 故事线 v2（Lux） | 多船队框架、角色职称体系、创建新船队的手动流程 | 将「四步创建流程」自动化，角色模板标准化 |
| Getting Started（Jayce） | 使用说明、文档索引 | 一键实例化入口，降低上手门槛 |

**结论**：现有文档定义了「是什么」和「应该怎样」，项目组工厂解决「如何自动做到」。不是重复建设，而是自动化落地层。

**Why now**：
- 晨星号已验证模式可行，是抽象模板的最佳时机
- 即将有新项目需要创建船队，需求真实存在
- 手动配置的痛点已被团队充分体验

---

## 5. Solution Overview — 五大模块定义

### 模块 1：角色原型池（Role Archetype Pool）

**做什么**：维护一组标准化的角色配置模板，每个原型定义一类角色的完整配置。

**原型内容**：
```
archetype/
  navigator/           # 领航员（产品）
    SOUL.md            # 通用灵魂定义
    IDENTITY.md        # 角色身份模板（含占位符）
    AGENTS.md          # 工作规范
    TOOLS.md           # 工具配置模板
    USER.md            # 用户档案模板
    metadata.yaml      # 原型元数据（职责描述、技能要求、推荐 model）
  shipwright/          # 船匠（架构）
  sailmaster/          # 帆手（前端）
  engineer/            # 轮机长（后端）
  lookout/             # 瞭望员（QA）
  chartmaker/          # 海图师（设计）
  quartermaster/       # 补给官（办公）
  keeper/              # 守望者（运维）
  commander/           # 指挥官（总控）
```

**边界**：
- 原型是「模板」，不是「实例」——包含占位符（如 `{{ship_name}}`、`{{agent_name}}`）
- 原型池是只读参考，用户不直接修改原型；定制在实例化后进行
- 原型来源：从晨星号现有角色配置抽象提取

### 模块 2：项目组模板（Team Template）

**做什么**：定义一套完整项目组的角色组合 + 配置参数。

**模板结构**：
```yaml
# team-template: full-stack-fleet
name: 全栈船队
description: 包含完整前后端开发能力的标准项目组
roles:
  - archetype: commander
    count: 1
    required: true
  - archetype: navigator
    count: 1
    required: true
  - archetype: shipwright
    count: 1
    required: false    # 小项目可省略
  - archetype: sailmaster
    count: 1
    required: true
  - archetype: engineer
    count: 1
    required: true
  - archetype: lookout
    count: 1
    required: false
  - archetype: chartmaker
    count: 0           # 默认不含
    required: false
defaults:
  model: anthropic/claude-sonnet-4-20250514
  notification_channel: feishu
  skin: nautical        # 默认皮肤包
```

**预置模板**：
| 模板名 | 角色组合 | 适用场景 |
|--------|----------|----------|
| `full-stack-fleet` | 指挥官 + 领航员 + 船匠 + 帆手 + 轮机长 + 瞭望员 | 完整产品开发 |
| `lite-fleet` | 指挥官 + 领航员 + 帆手 + 轮机长 | 快速原型/小项目 |
| `solo-captain` | 指挥官 | 单人全能模式 |
| `content-crew` | 指挥官 + 领航员 + 海图师 + 补给官 | 内容/运营类项目 |

**边界**：
- 模板定义「结构」，不定义「内容」——具体项目名、角色名在实例化时填写
- 用户可基于预置模板自定义（增减角色）

### 模块 3：皮肤包（Skin Pack）🏷️ **v2**

**做什么**：提供故事线主题，影响 IDENTITY.md 中的展示名、emoji、叙事风格，不影响功能逻辑。

**预置皮肤**：
| 皮肤 | 主题 | 指挥官称呼 | 专业角色称呼示例 |
|------|------|-----------|----------------|
| `nautical` | 航海 | 指挥官 | 领航员/船匠/帆手 |
| `military` | 军队 | 指挥官 | 参谋/工程师/前锋 |
| `league` | 英雄联盟 | 队长 | 各英雄名 |
| `office` | 办公室 | 项目经理 | 产品经理/架构师/前端 |
| `custom` | 自定义 | 用户定义 | 用户定义 |

**为什么是 v2**：
- 核心功能（创建可运行的项目组）不依赖皮肤
- 当前 nautical 皮肤已硬编码在原型中，MVP 直接使用即可
- 皮肤切换需要额外的模板引擎能力，增加复杂度

### 模块 4：项目实例（Project Instance）

**做什么**：基于模板创建的具体项目组，包含所有运行时配置。

**实例目录结构**：
```
projects/{project-slug}/
  manifest.yaml           # 实例元数据（模板来源、创建时间、角色列表）
  agents/
    {ship-slug}-commander/
      SOUL.md / IDENTITY.md / AGENTS.md / TOOLS.md / USER.md
    {ship-slug}-navigator/
      ...
  shared/                 # 共享文件区
    docs/
    status/
  .project-memory/        # 项目记忆
```

**实例生命周期**：创建 → 运行 → 归档（v2 支持暂停/恢复）

**边界**：
- 实例创建后，用户可自由修改任何配置文件（脱离模板约束）
- 实例不自动同步模板更新（避免覆盖用户定制）
- 实例归档 = 将目录移至 `archived/` 并停用相关 cron/agent

### 模块 5：一键实例化（One-Click Instantiation）

**做什么**：自动化从模板选择到项目组可运行的全流程。

**用户操作流程**：

```
Step 1: 选择模板
  用户 → 选择 team template（如 full-stack-fleet）
       → 或从已有项目「克隆」

Step 2: 填写参数
  - 项目名（中文）: 破浪号
  - 项目 slug: storm-breaker
  - 飞书群 ID（可选）: oc_xxx
  - 角色调整（可选）: 去掉瞭望员 / 加一个轮机长

Step 3: 确认并创建
  系统自动执行：
  ├── 创建项目目录结构
  ├── 从原型池复制角色配置文件
  ├── 替换占位符（船队名/角色名/slug 等）
  ├── 生成 manifest.yaml
  ├── 配置 agent 运行时（OpenClaw agent 注册）
  ├── 配置飞书群通知目标
  └── 初始化 shared/ 和 .project-memory/

Step 4: 验证
  自动检查：
  ├── 所有角色配置文件存在且格式正确
  ├── agentId/accountId 无冲突
  ├── slug 全局唯一
  └── 飞书群可达（如配置了的话）

Step 5: 启动
  输出：「破浪号船队已就位，指挥官 storm-breaker-commander 待命。」
```

---

## 6. Success Metrics

| 指标 | 当前 | 目标（MVP） |
|------|------|------------|
| 新项目组搭建时间 | 2-4 小时（手动） | < 5 分钟 |
| 配置文件一致性错误 | 常见 | 0（自动校验） |
| 新用户首次创建成功率 | N/A | > 90% |
| 从模板到可运行 | 手动多步 | 一条命令 |

---

## 7. MVP 范围与优先级

### ✅ MVP（v1）包含

| 优先级 | 模块 | 范围 |
|--------|------|------|
| **P0** | 角色原型池 | 从晨星号提取 9 个标准原型（含占位符模板化） |
| **P0** | 一键实例化 | CLI 命令：`openclaw fleet create --template <name> --name <slug>` |
| **P1** | 项目组模板 | 2 个预置模板（full-stack-fleet / lite-fleet） |
| **P1** | 项目实例 | 目录结构生成 + manifest.yaml + 配置文件渲染 |
| **P2** | 实例校验 | 创建后自动检查文件完整性和 ID 唯一性 |

### 🔜 v2 推迟

| 模块 | 原因 |
|------|------|
| 皮肤包 | 核心功能不依赖，当前 nautical 主题已够用 |
| 从已有项目克隆 | 需要抽象「反向提取模板」逻辑，复杂度高 |
| 实例暂停/恢复/归档 | 生命周期管理，MVP 先关注「创建」|
| GUI 界面 | MVP 用 CLI，后续可加 Web UI |
| 模板市场/分享 | 需要远程存储和分发机制 |
| agent 运行时自动注册 | 依赖 OpenClaw API，MVP 先生成配置文件，手动注册 |

---

## 8. Out of Scope

- **角色行为逻辑定制**：项目组工厂管「配置文件生成」，不管角色运行时如何思考/行动（那是 SOUL.md 和 skill 的事）
- **飞书账号自动创建**：accountId 需要在飞书侧预注册，工厂只做映射配置
- **跨项目角色共享（运行时）**：v1 每个项目组的角色独立，不支持运行时借调
- **模型选择/计费管理**：模板可推荐模型，但实际选择和计费由 OpenClaw 运行时管理

---

## 9. Dependencies & Risks

### 依赖

| 依赖项 | 说明 | 风险等级 |
|--------|------|----------|
| 现有晨星号配置 | 原型池的提取来源 | 低（已存在） |
| OpenClaw agent 配置格式 | 生成的配置需要兼容运行时 | 中（格式可能演进） |
| 飞书 bot 账号 | 每个角色需要独立 accountId | 中（需要预注册） |
| 占位符模板引擎 | 简单的变量替换能力 | 低（可用 shell/Python 实现） |

### 风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| OpenClaw 配置格式不稳定 | 生成的配置可能不兼容新版本 | 模板中标注 OpenClaw 版本兼容性 |
| 原型抽象不够通用 | 模板太贴合晨星号，新项目难用 | 提取时刻意泛化，去除项目特定信息 |
| slug 命名冲突 | 多项目 slug 重复导致目录冲突 | 创建时校验全局唯一性 |

---

## 10. 与现有系统的集成点

```
项目组工厂
  │
  ├── 读取 → 角色原型池（archetype/）
  ├── 读取 → 项目组模板（templates/）
  ├── 生成 → 项目实例目录（projects/{slug}/）
  ├── 遵循 → 三层架构规范（L0/L1/L2 职责边界）
  ├── 遵循 → 身份映射规范（agentId/accountId/展示名）
  ├── 遵循 → 命名规则（{slug}-{职称标识}）
  ├── 对接 → OpenClaw 运行时（agent 配置加载）
  ├── 对接 → 飞书通知（群 ID 配置）
  └── 对接 → project-memory skill（.project-memory/ 初始化）
```

---

## 11. Open Questions

| # | 问题 | 影响 | 建议决策方 |
|---|------|------|-----------|
| 1 | 原型池存放位置：项目目录内 vs 全局 `~/.agents/archetypes/`？ | 决定原型是项目级还是全局级 | Jax（架构） |
| 2 | 一键实例化是 CLI 命令还是 agent 能力（让提莫执行）？ | 决定实现方式和用户入口 | Jax + Jayce |
| 3 | 飞书 bot 账号是否需要工厂自动注册，还是 MVP 先手动？ | 影响自动化程度 | Ryze（运维） |
| 4 | manifest.yaml 格式需要与 OpenClaw 运行时对齐吗？ | 决定是否需要 OpenClaw 侧适配 | Ryze（运维） |
| 5 | 是否需要「模板版本管理」？原型更新后已创建的实例怎么处理？ | 影响长期维护 | Ekko（v2 规划时决策） |

---

## 附录：决策记录

| 日期 | 决策 | 决策人 | 理由 |
|------|------|--------|------|
| 2026-03-20 | MVP 包含 3 个模块（原型池 + 模板 + 一键实例化），皮肤包推 v2 | Ekko | 核心价值是自动化创建，皮肤是锦上添花 |
| 2026-03-20 | MVP 用 CLI 实现，不做 GUI | Ekko | 目标用户是技术人员，CLI 足够且开发快 |
| 2026-03-20 | 原型从晨星号现有配置提取 | Ekko | 已验证的最佳实践，避免从零设计 |

---

*本文档由 Ekko（领航员·艾克）编制，待 Jax（船匠·贾克斯）架构评估后进入实施阶段。*
