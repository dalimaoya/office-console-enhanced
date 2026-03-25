# 2026-03-20 控制台 14 条问题全局扫描报告 - Galio

项目：office-console-enhanced / office-dashboard-adapter  
扫描人：Galio（codingqa-galio）  
范围：前端 `src/public/`，后端 `src/`  
方法：静态代码扫描 + 前后端接口契约核对（按 qa-patrol 的排障思路做 root cause 归因）

---

## 一、结论总览

本轮 14 条问题里，**高确定性根因主要集中在“前后端字段契约不一致 + 前端页面降级/占位实现未收口”**：

- **接口契约错位**：#2 #3 #6 #9 #13 #14
- **前端布局/样式实现问题**：#1 #4 #5 #7 #12 #13
- **数据源接入不足或仅接入占位数据**：#6 #8 #11
- **需要产品裁决后再做**：#5 #8 #10 #11 #12

### 优先级建议
- **P0**：#2 #13 #14
- **P1**：#1 #3 #4 #6 #9 #11
- **P2**：#5 #7 #8 #10 #12

---

## 二、逐条扫描结论（1~14）

| # | 问题 | 根因定位 | 责任方 | 优先级 |
|---|---|---|---|---|
| 1 | 总览飞书通知框配色不搭；下钻页“去配置”按钮点不动 | 配色是前端样式未统一到当前主题 token；“去配置”使用 inline onclick + hash/route 混用，交互链路脆弱，属于前端导航逻辑问题 | 前端（Ezreal） | P1 |
| 2 | 飞书告警通知 / 显示名称-皮肤包 / 告警阈值配置-Phase2；皮肤包功能完全失效 | 告警阈值前后端字段名不一致：前端发 `contextPressurePct/dailyCostUSD`，后端收 `contextPressurePercent/costDailyUSD`；读取时前端也读错字段。皮肤包仅在少数前端渲染点生效，后端返回的 displayName 固定，不随模式切换 | 前端 + 后端（主责前端收口，后端补统一字段） | P0 |
| 3 | 安全设置：Token 鉴权 / Dry-run 模式点不动；版本/运行时长无数据 | UI 实际是状态展示卡而非可交互开关；且前后端字段名不一致：前端读 `tokenAuth/dryRun/uptime`，后端给 `tokenEnabled/dryRunEnabled/startedAt`，导致展示错误或空值 | 前端 + 后端 + 产品（是否做可切换需裁决） | P1 |
| 4 | 系统概览-实时状态汇总：检查时间折行；下方框全白 | 前端在“系统概览”只渲染了 banner，未把 metric-panel 下半区填满；长文案/时间字符串未做布局约束，导致折行观感差 | 前端（Ezreal） | P1 |
| 5 | 健康状态-组件可达性：版面空旷，是否调整高度与系统概览对齐 | 当前是前端布局问题；但是否必须与左卡等高属于产品展示策略 | 产品决策 + 前端（Ezreal） | P2 |
| 6 | 协作会话：已加载 0 条；Subagent 任务树无数据 | `/api/v1/sessions` 返回 `{ data: [...] }`，前端却按 `payload.data.items` 取值，直接读空；同时后端旧 `/collaboration` 数据量依赖运行时文件，未必稳定 | 前端主责，后端次责 | P1 |
| 7 | 任务看板-Kanban：数据折行，右侧空间浪费 | 纯前端 CSS/布局问题：三列宽度固定、卡片字号与内容密度不匹配，lane 内容未做更紧凑编排 | 前端（Ezreal） | P2 |
| 8 | 时间线：只有 `system_start` 日志，是否重新接入有意义数据 | 后端时间线数据源过薄，目前主要来自 `appendTimelineEvent`，仅覆盖 system_start / task create/update；是否接入更多事件需要产品定义“有意义事件”范围 | 后端（Leona） + 产品裁决 | P2 |
| 9 | 用量统计：切换统计周期时，费用/上下文压力卡片和图表不联动 | 前端只把 period 传给 `/usage`，没传给 `/usage/by-agent` 和 `/usage/context-pressure`，所以图表与统计卡片不同步 | 前端（Ezreal） | P1 |
| 10 | “最适合：了解 API 用量...” / “用量数据已加载·统计周期：今日” 文本是否有必要；是否加日历选择器 | 现状是前端文案堆叠、信息冗余；是否保留辅助文案、是否扩展到日历选择器属于产品策略 | 产品决策（Teemo） | P2 |
| 11 | 用量费用/上下文压力超限统计口径是否正确 | 后端当前口径偏“估算”：cost 可能按 `$0.002/1k` 粗估；context pressure 取最近 session size 或 today 总量估算，且未与预算/真实 model pricing/时间周期统一。需要先产品定义口径，再由后端实现 | 产品决策主责，后端落地 | P1 |
| 12 | Token 与费用汇总图表：空间浪费，各角色数据展示需优化 | 前端图表/表格编排利用率低；后端虽已提供 `by-model` 等增强接口，但前端未充分消费。具体展示维度取舍需产品定稿 | 产品决策 + 前端（Ezreal） | P2 |
| 13 | 项目组：新建项目组点不动；项目实例列表点不动；“🗂️ 项目组 项目组”文本重复 | 文本重复是前端标题拼装问题；更关键的是 `/api/v1/instances` 返回 `{ instances, total }` 与前端读取 `items/id` 不一致，导致列表渲染失败、后续操作对象为空，整体表现为“点不动” | 前端 + 后端 | P0 |
| 14 | 设置-环境诊断：请求失败 | 后端 `/api/v1/diagnostic` 直接返回裸对象 `{ok,checks,summary}`，前端统一按 `payload.success/payload.data` 解析，故 200 也会被前端判失败；这是典型接口 envelope 不一致 | 后端（Leona）主责，前端可兼容兜底 | P0 |

---

## 三、前端任务包（给伊泽瑞尔）

> 输出原则：只放前端可直接修的项；涉及后端配合的，在建议里注明依赖。

### 1. #1 总览飞书通知框配色 / “去配置”按钮
- **根因**：`style.css` 中 `.connection-health-card` / `.feishu-empty-state` 使用的边框、背景、accent 未完全跟现主题统一；“去配置”使用 inline onclick + href hash 双轨，交互实现不稳。
- **建议**：
  1. 统一改为基于现有 token 的语义色（warning/info），避免视觉跳色。
  2. 去掉 inline onclick，统一改为 JS addEventListener + `navigateTo('settings')`。
  3. 对 overview/settings 两处 CTA 走同一导航 helper，避免 hash/scroll 分叉。

### 2. #2 飞书告警通知 / 皮肤包 / 告警阈值配置
- **根因**：前端字段使用错误：保存发 `contextPressurePct/dailyCostUSD`，读取也按旧字段；显示名称模式切换只重绘少数区域，未覆盖 usage/collab 等消费后端 displayName 的模块。
- **建议**：
  1. 统一阈值字段名，与后端对齐为单一协议。
  2. 皮肤包模式改成全局 UI state，所有 agent name 渲染都走同一 `getRoleDisplayName()` 适配层。
  3. 对后端返回 `displayName` 的表格，前端优先自行二次映射，而不是直接裸用后端文案。

### 3. #3 安全设置展示错误
- **根因**：`renderSettingsPanel()` 读取 `tokenAuth/dryRun`，而后端返回 `tokenEnabled/dryRunEnabled`；版本/运行时也未走 update-status 数据源。
- **建议**：
  1. 修正字段兼容：`d.tokenAuth ?? d.tokenEnabled`、`d.dryRun ?? d.dryRunEnabled`。
  2. 版本/运行时长改为调用 `/api/v1/settings/update-status`，不要复用 `/settings`。
  3. 如果当前就是只读展示，不要做成像开关的视觉样式。

### 4. #4 系统概览空白/折行
- **根因**：`renderDashboard()` 只渲染 banner，未把 metric panel 的空间填充为结构化指标；检查时间字符串太长，status row 未做换行策略优化。
- **建议**：
  1. 系统概览补 3~4 个核心指标卡（检查时间、运行时长、平均响应、活跃 Agent）。
  2. 时间行改为两段布局，label/value 分栏，避免整句挤压折行。

### 5. #5 健康状态版面空旷
- **根因**：右侧 health 面板信息密度低，缺少卡片化组件列表。
- **建议**：
  1. 产品确认后，改成与左侧等高的 component grid。
  2. 至少补充 Gateway / OpenClaw Home / Feishu / SSE 四项可达性卡片。

### 6. #6 协作会话 0 条
- **根因**：前端取值写成 `payload.data.items`，而 sessions 接口实际是 `payload.data` 数组。
- **建议**：
  1. 修正解析为 `Array.isArray(payload.data) ? payload.data : payload.data?.items || []`。
  2. 对无父子关系的数据做平铺降级展示，不要直接空白。

### 7. #7 Kanban 折行/浪费空间
- **根因**：`.board-view` 固定三列 1fr，卡片信息密度低；chip 文案较长时被迫多行。
- **建议**：
  1. 压缩列内 padding、标题行高度、chip 行高。
  2. 增加 secondary meta（owner/status）为单行省略。
  3. 屏宽足够时可考虑 `1.2fr 1.2fr 0.8fr` 之类非均分列宽。

### 8. #9 用量统计不联动
- **根因**：前端 period switch 未把周期参数传给 `/usage/by-agent`、`/usage/context-pressure`。
- **建议**：
  1. 三个接口统一带 `?period=${usageState.period}`。
  2. 切换后同时刷新 summary / pie / attribution / pressure。

### 9. #12 Token/费用图表展示优化
- **根因**：前端图表布局密度低、图表与表格重复表达。
- **建议**：
  1. 增加 Top N + Others 聚合。
  2. 表格里展示角色名 + 模型 + token/cost 占比，不必全部铺满。
  3. 视产品决定再接 `/usage/by-model` 做二级切换。

### 10. #13 项目组页不可用 + 文案重复
- **根因**：前端读 `payload.data.items`、`inst.id`，而后端是 `payload.data.instances`、`instanceId`；页面标题/顶部副标题重复“项目组”。
- **建议**：
  1. 修正列表解析兼容 `instances`。
  2. 统一使用 `inst.instanceId`。
  3. 去掉“🗂️ 项目组 项目组”重复文案。
  4. 列表加载失败时显示具体错误，而非泛化“点不动”。

### 11. #14 环境诊断“请求失败”前端兜底
- **根因**：前端只接受 success envelope。
- **建议**：
  1. 在后端修复前，前端先兼容 `{ok,checks,summary}` 直出格式。
  2. error 文案改成“接口协议不匹配/返回格式异常”，便于定位。

---

## 四、后端任务包（给雷欧娜）

### 1. #2 告警阈值配置字段协议统一
- **根因**：`settings-controller.ts` 使用 `contextPressurePercent/agentIdleMinutes/costDailyUSD`；前端现用另一套命名，导致保存/回填均失效。
- **建议**：
  1. 后端明确唯一协议并文档化。
  2. 过渡期兼容旧字段名，避免前端未发版前彻底失效。

### 2. #3 设置接口字段语义统一
- **根因**：`getSettings()` 返回 `tokenEnabled/dryRunEnabled/version/startedAt`，但前端和其他逻辑普遍按 `tokenAuth/dryRun/uptime` 读。
- **建议**：
  1. 输出一个稳定的 settings DTO，避免多个别名并存。
  2. 版本/uptime 可直接并入 `/settings` 或要求前端独立调 `/settings/update-status`，但要定一套。

### 3. #6 协作数据稳定性
- **根因**：`/sessions` 与 `/collaboration` 返回结构不统一；旧数据源依赖 `runs.json`，在某些运行场景天然为空。
- **建议**：
  1. 标准化 sessions DTO。
  2. 若主数据源为空，明确返回 `source` 与 `note`，方便前端降级展示。

### 4. #8 时间线数据源过薄
- **根因**：当前 `timeline-service.ts` 只有 `system_start` 与 task create/update 写入，未接 agent status、session lifecycle、project transition、notification ack 等关键事件。
- **建议**：
  1. 增加 session / collaboration / project / notification / diagnostic 事件写入。
  2. 统一事件类型枚举，避免 timeline 成为“只有启动日志”的假功能。

### 5. #11 用量费用/上下文压力统计口径
- **根因**：`usage-service.ts` 大量使用 estimate：无 usage 时按字符估 token、cost 固定按 `$0.002/1k` 粗估、context pressure 取 recent session size/today total。
- **建议**：
  1. 在产品给出统计口径后，统一真实 model pricing、时间周期、超限阈值算法。
  2. 在返回值里显式标记 estimated/source，别把估算值伪装成真实值。

### 6. #13 项目组实例接口 schema
- **根因**：`listInstances()` 返回 `{ instances, total }`，字段名 `instanceId`；前端现有页按 `items/id` 读取，契约断裂。
- **建议**：
  1. 后端可增加兼容层：同步返回 `items`、`id` 别名，降低前端联调成本。
  2. create/archive 响应也保持同一 DTO。

### 7. #14 环境诊断接口 envelope
- **根因**：`getDiagnostic()` 直接 `res.json(result)`，未走 `sendSuccess()`；和全站其余 API envelope 不一致。
- **建议**：
  1. 改成统一 success/data 包装。
  2. 如果要保留裸返回，必须同步修前端解析并在 API 文档注明特例；但更建议统一。

---

## 五、产品决策项（给 Teemo 裁决）

### 1. #3 安全设置是否允许交互
- **问题**：Token 鉴权 / Dry-run 当前看起来像开关，但实际是状态展示。  
- **需要裁决**：
  1. 是纯只读状态卡，还是允许在控制台直接切换？
  2. 若允许切换，是否要加权限控制/二次确认？

### 2. #5 健康状态面板是否必须与系统概览等高
- **问题**：目前空，但并不影响功能。  
- **需要裁决**：是追求视觉对齐，还是接受信息密度不同的自然高度？

### 3. #8 时间线接什么才算“有意义”
- **问题**：接更多日志不是目的，关键是定义用户真正关心的事件。  
- **建议裁决范围**：system / task / session / project / alert / config change 六类里要哪几类。

### 4. #10 用量页辅助文案与日历选择器
- **问题**：现有“最适合/数据已加载”文案偏冗余；是否上日历会影响复杂度。  
- **需要裁决**：
  1. 保留教育性文案，还是极简 dashboard 风格？
  2. 周期仅 today/week/month，还是支持任意日期区间？

### 5. #11 超限统计口径定义
- **问题**：费用、上下文压力、预算超限都缺统一业务口径。  
- **需要裁决**：
  1. cost 用真实模型单价还是估算？
  2. context pressure 以单 session 峰值、最近一次、还是周期均值计算？
  3. “超限”按软阈值预警还是硬阈值拦截？

### 6. #12 图表主展示维度
- **问题**：角色、模型、token、cost 都能展示，但一个页面不能全堆。  
- **需要裁决**：主视图优先角色维度，还是模型维度；是否要 Top N + 其它合并。

---

## 六、我认为最值得先修的 5 个点

1. **#14 环境诊断接口 envelope 统一** —— 低成本高收益，立刻解除“请求失败”假象。  
2. **#13 项目组列表 DTO 对齐** —— 当前接近整页不可用。  
3. **#2 告警阈值字段统一 + 皮肤包全局收口** —— Phase2 功能当前名义存在、实际失效。  
4. **#6 sessions 数据解析修正** —— 协作页 0 条属于典型假空白。  
5. **#9 用量页统计周期联动** —— 修完后页面可信度明显提升。  

---

## 七、建议联调顺序

1. **Leona**：先统一 #14、#13、#2、#3 的接口 schema  
2. **Ezreal**：再统一前端解析层与容错层，修 #6、#9、#4、#1  
3. **Teemo**：最后裁决 #5、#8、#10、#11、#12 展示与口径问题  

---

## 八、附：本次高确定性代码定位点

- 前端
  - `src/public/app.js`
    - `loadSettings()` / `renderSettingsPanel()`
    - `loadAlertThresholds()` / `saveAlertThresholds()`
    - `loadDiagnostic()` / `renderDiagnostic()`
    - `loadCollaboration()` / `renderCollaboration()`
    - `loadUsage()` / `renderUsage()` / `renderUsageByAgent()` / `renderContextPressure()`
    - `loadInstances()` / `confirmNewInstance()`
    - `initDisplayNameToggle()` / `getRoleDisplayName()`
  - `src/public/index.html`
    - overview/settings 的“去配置” CTA
    - usage / projects / settings 页面结构
  - `src/public/style.css`
    - `.connection-health-card`
    - `.feishu-empty-state`
    - `.board-view` / `.board-lane` / `.board-task-chip`

- 后端
  - `src/controllers/settings-controller.ts`
  - `src/controllers/collaboration-controller.ts`
  - `src/controllers/diagnostic-controller.ts`
  - `src/controllers/instance-controller.ts`
  - `src/controllers/usage-controller.ts`
  - `src/services/usage-service.ts`
  - `src/services/timeline-service.ts`
  - `src/services/project-instance-service.ts`

---

**扫描结论**：当前不是单点 bug，而是 Phase2/3 迭代后遗留的 **接口协议漂移 + 前端占位实现未收口**。先修契约，再修样式，最后做产品取舍，性价比最高。
