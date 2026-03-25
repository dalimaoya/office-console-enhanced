# Ryze 投票：项目过程沉淀 skill

- 时间：2026-03-20 UTC
- 角色：Technical Advisor Ryze
- 结论：**有条件赞成**

## 1. 判断

我支持把“项目过程沉淀”做成 skill，**但前提是把它定义为一套写入约定 + 目录规范 + 轻量脚本/模板的封装**，而不是把它误判成 OpenClaw 原生的“共享持久化中台”。

如果目标是：
- 统一各角色的沉淀目录结构
- 降低项目复用成本
- 提供标准化摘要/日志写法
- 让不同 agent 更容易按同一规则落盘

那么 skill 可行，而且有价值。

但如果目标是：
- 自动拦截每个会话结束并强制写摘要
- 天然实现跨 agent / 跨项目 / 跨机器共享存储
- 可靠处理并发日志写入而无额外运行时配套

那么**单靠 skill 不够**，必须引入 hook、统一共享路径、甚至独立存储层，否则会高估 skill 能力。

## 2. 依据

### 2.1 OpenClaw skill 机制的能力边界

根据 OpenClaw 文档，skill 本质是一个包含 `SKILL.md` 的目录，用来给模型提供“何时触发、如何操作、该调用什么工具/脚本”的指令包；它不是独立运行时，也不是常驻服务。

已核对依据：
- `docs/tools/skills.md`
  - skill 加载位置分三层：`<workspace>/skills`、`~/.openclaw/skills`、bundled skills
  - 共享 skill 可放 `~/.openclaw/skills`，供同机所有 agent 看到
  - `SKILL.md` 变更由 watcher 在**下一次 agent turn**更新，不是即时全局热执行
- `docs/concepts/context.md`
  - skill 指令默认**不会自动注入**，而是模型在需要时再 `read` 它的 `SKILL.md`

这意味着：
1. **skill 可以指导文件操作**：让 agent 用 `read/write/edit/exec` 去读写项目目录、生成摘要、追加日志。
2. **skill 可以复用**：放在 `~/.openclaw/skills` 可跨同机 agent 复用；放项目内 `skills/` 可项目级覆盖。
3. **skill 不能天然提供后台自动化**：它不会自己在“会话结束时”运行，除非有额外 hook/命令/明确触发点。
4. **skill 不能天然解决跨机器共享**：它只是规则包，不是存储后端。

### 2.2 能否支撑“跨会话持久化存储”和“日志式记录”

**能部分支撑，但要区分“持久化”与“自动化”。**

- **持久化**：可以。只要 skill 指导 agent 写入磁盘目录，文件自然跨会话存在。
- **日志式记录**：可以。skill 可约定 `logs/YYYY-MM-DD.md`、`sessions/<agent>/<date>.md` 等格式，让 agent 追加写入。
- **自动在会话结束写入**：单靠 skill 不可靠。因为 skill 不是结束事件的原生 handler。

OpenClaw 已有接近需求的原生能力：
- `docs/automation/hooks.md`：内置 `session-memory` hook，可在 `/new` 时把会话上下文写到 workspace 的 `memory/`
- `docs/concepts/memory.md`：OpenClaw 有 `memory/YYYY-MM-DD.md` 与 `MEMORY.md` 两层记忆模型
- `agents.defaults.compaction.memoryFlush` 可在压缩前静默提醒模型把持久信息写入 `memory/YYYY-MM-DD.md`
- `docs/gateway/security/index.md`：会话 transcript 本来就保存在 `~/.openclaw/agents/<agentId>/sessions/*.jsonl`

所以：
- **跨会话落盘**：OpenClaw 原生就支持一部分
- **聊天日志持久化**：OpenClaw session jsonl 已存在
- **项目级结构化沉淀**：这是新 skill 可以补位的地方

### 2.3 实现可行性与技术风险

#### 风险1：路径冲突 / 路径漂移

如果 skill 只是写“把内容存到某个共享目录”，但没有严格定义：
- 项目标识如何命名
- 共享根目录如何解析
- 是相对当前 workspace，还是绝对共享目录

就会出现：
- 不同 agent 写到不同目录
- 项目 rename 后目录失联
- workspace skill 与 managed skill 的同名覆盖行为造成规则漂移

建议：skill 只负责**规则**，真实共享根目录必须由一个固定配置决定，例如：
- `PROJECT_ARCHIVE_ROOT=/root/.openclaw/workspace/projects`
- 项目标识显式传入，如 `office-console-enhanced`

#### 风险2：并发写入

多个 agent 同时写同一份 `CURRENT.md` / `daily-log.md` 时，会有：
- 互相覆盖
- edit 精确替换失败
- append 顺序错乱

skill 本身不提供锁。

建议：
- 正式状态文件采用“单写者”模式（如 only owner/orchestrator 汇总）
- 角色沉淀采用“分文件写入”模式，如：
  - `reviews/2026-03-20-ryze-*.md`
  - `handoffs/2026-03-20-ezreal-*.md`
- 日志采用“按 agent/日期分片”，避免多人抢同一个文件
- 必要时配套小脚本做 `flock` 或原子追加，而不是直接让多个 agent edit 同一文件

#### 风险3：技能加载时机

skill 被看到，不等于被执行。

OpenClaw 的 skill 是“按需读入”的；即使有 watcher，`SKILL.md` 更新也只是**下一轮**可见。若想依赖它做关键收口动作，存在：
- agent 没触发 skill
- agent 忘记读 skill
- 子 agent 场景下只注入部分 workspace 文件，项目规则不在默认上下文中

所以关键流程不能只靠“希望模型记得”。

建议把关键入口显式化：
- 约定命令：`/project-log`、`/project-handoff`
- 或在 AGENTS.md / 项目规则中明确“结束前必须调用项目过程沉淀 skill”
- 真正要自动化，就用 hook，而不是只写 skill

#### 风险4：共享范围被高估

`~/.openclaw/skills` 能做到的是**同机共享 skill**，不是“所有环境共享存储”。

skill 可以跨项目复用，但它写到哪里，仍取决于当前机器文件系统。如果以后迁移到：
- 多台宿主机
- 云端与本地混合
- 沙箱只读 / 无共享挂载

就会失效或割裂。

因此该方案应被定义为：
**“同一 OpenClaw 部署内的标准化项目沉淀协议”**，不要宣传成通用分布式知识底座。

### 2.4 与现有 memory 系统的关系

我的判断：**它应是补充，不应替代 memory。**

OpenClaw memory 的职责已很清楚：
- `MEMORY.md`：长期稳定事实、偏好、决策
- `memory/YYYY-MM-DD.md`：每天的运行性笔记
- memory search 对这两类文件有原生索引与召回支持

如果“项目过程沉淀 skill”也再搞一套：
- 项目摘要
- 每日记录
- 长期事实

那就会和原生 memory 发生职责重叠，最终出现两套系统打架：
- 同一事实写 memory 还是写项目 docs？
- 搜索时命中 memory，但项目正式文件没更新
- 正式结论写在项目区，agent 只记得 memory 中旧摘要

### 建议的职责切分

**OpenClaw memory：面向 agent 自身连续性**
- 个人/角色长期偏好
- 近期运行上下文
- 需要语义召回的零散事实

**项目过程沉淀 skill：面向项目协作与正式交接**
- 项目 status / handoff / review / advisory / meeting note
- 对外一致口径的正式文档
- 多角色可查阅的项目级归档

一句话：
- **memory 是“让 agent 记住”**
- **项目沉淀 skill 是“让团队留档”**

避免打架的关键规则：
1. 项目正式事实以项目目录为准
2. memory 只存“指针 + 辅助上下文”，不复制整份项目文档
3. skill 写入项目文件后，如确有必要，只在 memory 留一句索引：
   - “2026-03-20：已对项目过程沉淀 skill 方案给出顾问意见，见 `projects/office-console-enhanced/docs/...`”

## 3. 最小可行方案（MVP）

### 我建议的最小实现路径

#### 第1步：先做 skill，不做平台级自动化

在 `~/.openclaw/skills/project-archive/` 放一个共享 skill：
- `SKILL.md`：定义何时使用、目录协议、写作模板、文件命名规范
- 可选 `scripts/append-log.sh`：做安全追加
- 可选 `references/schema.md`：说明 status/tasks/reviews/docs/artifacts/logs/handoffs 各自用途

#### 第2步：只解决“标准化落盘”，不解决“全自动收口”

先支持 3 个动作：
1. **写会话摘要** → `docs/` 或 `handoffs/`
2. **写每日项目日志** → `logs/YYYY-MM-DD/<agent>.md`
3. **写正式评审/决策建议** → `reviews/` 或 `docs/`

不要第一版就承诺：
- 自动在所有会话结束执行
- 自动抓取完整聊天 transcript
- 自动合并多 agent 日志

#### 第3步：目录结构建议

```text
projects/<project>/
  status/
  tasks/
  reviews/
  docs/
  handoffs/
  artifacts/
  logs/
    2026-03-20/
      technical-advisor-ryze.md
      frontend-ezreal.md
      backend-leona.md
```

关键点：
- **日志按日期+agent 分片**，避免并发覆盖
- **正式文档单独目录**，不要把日志和结论混写

#### 第4步：自动化若要做，放到 hook 第二阶段

若后续验证该 skill 有价值，再增加 hook：
- 在 `/new`、会话收尾命令、或特定 slash command 时触发沉淀
- 由 hook 调用固定脚本，把 session 元信息整理后落盘

这样分层最稳：
- **skill 负责规范和人工可控触发**
- **hook 负责自动事件触发**
- **memory 负责 agent 记忆**

## 4. 建议动作

1. **批准做 MVP，但收窄目标**
   - 不叫“跨角色共享存储系统”
   - 叫“项目过程沉淀规范 skill”更准确

2. **先明确职责边界文档**
   - memory 写什么
   - 项目沉淀区写什么
   - session jsonl 什么时候引用、什么时候不复制

3. **第一版只做同机共享**
   - skill 放 `~/.openclaw/skills`
   - 项目根目录继续在统一共享盘/固定根路径下
   - 不要第一版就抽象到多机

4. **采用“分片日志 + 单写者正式状态”**
   - 日志分文件
   - `CURRENT.md` 这类汇总文件只允许 owner/orchestrator 改

5. **第二阶段再评估 hook 自动化**
   - 先验证 1~2 周实际使用收益
   - 若人工触发经常漏，再补自动机制

## 5. 投票理由

### 投票：**有条件赞成**

**赞成点：**
- 能把当前“深度依赖本机固定路径的经验做法”抽象成可复用协作协议
- 能降低多项目复制规则的成本
- 能补足 OpenClaw 原生 memory 不擅长的“项目正式交接文档”层

**保留条件：**
- 不能把 skill 误当作自动化框架或共享存储中台
- 必须和 memory 系统做职责切分
- 必须避免多人并发写同一文件
- 第一版必须从轻量规范化方案起步，不要一步到位做复杂自动归档

## 6. 核对来源

- `/root/.local/share/pnpm/global/5/.pnpm/openclaw@2026.3.13_@napi-rs+canvas@0.1.96_@types+express@5.0.6_node-llama-cpp@3.16.2/node_modules/openclaw/docs/tools/skills.md`
- `/root/.local/share/pnpm/global/5/.pnpm/openclaw@2026.3.13_@napi-rs+canvas@0.1.96_@types+express@5.0.6_node-llama-cpp@3.16.2/node_modules/openclaw/docs/concepts/memory.md`
- `/root/.local/share/pnpm/global/5/.pnpm/openclaw@2026.3.13_@napi-rs+canvas@0.1.96_@types+express@5.0.6_node-llama-cpp@3.16.2/node_modules/openclaw/docs/automation/hooks.md`
- `/root/.local/share/pnpm/global/5/.pnpm/openclaw@2026.3.13_@napi-rs+canvas@0.1.96_@types+express@5.0.6_node-llama-cpp@3.16.2/node_modules/openclaw/docs/gateway/security/index.md`
- `/root/.openclaw/workspace/projects/office-console-enhanced/status/CURRENT.md`
- `/root/.openclaw/workspace/projects/office-console-enhanced/DECISIONS.md`
