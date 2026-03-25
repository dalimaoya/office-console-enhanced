# 🚀 Getting Started — 办公增强控制台

## What is this?

> **一套基于 OpenClaw 的 AI 多角色协作系统：你提需求，AI 船队自动分工协作完成任务。**

---

## 你是哪类读者？

### 🛠️ 想搭建这套系统

你需要：
1. `docs/2026-03-20-three-layer-arch-jax.md` — 三层架构说明，了解系统如何运转
2. `docs/2026-03-20-fleet-identity-mapping-jax.md` — 角色身份映射，搞清楚每个 Agent 怎么配置
3. `docs/fleet-role-titles.md` — 权威职称表，角色命名的唯一参考
4. `~/.agents/skills/project-memory/SKILL.md` — project-memory skill，Agent 跨任务记忆能力的使用方式

### 👀 想了解这套系统能做什么

你需要：
1. 先看本文档（5 步上手）
2. `docs/2026-03-20-fleet-storyline-v2-lux.md` — 故事线文档，用航海隐喻解释整套体系，读完即懂

---

## 5 步快速上手

**Step 1：明确你的目标**  
想让 AI 帮你做什么？一个功能需求、一份文档、一套系统？把目标说清楚就行。

**Step 2：找到提莫（指挥官）**  
所有任务从提莫（Orchestrator）开始，他负责接收需求、拆解任务、调度团队。不需要直接联系其他角色。

**Step 3：等船队协作**  
提莫会把任务分发给合适的 AI 角色（产品/架构/前端/后端/QA/UI……），他们各司其职、协作完成。

**Step 4：查看成果物**  
完成的文档、代码、方案会写入 `shared/` 目录下的对应位置，飞书群也会收到完成通知。

**Step 5：追加反馈或新任务**  
有修改意见？直接告诉提莫，他会安排跟进。循环迭代，直到你满意。

---

## 关键文档索引

| 文档 | 用途 |
|------|------|
| 📖 `docs/2026-03-20-fleet-storyline-v2-lux.md` | 故事线：用航海隐喻讲清整套体系的世界观和角色分工 |
| 🏗️ `docs/2026-03-20-three-layer-arch-jax.md` | 三层架构：L0 公会 / L1 指挥官 / L2 船员的系统设计 |
| 🪪 `docs/2026-03-20-fleet-identity-mapping-jax.md` | 角色身份映射：Agent 标识、账号、展示名如何对应 |
| 📋 `docs/fleet-role-titles.md` | 权威职称表：所有角色的中英文职称、标识符的唯一来源 |
| 🧠 `~/.agents/skills/project-memory/SKILL.md` | project-memory skill：Agent 如何跨任务保存和读取项目记忆 |

---

## 还是不知道从哪里开始？

直接告诉提莫：「我想做 XXX，帮我开始。」

他会问你需要知道的问题，其他的交给船队。

---

*本文档由 Jayce（补给官·杰斯）维护 · 2026-03-20*
