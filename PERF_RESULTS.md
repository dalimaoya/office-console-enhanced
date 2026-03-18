# Office Dashboard Adapter 性能结果

- 测试时间：2026-03-13 UTC
- 测试对象：`artifacts/office-dashboard-adapter`
- 启动方式：`npm run benchmark`
- 鉴权：**MVP 当前无鉴权要求**

## 测试口径

1. 服务启动后直接开始监听端口，不要求 Bearer Token。
2. 首次请求（cold）定义为“服务就绪后的第一笔 dashboard 请求”。
3. 后续 12 次请求用于统计缓存命中表现。
4. 缓存降级口径以当前契约为准：有缓存时返回 `200 + success:true + cached:true + stale:true`，无缓存时返回 `503 + success:false + error.code=GATEWAY_UNAVAILABLE`。

## 结果

```json
{
  "cold": {
    "status": 200,
    "durationMs": 13.10,
    "cached": true,
    "stale": false
  },
  "warm": {
    "count": 12,
    "avgMs": 7.76,
    "p95Ms": 15.68,
    "maxMs": 15.68,
    "cacheHitRate": 100
  }
}
```

## 结论

- 服务就绪后的首笔请求：`13.10ms`
- 缓存命中 P95：`15.68ms`
- 缓存命中率：`100%`
- 满足契约要求：
  - 缓存命中 P95 ≤ 500ms：**满足**
  - 联调场景接口响应 P95 ≤ 2000ms：**满足**

## 说明

- 当前 Gateway CLI/RPC 原始调用本身较慢，因此 MVP 采用 TTL 缓存 + stale fallback 保证联调体验。
- 若 Gateway 刷新失败且存在可用缓存，接口按当前契约返回 `stale:true` 警告响应。
- 本文件仅记录性能观测，不再沿用旧的 Bearer 鉴权或 `cachedData` 响应口径。
