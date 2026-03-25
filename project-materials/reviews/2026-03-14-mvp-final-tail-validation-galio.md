# MVP 尾项最终补验记录（Galio）

- 时间：2026-03-14 UTC
- 角色：codingqa-galio
- 阶段：办公控制台增强项目 MVP 尾项收口第 2 棒 / 最终补验判断
- 范围：仅对剩余尾项做最终补验、给出收口结论与环境影响判断；**不代替开发继续修代码**

## 1. 本轮判定依据

按本轮指令要求，先读取并以以下文件/目录为准：

1. `status/CURRENT.md`
2. `reviews/2026-03-14-mvp-integration-check-phase2-galio.md`
3. `tasks/2026-03-14-mvp-backend-tail-closure-leona.md`
4. `contracts/2026-03-14-office-dashboard-api-contract.md`
5. `artifacts/office-dashboard-adapter/`

### 1.1 输入完整性结论

- `status/CURRENT.md`：存在
- `reviews/2026-03-14-mvp-integration-check-phase2-galio.md`：存在
- `contracts/2026-03-14-office-dashboard-api-contract.md`：存在
- `artifacts/office-dashboard-adapter/`：存在
- `tasks/2026-03-14-mvp-backend-tail-closure-leona.md`：**不存在**

> 结论：本轮正式输入链 **不完整**。因此即使主链路可运行，也**不能仅依据 CURRENT 中“全绿通过”字样直接无条件盖章**；必须以实际 artifact 与补验结果重新判断。

---

## 2. 本轮最终补验范围与方法

本轮重点只覆盖 3 个剩余尾项：

1. `agents stale`
2. `TEMPLATE_INVALID`
3. `TEMPLATE_APPLY_FAILED`

### 2.1 补验方式

#### A. 静态复核
复核以下实现文件：
- `src/services/agent-service.ts`
- `src/services/cached-resource-service.ts`
- `src/services/template-service.ts`
- `src/services/config-apply-service.ts`
- `src/verify.ts`

#### B. 实际脚本补验
在 `artifacts/office-dashboard-adapter/` 下执行：
- `npm run verify`

结果：**通过（exit code 0）**

#### C. 隔离环境错误分支实测
为避免污染真实 OpenClaw 配置，本轮额外构造了**隔离假环境**：
- 用临时 `openclaw` mock 脚本替代真实 CLI
- 用临时模板目录挂载非法模板 / 校验失败模板
- 通过实际 HTTP 请求命中 `/api/v1/config/templates/:id/apply`

这样可以在**不修改真实系统配置**的前提下，补验此前未留痕的错误分支。

---

## 3. 剩余尾项最终补验结果

## 3.1 `TEMPLATE_INVALID`

### 静态复核
`src/services/config-apply-service.ts` 中明确存在两层非法模板判断：

1. `templateService.getTemplate()` 负责 YAML 解析失败 / 缺字段 / `config` 非对象时抛出 `TEMPLATE_INVALID`
2. `ConfigApplyService` 额外限制模板只允许白名单字段：
   - `model`
   - `skills`
   - `identity`

若模板中出现非白名单字段（如 `workspace`），会返回：
- code: `TEMPLATE_INVALID`
- http: `422`

### 隔离环境实测
构造模板：
```yaml
config:
  workspace: /tmp/should-not-pass
```

实测响应：
```json
{
  "success": false,
  "error": {
    "code": "TEMPLATE_INVALID",
    "message": "Template YAML is invalid",
    "detail": "non-whitelisted config fields: workspace"
  }
}
```

### 结论
**`TEMPLATE_INVALID`：补验通过。**

---

## 3.2 `TEMPLATE_APPLY_FAILED`

### 静态复核
`src/services/config-apply-service.ts` 中 `config set + config validate` 被 try/catch 包裹：
- `openclaw config set` 失败 → 抛 `TEMPLATE_APPLY_FAILED`
- `openclaw config validate` 失败 → 抛 `TEMPLATE_APPLY_FAILED`

`src/adapters/openclaw-cli-adapter.ts` 中，`configValidate()` 会把 validate 输出解析成 detail，并统一映射到：
- code: `TEMPLATE_APPLY_FAILED`
- http: `500`

### 隔离环境实测
构造模板：
```yaml
config:
  model: wrong-type
```

并通过 mock CLI 让 `openclaw config validate --json` 返回：
```json
{
  "valid": false,
  "errors": [
    {
      "path": "/agents/list/0/model",
      "message": "must be object"
    }
  ]
}
```

实测响应：
```json
{
  "success": false,
  "error": {
    "code": "TEMPLATE_APPLY_FAILED",
    "message": "Template apply failed",
    "detail": "/agents/list/0/model: must be object"
  }
}
```

### 结论
**`TEMPLATE_APPLY_FAILED`：补验通过。**

---

## 3.3 `agents stale`

### 静态复核
`/api/v1/agents` 走的是 `cachedResourceService.getWithFallback('agents', ...)`：
- fresh 成功时写入缓存
- 若后续 `GatewayUnavailableError / GatewayTimeoutError` 且缓存仍在 `staleUntil` 内，则返回：
  - `200`
  - `success:true`
  - `cached:true`
  - `stale:true`
  - `warning.type = gateway_unreachable`

从实现上，`agents stale` 分支**是存在且与 contract 对齐的**。

### 运行态补验现状
- `npm run verify` 当前仍只输出：`staleRuntime: pending-runtime-validation`
- 本轮在真实环境中**未新增拿到 `/api/v1/agents` 的稳定 stale 运行样本**
- 由于当前实现的 `agents` fresh TTL 为 60s，且本轮未新增专用可控注入点，未在不改代码前提下稳定复现“同进程先成功缓存、再 Gateway 失败、再命中 stale”的完整证据链

### 结论
**`agents stale`：实现口径成立，但真实运行态稳定复现证据仍不足，保留为待环境验证项。**

> 注意：这不是“实测失败”，而是“尚未补到足够扎实的运行态留痕”。

---

## 4. 与主链路状态合并后的最终判断

结合：
- `CURRENT.md` 中的主链路全绿状态
- `Phase2` 补验记录中已确认的 Dashboard / Health stale、apply 主链路、浏览器级点击通过
- 本轮对 `TEMPLATE_INVALID` / `TEMPLATE_APPLY_FAILED` 的新增补验通过
- `agents stale` 仍未补到稳定环境证据
- 指定前置交付物 `tasks/2026-03-14-mvp-backend-tail-closure-leona.md` 缺失

### 最终判断：**有条件通过**

不判“仍未通过”的原因：
1. 当前没有新的主链路硬失败
2. `TEMPLATE_INVALID` 与 `TEMPLATE_APPLY_FAILED` 已补验通过
3. `npm run verify` 已通过
4. Dashboard / Config / apply 主链路此前已通过

不判“全绿通过”的原因：
1. **指定前置交付物缺失**，正式输入链不完整
2. `agents stale` 仍缺真实运行态稳定复现证据

---

## 5. 待环境验证项的影响判断

## 5.1 不影响主链路、但影响“绝对全绿”口径的项

1. `agents stale` 真实运行态稳定复现留痕
   - 不影响 fresh 主链路
   - 不影响 `/api/v1/agents` 正常成功路径
   - 影响的是“缓存降级分支证据完备度”

2. 缺失的 `tasks/2026-03-14-mvp-backend-tail-closure-leona.md`
   - 不直接影响当前 artifact 可运行性
   - 但影响正式交付链与审计闭环完整度

## 5.2 会阻塞“正式继续推进”的项

**本轮未发现新的主链路阻塞项。**

但需要明确：
- 如果后续要以“无保留、绝对全绿、正式归档完成”口径对外发布，
  - 缺失的 backend tail closure 任务单需要补齐
  - `agents stale` 最好补一份真实运行态留痕

换句话说：
- **继续推进 MVP 正式开发：不阻塞**
- **以文档审计完全闭环口径归档：仍有保留条件**

---

## 6. 最终收口结论

本轮尾项最终补验结论如下：

### 已完成补验并通过
- `TEMPLATE_INVALID`
- `TEMPLATE_APPLY_FAILED`
- `npm run verify`

### 仍保留待环境验证
- `agents stale` 真实运行态稳定复现留痕

### 统一收口结论
**办公控制台增强项目 MVP 尾项收口，建议按“有条件通过”落结论。**

推荐对外口径：

> MVP 主链路已可视为通过，剩余保留项不阻塞继续推进；但由于指定 backend tail closure 任务单缺失，且 `agents stale` 仍缺稳定运行态留痕，当前不建议写成“绝对全绿无条件通过”。

---

## 7. 给 Teemo 的简短建议

1. 可以继续推进正式开发，不必因本轮尾项停住主链路
2. 若要做最终归档收口，建议补齐：
   - `tasks/2026-03-14-mvp-backend-tail-closure-leona.md`
   - `agents stale` 一次真实环境留痕
3. 当前最稳妥标签：**有条件通过 / 主链路通过 / 文档与单一降级分支待补档**
