# CC 深度产品分析：高价值借鉴功能清单

**作者**：Ekko（product-ekko）  
**日期**：2026-03-19  
**来源**：https://github.com/TianyiDataScience/openclaw-control-center  
**参考旧报告**：`2026-03-18-cc-analysis-product-ekko.md`（本次做更深入分析，旧报告可作补充）  
**分析目标**：产出按优先级排序的功能借鉴清单，指导后续迭代方向

---

## 一、CC 完整功能地图

### 1.1 页面/分区路由全景（12个）

| section | 页面名称 | 核心定位 |
|---------|---------|---------|
| `overview` | 总览/指挥台 | 系统当前健康状态的一句话入口 |
| `team` | 员工/Staff | 谁真的在工作 vs. 只是排队待命 |
| `collaboration` | 协作 | agent 之间如何交接与通信 |
| `memory` | 记忆工作台 | 各 agent 记忆是否可用、可搜索 |
| `docs` | 文档工作台 | 核心 markdown 文档的读写工作台 |
| `usage-cost` | 用量与花费 | token 消耗、花费、订阅窗口 |
| `projects-tasks` | 任务与项目 | 任务看板 + 审批 + 执行链 + 运行证据 |
| `alerts` | 告警中心 | 三级告警 + 确认机制 |
| `replay-audit` | 回放与审计 | 执行时间线 + 会话回放 |
| `settings` | 设置/控制室 | 安全模式、接线状态、风险摘要 |
| `calendar` | 日历视图 | 任务的时间线日历视图（tasks子视图） |
| `office-space` | 像素办公室 | 可视化像素风格办公室（趣味交互层） |

### 1.2 各页面子功能明细

#### Overview（总览）
- **KPI 告警卡片组**（5张）：审阅队列 / 运行异常 / 停滞执行 / 预算风险 / 今日用量
- **Executive 摘要卡片**（6项）：Projects / Tasks / Agents / Budget / Subscription / System health
- **Staff 精简卡片**：各 agent 当前"正在做什么"摘要
- **需要你介入**区域：待审批 + 超预算 + 阻塞会话（decision-list）
- **告警计数摘要**：info N / warn N / action-required N
- **数字计数动画**：KPI 数字从 0 递增到目标值

#### Staff（员工）
- **四区域办公室布局**：Builder Desks / Approval Desk / Support Bay / Standby Pods
- **Agent 卡片**：像素头像 + 状态 badge + 名称 + 当前重点 + 活跃会话数
- **5 种运行状态**：idle / running / blocked / waiting_approval / error
- **状态分区展示**：活跃区 / 等待区 / 阻塞区 / 待机区

#### Collaboration（协作）—— **旧报告未深入分析**
- **父子会话接力视图**：谁发起了子任务、谁接单、谁在等
- **跨会话通信视图**：sessions_send / inter-session message 已验证记录
- **通信方向图**：如 Main ⇄ Pandas 这类双向通信可视化
- **等待节点定位**："协作现在卡在谁这里"

#### Memory（记忆）—— **旧报告未深入分析**
- **记忆工作台**：可视化查看各 agent 的日记忆和长期记忆文件
- **记忆状态卡片**（新增）：每个 agent 的记忆健康状态 → 可用 / 可搜索 / 需检查
- **范围跟随 openclaw.json**：已删除 agent 不继续显示
- **直接读写源文件**：修改后保存写回真实 memory 文件

#### Documents（文档）
- **文档工作台**：共享文档 + agent 核心文档（SOUL.md、USER.md 等）的读写界面
- **client-side 实时搜索**：`data-file-search` 属性 + JS 内联筛选
- **文件名过滤器**：`<input data-file-filter>` 路径过滤
- **直接写回源文件**：打开的是真实源文件，保存直接写回

#### Usage（用量）
- **今日 / 7日 / 30日 用量趋势**
- **订阅窗口 + 配额消耗**
- **CSS conic-gradient 饼图**（无第三方依赖）：按 agent/project/task/model/provider/session-type/cron 多维拆分
- **Context Pressure Card**（新增）：每个 agent 的上下文使用百分比 + 速率 + 阈值
- **连接器状态**：数据源是否接通
- **时间段 segment switch**：今日 / 累计切换

#### Tasks/Projects（任务）
- **看板视图**（board）：Todo / In Progress / Blocked 三泳道
- **分组列表视图**（group-list）：带日期、owner、badge 的详细列表
- **快速筛选器**（quick-chip）：Everything / Needs Attention / Ready / In Motion / Blocked / Completed
- **定义完成标准**（definitionOfDone）：每个任务有明确的完成判定清单
- **执行链视图**：任务 → 会话 → 命令的完整链条
- **运行证据区**：区分"只是计划了"和"已有真实执行记录"
- **审批队列**：pending 审批请求，带 command + agent + badge
- **任务交付物**（artifacts）：code / doc / link / other 类型标注
- **回滚计划**（rollback）：每个任务附带 strategy + steps + verification

#### Alerts（告警）
- **ExceptionFeed**：告警条目流（info / warn / action-required 三级）
- **Action Queue**：待处理决策队列，每项有 `acknowledged` 状态
- **确认机制**（ack）：确认 + 有效期 + 过期后重新显示
- **告警来源分类**：system / session / approval / budget / task
- **告警代码类型**：SESSION_BLOCKED / SESSION_ERROR / PENDING_APPROVAL / OVER_BUDGET / TASK_DUE / NO_SESSIONS

#### Replay & Audit（回放与审计）—— **旧报告未涉及**
- **Timeline Log**：按时间顺序的执行事件流
- **会话回放**：查看历史会话的操作轨迹
- **Diff 摘要**：两次快照之间的变化摘要（formatDiffSummary）

#### Settings（设置）
- **安全模式显示**：当前 READONLY_MODE / AUTH / 高风险写操作状态
- **Connection Health Card**（新增）：接线状态，哪些已连 / 哪些缺 / 去哪里补
- **Security Risk Summary**（新增）：当前风险 + 影响 + 下一步建议，翻译成人话
- **Update Status Card**（新增）：当前版本 / 最新版本 / 更新通道 / 安装方式
- **连接器状态汇总**

### 1.3 数据模型层关键类型

| 类型 | 描述 |
|------|------|
| `AgentRunState` | idle / running / blocked / waiting_approval / error |
| `ProjectTask` | 含 definitionOfDone、artifacts、rollback、budget、sessionKeys |
| `BudgetEvaluation` | scope=agent/project/task，含 status=ok/warn/over |
| `ExceptionFeedItem` | 含 level、code、route，三级告警 |
| `ActionQueueItem` | 含 acknowledged、ackExpiresAt、links，决策队列 |
| `ReadinessScoreSnapshot` | 4维度就绪度评分：observability/governance/collaboration/security |
| `DoneChecklistItem` | 完成核查清单，per-item status=pass/warn/fail |
| `ExportBundle` | 完整数据导出（phase-9 schema），含 sessions/projects/tasks/budgets/exceptions |
| `SessionStatusSnapshot` | 含 model、tokensIn、tokensOut、cost |
| `CronJobSummary` | 定时任务列表，含 enabled、nextRunAt |

---

## 二、与我们控制台的 Gap 分析

### 2.1 我们有什么

基于 `2026-03-17-reconstruction-product-spec-ekko.md`，我们已定义的 8 个分区：

| 分区 | 我们的状态 | 优先级 |
|------|---------|--------|
| Overview | 定义中，部分实现（基础 KPI） | P0 |
| Staff | 定义中，无卡片，仅文字列表 | P0 |
| Tasks | 定义中，用飞书表格替代，无看板 | P0 |
| Usage | 定义中，无可视化 | P1 |
| Documents | 定义中，基础文件浏览 | P1 |
| Settings | 定义中，无高级卡片 | P2 |
| Memory | 定义中，无工作台 | P2 |
| Collaboration | 仅有概念，无实现 | 未定义 |

### 2.2 CC 有而我们没有

| CC 功能 | 我们缺失 | 用户价值 | 实现复杂度 |
|--------|---------|---------|---------|
| **Collaboration 独立分区** | 完全没有 | ⭐⭐⭐⭐⭐ | 高 |
| **ReadinessScore 4维度评分** | 完全没有 | ⭐⭐⭐⭐ | 中 |
| **Context Pressure Card** | 完全没有 | ⭐⭐⭐⭐ | 低 |
| **Memory 状态卡片** | 完全没有 | ⭐⭐⭐⭐ | 低 |
| **Connection Health Card** | 完全没有 | ⭐⭐⭐⭐ | 低 |
| **Security Risk Summary** | 完全没有 | ⭐⭐⭐ | 低 |
| **Update Status Card** | 完全没有 | ⭐⭐⭐ | 低 |
| **Action Queue + Ack 机制** | 无确认机制 | ⭐⭐⭐⭐⭐ | 中 |
| **Replay & Audit** | 完全没有 | ⭐⭐⭐ | 高 |
| **Calendar 日历视图** | 完全没有 | ⭐⭐⭐ | 中 |
| **DoneChecklist 核查清单** | 完全没有 | ⭐⭐⭐⭐ | 低 |
| **ExportBundle 数据导出** | 完全没有 | ⭐⭐⭐ | 中 |
| **KPI 数字计数动画** | 无 | ⭐⭐ | 低 |
| **执行链视图（任务→会话→命令）** | 无 | ⭐⭐⭐⭐ | 高 |
| **像素头像 Agent 识别** | 无 | ⭐⭐ | 中 |
| **三栏布局 Inspector Sidebar** | 无 | ⭐⭐⭐⭐ | 低 |
| **快速筛选 quick-chip（URL驱动）** | 无 | ⭐⭐⭐⭐ | 低 |
| **CSS conic-gradient 饼图** | 无 | ⭐⭐⭐ | 低 |
| **任务 definitionOfDone 清单** | 无 | ⭐⭐⭐⭐ | 低 |
| **任务 Rollback Plan 字段** | 无 | ⭐⭐⭐ | 低 |

### 2.3 我们有但 CC 不如我们的

| 我们的优势 | 说明 |
|-----------|------|
| **飞书消息推送集成** | CC 无消息推送，我们有飞书 bot 推关键事件 |
| **多 agent 真实调度** | CC 是"看板"，我们有真实 agent 运行基础设施 |
| **Feishu 入口统一** | 飞书作为统一入口，CC 没有 |

---

## 三、高价值借鉴功能（按优先级排序）

> 评分维度：用户价值（对 AI 效率型专业用户）× 实现复杂度（越低越快落地）

### 🔥 P0：立即借鉴（本迭代，高价值 + 低实现成本）

#### P0-1：Action Queue + Ack 确认机制
**CC 实现**：告警条目有 `acknowledged` 状态，`ackExpiresAt` 过期后重新显示，支持 `POST /api/action-queue/:id/ack`  
**用户价值**：专业用户需要"处理了就标记，不处理会提醒"——飞书消息是一次性的，控制台告警需要状态持久化  
**实现复杂度**：低（一个 JSON 文件存储 ack 状态，前端渲染已确认/未确认两态）  
**我们对应区域**：Overview 介入区 + 告警中心  
**借鉴要点**：
- `ActionQueueItem` 数据模型（level + code + sourceId + acknowledged + ackExpiresAt）
- 两态 UI：未确认（红色 + 确认按钮）/ 已确认（灰色 + "已确认 · 到期日"）
- ack 有效期机制：过期后自动重新高亮

#### P0-2：Context Pressure Card（上下文压力卡片）
**CC 实现**：专门一张卡片显示每个 agent 的 context 使用百分比 + 速率 + 当前模型  
**用户价值**：AI 效率型用户最关注"context 快满了"——这直接影响执行质量和费用  
**实现复杂度**：低（SessionStatusSnapshot 已有 tokensIn/tokensOut，除以模型上限得百分比）  
**我们对应区域**：Usage 页 / Inspector Sidebar  
**借鉴要点**：
```
Agent | Session | Model | 上下文使用% | 速率 | 阈值
product-ekko | session-xxx | claude-3.7 | 42% ████░░░░ | 适中 | >80% 警告
```

#### P0-3：三栏布局 + Inspector Sidebar
**CC 实现**：`app-shell = sidebar + panel + inspector-sidebar`，宽屏常驻，可折叠，`localStorage` 持久化  
**用户价值**：AI 效率型用户多窗口并行，右侧 inspector 常驻"活跃会话/用量/告警"大幅减少页面切换  
**实现复杂度**：低（CSS 布局 + localStorage）  
**我们对应区域**：全局布局  
**借鉴要点**：
- 右侧 inspector 固定展示：活跃会话数 / 今日用量 / 未确认告警数
- 折叠状态 key: `openclaw:inspector-collapsed:v1`
- 宽度阈值 1320px 才默认展开

#### P0-4：ReadinessScore 4维度就绪度评分
**CC 实现**：`ReadinessScoreSnapshot` 含 overall score + 4个维度（observability / governance / collaboration / security）  
**用户价值**：专业用户关注"我的系统现在整体健康度"，一个综合评分比看 5 个 KPI 更直观  
**实现复杂度**：中（需要定义评分规则，但展示层简单——一个仪表盘 + 4 个维度分）  
**我们对应区域**：Overview 页  
**借鉴要点**：
- 4 维度：可观测性 / 治理 / 协作 / 安全
- 展示方式：中央大分数（如 78/100）+ 四象限细分
- 每个维度有 pass/warn/fail 的 checklist 支撑

#### P0-5：DoneChecklist 完成核查清单
**CC 实现**：`DoneChecklistItem` 含 category + status=pass/warn/fail + detail + docRef  
**用户价值**：专业用户需要知道"这个任务到底完了没"——不是靠 badge，而是逐项核查  
**实现复杂度**：低（任务模型添加 checklist 字段，UI 渲染勾选列表）  
**我们对应区域**：Tasks 页任务详情  
**借鉴要点**：任务的 `definitionOfDone: string[]` → 前端渲染为带状态的 checklist

---

### 🌟 P1：本轮迭代末完成（高价值 + 中实现成本）

#### P1-1：Collaboration 独立分区（Agent 协作视图）
**CC 实现**：独立页面展示父子会话接力 + 跨会话通信，"谁传给了谁、现在卡在谁这里"  
**用户价值**：运行多 agent 团队的用户最痛点之一——看不清"这件事现在到底在哪里"  
**实现复杂度**：高（需要 session relay 数据、跨会话 message 记录、可视化图）  
**我们对应区域**：新建 Collaboration 分区  
**借鉴要点**：
- 父子会话列表：parent session → child sessions，带时间戳和状态
- 跨会话通信记录：sessions_send 发出方 / 接收方 / 消息内容 / 状态
- "等待节点"高亮：当前协作卡在哪个 session

#### P1-2：执行链视图（任务 → 会话 → 命令）
**CC 实现**：`sessionKeys: string[]` 关联任务与会话，展示完整执行证据链  
**用户价值**：区分"只是计划了"和"真的在跑"——AI 效率型用户最需要的真实执行证明  
**实现复杂度**：高（需要 session-task 关联数据）  
**我们对应区域**：Tasks 页任务详情  
**借鉴要点**：
- 每个任务底部展示关联 sessionKeys
- 每个 sessionKey 展示当前状态（idle/running/blocked）
- "运行证据"vs"计划" 在 UI 上明确区分

#### P1-3：Settings 三张新卡片
**CC 实现**：Connection Health / Security Risk Summary / Update Status  
**用户价值**：AI 效率型用户需要"5 秒知道哪里没接好" + "当前风险是什么"  
**实现复杂度**：低（读取 .env 状态 + Gateway 健康检查 + 版本文件）  
**我们对应区域**：Settings 页  
**借鉴要点**：
- Connection Health：每个数据源（Gateway / openclaw.json / 飞书）展示 ✅已连 / ⚠️部分 / ❌未连
- Security Risk Summary：高风险开关状态翻译成人话（"APPROVAL_ACTIONS_ENABLED 当前关闭，风险：低"）
- Update Status：当前版本 / 最新版本（可配置是否展示）

#### P1-4：Memory 状态卡片
**CC 实现**：每个 agent 的记忆是否可用 / 可搜索 / 需检查  
**用户价值**：AI 效率型用户依赖 agent memory，记忆失效直接影响工作质量  
**实现复杂度**：低（扫描 memory 目录 + 文件大小/日期/格式校验）  
**我们对应区域**：Memory 页 / Overview 右侧 Inspector  
**借鉴要点**：
```
Agent | 记忆文件 | 状态 | 最后更新
product-ekko | MEMORY.md | ✅ 可用 | 2026-03-18
architect-jax | MEMORY.md | ⚠️ 过旧（14天）| 2026-03-05
```

---

### 📌 P2：下一迭代（中价值，补强功能完整性）

#### P2-1：Calendar 日历视图
**CC 实现**：任务的时间线日历视图，`dueAt` 字段驱动  
**用户价值**：多项目并行用户需要时间维度的任务布局  
**实现复杂度**：中（前端日历组件 + 任务 dueAt 数据）  
**我们对应区域**：Tasks 页子视图  

#### P2-2：ExportBundle 数据导出
**CC 实现**：`phase-9 schema` 包含 sessions + projects + tasks + budgets + exceptions  
**用户价值**：AI 效率型用户需要定期备份/审查操作记录  
**实现复杂度**：中（JSON 序列化 + 文件下载）  
**我们对应区域**：Settings 页  

#### P2-3：Replay & Audit（回放与审计）
**CC 实现**：timeline.log 记录每次 monitor 事件 + diff 摘要  
**用户价值**：高级用户需要追溯"什么时候发生了什么变化"  
**实现复杂度**：高（需要持续写入 timeline log + 前端可视化时间线）  
**我们对应区域**：新建 Replay 分区  

#### P2-4：Office Space 像素办公室
**CC 实现**：可视化像素风格办公室，agent 有 canvas 渲染的像素头像  
**用户价值**：对目标用户价值有限（专业用户更要效率，不要噱头）  
**实现复杂度**：中  
**建议**：不借鉴像素头像渲染，用 emoji + 首字母颜色圆圈替代  

---

## 四、页面展示效果借鉴清单

### 4.1 可以直接复用的 CSS/UI 模式

| 模式名 | CC 技术实现 | 我们对应区域 | 复用优先级 |
|--------|------------|------------|---------|
| **Badge 语义色系** | `.badge.ok/warn/blocked/info/idle` | 全站状态展示 | 🔥 立即 |
| **Segment Switch** | `.segment-switch` + `.segment-item.active` | 任何 Tab/视图切换 | 🔥 立即 |
| **KPI 卡片顶线** | `::before` 3px conic-gradient | Overview KPI 卡片 | 🔥 立即 |
| **Quick Chip 筛选** | `.quick-chip` URL 参数驱动 | Tasks / Staff 页 | 🔥 立即 |
| **三栏 app-shell** | `sidebar + panel + inspector` | 全局布局 | P0 |
| **CSS conic-gradient 饼图** | 纯 CSS，无依赖 | Usage 页 | P0 |
| **Agent 卡片布局** | `.office-card` + `.topline` + `.meta` | Staff 页 | P0 |
| **看板泳道** | `.board` grid + `.lane` | Tasks 页 | P0 |
| **告警 queue-item** | `.queue-item` 两态渲染 | 告警 / Overview | P1 |
| **数字计数动画** | `data-counter-target` + rAF | Overview KPI | P2 |
| **Context Pressure Bar** | 进度条 + 百分比文字 | Usage / Inspector | P1 |
| **Memory 状态表格** | 3列（agent / 状态 / 最后更新） | Memory 页 | P1 |

### 4.2 CC 展示模式与我们分区的对应关系

```
CC 展示模式                    → 我们哪个分区
─────────────────────────────────────────────
Overview KPI 卡片 (5张)        → Overview 分区：核心指标卡片
Executive 摘要卡片 (6项)       → Overview 分区：全局数字摘要
ReadinessScore 仪表盘          → Overview 分区：新增综合评分
右侧 Inspector 常驻栏          → 全局布局：Inspector Sidebar
Staff Office Floor 四区        → Staff 分区：状态分区展示
Agent 卡片 (.office-card)     → Staff 分区：agent 详情卡片
看板 (.board + .lane)         → Tasks 分区：主视图
Quick Chip 筛选               → Tasks / Staff 分区：顶部筛选行
Action Queue (.queue-item)    → 告警分区 + Overview 介入区
Context Pressure Card         → Usage 分区 + Inspector 摘要
CSS 饼图 (conic-gradient)     → Usage 分区：用量分布
Memory 状态卡                  → Memory 分区：健康状态摘要
Connection Health 卡           → Settings 分区：接线状态
Security Risk Summary          → Settings 分区：风险摘要
Collaboration 父子视图         → Collaboration 分区（新建）
Timeline Log                  → Replay 分区（新建）
```

### 4.3 展示模式设计原则（来自 CC 经验）

1. **信息分层**：Overview 是一句话回答 "系统OK吗？"，不要把所有内容塞进 Overview
2. **URL 驱动状态**：筛选器 / Tab 切换用 URL 参数（无 JS 状态），可刷新保持状态
3. **三色状态系统**：绿（ok/done）/ 黄（warn/blocked）/ 红（over/error/action-required）保持全站一致
4. **操作与展示分离**：展示内容 SSR，写操作用独立 POST API（不混在 GET 里）
5. **降级友好**：数据源缺失时显示"N/A"或"数据源未连接"，不崩溃、不显示错误页

---

## 五、综合优先级排序总表

### 按迭代分层的借鉴清单

| 优先级 | 功能 | 价值 | 复杂度 | 对应分区 |
|--------|------|------|--------|---------|
| **🔥 P0-1** | Action Queue + Ack 确认机制 | ⭐⭐⭐⭐⭐ | 低 | 告警/Overview |
| **🔥 P0-2** | Context Pressure Card | ⭐⭐⭐⭐⭐ | 低 | Usage/Inspector |
| **🔥 P0-3** | 三栏布局 + Inspector Sidebar | ⭐⭐⭐⭐ | 低 | 全局布局 |
| **🔥 P0-4** | ReadinessScore 综合评分 | ⭐⭐⭐⭐ | 中 | Overview |
| **🔥 P0-5** | DoneChecklist 任务核查清单 | ⭐⭐⭐⭐ | 低 | Tasks 任务详情 |
| **🌟 P1-1** | Collaboration 协作视图 | ⭐⭐⭐⭐⭐ | 高 | 新建 Collaboration |
| **🌟 P1-2** | 执行链视图（任务→会话→命令） | ⭐⭐⭐⭐ | 高 | Tasks 任务详情 |
| **🌟 P1-3** | Settings 三张新卡片 | ⭐⭐⭐⭐ | 低 | Settings |
| **🌟 P1-4** | Memory 状态卡片 | ⭐⭐⭐⭐ | 低 | Memory |
| **📌 P2-1** | Calendar 日历视图 | ⭐⭐⭐ | 中 | Tasks 子视图 |
| **📌 P2-2** | ExportBundle 数据导出 | ⭐⭐⭐ | 中 | Settings |
| **📌 P2-3** | Replay & Audit | ⭐⭐⭐ | 高 | 新建 Replay |
| **📌 P2-4** | Office Space 像素办公室 | ⭐⭐ | 中 | 暂不借鉴 |

### UI 模式立即借鉴（零额外工期）

| UI 模式 | 对应 CSS | 影响范围 |
|--------|---------|---------|
| Badge 语义色系 | `.badge.ok/warn/blocked/info/idle` | 全站 |
| Segment Switch | `.segment-switch` CSS | 所有 Tab 区域 |
| KPI 顶线渐变 | `.overview-kpi-card::before` | Overview |
| Quick Chip | `.quick-chip` + URL param | Tasks/Staff |

---

## 六、关键结论

### 6.1 CC 的核心竞争力

CC 的设计哲学是 **"可观测性优先"**：用户打开页面的第一优先级是"看清楚状态"，而不是"执行操作"。这与我们的目标用户（AI 效率型专业用户）高度吻合。

### 6.2 我们应该超越 CC 的地方

1. **真实执行集成**：CC 是纯展示层，我们有真实的 agent 运行基础设施，控制台操作可以直接触发 agent 行动
2. **飞书深度集成**：CC 无消息推送，我们的飞书 bot 推关键告警是差异化优势
3. **写操作能力**：CC 默认只读，我们可以提供配置编辑、agent 启停等写操作入口

### 6.3 下一步行动建议

按照 P0 清单启动下一轮迭代：
1. 先完成 Badge 系统 + Quick Chip + Segment Switch（纯 CSS，半天内落地）
2. 再接入 Action Queue 数据结构（建 acks.json + 渲染两态 UI）
3. Context Pressure Card（Usage 页新增）
4. Inspector Sidebar（全局布局调整）
5. ReadinessScore（Overview 页新增）

---

*本报告基于 CC repo 截至 2026-03-19 的功能状态。CC 仍在快速迭代，建议每两周重新 review CC 新功能。*
