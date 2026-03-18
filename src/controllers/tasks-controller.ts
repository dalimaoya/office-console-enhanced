/**
 * TasksController — 任务文件列表 API
 *
 * Iter-4 新增：扫描项目 tasks 目录，返回任务文件列表
 */

import type { Request, Response, NextFunction } from 'express';
import { stat, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sendSuccess, sendError } from '../utils/responses.js';

const TASKS_DIR = '/root/.openclaw/workspace/projects/office-console-enhanced/tasks';

interface TaskItem {
  name: string;
  filename: string;
  mtime: string;
  size: number;
  status: 'active' | 'blocked';
}

function inferStatus(filename: string): 'active' | 'blocked' {
  return filename.toLowerCase().includes('blocked') ? 'blocked' : 'active';
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
        const s = await stat(filePath);
        items.push({
          name: filenameToName(filename),
          filename,
          mtime: s.mtime.toISOString(),
          size: s.size,
          status: inferStatus(filename),
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
    const { filename } = req.params;
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
    return sendSuccess(res, { filename, title });
  } catch (error) {
    next(error);
  }
}
