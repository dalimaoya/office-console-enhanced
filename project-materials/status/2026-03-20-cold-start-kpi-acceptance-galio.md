# 2026-03-20 冷启动指标前端修复验收结论（Galio）

## 验收结论
**通过。**

本次 `loadColdStart()` 的字段映射修复已与后端 `ColdStartSnapshot` DTO 对齐；结合当前 `data/cold-start-snapshot.json` 实际数据核对，"当前项目阶段"、"活跃对象数"、"最近事件"、"阻塞项" 四类信息均能按逻辑正确取值与展示。

---

## 验收范围
- 前端文件：`artifacts/office-dashboard-adapter/src/public/app.js`
- 后端 DTO 来源：`artifacts/office-dashboard-adapter/src/services/cold-start-service.ts`
- 接口：`GET /api/v1/cold-start`
- 实际样本：`artifacts/office-dashboard-adapter/data/cold-start-snapshot.json`

---

## 1. 字段映射核对结果

### 1.1 当前项目阶段
前端：
```js
const phase = data.projectStage?.currentStage || data.currentPhase || data.phase || '';
```
后端真实结构：
```ts
projectStage: {
  currentStage: string;
}
```
核对结论：**一致**。优先读取 `projectStage.currentStage`，并保留旧字段兜底，兼容性合理。

### 1.2 活跃对象数
前端：
```js
const activeObjs = Number.isFinite(data.activeObjectCount)
  ? data.activeObjectCount
  : Array.isArray(data.activeObjects)
    ? data.activeObjects.length
    : (data.activeCount ?? null);
```
后端真实结构：
```ts
activeObjectCount: number;
activeObjects: Array<...>;
```
核对结论：**一致**。优先读取 `activeObjectCount`，回退 `activeObjects.length`，逻辑正确。

### 1.3 最近事件
前端：
```js
const evType = lastEvent.event_type || lastEvent.type || lastEvent.event || '事件';
const evMsg  = lastEvent.description || lastEvent.message || JSON.stringify(lastEvent);
const evTime = lastEvent.ts || lastEvent.timestamp;
```
后端真实结构：
```ts
recentEvents: Array<{
  ts: string;
  event_type: string;
  source_role: string;
  description: string;
}>;
```
核对结论：**一致**。真实 DTO 字段 `event_type / description / ts` 已作为优先读取项。

### 1.4 阻塞项
前端：
```js
const blockerItems = blockers.map(b =>
  `<li>${escapeHtml(String(b.description || b.id || b.message || '未知阻塞项'))}</li>`
).join('');
```
后端真实结构：
```ts
blockers: Array<{
  source: string;
  id: string;
  description: string;
}>;
```
核对结论：**一致**。真实 DTO 字段 `b.description` 已作为优先读取项。

---

## 2. 逻辑取值核对结果

基于当前快照文件：`artifacts/office-dashboard-adapter/data/cold-start-snapshot.json`

### 2.1 活跃对象数
当前快照：
- `activeObjectCount = 3`
- `activeObjects.length = 3`

核对结论：前端会显示 **3**，不再把数组本身渲染为字符串，逻辑正确。

### 2.2 当前项目阶段
当前快照：
- `projectStage.currentStage = "active"`

核对结论：前端会显示 **active**，逻辑正确。

### 2.3 最近事件
当前快照最近一条：
- `event_type = "system.healthcheck_passed"`
- `description = "Dashboard 请求成功"`
- `ts = "2026-03-20T00:26:18.264Z"`

核对结论：前端会正确显示事件类型、描述与时间，逻辑正确。

### 2.4 阻塞项
当前快照：
- `blockers.length = 3`
- 3 条 `description` 分别为：
  1. `Iter-1 后端数据层重构任务记录`
  2. `Iter-1 前端 SSE 接入任务记录`
  3. `CC 借鉴设计系统升级（Lux）`

核对结论：前端标题中的数量与列表内容都能正确取值；不再依赖不存在的 `message` 字段。

---

## 3. 其他同类字段映射遗漏检查

已检查 `loadColdStart()` 相关同类错配点：
- `currentPhase / phase`
- `activeObjectCount / activeObjects / activeCount`
- `event_type / description / ts`
- `blockers[].description`

本次任务范围内，**未发现新的同类遗漏仍留在 `loadColdStart()` 主展示链路中**。

补充观察：
- 代码中保留了旧字段兜底（如 `type`、`event`、`timestamp`、`message`），这属于兼容策略，不构成当前缺陷。
- `app.js` 其他模块存在 `ev.type || ev.event_type` 这种兼容写法，但不属于本次冷启动卡片 DTO 错配问题。

---

## 4. 风险与建议

### 当前风险
低。当前实现已能覆盖真实 DTO，并兼容旧字段。

### 建议
1. 后续可抽出 `normalizeColdStartPayload()`，把契约兼容逻辑集中管理，避免字段漂移再次散落到渲染层。
2. 建议补一条前端回归断言：
   - `activeObjectCount` 为数字时直接显示数字
   - `blockers[].description` 正常渲染
   - `recentEvents[0].event_type / description / ts` 正常渲染
3. 若后端未来正式公开 DTO，建议补一个共享类型定义，避免前后端再次各写一套字段名假设。

---

## 最终结论
**验收通过，可继续进入联调/回归阶段。**
