/**
 * DocsController — 文档文件列表 API
 *
 * Iter-4 新增：扫描项目 docs 目录，返回文档文件列表或指定文件内容
 */

import type { Request, Response, NextFunction } from 'express';
import { stat, readdir, readFile } from 'node:fs/promises';
import { join, basename, resolve } from 'node:path';
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

export async function getDocs(req: Request, res: Response, next: NextFunction) {
  try {
    const fileParam = req.query.file;

    // If ?file=xxx.md — return file content
    if (fileParam) {
      const filename = basename(String(fileParam));
      // Security: only allow .md files within DOCS_DIR (no path traversal)
      const filePath = resolve(join(DOCS_DIR, filename));
      if (!filePath.startsWith(resolve(DOCS_DIR))) {
        return sendError(res, 400, 'INVALID_PATH', 'Invalid file path');
      }

      try {
        const content = await readFile(filePath, 'utf-8');
        return sendSuccess(res, { filename, content });
      } catch {
        return sendError(res, 404, 'FILE_NOT_FOUND', `File not found: ${filename}`);
      }
    }

    // Otherwise — return file list
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

    // Sort by mtime descending
    items.sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());

    return sendSuccess(res, items);
  } catch (error) {
    next(error);
  }
}
