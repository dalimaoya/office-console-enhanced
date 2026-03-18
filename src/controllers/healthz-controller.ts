import type { Request, Response, NextFunction } from 'express';
import { openclawCliAdapter } from '../adapters/openclaw-cli-adapter.js';
import { memoryCache } from '../cache/memory-cache.js';
import { getGatewayWsClient } from '../data/gateway-ws-client.js';
import { env } from '../config/env.js';
import { log } from '../utils/logger.js';
import { gatewayWsClient } from '../data/gateway-ws-client.js';
import { existsSync, statSync } from 'node:fs';

export interface HealthzCheck {
  status: 'ok' | 'degraded' | 'error';
  latencyMs?: number;
  message?: string;
  details?: Record<string, any>;
}

export interface HealthzResponse {
  status: 'healthy' | 'degraded' | 'error';
  checks: {
    gateway: HealthzCheck;
    filesystem: HealthzCheck;
    feishu: HealthzCheck;
    snapshotAge: HealthzCheck;
  };
  version: string;
  uptime: number;
  ts: string;
}

async function checkGateway(): Promise<HealthzCheck> {
  const start = Date.now();
  try {
    const wsClient = getGatewayWsClient();
    if (wsClient?.isConnected) {
      // 使用 WebSocket 客户端检查
      try {
        // 尝试一个简单的 ping 或调用
        await wsClient.call('ping', {}, 2000);
        const latencyMs = Date.now() - start;
        return {
          status: 'ok',
          latencyMs,
          details: { method: 'websocket', connected: true }
        };
      } catch (error) {
        // WebSocket 连接存在但调用失败
        const latencyMs = Date.now() - start;
        log('warn', 'healthz_gateway_ws_call_failed', { error: String(error) });
        return {
          status: 'degraded',
          latencyMs,
          message: `WebSocket connected but call failed: ${String(error)}`,
          details: { method: 'websocket', connected: true, callFailed: true }
        };
      }
    } else {
      // 回退到 HTTP 健康检查
      try {
        const healthResult = await openclawCliAdapter.healthCheck();
        const latencyMs = Date.now() - start;
        return {
          status: 'ok',
          latencyMs,
          details: { method: 'http', connected: healthResult.ok }
        };
      } catch (error) {
        const latencyMs = Date.now() - start;
        return {
          status: 'degraded',
          latencyMs,
          message: `Gateway unreachable: ${error instanceof Error ? error.message : String(error)}`,
          details: { method: 'http', connected: false }
        };
      }
    }
  } catch (error) {
    const latencyMs = Date.now() - start;
    return {
      status: 'error',
      latencyMs,
      message: `Gateway check failed: ${error instanceof Error ? error.message : String(error)}`,
      details: { method: 'unknown', error: String(error) }
    };
  }
}

function checkFilesystem(): HealthzCheck {
  try {
    const openclawRoot = env.openclawRoot;
    if (!existsSync(openclawRoot)) {
      return {
        status: 'error',
        message: `OpenClaw root directory does not exist: ${openclawRoot}`,
        details: { path: openclawRoot, exists: false }
      };
    }

    // 检查路径是否可写和可读
    const stat = statSync(openclawRoot);
    if (!stat.isDirectory()) {
      return {
        status: 'error',
        message: `OpenClaw root is not a directory: ${openclawRoot}`,
        details: { path: openclawRoot, isDirectory: false }
      };
    }

    // 检查一些关键目录
    const keyDirs = ['config', 'workspace', 'cache'].map(dir => `${openclawRoot}/${dir}`);
    const missingDirs = keyDirs.filter(dir => !existsSync(dir));
    
    if (missingDirs.length > 0) {
      return {
        status: 'degraded',
        message: `Some required directories are missing: ${missingDirs.join(', ')}`,
        details: { path: openclawRoot, exists: true, isDirectory: true, missingDirs }
      };
    }

    return {
      status: 'ok',
      message: `Filesystem accessible at ${openclawRoot}`,
      details: { path: openclawRoot, exists: true, isDirectory: true }
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Filesystem check failed: ${error instanceof Error ? error.message : String(error)}`,
      details: { error: String(error) }
    };
  }
}

function checkFeishu(): HealthzCheck {
  try {
    // 检查环境变量
    const feishuWebhookUrl = process.env.FEISHU_WEBHOOK_URL;
    const feishuToken = process.env.FEISHU_TOKEN || process.env.OC_FEISHU_TOKEN;
    
    const isConfigured = !!(feishuWebhookUrl || feishuToken);
    
    if (!isConfigured) {
      return {
        status: 'ok',
        message: 'Feishu not configured (not required for basic operation)',
        details: { configured: false, webhookSet: false }
      };
    }
    
    // 如果有配置，检查基本格式
    const webhookSet = !!feishuWebhookUrl;
    const tokenSet = !!feishuToken;
    
    return {
      status: webhookSet ? 'ok' : 'degraded',
      message: webhookSet ? 'Feishu webhook configured' : 'Feishu token set but no webhook configured',
      details: { 
        configured: true, 
        webhookSet,
        tokenSet
      }
    };
  } catch (error) {
    return {
      status: 'degraded',
      message: `Feishu check error: ${error instanceof Error ? error.message : String(error)}`,
      details: { error: String(error) }
    };
  }
}

function checkSnapshotAge(): HealthzCheck {
  try {
    // 从 memoryCache 获取最近一次缓存更新时间
    const cacheKeys = ['dashboard', 'agents', 'health'] as const;
    const now = Date.now();
    let oldestSnapshot: { age: number; key: string; timestamp: number } | null = null;
    
    for (const key of cacheKeys) {
      const cached = memoryCache.get(key);
      if (cached) {
        const age = now - cached.fetchedAt;
        if (!oldestSnapshot || age > oldestSnapshot.age) {
          oldestSnapshot = {
            age,
            key,
            timestamp: cached.fetchedAt
          };
        }
      }
    }
    
    if (!oldestSnapshot) {
      return {
        status: 'degraded',
        message: 'No cached snapshots available',
        details: { hasSnapshot: false }
      };
    }
    
    const ageSeconds = Math.floor(oldestSnapshot.age / 1000);
    const status = ageSeconds < 300 ? 'ok' : ageSeconds < 600 ? 'degraded' : 'error';
    
    return {
      status,
      message: status === 'ok' 
        ? `Recent snapshot (${ageSeconds}s old)`
        : `Snapshot is stale (${ageSeconds}s old)`,
      details: {
        hasSnapshot: true,
        ageSeconds,
        oldestKey: oldestSnapshot.key,
        timestamp: new Date(oldestSnapshot.timestamp).toISOString()
      }
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Snapshot age check failed: ${error instanceof Error ? error.message : String(error)}`,
      details: { error: String(error) }
    };
  }
}

function getOverallStatus(checks: Record<string, HealthzCheck>): 'healthy' | 'degraded' | 'error' {
  let hasError = false;
  let hasDegraded = false;
  
  for (const check of Object.values(checks)) {
    if (check.status === 'error') {
      hasError = true;
    } else if (check.status === 'degraded') {
      hasDegraded = true;
    }
  }
  
  if (hasError) return 'error';
  if (hasDegraded) return 'degraded';
  return 'healthy';
}

export async function getHealthz(_req: Request, res: Response, next: NextFunction) {
  try {
    const [gateway, filesystem, feishu, snapshotAge] = await Promise.all([
      checkGateway(),
      Promise.resolve(checkFilesystem()),
      Promise.resolve(checkFeishu()),
      Promise.resolve(checkSnapshotAge())
    ]);
    
    const checks = { gateway, filesystem, feishu, snapshotAge };
    const overallStatus = getOverallStatus(checks);
    
    const response: HealthzResponse = {
      status: overallStatus,
      checks,
      version: '1.0.0',
      uptime: process.uptime() * 1000, // 转换为毫秒
      ts: new Date().toISOString()
    };
    
    // 始终返回 200，状态在响应体中
    res.status(200).json(response);
  } catch (error) {
    // 确保总是返回 200
    const errorResponse: HealthzResponse = {
      status: 'error',
      checks: {
        gateway: { status: 'error', message: 'Health check execution failed' },
        filesystem: { status: 'error', message: 'Health check execution failed' },
        feishu: { status: 'error', message: 'Health check execution failed' },
        snapshotAge: { status: 'error', message: 'Health check execution failed' }
      },
      version: '1.0.0',
      uptime: process.uptime() * 1000,
      ts: new Date().toISOString()
    };
    
    res.status(200).json(errorResponse);
  }
}