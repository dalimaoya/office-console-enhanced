# 对象注册表后端实现 — 贾克斯

**日期**: 2026-03-19  
**作者**: architect-jax  
**状态**: ✅ 已完成

## 实现摘要

### 新增文件
1. **`src/services/registry-service.ts`** — 对象注册表核心服务
   - 读取 `registry/objects.md` Markdown 表格，解析为结构化 JSON
   - 支持按 `status`、`type` 过滤，支持 `limit` 分页
   - `getById(objectId)` 单条查询
   - `appendObject(entry)` 内部写入方法（一期不对外暴露）
   - 文件不存在时静默返回空数组

2. **`src/controllers/registry-controller.ts`** — API 控制器
   - `GET /api/v1/registry` — 列表查询，支持 `?status=active&type=handoff&limit=20`
   - `GET /api/v1/registry/:object_id` — 单条查询，404 时返回标准错误

### 修改文件
3. **`src/routes/api.ts`** — 注册两条路由

## 验证结果
- `npx tsc --noEmit` ✅ 通过
- `curl http://localhost:3014/api/v1/registry` ✅ 返回 4 条记录
- `curl http://localhost:3014/api/v1/registry?status=active` ✅ 返回 1 条
- `curl http://localhost:3014/api/v1/registry/artifact-20260319-01-adjustment` ✅ 单条返回

## 设计决策
- Markdown 解析兼容空行、注释行（`#`/`**`/`---`）、表头分隔行
- 路径使用绝对路径，避免 cwd 依赖
- 遵循 event-log-service 的模式：单例导出 + 同步风格 API
