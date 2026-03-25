# 2026-03-20 控制台指标异常排查结论（Galio）

## 结论摘要
本次用户反馈的「阻塞项」「活跃对象数」等显示异常，**根因明确为前端字段读取/映射错误，不是后端聚合或状态文件数据错误**。

问题集中在：
- `artifacts/office-dashboard-adapter/src/public/app.js`
- 函数：`loadColdStart()`（约 4615 行开始）
- 接口：`GET /api/v1/cold-start`
- 后端来源：`src/services/cold-start-service.ts`
- 状态文件来源：
  - `data/cold-start-snapshot.json`
  - `registry/objects.md`

---

## 1. 指标数据来源定位

### 1.1 「活跃对象数」

**前端读取位置**
- 文件：`artifacts/office-dashboard-adapter/src/public/app.js`
- 代码：

```js
const activeObjs = data.activeObjects ?? data.activeCount ?? null;
```

随后直接渲染：

```js
<div class="kpi-value">${escapeHtml(String(activeObjs))}</div>
```

**后端真实返回结构**
- 文件：`artifacts/office-dashboard-adapter/src/services/cold-start-service.ts`
- 字段：
  - `activeObjectCount: number`
  - `activeObjects: Array<...>`

**当前实际数据**
- 文件：`artifacts/office-dashboard-adapter/data/cold-start-snapshot.json`
- 当前值：
  - `activeObjectCount = 3`
  - `activeObjects.length = 3`

**与状态文件一致性检查**
- 文件：`registry/objects.md`
- 当前 `status=active` 条目共 3 个：
  1. `artifact-20260319-04-file-schema`
  2. `proj-bf4ea0a0`
  3. `proj-84b2575f`

**结论**
- 后端/状态文件正确
- 前端错误地把 `activeObjects` 数组本身当作“活跃对象数”展示
- 正确应读取 `activeObjectCount`，或回退为 `activeObjects.length`

---

### 1.2 「阻塞项」

**前端读取位置**
- 文件：`artifacts/office-dashboard-adapter/src/public/app.js`
- 代码：

```js
const blockers = Array.isArray(data.blockers) ? data.blockers : [];
```

标题数量来自：

```js
🚧 阻塞项（${blockers.length}）
```

列表内容来自：

```js
const blockerItems = blockers.map(b => `<li>${escapeHtml(String(b.message || b))}</li>`).join('');
```

**后端真实返回结构**
- 文件：`artifacts/office-dashboard-adapter/src/services/cold-start-service.ts`
- `blockers` 每项结构：

```ts
{
  source: string;
  id: string;
  description: string;
}
```

**当前实际数据**
- 文件：`artifacts/office-dashboard-adapter/data/cold-start-snapshot.json`
- 当前 `blockers.length = 3`
- 具体为：
  1. `agent-backend-leona` → `Iter-1 后端数据层重构任务记录`
  2. `agent-frontend-ezreal` → `Iter-1 前端 SSE 接入任务记录`
  3. `agent-ui-lux` → `CC 借鉴设计系统升级（Lux）`

**与实际状态一致性检查**
- 当前快照里的 `agentSummary` 中确实有 3 个 `status=blocked`：
  - backend-leona
  - frontend-ezreal
  - ui-lux
- 因此 `blockers.length = 3` 与快照一致

**结论**
- 阻塞项数量来源为 `data.blockers.length`，当前值 **3**，与快照一致
- 但阻塞项列表文案读取了不存在的 `message` 字段，导致展示可能变成 `[object Object]` 或异常文案
- 正确应读取 `b.description`

---

## 2. 发现的其他同类问题

### 2.1 「当前项目阶段」同样字段映射错误
前端当前代码：

```js
const phase = data.currentPhase || data.phase || '';
```

但后端真实结构为：

```json
projectStage.currentStage
```

当前快照实际值：
- `projectStage.currentStage = "active"`

因此：
- 页面上“当前项目阶段”大概率显示为空或错误
- 属于同一处前端字段契约未对齐问题

### 2.2 「最近事件」字段也未按真实结构读取
前端按以下字段取值：
- `lastEvent.type`
- `lastEvent.event`
- `lastEvent.message`
- `lastEvent.timestamp`

但后端真实字段为：
- `event_type`
- `description`
- `ts`

因此最近事件区域也可能显示为默认值、空值或不正确内容。

---

## 3. 根因定位

### 根因类型
**前端逻辑问题（字段契约错配）**

### 具体根因
`loadColdStart()` 使用了旧字段名/假设字段名：
- `currentPhase` / `phase`
- `activeObjects`（被当成数字） / `activeCount`
- `blockers[].message`
- `recentEvents[].type/event/message/timestamp`

但后端 `cold-start-service.ts` 实际输出的是：
- `projectStage.currentStage`
- `activeObjectCount`
- `activeObjects[]`
- `blockers[].description`
- `recentEvents[].event_type / description / ts`

说明：
- 接口已经有稳定返回
- 前端没有按真实 DTO 渲染
- 数据文件与后端聚合链路未发现本次异常对应的问题

---

## 4. 修复建议

### 建议修复方向（前端）
修复文件：`artifacts/office-dashboard-adapter/src/public/app.js`

#### 建议一：按真实 DTO 字段读取
建议将 `loadColdStart()` 中的取值改为类似：

```js
const phase = data.projectStage?.currentStage ?? '';
const activeCount = Number.isFinite(data.activeObjectCount)
  ? data.activeObjectCount
  : Array.isArray(data.activeObjects)
    ? data.activeObjects.length
    : 0;
const blockers = Array.isArray(data.blockers) ? data.blockers : [];
const events = Array.isArray(data.recentEvents) ? data.recentEvents : [];
```

#### 建议二：阻塞项列表改读 `description`
```js
const blockerItems = blockers
  .map((b) => `<li style="color:var(--color-danger)">${escapeHtml(String(b.description || b.id || '未知阻塞项'))}</li>`)
  .join('');
```

#### 建议三：最近事件字段改读真实结构
```js
const evType = escapeHtml(lastEvent.event_type || '事件');
const evMsg = escapeHtml(lastEvent.description || '');
const evTime = lastEvent.ts ? ... : '';
```

#### 建议四：增加前端容错
建议对 cold-start 卡片增加字段兼容层，避免再次因 DTO 变更出现：
- 数组/数字混用
- 嵌套字段缺失
- 文案字段命名变更

例如单独抽一个 `normalizeColdStartPayload()`。

---

## 5. 影响范围

### 已确认受影响
- Overview / 冷启动快照区域：
  - 当前项目阶段
  - 活跃对象数
  - 阻塞项列表文案
  - 最近事件展示

### 未发现问题
- 后端 `cold-start-service.ts` 聚合逻辑本次核对未发现异常
- `registry/objects.md` 当前 active 数量与快照一致
- `data/cold-start-snapshot.json` 当前 blockers/activeObjectCount 与实际状态一致

---

## 6. 最终判断

**这是前端展示层的 DTO 字段映射错误，不是后端/数据层问题。**

建议由前端负责人优先修复 `loadColdStart()` 的字段映射，再做一次页面回归验证：
1. 活跃对象数应显示 `3`
2. 阻塞项标题应显示 `3`
3. 阻塞项列表应显示三条 description 文案
4. 当前项目阶段应显示 `active`
5. 最近事件应显示 `system.healthcheck_passed / Dashboard 请求成功`
