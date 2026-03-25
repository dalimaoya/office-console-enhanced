# MVP 联调可观测性补验记录（Galio）

- 时间：2026-03-14 UTC
- 角色：codingqa-galio
- 阶段：办公控制台增强项目 MVP 持续开发与联调迭代 / 联调可观测性补验
- 范围：仅检查本轮新增联调/排障字段在实际链路中的可见性、可读性、排障可用性；不扩展新功能或新验收范围

---

## 1. 本轮依据

按要求先读取并以以下输入为准：

1. `status/CURRENT.md`
2. `tasks/2026-03-14-mvp-backend-iteration-phase3-leona.md`
3. `tasks/2026-03-14-mvp-frontend-debug-alignment-phase5-ezreal.md`
4. `reviews/2026-03-14-mvp-browser-sampling-galio.md`
5. `artifacts/office-dashboard-adapter/`

补充核对与执行：
- `npm run verify` ✅
- `npx tsc --noEmit` ✅
- 直接 HTTP 取样（curl）✅
- 前后端关键实现位置最小核对：
  - `src/middleware/request-logger.ts`
  - `src/utils/responses.ts`
  - `src/public/app.js`

---

## 2. 本轮补验方法

本轮证据来源分为三层：

1. **后端真实运行链路**
   - `npm run verify` 输出的在线、stale、apply error 分支结果
   - verify 运行期间的结构化日志

2. **直接 HTTP 头取样**
   - `GET /api/v1/config/templates`
   - `GET /api/v1/agents`（offline + stale）
   - `POST /api/v1/config/templates/office-basic/apply`（mock failure）
   - `GET /api/v1/dashboard`（本轮取样落到 success/miss）

3. **前端消费与展示实现核对**
   - `app.js` 已统一抽取并渲染：
     - `X-Request-Id`
     - `X-Cache-Status`
     - `X-Error-Code`
     - `X-Warning-Type`
   - 调试头已挂到 Dashboard / Health / Config / apply 反馈区

说明：
- browser 工具在上一轮已明确超时不可用，本轮**不伪造真实浏览器截图级通过**。
- 因此本轮结论以“运行链路 + HTTP 头取样 + 前端实现消费”作为主证据。

---

## 3. 核对到的实现事实

## 3.1 后端头部写入

已核对：

- `request-logger.ts`
  - 每个请求都会设置 `X-Request-Id`
  - 完成日志会带 `requestId / statusCode / durationMs / cacheStatus / errorCode`

- `responses.ts`
  - 成功响应：按 `cached/stale` 设置 `X-Cache-Status`
  - warning 响应：设置 `X-Warning-Type`
  - 错误响应：设置 `X-Error-Code`

这说明后端的“可观测性字段来源”是明确且统一的，不是零散拼接。

## 3.2 前端头部消费

已核对 `src/public/app.js`：

- `extractDebugMeta(response)` 会统一读取：
  - `x-request-id`
  - `x-cache-status`
  - `x-error-code`
  - `x-warning-type`
- `renderDebugMeta()` 会把这些值渲染成调试 chip
- 展示位置已接入：
  - Dashboard 调试头
  - Health 调试头
  - 模板列表调试头
  - Agent 列表调试头
  - 模板详情调试头
  - 本次 apply 调试头

这说明前端并非“只在网络面板可见”，而是已经把联调头最小落位到页面内。

---

## 4. 实际链路补验结果

## 4.1 `X-Request-Id`

状态：**已验证可见、可读、可用于排障**

证据：
- 直接 HTTP 取样中，以下场景均返回该头：
  - Dashboard success：`X-Request-Id` ✅
  - Config templates success：`X-Request-Id` ✅
  - Agents stale：`X-Request-Id` ✅
  - apply failure：`X-Request-Id` ✅
- verify 结构化日志中，每条请求开始/结束日志均带同一 `requestId`
- 前端已在 Dashboard / Config / apply 调试块中消费展示

排障价值判断：
- **已足够支撑联调**
- 前端/QA 可直接拿页面或响应头中的 `requestId` 去对后端结构化日志
- 对 apply 失败、缓存降级、Gateway 异常链路都有效

## 4.2 `X-Cache-Status`

状态：**已验证可见、可读、基本可用于排障**

本轮实际取样：
- Dashboard success：`X-Cache-Status: miss`
- Config templates success：`X-Cache-Status: hit`
- Agents stale：`X-Cache-Status: stale`

补充证据：
- verify 日志中可见：
  - `cache_refresh_success`
  - `cache_stale_fallback`
  - 请求完成日志里的 `cacheStatus`
- 前端已在 Dashboard / Config 调试块中展示该值

排障价值判断：
- **已足够支撑常规联调**
- 能帮助快速区分 `hit / miss / stale`
- 对缓存问题排查明显有帮助，尤其是“页面拿到的是新数据还是 stale 数据”

当前局限：
- 对最终用户而言可读性一般，更适合联调/开发视角
- 若后续需要更强运维解释力，可考虑在内部日志/文档补一份 `hit/miss/stale` 判定说明，但这不是本轮 blocker

## 4.3 `X-Error-Code`

状态：**已验证可见、可读、适合错误链路排障**

本轮实际取样：
- apply mock failure：`X-Error-Code: TEMPLATE_APPLY_FAILED`

verify 已稳定命中的错误分支：
- `BAD_REQUEST = 400`
- `AGENT_NOT_FOUND = 404`
- `TEMPLATE_INVALID = 422`
- `TEMPLATE_APPLY_FAILED = 500`

日志对齐：
- 请求完成日志带 `errorCode`
- `request_failed` 日志带 `code / statusCode / message / detail`

前端对齐：
- apply 失败反馈区已展示 `error.code｜error.message`
- 若有 `detail`，也会展示；调试头中还会补显示 `X-Error-Code`

排障价值判断：
- **已足够支撑错误态联调**
- 对 apply 失败定位非常有价值
- 适合开发/QA/后端联调，也适合保留在浏览器网络面板或页面轻量调试区

当前边界：
- `X-Error-Code` 更偏联调/内部排障，不建议升格为面向最终用户的主展示字段

## 4.4 `X-Warning-Type`

状态：**已验证可见、可读，主要适用于 stale/warning 排障**

本轮实际取样：
- Agents stale：`X-Warning-Type: gateway_unreachable`

补充证据：
- verify 汇总中：`warningType = gateway_unreachable`
- `cache_stale_fallback` 日志与 stale 响应链路一致
- 前端已支持条件展示该字段

排障价值判断：
- **已足够支撑缓存降级类联调**
- 对判断“是正常缓存命中，还是 Gateway 不可达导致的 stale 降级”很有帮助

当前边界：
- 该字段更适合联调与内部排障，不建议作为用户主提示文案直接暴露
- 当前主要在 stale/warning 场景有价值，通用性低于 `X-Request-Id`

---

## 5. 按场景收口

## 5.1 Dashboard 场景

已确认：
- 后端已支持 `X-Request-Id`、`X-Cache-Status`
- 前端 Dashboard 调试块已接入展示
- 本轮直接 HTTP 取样拿到：
  - `200 OK`
  - `X-Request-Id`
  - `X-Cache-Status: miss`
- verify 另一路运行曾命中 `503 / GATEWAY_UNAVAILABLE`

结论：
- **Dashboard 的 request id 与 cache status 已具备联调可见性**
- 本轮未用真实浏览器完成页面截图级确认，因此“页面视觉可见性”仍沿用前端实现级与非浏览器证据，不写成浏览器全绿
- Dashboard 下 `X-Warning-Type` / `X-Error-Code` 取决于实际 warning/error 分支是否命中，本轮未补到浏览器级现场样本

## 5.2 Config 场景

已确认：
- `GET /api/v1/config/templates` 直接取样返回：
  - `200 OK`
  - `X-Request-Id`
  - `X-Cache-Status: hit`
- 前端已在模板列表 / Agent 列表 / 模板详情附近挂调试头

结论：
- **Config 场景的 request id 与 cache status 已具备联调可见性和可读性**
- 对“列表拿到的是 fresh/hit/stale 哪种状态”已有最小支撑
- 仍缺真实浏览器页面留样，但不影响本轮判断其联调可用

## 5.3 apply 场景

已确认：
- 直接取样：
  - `500 Internal Server Error`
  - `X-Request-Id`
  - `X-Error-Code: TEMPLATE_APPLY_FAILED`
- verify 可稳定覆盖：
  - `BAD_REQUEST`
  - `AGENT_NOT_FOUND`
  - `TEMPLATE_INVALID`
  - `TEMPLATE_APPLY_FAILED`
- 结构化日志带：
  - `config_apply_started`
  - `request_failed`
  - `http_request_completed`
- 前端 apply 反馈区可展示：
  - `error.code`
  - `error.message`
  - `error.detail`
  - 本次 apply 调试头

结论：
- **apply 场景的排障支撑最完整**
- `X-Request-Id + X-Error-Code + detail + 结构化日志` 已足够支持当前联调
- 这条链路已经能比较高效地定位“参数问题 / 目标 agent 不存在 / 模板非法 / CLI apply 失败”

---

## 6. 哪些信息已足够支持联调，哪些仍需补充

## 6.1 已足够支持联调

1. **`X-Request-Id`**
   - 已贯通请求头、日志、前端调试块
   - 属于当前最有价值的联调字段

2. **`X-Cache-Status`**
   - 已能支撑 Dashboard / Config 的缓存态判断
   - 对 stale/hit/miss 排障足够实用

3. **`X-Error-Code`**
   - 已能支撑 apply 错误分类对齐
   - 与 JSON error code 形成双重确认

4. **`X-Warning-Type`**
   - 已能支撑 stale 降级类排障
   - 对判断 `gateway_unreachable` 这类 warning 足够有效

5. **apply 错误 detail**
   - `AGENT_NOT_FOUND`、`TEMPLATE_INVALID`、`TEMPLATE_APPLY_FAILED` 均已具备较强可读性
   - 当前 detail 粒度已能支撑联调

## 6.2 仍建议补充或仅适合内部使用

1. **真实浏览器留样仍待补档**
   - 当前 browser 环境仍是已知限制项
   - 因此本轮对“页面视觉可见性”的结论仍不是截图级归档

2. **`X-Warning-Type` 更适合内部/联调使用**
   - 不建议升格为用户主文案
   - 保持在调试块/网络面板即可

3. **`X-Error-Code` 更适合内部/联调使用**
   - 对研发/QA 很有用
   - 对最终用户不必作为主视图强暴露

4. **Dashboard error/warning 的现场样本还不够完整**
   - 运行链路已有证据
   - 但本轮没有补齐浏览器级页面样本

---

## 7. 风险与限制说明

1. **browser 环境限制仍存在**
   - 上一轮已明确超时不可用
   - 本轮未把不可完成部分伪造成通过

2. **本轮直接 HTTP 取样中的 Dashboard 请求落到 success/miss**
   - 说明 Dashboard 响应头机制是有效的
   - 但不代表已完整覆盖 Dashboard warning/error 的页面内可见性留样

3. **当前结论以“联调可用”为主，不等于“最终用户文案设计已优化完成”**
   - 本轮关注的是排障信息能否被看到、读懂、用来定位问题
   - 不是做产品化包装优化

---

## 8. 阶段性结论

**本轮联调可观测性补验结论：基本达标，可支撑当前 MVP 持续联调。**

更具体地说：
- `X-Request-Id`、`X-Cache-Status`、`X-Error-Code`、`X-Warning-Type` 已在后端真实响应中可见
- 前端已完成最小消费与页面内调试展示挂载
- apply 场景的联调/排障支撑最完整，当前已足够高效定位错误来源
- Dashboard / Config 的缓存态与请求级定位能力已具备联调价值
- 当前仍缺少 browser 恢复后的真实浏览器截图级补档，但这**不构成当前 MVP 联调推进阻塞**

当前最稳妥的项目口径：
- **联调可观测性已达到“可用且基本够用”**
- **其中 `X-Error-Code`、`X-Warning-Type` 更适合作为内部/联调辅助信息**
- **待 browser 环境恢复后，再补一轮真实浏览器页面留样即可**

---

## 9. 后续建议（简短）

1. **保持当前头部方案，不建议本轮再扩字段**
   - 现有四个头已能覆盖请求定位、缓存判断、错误分类、warning 类型

2. **待 browser 环境恢复后，补一轮截图级留样**
   - 优先补 Dashboard warning/error
   - 其次补 Config/apply 失败调试块现场样本

3. **继续保持调试字段轻量展示，不提升为主视图信息**
   - 当前信息层级合理
   - 联调够用，且未明显干扰主流程
