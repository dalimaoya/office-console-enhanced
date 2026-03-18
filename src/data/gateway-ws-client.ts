/**
 * GatewayWsClient — 复用单个 WebSocket 连接替代每次 spawn 子进程
 *
 * Iter-1 新增：
 * - 单连接复用，避免每次请求重新建立
 * - 支持 JSON-RPC 2.0 调用（替代 CLI execFile）
 * - 支持实时推送事件订阅
 * - 自动重连机制
 */

import { EventEmitter } from 'node:events';
import { log } from '../utils/logger.js';

export interface GatewayWsConfig {
  /** Gateway WebSocket URL，默认 ws://127.0.0.1:18789 */
  url: string;
  /** 鉴权 token（可选） */
  token?: string;
  /** 重连间隔 ms，默认 3000 */
  reconnectMs: number;
  /** 调用超时 ms，默认 10000 */
  callTimeoutMs: number;
}

type PendingCall = {
  resolve: (value: any) => void;
  reject: (reason: Error) => void;
  timer: NodeJS.Timeout;
};

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'closing';

export class GatewayWsClient extends EventEmitter {
  private ws: any = null; // Node.js 内置 WebSocket（v22+）或动态 import
  private pendingCalls = new Map<string, PendingCall>();
  private callId = 0;
  private state: ConnectionState = 'disconnected';
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(private config: GatewayWsConfig) {
    super();
  }

  get isConnected(): boolean {
    return this.state === 'connected';
  }

  /** 建立连接（Server 启动时调用，非阻塞） */
  connectAsync(): void {
    if (this.state === 'connecting' || this.state === 'connected') return;
    this.state = 'connecting';
    this.doConnect();
  }

  /** 建立连接（等待首次连接成功） */
  async connect(timeoutMs = 5000): Promise<void> {
    if (this.state === 'connected') return;
    this.connectAsync();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeListener('connected', onConn);
        this.removeListener('error', onErr);
        reject(new Error('Gateway WS connect timeout'));
      }, timeoutMs);

      const onConn = () => {
        clearTimeout(timer);
        this.removeListener('error', onErr);
        resolve();
      };
      const onErr = (err: Error) => {
        clearTimeout(timer);
        this.removeListener('connected', onConn);
        reject(err);
      };

      this.once('connected', onConn);
      this.once('error', onErr);
    });
  }

  private doConnect(): void {
    try {
      const url = new URL(this.config.url);
      if (this.config.token) url.searchParams.set('token', this.config.token);

      // 使用 Node.js 22 内置 WebSocket
      const WS = (globalThis as any).WebSocket;
      if (!WS) {
        log('warn', 'gateway_ws_not_available', { reason: 'WebSocket not available in this Node.js version' });
        this.state = 'disconnected';
        return;
      }

      const ws = new WS(url.toString());
      this.ws = ws;

      ws.addEventListener('open', () => {
        this.state = 'connected';
        log('info', 'gateway_ws_connected', { url: this.config.url });
        this.emit('connected');
      });

      ws.addEventListener('message', (event: any) => {
        this.handleMessage(event.data);
      });

      ws.addEventListener('close', () => {
        this.state = 'disconnected';
        this.ws = null;
        this.emit('disconnected');
        log('info', 'gateway_ws_disconnected', {});
        // 拒绝所有 pending calls
        for (const [id, pending] of this.pendingCalls) {
          clearTimeout(pending.timer);
          pending.reject(new Error('Gateway WS disconnected'));
          this.pendingCalls.delete(id);
        }
        this.scheduleReconnect();
      });

      ws.addEventListener('error', (event: any) => {
        const err = new Error('Gateway WS error');
        log('warn', 'gateway_ws_error', { message: String(event) });
        this.emit('error', err);
        // 不需要显式 close，close 事件会触发
      });
    } catch (err) {
      log('warn', 'gateway_ws_connect_failed', { err: String(err) });
      this.state = 'disconnected';
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.state === 'closing') return;
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.state === 'disconnected') {
        this.state = 'connecting';
        this.doConnect();
      }
    }, this.config.reconnectMs);
  }

  /** JSON-RPC 2.0 调用（替代 CLI execFile） */
  async call<T = any>(method: string, params: Record<string, unknown> = {}, timeoutMs?: number): Promise<T> {
    if (!this.isConnected || !this.ws) {
      throw new Error(`Gateway WS not connected (state: ${this.state})`);
    }

    const id = String(++this.callId);
    const timeout = timeoutMs ?? this.config.callTimeoutMs;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingCalls.delete(id);
        reject(new Error(`Gateway WS call ${method} timed out after ${timeout}ms`));
      }, timeout);

      this.pendingCalls.set(id, { resolve, reject, timer });

      try {
        this.ws.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }));
      } catch (err) {
        clearTimeout(timer);
        this.pendingCalls.delete(id);
        reject(err);
      }
    });
  }

  private handleMessage(raw: string): void {
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    // JSON-RPC 响应
    if (msg.id !== undefined && this.pendingCalls.has(String(msg.id))) {
      const pending = this.pendingCalls.get(String(msg.id))!;
      clearTimeout(pending.timer);
      this.pendingCalls.delete(String(msg.id));

      if (msg.error) {
        pending.reject(new Error(msg.error.message ?? JSON.stringify(msg.error)));
      } else {
        pending.resolve(msg.result);
      }
      return;
    }

    // 实时推送事件（通知类消息）
    if (msg.method) {
      this.emit('push', { method: msg.method, params: msg.params });
      this.emit(`push:${msg.method}`, msg.params);
    }
  }

  /** 关闭连接 */
  disconnect(): void {
    this.state = 'closing';
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch { /* ignore */ }
      this.ws = null;
    }
  }
}

/** 全局单例 */
let _instance: GatewayWsClient | null = null;

export function initGatewayWsClient(config: GatewayWsConfig): GatewayWsClient {
  _instance = new GatewayWsClient(config);
  return _instance;
}

export function getGatewayWsClient(): GatewayWsClient | null {
  return _instance;
}
