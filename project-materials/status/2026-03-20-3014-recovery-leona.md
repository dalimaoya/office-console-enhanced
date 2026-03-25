# 3014 端口服务修复记录 - Leona

- 时间：2026-03-20 11:13 UTC
- 项目：office-console-enhanced
- 服务目录：`artifacts/office-dashboard-adapter/`
- 服务名：`office-console`

## 现象
用户反馈 3014 端口不可访问。

## 排查过程
1. `pm2 list` 结果为空，说明 PM2 当前未托管该服务。
2. `ps aux` 未发现 `office-dashboard-adapter` 对应运行进程。
3. `curl http://127.0.0.1:3014/api/v1/health` 连接失败。
4. 读取 `logs/pm2-out.log` / `logs/pm2-error.log`：
   - 日志显示服务曾于 `2026-03-20T06:49:05Z` 正常启动并监听 `0.0.0.0:3014`。
   - 最新错误日志只有 `Gateway WS disconnected` 告警，没有应用崩溃堆栈。
   - 结合 PM2 进程列表为空，判断根因是 **服务进程未被 PM2 托管/已退出，导致 3014 无监听**，而非代码启动报错。

## 修复动作
1. 在 `artifacts/office-dashboard-adapter/` 下确认 PM2 配置：`ecosystem.config.cjs`。
2. 执行：`pm2 start ecosystem.config.cjs`
3. 执行：`pm2 save`，持久化当前 PM2 进程列表。
4. 复检：
   - `pm2 list`：`office-console` 状态 `online`
   - `netstat -ltnp`：`0.0.0.0:3014` 已监听
   - `curl http://127.0.0.1:3014/api/v1/health`：HTTP 200

## 当前状态
服务已恢复：
- 进程：在线
- 端口：3014 已监听
- 健康检查：`/api/v1/health` 返回 200

## 健康检查返回示例
```http
HTTP/1.1 200 OK
```

```json
{"success":true,"data":{"service":{"status":"ok"},"gateway":{"status":"ok"},"checkedAt":"2026-03-20T11:13:16.367Z"},"cached":false,"stale":false}
```
