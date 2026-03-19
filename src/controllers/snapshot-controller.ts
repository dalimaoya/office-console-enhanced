import type { NextFunction, Request, Response } from 'express';
import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { agentService } from '../services/agent-service.js';
import { getBudgetPolicy } from '../services/budget-service.js';
import { eventLogService } from '../services/event-log-service.js';
import { listNotifications } from '../services/persistent-notifications-service.js';
import { readTimelineEvents } from '../services/timeline-service.js';
import { sendError } from '../utils/responses.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const BUDGET_POLICY_PATH = path.join(DATA_DIR, 'budget-policy.json');
const NOTIFICATIONS_PATH = path.join(DATA_DIR, 'notifications.json');
const TASKS_DIR = '/root/.openclaw/workspace/projects/office-console-enhanced/tasks';

interface SnapshotPayload {
  exported_at: string;
  version: string;
  sessions: unknown[];
  tasks: unknown[];
  budget: unknown;
  notifications: unknown[];
  timeline: unknown[];
}

async function readTasksSnapshot(): Promise<unknown[]> {
  const { getTasks } = await import('./tasks-controller.js');
  const files = await import('node:fs/promises');
  const { join } = await import('node:path');

  try {
    const entries = await files.readdir(TASKS_DIR);
    const mdFiles = entries.filter((f) => f.endsWith('.md'));
    const items = await Promise.all(mdFiles.map(async (filename) => {
      const filePath = join(TASKS_DIR, filename);
      const [content, stat] = await Promise.all([
        files.readFile(filePath, 'utf8').catch(() => ''),
        files.stat(filePath),
      ]);
      return {
        filename,
        content,
        mtime: stat.mtime.toISOString(),
        size: stat.size,
      };
    }));
    items.sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());
    return items;
  } catch {
    return [];
  }
}

async function ensureDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

async function backupIfExists(filePath: string): Promise<void> {
  try {
    await rename(filePath, `${filePath}.bak`);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function writeJsonWithBackup(filePath: string, payload: unknown): Promise<void> {
  await ensureDir();
  await backupIfExists(filePath);
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

export async function exportSnapshot(_req: Request, res: Response, next: NextFunction) {
  try {
    const [sessions, tasks, budget, notificationsResult, timeline] = await Promise.all([
      agentService.listAgents(),
      readTasksSnapshot(),
      getBudgetPolicy(),
      listNotifications({ limit: 50 }),
      readTimelineEvents(50),
    ]);

    const now = new Date();
    const payload: SnapshotPayload = {
      exported_at: now.toISOString(),
      version: '1.0',
      sessions,
      tasks,
      budget,
      notifications: notificationsResult.items,
      timeline,
    };

    const filenameDate = now.toISOString().slice(0, 10);
    res.setHeader('Content-Disposition', `attachment; filename="office-console-snapshot-${filenameDate}.json"`);
    eventLogService.append({
      event_type: 'object.created',
      source_role: 'office-dashboard-adapter',
      description: '导出控制台快照',
      object_id: 'project-office-console-enhanced',
      context: {
        path: '/api/v1/snapshot/export',
        sessions: sessions.length,
        tasks: tasks.length,
      },
    });
    return res.json(payload);
  } catch (error) {
    eventLogService.append({
      event_type: 'object.updated',
      source_role: 'office-dashboard-adapter',
      description: '导出控制台快照失败',
      object_id: 'project-office-console-enhanced',
      error: error instanceof Error ? { summary: error.message, detail: error.stack } : { summary: String(error) },
      context: { path: '/api/v1/snapshot/export' },
    });
    next(error);
  }
}

export async function importSnapshot(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as Partial<SnapshotPayload> | null;
    if (!body || typeof body !== 'object') {
      return sendError(res, 400, 'INVALID_BODY', 'snapshot body is required');
    }
    if (body.budget === undefined || !Array.isArray(body.notifications)) {
      return sendError(res, 400, 'INVALID_SNAPSHOT', 'snapshot must include budget and notifications');
    }

    await writeJsonWithBackup(BUDGET_POLICY_PATH, body.budget);
    await writeJsonWithBackup(NOTIFICATIONS_PATH, body.notifications);

    eventLogService.append({
      event_type: 'object.updated',
      source_role: 'office-dashboard-adapter',
      description: '导入控制台快照',
      object_id: 'project-office-console-enhanced',
      context: {
        path: '/api/v1/snapshot/import',
        imported: ['budget', 'notifications'],
      },
    });

    return res.json({ ok: true, imported: ['budget', 'notifications'] });
  } catch (error) {
    eventLogService.append({
      event_type: 'object.updated',
      source_role: 'office-dashboard-adapter',
      description: '导入控制台快照失败',
      object_id: 'project-office-console-enhanced',
      error: error instanceof Error ? { summary: error.message, detail: error.stack } : { summary: String(error) },
      context: { path: '/api/v1/snapshot/import' },
    });
    next(error);
  }
}
