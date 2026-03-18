/**
 * EventsController — SSE 推送端点
 *
 * Iter-1 新增：GET /api/v1/events
 * - 浏览器通过 EventSource API 连接此端点
 * - FileWatcher 检测到文件变更时，通过 SSE 推送到浏览器
 * - 替代现有的轮询刷新机制
 */

import type { Request, Response } from 'express';
import { getSseHub } from '../data/sse-hub.js';
import { log } from '../utils/logger.js';

/**
 * GET /api/v1/events
 * 建立 SSE 连接，接收服务端实时推送
 */
export function getEvents(req: Request, res: Response): void {
  const hub = getSseHub();

  // addClient 会设置好 SSE 响应头并注册客户端
  const clientId = hub.addClient(req, res);

  log('info', 'sse_events_connected', {
    clientId,
    remoteAddress: req.socket?.remoteAddress ?? 'unknown',
    totalClients: hub.clientCount,
  });
}

/**
 * GET /api/v1/events/status
 * 返回当前 SSE 连接状态（非 SSE，普通 JSON）
 */
export function getEventsStatus(req: Request, res: Response): void {
  const hub = getSseHub();
  res.json({
    success: true,
    data: {
      clientCount: hub.clientCount,
      endpoint: '/api/v1/events',
      protocol: 'text/event-stream',
    },
  });
}
