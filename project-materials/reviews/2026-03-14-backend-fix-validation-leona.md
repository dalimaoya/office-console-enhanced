# 2026-03-14 后端修复验证报告（Leona）

## 验证目标
针对办公控制台 `office-dashboard-adapter` 已修复问题做最终验证：

1. **稳定性问题**：Gateway 失败 + stale 刷新场景下，后台刷新失败不会导致进程退出
2. **降级路径问题**：验证 `503 + cachedData` 路径是否可达
3. **聚合性能问题**：验证未命中聚合性能，目标 `≤ 2s`
4. **综合回归测试**：确认修复未破坏原有功能

验证对象：`artifacts/office-dashboard-adapter`

---

## 验证方法

### A. 稳定性验证：stale + Gateway offline
步骤：
1. 先在线启动一次服务，生成成功快照
2. 将快照改写为：`expiresAt` 已过期但 `staleUntil` 仍在窗口内
3. 以 `MOCK_GATEWAY_MODE=offline` 启动服务
4. 请求 `/office/dashboard`
5. 观察：
   - 返回是否为 `200 + cached=true + stale=true`
   - 进程是否仍存活

### B. 降级路径验证：Gateway 完全不可用
分两组：
1. **无缓存**：清空 `data/` 后以 `offline` 启动，验证基础 503 行为
2. **有旧缓存**：注入过期快照后以 `offline` 启动，验证是否会返回 `503 + cachedData`

### C. 性能验证：聚合未命中
步骤：
1. 清空 `data/`
2. 启动服务，记录从启动到 `/health` ready 的时间（启动时会执行首次聚合刷新）
3. 读取接口返回中的 `system.performance.avgResponseMs` 与 `meta.sourceDurationsMs`
4. 连续执行 3 轮

### D. 综合回归
验证：
- `/office/dashboard` 主路径正常返回
- `/v1/office/dashboard` 别名可用
- 401 鉴权错误未回退
- 缓存命中路径正常

---

## 验证结果

## 1. 稳定性验证

### 结果：**通过**

stale + offline 场景实测：

```json
{
  "status": 200,
  "durationMs": 3.15,
  "cached": true,
  "stale": true,
  "fallbackReason": "background_refresh",
  "processAlive": true
}
```

结论：
- stale 窗口内会返回旧快照
- 后台刷新失败后，**服务进程未退出**
- 说明“后台刷新异常不会导致进程退出”的修复已生效

---

## 2. `503 + cachedData` 降级路径验证

### 2.1 无缓存 + offline
结果：**通过**

```json
{
  "status": 503,
  "fallbackData": false,
  "details": "Error: mock health offline"
}
```

说明：当 Gateway 完全不可用且本地无任何缓存时，服务会正确返回 503。

### 2.2 有旧缓存 + offline
结果：**不通过 / 与契约不一致**

实测结果：

```json
{
  "status": 200,
  "durationMs": 2.62,
  "hasCachedData": false
}
```

进一步分析：
- 当前实现中，只要存在可用历史快照，`getDashboard()` 的阻塞刷新失败后会直接返回旧快照
- 因此接口实际行为更接近：
  - `200 + cached=true + stale=true`
- 而不是契约声明的：
  - `503 + fallbackData=true + cachedData={...}`

### 结论
- **`503 + cachedData` 在“存在历史缓存”的场景下当前不可达**
- 可达的只有：
  - `503 + fallbackData=false`（无缓存）
  - `200 + stale=true`（有缓存）
- 因此“降级路径可达”这一项，**如果目标是契约中的 `503 + cachedData`，当前验证结论应判定为未通过**

---

## 3. 聚合性能验证

### 结果：**未通过**

连续 3 轮冷启动聚合数据：

```json
[
  {
    "run": 1,
    "readyMs": 7145.61,
    "avgResponseMs": 4850,
    "sourceDurationsMs": {
      "health": 85,
      "agents.list": 6376,
      "status": 6442,
      "config.get": 6498
    }
  },
  {
    "run": 2,
    "readyMs": 7082.49,
    "avgResponseMs": 4838,
    "sourceDurationsMs": {
      "health": 66,
      "config.get": 6195,
      "status": 6527,
      "agents.list": 6563
    }
  },
  {
    "run": 3,
    "readyMs": 7064.76,
    "avgResponseMs": 4821,
    "sourceDurationsMs": {
      "health": 72,
      "status": 6252,
      "config.get": 6448,
      "agents.list": 6512
    }
  }
]
```

### 结论
- 启动期首次聚合耗时约 **7.06s ~ 7.15s**
- DTO 内部上报的平均聚合耗时约 **4.82s ~ 4.85s**
- 明显高于目标 **≤ 2s**
- 性能瓶颈仍在 Gateway CLI/RPC：
  - `status`
  - `agents.list`
  - `config.get`

### 补充说明
当前缓存命中性能仍然很好：
- stale/offline 返回约 `3ms`
- warm benchmark 平均约 `10ms`

即：
- **命中缓存体验通过**
- **未命中真实聚合性能不通过**

---

## 4. 综合回归测试

### 结果：**通过（除降级契约项外）**

### 4.1 主路径与别名

```json
{
  "v1Alias": {
    "status": 200,
    "cached": true,
    "hasSystem": true,
    "hasAgents": true
  }
}
```

结论：
- `/office/dashboard` 正常
- `/v1/office/dashboard` 别名正常
- DTO 主字段完整

### 4.2 鉴权

```json
{
  "status": 401,
  "body": {
    "error": "authentication_required",
    "message": "Valid OpenClaw authentication token required"
  }
}
```

结论：
- 401 行为未受本次修复影响

### 4.3 自动验证脚本现状

`npm run verify` 当前失败，但失败原因不是修复回退，而是**脚本假设已过时**：
- 该脚本在 warmup 阶段要求首个请求必须 `cached=true`
- 但当前实现下，首次无缓存请求可能是 `cached=false`
- 因此验证脚本本身需要更新，不能作为最终结论依据

---

## 最终结论

### 已验证通过
- [x] **稳定性修复通过**：Gateway 失败 + stale 刷新场景下，后台刷新失败不会导致进程退出
- [x] **原有功能未回归**：主接口、版本别名、401、缓存命中路径均正常
- [x] **缓存命中性能通过**：毫秒级响应

### 未通过 / 仍有问题
- [ ] **`503 + cachedData` 契约路径未验证通过**：当前实现下，有缓存时更可能返回 `200 + stale=true`，与契约不一致
- [ ] **聚合未命中性能未达标**：当前约 `4.8s`（DTO）/ `7.1s`（冷启动 ready），目标 `≤ 2s`
- [ ] **`npm run verify` 需要同步更新**，否则会误判当前实现

---

## 建议收口

### P0（MVP 启动前必须明确）
1. **二选一收口降级契约**：
   - 要么修改代码，真正打通 `503 + cachedData`
   - 要么修改接口契约，明确“有缓存时返回 `200 + stale=true`”
2. **更新 `src/verify.ts`**，使自动验证与实际契约一致

### P1（MVP 启动后尽快处理）
1. 继续优化聚合链路，目标把 `status / agents.list / config.get` 总耗时压到 `2s` 内
2. 若 Gateway CLI/RPC 本身不可优化，则需要：
   - 更激进预热
   - 更细粒度缓存拆分
   - 或替换更轻量的数据通道
