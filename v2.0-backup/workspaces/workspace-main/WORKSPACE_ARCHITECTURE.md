# OpenClaw 工作区架构说明

## 目的

这个工作区是顶层协同与治理层。

- `main` 用作总控、编排与共享治理工作区。
- `main` 对应 Azir（沙漠皇帝），是平台级总控。
- 每个专业 agent 都有自己的独立工作区。
- 项目上下文统一放在 `projects/` 下。
- 长期共享知识统一放在 `shared/` 下。
- agent 的身份、职责、行为边界统一放在 `AGENTS.md`、`SOUL.md`、`USER.md`、`TOOLS.md` 等根文件里。

## 分层规则

### 1. 角色层

涉及文件：

- `AGENTS.md`
- `SOUL.md`
- `USER.md`
- `TOOLS.md`
- `IDENTITY.md`
- `HEARTBEAT.md`

这些文件只用于定义稳定的角色信息：

- 这个 agent 是谁
- 这个 agent 负责什么
- 这个 agent 如何协作
- 这个 agent 应避免什么

不要把某个具体项目的临时实现细节长期写在这些文件里，除非它已经变成固定规则。

### 2. 项目层

所有项目专属上下文都放在：

- `projects/<项目名>/`

推荐内容：

- `README.md`
- `STATUS.md`
- `DECISIONS.md`
- `TASKS.md`
- `handoff/`
- `docs/`
- `artifacts/`

### 3. 共享层

跨项目可复用的内容放在：

- `shared/standards/`
- `shared/templates/`
- `shared/routing/`

例如：

- 写作规范
- 命名规范
- 路由策略草案
- 可复用提示词
- 交付模板

### 4. 运行层

短期运行与交付流转内容放在：

- `inbox/`
- `outbox/`
- `runbooks/`
- `artifacts/`

这些目录分别用于：

- 待分拣输入
- 待发送输出
- 可重复执行的操作手册
- 生成产物

## 当前模型

### 主工作区

`/root/.openclaw/workspace`

职责：

- 系统总协调
- 跨 agent 治理
- 共享规范管理
- 多项目总览
- 全局消息通知与事项整理

说明：

- `main` 可以直接接收外部消息和指令
- `main` 负责平台规则治理、全局通知整理与升级接收
- 某些项目总控角色也可以直接接收本项目相关的外部消息
- 因此“工作区分层”和“消息入口个数”不是同一个问题

### 角色关系说明

- `main` / Azir：平台总控、总入口、规则治理者
- `agent-orchestrator-teemo`：办公增强项目指挥官
- specialist agents：办公增强项目执行角色
- `agent-heimerdinger`：独立折腾与沉淀角色

### 专业工作区

`/root/.openclaw/workspace-agent-*`

职责：

- 角色专属执行
- 该角色负责的项目工作
- 局部独立上下文

每个专业工作区都应该有自己的：

- `projects/`
- `shared/`
- `inbox/`
- `outbox/`
- `runbooks/`
- `artifacts/`

## 当前共享项目

- `projects/office-console-enhanced/`
- `projects/doc-processing/`

新增项目统一放入 `projects/`。

## 编辑规则

- 角色本身变化时，修改 `SOUL.md`
- 用户长期偏好变化时，修改 `USER.md`
- 项目变化时，修改对应项目目录内文件
- 不要把路由状态、凭据、运行态数据写进工作区说明文档
