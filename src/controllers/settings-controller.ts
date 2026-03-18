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
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import * as net from 'node:net';
import { join } from 'node:path';
import { env } from '../config/env.js';
import { sendSuccess } from '../utils/responses.js';

/** 服务启动时间（进程启动时记录） */
const startedAt = new Date().toISOString();

const OPENCLAW_ROOT = '/root/.openclaw';
const GATEWAY_WS_URL = 'ws://127.0.0.1:18789';
const GATEWAY_PING_TIMEOUT_MS = 2000;
const SSE_DEFAULT_URL = 'http://127.0.0.1:3030/api/v1/events';

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

// ─── P1 CC借鉴：Settings 运维卡片 ────────────────────────────────────────────

/**
 * GET /api/v1/settings/connection-health
 * 检查 Gateway / OpenClaw Home / 飞书 / SSE 四路连接状态
 */
export async function connectionHealth(_req: Request, res: Response, next: NextFunction) {
  try {
    // Gateway TCP 检查
    const gateway = await checkGatewayWs();

    // OpenClaw Home（文件系统）检查
    const fileSystem = await checkFileSystem();

    // 飞书 Webhook 配置检查（有 URL 即视为已配置）
    const feishuWebhookUrl = process.env['FEISHU_WEBHOOK_URL'] ?? '';
    const feishuConfigured = feishuWebhookUrl.length > 0;
    const feishu = {
      status: feishuConfigured ? 'configured' : 'not_configured',
      webhookConfigured: feishuConfigured,
    };

    // SSE 端点可达性（HTTP HEAD 检查，失败不阻断）
    let sseStatus: 'ok' | 'error' | 'unknown' = 'unknown';
    let sseLatencyMs: number | null = null;
    try {
      const sseStart = Date.now();
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2000);
      const resp = await fetch(SSE_DEFAULT_URL, {
        method: 'HEAD',
        signal: ctrl.signal,
      }).finally(() => clearTimeout(timer));
      sseLatencyMs = Date.now() - sseStart;
      sseStatus = resp.ok || resp.status === 405 ? 'ok' : 'error';
    } catch {
      sseStatus = 'error';
    }

    const sse = { status: sseStatus, url: SSE_DEFAULT_URL, latencyMs: sseLatencyMs };

    const overallHealthy =
      gateway.status === 'connected' &&
      fileSystem.accessible &&
      feishuConfigured &&
      sseStatus !== 'error';

    const summary = overallHealthy
      ? '所有连接正常'
      : [
          gateway.status !== 'connected' ? 'Gateway 未连接' : '',
          !fileSystem.accessible ? '文件系统不可访问' : '',
          !feishuConfigured ? '飞书 Webhook 未配置' : '',
          sseStatus === 'error' ? 'SSE 端点不可达' : '',
        ]
          .filter(Boolean)
          .join('；');

    return sendSuccess(res, {
      gateway,
      openclawHome: fileSystem,
      feishu,
      sse,
      overall: overallHealthy ? 'healthy' : 'degraded',
      summary,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/settings/security-summary
 * 将系统安全状态翻译成运营语言（人话化风险评估）
 */
export async function securitySummary(_req: Request, res: Response, next: NextFunction) {
  try {
    const tokenEnabled = env.consoleToken.length > 0;
    const readonlyMode = env.readonlyMode;
    const dryRunDefault = env.dryRunDefault;

    const risks: string[] = [];
    const suggestions: string[] = [];

    if (!tokenEnabled) {
      risks.push('控制台未设置访问令牌（CONSOLE_TOKEN），任何人都可以访问');
      suggestions.push('建议配置 CONSOLE_TOKEN 环境变量以启用令牌鉴权');
    }
    if (!readonlyMode) {
      risks.push('只读模式未开启，写操作端点对外暴露');
      suggestions.push('如无需写操作，建议开启 READONLY_MODE=true');
    }
    if (!dryRunDefault) {
      risks.push('默认未开启 Dry-Run，配置变更将实际生效');
      suggestions.push('调试阶段建议开启 DRY_RUN_DEFAULT=true');
    }

    const riskLevel =
      risks.length === 0 ? 'low' : risks.length === 1 ? 'medium' : 'high';

    const riskLabelMap: Record<string, string> = {
      low: '低风险 — 配置符合安全基准',
      medium: '中风险 — 存在改善空间',
      high: '高风险 — 建议尽快处理',
    };

    return sendSuccess(res, {
      riskLevel,
      riskLabel: riskLabelMap[riskLevel],
      risks,
      suggestions,
      config: {
        tokenEnabled,
        readonlyMode,
        dryRunDefault,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/settings/update-status
 * 返回当前服务版本信息及升级建议
 */
export async function updateStatus(_req: Request, res: Response, next: NextFunction) {
  try {
    // 尝试从 package.json 读取版本
    let currentVersion = process.env['npm_package_version'] ?? 'unknown';
    try {
      const pkgPath = join(process.cwd(), 'package.json');
      const pkgRaw = await readFile(pkgPath, 'utf-8').catch(() => null);
      if (pkgRaw) {
        const pkg = JSON.parse(pkgRaw);
        currentVersion = pkg.version ?? currentVersion;
      }
    } catch {
      // ignore
    }

    return sendSuccess(res, {
      currentVersion,
      startedAt,
      uptime: Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
      uptimeLabel: formatUptime(Date.now() - new Date(startedAt).getTime()),
      channel: 'stable',
      updateCheckAvailable: false,
      note: '自动更新检查暂未实装，请手动检查 npm 版本或 GitHub Release',
    });
  } catch (error) {
    next(error);
  }
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} 天 ${hours % 24} 小时`;
  if (hours > 0) return `${hours} 小时 ${minutes % 60} 分钟`;
  if (minutes > 0) return `${minutes} 分钟`;
  return `${seconds} 秒`;
}
