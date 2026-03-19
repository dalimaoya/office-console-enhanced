/**
 * TasksController — 任务文件列表 API
 *
 * Iter-4 新增：扫描项目 tasks 目录，返回任务文件列表
 */

import type { Request, Response, NextFunction } from 'express';
import { stat, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sendSuccess, sendError } from '../utils/responses.js';
import { appendTimelineEvent } from '../services/timeline-service.js';

const TASKS_DIR = '/root/.openclaw/workspace/projects/office-console-enhanced/tasks';

// CC 借鉴 P0-3：DoneChecklist 解析
export interface ChecklistItem {
  item: string;
  done: boolean;
}

export function parseChecklist(content: string): { checklist: ChecklistItem[]; checklistProgress: number | null } {
  const lines = content.split('\n');
  const checklist: ChecklistItem[] = [];

  for (const line of lines) {
    const doneMatch = line.match(/^\s*-\s*\[x\]\s+(.+)/i);
    const todoMatch = line.match(/^\s*-\s*\[\s\]\s+(.+)/i);
    if (doneMatch) {
      checklist.push({ item: doneMatch[1].trim(), done: true });
    } else if (todoMatch) {
      checklist.push({ item: todoMatch[1].trim(), done: false });
    }
  }

  const checklistProgress = checklist.length > 0
    ? Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100)
    : null;

  return { checklist, checklistProgress };
}

interface TaskItem {
  name: string;
  filename: string;
  mtime: string;
  size: number;
  status: 'active' | 'blocked' | 'done';
  checklist?: ChecklistItem[];
  checklistProgress?: number | null;
}

function isHistoricalCompletedTask(filename: string, content: string): boolean {
  const text = `${filename}\n${content}`.toLowerCase();
  return /done|completed|review|已完成|已交付|验收|复盘/.test(text);
}

function inferStatus(filename: string, content: string): 'active' | 'blocked' | 'done' {
  const text = `${filename}\n${content}`.toLowerCase();
  if (/blocked|阻塞/.test(text)) return 'blocked';
  if (/done|completed|review|已完成|已交付|验收|复盘/.test(text)) return 'done';
  return 'active';
}

function filenameToName(filename: string): string {
  // Remove date prefix and extension, replace dashes with spaces
  return filename
    .replace(/\.md$/i, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/-/g, ' ');
}

export async function getTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const limitParam = req.query.limit;
    const limit = limitParam ? parseInt(String(limitParam), 10) : undefined;

    let files: string[];
    try {
      const entries = await readdir(TASKS_DIR);
      files = entries.filter((f) => f.endsWith('.md'));
    } catch {
      return sendSuccess(res, []);
    }

    const items: TaskItem[] = [];

    for (const filename of files) {
      const filePath = join(TASKS_DIR, filename);
      try {
        const [s, content] = await Promise.all([
          stat(filePath),
          readFile(filePath, 'utf-8').catch(() => ''),
        ]);
        if (isHistoricalCompletedTask(filename, content)) {
          continue;
        }

        const { checklist, checklistProgress } = parseChecklist(content);
        // Infer status from file content (- 状态: done/blocked/etc)
        let fileStatus: 'active' | 'blocked' | 'done' = inferStatus(filename, content);
        const statusMatch = content.match(/^[-*]\s*\*\*(?:状态|status)\*\*[：:]\s*(.+)|^[-*]\s*(?:状态|status)[：:]\s*(.+)/im);
        if (statusMatch) {
          const s2 = (statusMatch[1] ?? statusMatch[2] ?? '').trim().toLowerCase();
          if (/blocked|阻塞/.test(s2)) fileStatus = 'blocked';
          else if (/done|completed|review|已完成|已交付|验收|复盘/.test(s2)) fileStatus = 'done';
          else if (/active|pending|in.progress|进行中|待/.test(s2)) fileStatus = 'active';
        }
        items.push({
          name: filenameToName(filename),
          filename,
          mtime: s.mtime.toISOString(),
          size: s.size,
          status: fileStatus,
          checklist,
          checklistProgress,
        });
      } catch {
        // skip unreadable files
      }
    }

    // Sort by mtime descending (newest first)
    items.sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());

    const result = limit ? items.slice(0, limit) : items;
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function updateTaskStatus(req: Request, res: Response, next: NextFunction) {
  try {
    if (process.env.READONLY_MODE === 'true') {
      return res.status(403).json({ success: false, message: '当前是只读模式，操作被禁止' });
    }
    const filename = String(req.params.filename ?? '');
    const { status } = req.body as { status: string };
    if (!['active', 'blocked', 'done'].includes(status)) {
      return res.status(400).json({ success: false, message: '状态值无效，允许: active, blocked, done' });
    }
    const filePath = join(TASKS_DIR, filename);
    let content: string;
    try {
      content = await readFile(filePath, 'utf8');
    } catch {
      return res.status(404).json({ success: false, message: '任务文件不存在' });
    }
    // 追加状态标记到文件末尾
    const updated = content.trimEnd() + `\n\n<!-- status:${status} updated:${new Date().toISOString()} -->\n`;
    const { writeFile } = await import('node:fs/promises');
    await writeFile(filePath, updated, 'utf8');
    await appendTimelineEvent({
      type: 'task_updated',
      taskId: filename,
      summary: `任务 ${filename} 状态更新为 ${status}`,
      data: { filename, status },
    });
    return sendSuccess(res, { filename, status });
  } catch (error) {
    next(error);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    if (process.env.READONLY_MODE === 'true') {
      return res.status(403).json({ success: false, message: '当前是只读模式，操作被禁止' });
    }
    const { title, owner, priority = 'low' } = req.body as { title: string; owner?: string; priority?: string };
    if (!title) {
      return res.status(400).json({ success: false, message: '缺少必填字段: title' });
    }
    const slug = title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').slice(0, 40);
    const today = new Date().toISOString().slice(0, 10);
    const filename = `${today}-${Date.now()}-${slug}.md`;
    const cstNow = new Date(Date.now() + 8 * 3600000).toISOString().replace('T', ' ').slice(0, 19);
    const content = `# ${title}\n\n- 创建时间：${cstNow}（北京时间）\n- 负责人：${owner ?? '未指定'}\n- 优先级：${priority}\n- 状态：active\n`;
    const { writeFile } = await import('node:fs/promises');
    await writeFile(join(TASKS_DIR, filename), content, 'utf8');
    await appendTimelineEvent({
      type: 'task_created',
      taskId: filename,
      summary: `创建任务：${title}`,
      data: { filename, title, owner: owner ?? '未指定', priority },
    });
    return sendSuccess(res, { filename, title });
  } catch (error) {
    next(error);
  }
}
