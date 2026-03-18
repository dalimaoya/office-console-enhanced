/**
 * SseHub — 服务端推送（SSE）中心
 *
 * Iter-1 新增：替代现有的轮询刷新机制
 * - 管理所有 SSE 客户端连接
 * - 广播文件变更事件到所有已连接浏览器
 * - 支持心跳保活
 */

import type { Request, Response } from 'express';
import { log } from '../utils/logger.js';

export interface SseClient {
  id: string;
  res: Response;
  connectedAt: number;
}

export class SseHub {
  private clients = new Map<string, SseClient>();
  private idCounter = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private readonly heartbeatIntervalMs: number;

  constructor(heartbeatIntervalMs = 25_000) {
    this.heartbeatIntervalMs = heartbeatIntervalMs;
    this.startHeartbeat();
  }

  /** 将新的 HTTP 连接注册为 SSE 客户端 */
  addClient(req: Request, res: Response): string {
    const clientId = String(++this.idCounter);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Nginx 代理场景
    });

    // 立即发送连接成功事件
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: Date.now() })}\n\n`);

    const client: SseClient = { id: clientId, res, connectedAt: Date.now() };
    this.clients.set(clientId, client);

    log('info', 'sse_client_connected', { clientId, total: this.clients.size });

    // 客户端断开时清理
    req.on('close', () => {
      this.clients.delete(clientId);
      log('info', 'sse_client_disconnected', { clientId, total: this.clients.size });
    });

    return clientId;
  }

  /** 广播事件到所有客户端 */
  broadcast(event: string, data: unknown): void {
    if (this.clients.size === 0) return;

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const toRemove: string[] = [];

    for (const [id, client] of this.clients) {
      try {
        client.res.write(payload);
      } catch {
        // 写入失败，连接可能已断开
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.clients.delete(id);
    }
  }

  /** 推送心跳（防止连接因超时被断开） */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.clients.size === 0) return;
      this.broadcast('heartbeat', { timestamp: Date.now() });
    }, this.heartbeatIntervalMs);

    // 不阻塞进程退出
    if (this.heartbeatTimer.unref) {
      this.heartbeatTimer.unref();
    }
  }

  /** 当前客户端数 */
  get clientCount(): number {
    return this.clients.size;
  }

  /** 关闭所有连接 */
  close(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    for (const client of this.clients.values()) {
      try { client.res.end(); } catch { /* ignore */ }
    }
    this.clients.clear();
  }
}

/** 全局单例 */
let _instance: SseHub | null = null;

export function initSseHub(heartbeatIntervalMs?: number): SseHub {
  _instance = new SseHub(heartbeatIntervalMs);
  return _instance;
}

export function getSseHub(): SseHub {
  if (!_instance) {
    _instance = new SseHub();
  }
  return _instance;
}
