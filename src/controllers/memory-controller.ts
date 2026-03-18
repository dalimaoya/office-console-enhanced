/**
 * MemoryController — Agent 记忆文件列表 API
 *
 * Iter-5 新增：扫描各 agent workspace 的 MEMORY.md 和 memory/ 目录
 */

import type { Request, Response, NextFunction } from 'express';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, basename, resolve, normalize } from 'node:path';
import { homedir } from 'node:os';
import { sendSuccess, sendError } from '../utils/responses.js';
import { getMemoryHealth } from '../services/memory-health-service.js';

const HOME = homedir();
const OPENCLAW_ROOT = join(HOME, '.openclaw');

interface MemoryItem {
  agentId: string;
  file: string;
  mtime: string;
  size: number;
}

async function scanAgentMemory(agentId: string, workspaceDir: string): Promise<MemoryItem[]> {
  const items: MemoryItem[] = [];

  // Check for MEMORY.md at workspace root
  const memoryMdPath = join(workspaceDir, 'MEMORY.md');
  try {
    const s = await stat(memoryMdPath);
    items.push({
      agentId,
      file: memoryMdPath,
      mtime: s.mtime.toISOString(),
      size: s.size,
    });
  } catch {
    // no MEMORY.md
  }

  // Check for memory/ directory
  const memoryDir = join(workspaceDir, 'memory');
  try {
    const files = await readdir(memoryDir);
    for (const fname of files) {
      const fpath = join(memoryDir, fname);
      try {
        const s = await stat(fpath);
        if (s.isFile()) {
          items.push({
            agentId,
            file: fpath,
            mtime: s.mtime.toISOString(),
            size: s.size,
          });
        }
      } catch {
        // skip
      }
    }
  } catch {
    // no memory/ dir
  }

  return items;
}

function isPathSafe(filePath: string): boolean {
  // Only allow files within ~/.openclaw/workspace-agent-* directories
  const normalized = normalize(resolve(filePath));
  const allowed = normalize(resolve(OPENCLAW_ROOT));
  return normalized.startsWith(allowed);
}

// CC 借鉴 P0-4：Memory 健康状态评估
export async function getMemoryHealthHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getMemoryHealth();
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getMemory(req: Request, res: Response, next: NextFunction) {
  try {
    const fileParam = req.query.file;

    // If ?file=path — return file content (readonly, with safety check)
    if (fileParam) {
      const requestedPath = String(fileParam);
      if (!isPathSafe(requestedPath)) {
        return sendError(res, 400, 'INVALID_PATH', 'Path not allowed');
      }

      try {
        const content = await readFile(requestedPath, 'utf-8');
        return sendSuccess(res, { file: requestedPath, content });
      } catch {
        return sendError(res, 404, 'FILE_NOT_FOUND', `File not found: ${basename(requestedPath)}`);
      }
    }

    // Scan all workspace-agent-* directories
    let workspaceDirs: string[];
    try {
      const all = await readdir(OPENCLAW_ROOT);
      workspaceDirs = all.filter((d) => d.startsWith('workspace-agent-'));
    } catch {
      return sendSuccess(res, []);
    }

    const items: MemoryItem[] = [];
    for (const dir of workspaceDirs) {
      const agentId = dir.replace(/^workspace-/, '');
      const workspacePath = join(OPENCLAW_ROOT, dir);
      const agentItems = await scanAgentMemory(agentId, workspacePath);
      items.push(...agentItems);
    }

    // Sort by mtime descending
    items.sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());

    return sendSuccess(res, items);
  } catch (error) {
    next(error);
  }
}
