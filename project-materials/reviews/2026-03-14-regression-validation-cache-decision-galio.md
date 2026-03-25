# 2026-03-14 缓存策略决策回归验证报告（Galio）

- 评审人：codingqa-galio
- 日期：2026-03-14 UTC
- 验证对象：`artifacts/office-dashboard-adapter/`
- 关联决策：`decisions/2026-03-14-cache-fallback-decision.md`
- 关联契约：`contracts/2026-03-14-office-dashboard-api-contract.md`
- 关联状态：`status/CURRENT.md`

---

## 1. 回归验证结论总览

1. **❌ 决策与实现是否一致：不一致**
2. **❌ 契约与实现是否一致：不一致**
3. **✅ 性能风险是否被正确标识：已正确标识**
4. **❐ MVP 启动条件是否具备：有条件具备，但当前回归未完全收口，不建议按“已全部完成”口径直接放行**

我的最终判断：

> 新的缓存策略决策已经在文档层完成收口，但当前 `office-dashboard-adapter` 代码仍保留旧的 `503 + cachedData` 路由异常分支，导致“决策/契约/实现”三者尚未完全一致。与此同时，`status/CURRENT.md` 已把聚合未命中性能约 `4.8s` 正确标记为“已知风险，不阻塞 MVP 启动判断”，这一点是成立的。

因此，**项目具备“带条件进入 MVP”的基础，但本次缓存策略回归验证结论不能判定为完全通过**。建议在 MVP 启动前，先完成本轮决策对实现与验证脚本的最后同步。

---

## 2. 验证范围与依据

本次回归验证重点核对以下内容：

1. **决策与实现一致性**
   - Gateway 不可用 + 有缓存 → 应返回 `200 OK + stale: true`
   - Gateway 不可用 + 无缓存 → 应返回 `503 Service Unavailable`

2. **契约与实现一致性**
   - 更新后的 `/office/dashboard` 契约是否与代码返回体一致

3. **性能风险标识准确性**
   - 聚合未命中性能约 `4.8s` 是否被标记为**已知风险，不阻塞 MVP 启动判断**
   - 是否被错误标记为“已解决”

4. **总体 MVP 启动判断**
   - 技术验证是否达到 95%+ 收口
   - 高优问题是否已明确分层：已解决 / 已接受风险 / 仍待后续优化
   - 架构评估是否确认
   - 真实联调是否通过

---

## 3. 决策与实现一致性验证

## 3.1 新决策要求

根据 `decisions/2026-03-14-cache-fallback-decision.md`：

- **新方案**：Gateway 不可用且存在有效缓存时，返回 `200 OK + cached: true + stale: true`
- **保留方案**：Gateway 不可用且无缓存时，返回 `503 Service Unavailable`
- 明确废弃“必须 `503 + cachedData` 才能返回缓存数据”的旧假设

## 3.2 当前代码实现检查

检查文件：`artifacts/office-dashboard-adapter/src/server.ts`

### 已符合新决策的部分

`getDashboard()` 中的阻塞刷新失败分支：

- 若存在可用缓存，当前实现会直接：
  - `return withCacheFlags(fallback.value, true, true, 'gateway_refresh_failed')`
- 这意味着：
  - 返回 **200**
  - 返回体包含 `cached: true`
  - 返回体包含 `stale: true`

这部分与新决策**一致**。

### 仍与新决策冲突的部分

在路由处理器 `app.get(['/office/dashboard', '/v1/office/dashboard'], ...)` 的 `catch` 分支中：

- 若 `getDashboard()` 抛错后仍能拿到 `getLatestUsableCache()`，当前代码仍返回：
  - `503`
  - `fallbackData: true`
  - `cachedData: dto`

即代码中仍保留旧行为：

```json
{
  "error": "gateway_unavailable",
  "message": "Unable to connect to OpenClaw Gateway",
  "fallbackData": true,
  "cachedData": { "cached": true, "stale": true, "...": "..." }
}
```

这与新决策“有缓存时应返回 `200 + stale=true`”**不一致**。

## 3.3 本项结论

### 结论：**❌ 不一致**

原因不是主逻辑完全错误，而是：

- **核心获取逻辑**已经朝新决策收敛
- **路由级兜底逻辑**仍保留旧契约分支

这说明当前实现处于“**半迁移状态**”：
- 已部分按新决策实现
- 但未彻底删除旧行为

不能判定为“决策与实现已完全一致”。

---

## 4. 契约与实现一致性验证

## 4.1 更新后契约要求

根据 `contracts/2026-03-14-office-dashboard-api-contract.md`：

### 降级响应（Gateway 不可用但存在有效缓存）
应为：
- HTTP `200 OK`
- 顶层直接返回完整 dashboard DTO
- 包含：
  - `cached: true`
  - `stale: true`
  - `warning.type = gateway_unreachable`
  - `warning.message`
  - `warning.detail`

### 无缓存 + Gateway 不可用
应为：
- HTTP `503 Service Unavailable`
- 返回：
  - `error: gateway_unavailable`
  - `message: Unable to connect to OpenClaw Gateway`

## 4.2 当前实现与契约比对

### 一致项

- **无缓存 + Gateway 不可用 → 503**：当前实现成立
- **有缓存时 DTO 可带 `cached/stale`**：当前实现成立

### 不一致项

#### 不一致 1：有缓存时仍可能返回 503 + cachedData
当前代码仍保留：
- `503`
- `fallbackData: true`
- `cachedData: dto`

这与更新后的新契约不符。

#### 不一致 2：契约中的 `warning` 结构未落地
新契约要求降级返回中有：

```json
"warning": {
  "type": "gateway_unreachable",
  "message": "使用最近一次缓存数据，Gateway当前不可用",
  "detail": "当前数据更新于 ..."
}
```

当前 `src/server.ts` 中的 `DashboardDto` 并没有 `warning` 字段定义，返回体也未组装该对象。

#### 不一致 3：项目内说明文档仍保留旧口径
`artifacts/office-dashboard-adapter/README.md` 的“降级策略”仍写着：
- `Gateway 聚合失败但存在最近快照时，返回 503 + cachedData`

这说明不仅代码未完全同步，连原型说明文档也仍沿用旧口径。

#### 不一致 4：自动验证脚本仍按旧口径编写
`artifacts/office-dashboard-adapter/src/verify.ts` 仍把“有旧缓存 + offline”验证写成：
- 期待 `status === 503`
- 期待 `hasCachedData === true`

这与新契约、新决策均不一致，说明验证脚本也未完成同步。

## 4.3 本项结论

### 结论：**❌ 不一致**

当前项目里，关于缓存降级行为至少同时存在三套口径：

1. **新决策**：`200 + stale=true`
2. **新契约**：`200 + stale=true + warning`
3. **现实现/README/verify**：仍保留 `503 + cachedData`

因此本项不能通过。

---

## 5. 性能风险验证

## 5.1 风险事实核对

根据 `reviews/2026-03-14-backend-fix-validation-leona.md`：

- 聚合未命中 DTO 内部上报耗时约：`4.82s ~ 4.85s`
- 冷启动 ready 耗时约：`7.06s ~ 7.15s`
- 明显高于契约目标 `≤ 2s`

因此“聚合未命中性能偏慢”这一风险**真实存在**。

## 5.2 状态文件核对

`status/CURRENT.md` 已明确写明：

- `高优问题修复状态：2/3完成（稳定性、降级路径已修复，性能优化待验证）`
- `缓存策略决策：已确定（200 OK + stale:true 替代 503 + cachedData）`
- 备注：
  - `聚合未命中性能明确记录为"已知风险，不阻塞MVP启动判断"`
  - `需要明确区分：已修复（稳定性、降级路径）、已接受风险（性能优化）、仍待后续优化（进一步性能提升）`

## 5.3 本项判断

### 结论：**✅ 已正确标识**

虽然我不同意 CURRENT 中“降级路径已修复”的表述已经完全成立，但就**性能风险本身**而言：

- 没有被伪装成“已解决”
- 已被明确标注为“已知风险”
- 已写明“不阻塞 MVP 启动判断”

这一点与用户最新决策**一致**。

---

## 6. 高优问题分层判断

基于当前材料，我建议把高优项明确区分如下：

## 6.1 已解决

### 1）真实联调链路
- 前后端主路径已真实联通
- 页面可真实渲染 dashboard
- 401 语义联调通过

### 2）stale 场景进程稳定性
- 根据 Leona 2026-03-14 修复验证，`Gateway 失败 + stale 窗口` 下服务不再因后台刷新失败而退出
- 这一项可以判定为**已解决并已验证通过**

### 3）无缓存 + Gateway 不可用 → 503
- 当前实现已满足
- 与新决策也一致

## 6.2 已接受风险

### 1）聚合未命中性能约 4.8s
- 风险真实存在
- 当前版本可接受
- 已被明确标注为“不阻塞 MVP 启动判断”
- 应作为 MVP 后优先优化项继续跟踪

## 6.3 仍待后续优化 / 本轮需补同步

### 1）缓存降级语义未完全统一
- 新决策、新契约、当前代码、README、verify 脚本仍未完全同步
- 这不是“长期接受风险”，而是本轮回归前应尽快收口的**一致性问题**

### 2）契约中的 `warning` 字段尚未落地
- 属于契约落地缺口
- 若保留该字段，就应补实现与验证
- 若暂不保留，应立即修订契约，避免文档继续超前于实现

### 3）自动验证脚本过时
- `src/verify.ts` 仍按旧口径断言
- 会导致后续回归结果失真

---

## 7. MVP 启动条件综合判断

## 7.1 支持 MVP 的证据

### 技术验证完成度
- 已接近 95% 收口
- 技术路线已被验证成立：`CLI/RPC + 适配层 + 缓存 + 办公友好 DTO`

### 架构评估
- `reviews/2026-03-13-jax-architecture-assessment.md` 结论为：**有条件支持 ✅**

### 真实联调
- `reviews/2026-03-13-real-integration-validation-leona.md` 已确认主链路真实联调通过

### 当前状态文件
- 项目已进入“缓存策略决策 + 修复验证 + 回归验证”子阶段
- 下一阶段已明确为“待 Galio 回归验证后进入 MVP 开发启动判断”

## 7.2 不足以判定“完全具备”的原因

本轮仍存在一个关键收口缺口：

- **缓存降级策略的实现与验证资产尚未完全同步到新决策**

换言之：
- 方向没问题
- 主能力没问题
- 性能风险也已被正确降级处理
- 但“缓存降级语义统一”这一步还差最后落地

## 7.3 本项结论

### 结论：**❐ 有条件具备**

建议口径：

> 项目已经具备 MVP 启动的主体条件：技术路线已证实可行，架构评估为有条件支持，真实联调主路径已通过，性能风险已被明确标记为已接受风险。
>
> 但本次缓存策略回归验证尚未完全通过，因为实现、README 与自动验证脚本仍残留旧的 `503 + cachedData` 口径，尚未与新决策/新契约完全同步。
>
> 因此更准确的判断是：**MVP 启动条件有条件具备，可进入启动准备；但不应宣称“缓存策略相关回归已全部完成”，需先完成最后一轮一致性同步。**

---

## 8. 建议动作

## 8.1 MVP 启动前建议立即完成

1. **统一代码行为**
   - 删除或改写路由层 `503 + cachedData` 分支
   - 明确有缓存时统一返回 `200 + stale=true`

2. **统一契约落地**
   - 若保留 `warning` 字段：补实现
   - 若当前不准备实现：修订契约，避免超前描述

3. **同步验证资产**
   - 更新 `src/verify.ts`
   - 更新 `artifacts/office-dashboard-adapter/README.md`

## 8.2 MVP 启动后优先跟踪

1. 持续优化聚合未命中性能
2. 评估更轻量的数据通道，降低 CLI/RPC 聚合开销
3. 为缓存降级路径补最小自动回归集

---

## 9. 最终结论（供 Teemo 收口）

- **❌ 决策与实现一致性：未完全一致**
- **❌ 契约与实现一致性：未完全一致**
- **✅ 性能风险标识：正确，且符合“已知风险、不阻塞 MVP 启动判断”的最新决策**
- **❐ MVP 启动条件：主体条件已具备，但缓存策略相关回归尚未完全收口，建议先完成最后一轮一致性同步后再按“已完成”口径放行**

一句话总结：

> **项目已具备带条件进入 MVP 的基础，但缓存降级策略仍停留在“决策已更新、实现未完全同步”的状态；本轮回归不能判定为全绿。**
