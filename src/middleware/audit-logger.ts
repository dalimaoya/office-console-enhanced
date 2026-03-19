import type { NextFunction, Request, Response } from 'express';
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const AUDIT_LOG_PATH = path.resolve(process.cwd(), 'data', 'operation-audit.log');
const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

function summarizeBody(req: Request): string {
  const body = req.body ?? {};
  const requestPath = req.originalUrl || req.path;

  if (req.method === 'POST' && requestPath.endsWith('/tasks')) {
    return `创建任务:${String(body.title ?? '未命名任务')}`;
  }

  if (req.method === 'PATCH' && requestPath.includes('/tasks/')) {
    const fromParams = req.params.filename ?? req.params.id;
    const taskId = typeof fromParams === 'string' && fromParams.length > 0
      ? decodeURIComponent(fromParams)
      : decodeURIComponent(requestPath.split('/tasks/')[1]?.split('/status')[0] ?? 'unknown');
    return `更新任务:${taskId} -> ${String(body.status ?? 'unknown')}`;
  }

  if (req.method === 'PUT' && requestPath.endsWith('/memory')) {
    return `更新记忆:${String(body.agentId ?? 'unknown')}`;
  }

  if (req.method === 'DELETE') {
    return `删除操作:${requestPath}`;
  }

  if (req.method === 'POST' && requestPath.includes('/action-queue/')) {
    return `确认待办:${String(req.params.itemId ?? 'unknown')}`;
  }

  const title = typeof body?.title === 'string' ? body.title : undefined;
  if (title) return `${req.method} ${req.path}:${title}`;
  return `${req.method} ${req.path}`;
}

async function appendAuditRecord(record: Record<string, unknown>): Promise<void> {
  try {
    await mkdir(path.dirname(AUDIT_LOG_PATH), { recursive: true });
    await appendFile(AUDIT_LOG_PATH, `${JSON.stringify(record)}\n`, 'utf8');
  } catch {
    // 审计失败不影响主流程
  }
}

export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  if (!WRITE_METHODS.has(req.method)) {
    next();
    return;
  }

  const bodySummary = summarizeBody(req);
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

  res.on('finish', () => {
    void appendAuditRecord({
      ts: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl || req.path,
      body_summary: bodySummary,
      ip,
      result: res.statusCode >= 400 ? 'error' : 'ok',
    });
  });

  next();
}
