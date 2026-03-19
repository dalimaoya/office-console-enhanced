import { createApp } from './app.js';
import { env } from './config/env.js';
import { log } from './utils/logger.js';
import { initFileReader } from './data/file-reader.js';
import { initGatewayWsClient } from './data/gateway-ws-client.js';
import { initSseHub, getSseHub } from './data/sse-hub.js';
import { initFileWatcher } from './data/file-watcher.js';
import { initFeishuNotifier, getFeishuNotifier } from './services/feishu-notifier.js';
import { appendTimelineEvent } from './services/timeline-service.js';
import { eventLogService } from './services/event-log-service.js';
import { coldStartService } from './services/cold-start-service.js';

// ── Iter-6：初始化飞书通知服务 ───────────────────────────────────────────────
initFeishuNotifier();
const feishuNotifier = getFeishuNotifier();
if (feishuNotifier.isConfigured) {
  log('info', 'feishu_notifier_initialized', { configured: true });
} else {
  log('info', 'feishu_notifier_initialized', { configured: false, hint: 'Set FEISHU_WEBHOOK_URL to enable notifications' });
}

// ── Iter-1：初始化新数据层 ───────────────────────────────────────────────────

// 1. FileReader：直读运行时文件
initFileReader({ openclawRoot: env.openclawRoot });
log('info', 'file_reader_initialized', { root: env.openclawRoot });

// 2. SseHub：SSE 推送中心
initSseHub(env.sseHeartbeatIntervalMs);
log('info', 'sse_hub_initialized', { heartbeatMs: env.sseHeartbeatIntervalMs });

// 3. FileWatcher：监控项目目录变更，联动 SSE 推送
const fileWatcher = initFileWatcher(200);
const sseHub = getSseHub();

// 监控项目目录（tasks/status/docs 等变更）
fileWatcher.watchDirectory(env.projectRoot);
fileWatcher.on('change', (event) => {
  sseHub.broadcast('file-change', {
    filename: event.filename,
    dir: event.dir,
    eventType: event.eventType,
    timestamp: event.timestamp,
  });
});

// 4. GatewayWsClient：后台非阻塞连接 Gateway（可选增强，不影响主路径）
if (env.useFileReader) {
  const wsClient = initGatewayWsClient({
    url: env.gatewayWsUrl,
    token: env.gatewayToken || undefined,
    reconnectMs: env.gatewayWsReconnectMs,
    callTimeoutMs: env.commandTimeoutMs,
  });

  // 非阻塞连接，连接失败不影响服务启动
  wsClient.connectAsync();

  wsClient.on('connected', () => {
    log('info', 'gateway_ws_ready', { url: env.gatewayWsUrl });
    sseHub.broadcast('gateway-connected', { timestamp: Date.now() });
  });

  wsClient.on('disconnected', () => {
    sseHub.broadcast('gateway-disconnected', { timestamp: Date.now() });
  });

  // Gateway 实时推送事件透传到浏览器
  wsClient.on('push', (event: { method: string; params: any }) => {
    sseHub.broadcast('gateway-push', event);

    // Iter-6：触发飞书通知（agent 状态异常 / 任务 blocked）
    const notifier = getFeishuNotifier();
    if (notifier.isConfigured) {
      const { method, params } = event;

      // agent 状态变更：offline 或 error
      if (method === 'agent.status' && params) {
        const status: string = params.status ?? '';
        if (status === 'offline' || status === 'error') {
          void notifier.notifyAgentStatus(
            params.agentId ?? 'unknown',
            status,
            params.reason ?? params.message,
          );
        }
      }

      // 任务 blocked
      if (method === 'task.status' && params) {
        const taskStatus: string = params.status ?? '';
        if (taskStatus === 'blocked') {
          void notifier.notifyTaskBlocked(
            params.taskId ?? 'unknown',
            params.title,
            params.reason,
          );
        }
      }
    }
  });
}

// ── 启动 HTTP Server ─────────────────────────────────────────────────────────

eventLogService.init();

// ── 二期：冷启动快照服务 ─────────────────────────────────────────────────────
coldStartService.start();

const app = createApp();
app.listen(env.port, env.host, () => {
  void appendTimelineEvent({
    type: 'system_start',
    summary: '服务启动',
    data: {
      host: env.host,
      port: env.port,
    },
  });
  eventLogService.append({
    event_type: 'system.start',
    source_role: 'system-gateway',
    description: 'office-dashboard-adapter 服务启动',
    object_id: 'project-office-console-enhanced',
    context: {
      host: env.host,
      port: env.port,
    },
  });

  log('info', 'server_started', {
    host: env.host,
    port: env.port,
    useFileReader: env.useFileReader,
    openclawRoot: env.openclawRoot,
    projectRoot: env.projectRoot,
  });
});
