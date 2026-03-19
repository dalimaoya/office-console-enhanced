/**
 * DocsController — 文档文件列表/更新 API
 */

import type { Request, Response, NextFunction } from 'express';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { appendTimelineEvent } from '../services/timeline-service.js';
import { generateDiffSummary } from '../services/diff-service.js';
import { sendSuccess, sendError } from '../utils/responses.js';

const DOCS_DIR = '/root/.openclaw/workspace/projects/office-console-enhanced/docs';

interface DocItem {
  name: string;
  filename: string;
  mtime: string;
  size: number;
}

function filenameToName(filename: string): string {
  return filename
    .replace(/\.md$/i, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/-/g, ' ');
}

function resolveDocPath(filename: string): string {
  return resolve(join(DOCS_DIR, basename(filename)));
}

function isDocPathSafe(filePath: string): boolean {
  return filePath.startsWith(resolve(DOCS_DIR));
}

export async function getDocs(req: Request, res: Response, next: NextFunction) {
  try {
    const fileParam = req.query.file;

    if (fileParam) {
      const filename = basename(String(fileParam));
      const filePath = resolveDocPath(filename);
      if (!isDocPathSafe(filePath)) {
        return sendError(res, 400, 'INVALID_PATH', 'Invalid file path');
      }

      try {
        const content = await readFile(filePath, 'utf-8');
        return sendSuccess(res, { filename, content });
      } catch {
        return sendError(res, 404, 'FILE_NOT_FOUND', `File not found: ${filename}`);
      }
    }

    let files: string[];
    try {
      const entries = await readdir(DOCS_DIR);
      files = entries.filter((f) => f.endsWith('.md'));
    } catch {
      return sendSuccess(res, []);
    }

    const items: DocItem[] = [];

    for (const filename of files) {
      const filePath = join(DOCS_DIR, filename);
      try {
        const s = await stat(filePath);
        items.push({
          name: filenameToName(filename),
          filename,
          mtime: s.mtime.toISOString(),
          size: s.size,
        });
      } catch {
        // skip unreadable files
      }
    }

    items.sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());

    return sendSuccess(res, items);
  } catch (error) {
    next(error);
  }
}

export async function patchDoc(req: Request, res: Response, next: NextFunction) {
  try {
    if (process.env.READONLY_MODE === 'true') {
      return sendError(res, 403, 'READONLY_MODE', '当前是只读模式，操作被禁止');
    }

    const filename = typeof req.body?.filename === 'string' ? basename(req.body.filename) : '';
    const content = typeof req.body?.content === 'string' ? req.body.content : null;
    if (!filename || !filename.endsWith('.md')) {
      return sendError(res, 400, 'INVALID_FILENAME', 'filename must be a .md file');
    }
    if (content === null) {
      return sendError(res, 400, 'INVALID_CONTENT', 'content is required');
    }

    const filePath = resolveDocPath(filename);
    if (!isDocPathSafe(filePath)) {
      return sendError(res, 400, 'INVALID_PATH', 'Invalid file path');
    }

    let before = '';
    try {
      before = await readFile(filePath, 'utf8');
    } catch {
      before = '';
    }

    await mkdir(DOCS_DIR, { recursive: true });
    await writeFile(filePath, content, 'utf8');

    const diff = generateDiffSummary(before, content);
    await appendTimelineEvent({
      type: 'doc_updated',
      summary: `文档更新：${filename}（${diff.summary}）`,
      data: { filename, diff },
    });

    return res.json({ ok: true, diff });
  } catch (error) {
    next(error);
  }
}
