/**
 * SettingsController — 控制台安全配置端点
 *
 * Iter-6 新增：
 * - GET /api/v1/settings — 返回当前控制台安全配置
 * - 只读端点，READONLY_MODE 兼容
 *
 * Iter-2 新增：
 * - GET /api/v1/settings/wiring-status — 接线状态诊断
 */

import type { Request, Response, NextFunction } from 'express';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import * as net from 'node:net';
import { env } from '../config/env.js';
import { sendSuccess } from '../utils/responses.js';

/** 服务启动时间（进程启动时记录） */
const startedAt = new Date().toISOString();

const OPENCLAW_ROOT = '/root/.openclaw';
const GATEWAY_WS_URL = 'ws://127.0.0.1:18789';
const GATEWAY_PING_TIMEOUT_MS = 2000;

export async function getSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = {
      readonlyMode: env.readonlyMode,
      tokenEnabled: env.consoleToken.length > 0,
      dryRunEnabled: env.dryRunDefault,
      version: process.env.npm_package_version ?? 'unknown',
      startedAt,
    };
    return sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
}

async function checkGatewayWs(): Promise<{ status: string; url: string; latencyMs: number | null; error?: string }> {
  const url = GATEWAY_WS_URL;
  const start = Date.now();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      try { socket.destroy(); } catch { /* ignore */ }
      resolve({ status: 'timeout', url, latencyMs: null, error: 'ping timeout (2s)' });
    }, GATEWAY_PING_TIMEOUT_MS);

    // Use TCP-level check (ws port 18789 is TCP; connect success = gateway up)
    const socket = net.createConnection({ port: 18789, host: '127.0.0.1' });
    socket.setTimeout(GATEWAY_PING_TIMEOUT_MS);

    socket.on('connect', () => {
      clearTimeout(timer);
      const latencyMs = Date.now() - start;
      socket.destroy();
      resolve({ status: 'connected', url, latencyMs });
    });
    socket.on('error', (err: Error) => {
      clearTimeout(timer);
      resolve({ status: 'error', url, latencyMs: null, error: err.message });
    });
    socket.on('timeout', () => {
      clearTimeout(timer);
      socket.destroy();
      resolve({ status: 'timeout', url, latencyMs: null, error: 'connection timeout' });
    });
  });
}

async function checkFileSystem(): Promise<{ status: string; openclawRoot: string; accessible: boolean; error?: string }> {
  try {
    await access(OPENCLAW_ROOT, constants.R_OK);
    return { status: 'ok', openclawRoot: OPENCLAW_ROOT, accessible: true };
  } catch (err) {
    return { status: 'error', openclawRoot: OPENCLAW_ROOT, accessible: false, error: String(err) };
  }
}

export async function wiringStatus(_req: Request, res: Response, next: NextFunction) {
  try {
    const [gateway, fileSystem] = await Promise.all([
      checkGatewayWs(),
      checkFileSystem(),
    ]);

    const feishuWebhookConfigured = Boolean(process.env['FEISHU_WEBHOOK_URL']);
    const feishu = {
      status: feishuWebhookConfigured ? 'configured' : 'not_configured',
      webhookConfigured: feishuWebhookConfigured,
    };

    const allHealthy =
      gateway.status === 'connected' &&
      feishuWebhookConfigured &&
      fileSystem.accessible;

    const overallHealth = allHealthy
      ? 'healthy'
      : gateway.status === 'error' || !fileSystem.accessible
        ? 'degraded'
        : 'partial';

    return sendSuccess(res, {
      gateway,
      feishu,
      fileSystem,
      overallHealth,
    });
  } catch (error) {
    next(error);
  }
}
