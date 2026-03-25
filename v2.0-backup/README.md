# v2.0 Backup — 2026-03-25

**备份时间**: 2026-03-25 22:59 GMT+8  
**备份原因**: 准备重新定义平台、产品及所有角色职责

## 备份内容

### workspaces/
各角色 agent workspace 的核心设定文件：
- `SOUL.md` — 角色灵魂/人格设定
- `AGENTS.md` — 调度规则和工作规范
- `TOOLS.md` — 工具使用原则
- `IDENTITY.md` — 角色身份定义
- `USER.md` — 用户偏好记录
- `BOOTSTRAP.md` — 初始化规则
- `HEARTBEAT.md` — 心跳巡检规则
- `MEMORY.md` / `memory/` — 角色记忆文件

覆盖角色：
- orchestrator-teemo（项目总控）
- product-ekko（产品经理）
- architect-jax（架构师）
- frontend-ezreal（前端）
- backend-leona（后端）
- codingqa-galio（QA）
- ui-lux（UI设计）
- aioffice-jayce（办公顾问）
- technical-advisor-codex（技术顾问·瑞兹）
- twisted-fate（运营/数据）
- braum / heimerdinger / fullstack-viktor / product-swain / qa-bard（其余角色）
- workspace-main（主工作区配置）

### openclaw.json
平台级配置快照（含所有 agent 注册、模型路由、Feishu 集成配置）

### memory-db/
各角色 memory SQLite 数据库快照

## 对应代码版本
代码 tag: `v1.0-snapshot-2026-03-25`  
项目材料: `project-materials/` 目录（同 repo main 分支）
