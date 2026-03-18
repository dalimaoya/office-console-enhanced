/**
 * ReadinessService — 系统就绪度综合评分
 *
 * CC 借鉴 P0-1：4 维度评分（observability / governance / collaboration / security）
 * overall 0-100 分，每维度含 checklist 项（pass/warn/fail）
 */

import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';
import { openclawCliAdapter } from '../adapters/openclaw-cli-adapter.js';
import { getSseHub } from '../data/sse-hub.js';

const OPENCLAW_ROOT = '/root/.openclaw';
const AUDIT_LOG_DIR = join(OPENCLAW_ROOT, 'logs');
const AUDIT_LOG_FILE = join(AUDIT_LOG_DIR, 'audit.log');

export type CheckItemStatus = 'pass' | 'warn' | 'fail';

export interface ReadinessCheckItem {
  check: string;
  status: CheckItemStatus;
  detail?: string;
}

export interface ReadinessDimension {
  name: string;
  score: number;
  items: ReadinessCheckItem[];
}

export interface ReadinessScore {
  overall: number;
  dimensions: ReadinessDimension[];
  computedAt: string;
}

/** Check if a file is writable */
async function isWritable(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.W_OK);
    return true;
  } catch {
    // Try checking the directory instead
    try {
      await access(AUDIT_LOG_DIR, constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }
}

/** Score a dimension based on its checklist items */
function scoreDimension(items: ReadinessCheckItem[]): number {
  if (!items.length) return 100;
  const weights: Record<CheckItemStatus, number> = { pass: 1, warn: 0.5, fail: 0 };
  const total = items.reduce((sum, item) => sum + weights[item.status], 0);
  return Math.round((total / items.length) * 100);
}

async function computeObservability(): Promise<ReadinessDimension> {
  const items: ReadinessCheckItem[] = [];

  // Check 1: Gateway connection
  let gatewayOk = false;
  try {
    const health = await Promise.race([
      openclawCliAdapter.healthCheck(),
      new Promise<{ ok: boolean }>((res) => setTimeout(() => res({ ok: false }), 1000)),
    ]);
    gatewayOk = health.ok === true;
  } catch {
    gatewayOk = false;
  }
  items.push({
    check: 'Gateway 连接',
    status: gatewayOk ? 'pass' : 'warn',
    detail: gatewayOk ? 'Gateway 健康探针正常' : 'Gateway 未响应或连接失败',
  });

  // Check 2: SSE clients > 0
  const sseClientCount = getSseHub().clientCount ?? 0;
  items.push({
    check: 'SSE 客户端数',
    status: sseClientCount > 0 ? 'pass' : 'warn',
    detail: sseClientCount > 0 ? `当前有 ${sseClientCount} 个 SSE 客户端` : '暂无 SSE 客户端连接',
  });

  // Check 3: Audit log writable
  const auditWritable = await isWritable(AUDIT_LOG_FILE);
  items.push({
    check: '审计日志可写',
    status: auditWritable ? 'pass' : 'warn',
    detail: auditWritable ? '审计日志目录可写' : '审计日志目录不可写，操作记录可能缺失',
  });

  return { name: 'observability', score: scoreDimension(items), items };
}

async function computeGovernance(): Promise<ReadinessDimension> {
  const items: ReadinessCheckItem[] = [];

  const readonlyMode = process.env.READONLY_MODE === 'true';
  items.push({
    check: 'ReadonlyMode 开启',
    status: readonlyMode ? 'pass' : 'warn',
    detail: readonlyMode ? 'READONLY_MODE=true，写操作受保护' : '未开启 READONLY_MODE，写操作无限制',
  });

  const consoleToken = process.env.CONSOLE_TOKEN ?? process.env.OPENCLAW_TOKEN ?? '';
  items.push({
    check: 'ConsoleToken 已配置',
    status: consoleToken ? 'pass' : 'fail',
    detail: consoleToken ? 'ConsoleToken 已设置' : '未设置 ConsoleToken，API 访问无鉴权保护',
  });

  const dryRunDefault = process.env.DRY_RUN_DEFAULT === 'true';
  items.push({
    check: 'DryRunDefault 开启',
    status: dryRunDefault ? 'pass' : 'warn',
    detail: dryRunDefault ? 'DRY_RUN_DEFAULT=true' : '未启用默认 dry-run 模式',
  });

  return { name: 'governance', score: scoreDimension(items), items };
}

async function computeCollaboration(): Promise<ReadinessDimension> {
  const items: ReadinessCheckItem[] = [];

  // Check active sessions via Gateway
  let activeSessions = 0;
  let agentErrors = 0;
  try {
    const status = await Promise.race([
      openclawCliAdapter.gatewayCall<any>('status'),
      new Promise<null>((res) => setTimeout(() => res(null), 1000)),
    ]);
    if (status?.sessions?.active) {
      activeSessions = Array.isArray(status.sessions.active) ? status.sessions.active.length : (status.sessions.activeCount ?? 0);
    }
    if (status?.agents) {
      agentErrors = (status.agents ?? []).filter((a: any) => a.status === 'error').length;
    }
  } catch {
    // gateway unreachable, use defaults
  }

  items.push({
    check: '活跃 Session 数',
    status: activeSessions > 0 ? 'pass' : 'warn',
    detail: activeSessions > 0 ? `当前有 ${activeSessions} 个活跃 Session` : '暂无活跃 Session',
  });

  items.push({
    check: 'Agent 无 error 状态',
    status: agentErrors === 0 ? 'pass' : 'warn',
    detail: agentErrors === 0 ? '所有 Agent 状态正常' : `有 ${agentErrors} 个 Agent 处于 error 状态`,
  });

  return { name: 'collaboration', score: scoreDimension(items), items };
}

async function computeSecurity(): Promise<ReadinessDimension> {
  const items: ReadinessCheckItem[] = [];

  const consoleToken = process.env.CONSOLE_TOKEN ?? process.env.OPENCLAW_TOKEN ?? '';
  items.push({
    check: 'ConsoleToken 非空',
    status: consoleToken ? 'pass' : 'fail',
    detail: consoleToken ? 'API Token 已配置' : 'API Token 未配置，接口暴露风险',
  });

  const allowedOrigins = process.env.ALLOWED_WRITE_ORIGINS ?? '';
  const hasWildcard = allowedOrigins === '*' || allowedOrigins.includes('*');
  items.push({
    check: 'AllowedWriteOrigins 非通配',
    status: !allowedOrigins || (!hasWildcard) ? 'pass' : 'warn',
    detail: hasWildcard
      ? 'ALLOWED_WRITE_ORIGINS 包含通配符（*），写操作跨域限制已关闭'
      : allowedOrigins
        ? `跨域写操作限制: ${allowedOrigins}`
        : '未配置跨域写操作限制（仅限本域）',
  });

  return { name: 'security', score: scoreDimension(items), items };
}

export async function computeReadinessScore(): Promise<ReadinessScore> {
  const [observability, governance, collaboration, security] = await Promise.all([
    computeObservability(),
    computeGovernance(),
    computeCollaboration(),
    computeSecurity(),
  ]);

  const dimensions = [observability, governance, collaboration, security];
  const overall = Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length);

  return {
    overall,
    dimensions,
    computedAt: new Date().toISOString(),
  };
}
