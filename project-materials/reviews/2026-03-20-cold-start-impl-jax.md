# 冷启动索引快照 — 实现摘要

**作者**：贾克斯（architect-jax）  
**日期**：2026-03-19  
**阶段**：二期  

---

## 目标

新会话/新角色进入时，能在 10 秒内重建项目上下文，知道"现在该干什么"。

## 实现

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/services/cold-start-service.ts` | 冷启动快照核心服务 |
| `src/controllers/cold-start-controller.ts` | API 控制器 |

### 修改文件

| 文件 | 变更 |
|------|------|
| `src/routes/api.ts` | 注册 `GET /api/v1/cold-start` 路由 |
| `src/server.ts` | 启动时初始化冷启动服务 |

### 快照结构

```typescript
interface ColdStartSnapshot {
  generatedAt: string;           // 生成时间
  projectStage: { ... };         // 项目阶段（来自 state-machine-service）
  activeObjectCount: number;     // 活跃对象数
  activeObjects: [...];          // 活跃对象列表（registry-service, limit=10）
  recentEvents: [...];           // 最近5条事件日志（event-log-service）
  agentSummary: [...];           // Agent 状态摘要（agent-service）
  blockers: [...];               // 当前阻塞项（项目级 + Agent级 + 对象级）
}
```

### 定时更新

- 服务启动时生成一次快照
- 之后每 5 分钟自动刷新（`setInterval`, `unref` 避免阻塞进程退出）
- 快照持久化到 `data/cold-start-snapshot.json`

### API

- `GET /api/v1/cold-start` — 返回当前快照 JSON

## 验证

- `npx tsc --noEmit` ✅ 无错误
- `curl http://localhost:3014/api/v1/cold-start` ✅ 返回完整 JSON

## 设计决策

1. **并行聚合**：所有数据源 `Promise.all` 并行查询，单次快照构建 < 1s
2. **容错降级**：每个数据源独立 catch，单源失败不阻塞整体快照
3. **多源阻塞项**：从项目状态机、Agent 列表、对象注册表三个维度聚合 blockers
4. **非阻塞初始化**：首次构建为 fire-and-forget，不阻塞服务启动
