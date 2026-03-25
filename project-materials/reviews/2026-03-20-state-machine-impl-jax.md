# 二期·项目状态机实现摘要

**作者**：贾克斯（架构师）  
**日期**：2026-03-19  
**阶段**：二期

---

## 产出物

| 文件 | 类型 | 说明 |
|------|------|------|
| `docs/state-machine-v1.md` | 设计文档 | 项目状态机完整设计：5阶段+阻塞态、转移矩阵、进入/退出条件、持久化方案 |
| `src/services/state-machine-service.ts` | 后端服务 | 状态读取/转移/合法性检查/事件日志记录，JSON文件持久化 |
| `src/controllers/project-status-controller.ts` | 控制器 | GET/POST 两个端点的请求处理 |
| `src/routes/api.ts` | 路由注册 | 新增 `/projects/status` 和 `/projects/transition` |

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/projects/status` | 返回当前项目阶段、阻塞信息、上次转移记录 |
| POST | `/api/v1/projects/transition` | 触发阶段转移，body: `{nextStage, reason, actor?}` |

## 质量验证

- ✅ `npx tsc --noEmit` 通过，零错误
- ✅ `GET /api/v1/projects/status` 返回正确 JSON
- ✅ 合法转移（init→active）成功执行
- ✅ 非法转移（active→closing跳阶段）返回 400 + 错误说明
- ✅ event-log-service 集成，每次转移写入事件日志

## 设计要点

1. **单文件持久化**：`data/project-state.json`，服务重启后状态不丢失
2. **转移矩阵硬编码**：不允许跳阶段，仅允许相邻回退（review→active, closing→review）
3. **阻塞态横切**：任何非归档阶段可进入blocked，恢复时只能回到原阶段
4. **事件日志**：每次转移通过 event-log-service 记录 `object.status_changed` 事件
