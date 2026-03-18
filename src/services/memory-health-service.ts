/**
 * MemoryHealthService — Agent 记忆文件健康评估
 *
 * CC 借鉴 P0-4：评估每个 agent 的记忆文件健康状态
 * status: healthy / stale（>7天） / empty（0字节） / missing
 */

import { stat, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { getFileReader } from '../data/file-reader.js';
import { log } from '../utils/logger.js';

const HOME = homedir();
const OPENCLAW_ROOT = join(HOME, '.openclaw');
const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type MemoryFileStatus = 'healthy' | 'stale' | 'empty' | 'missing';

export interface MemoryFileHealth {
  name: string;
  exists: boolean;
  sizeBytes: number;
  lastModified: string | null;
  status: MemoryFileStatus;
}

export interface MemoryHealthItem {
  agentId: string;
  files: MemoryFileHealth[];
}

export interface MemoryHealthResult {
  agents: MemoryHealthItem[];
  generatedAt: string;
}

async function getFileHealth(filePath: string, fileName: string): Promise<MemoryFileHealth> {
  try {
    const s = await stat(filePath);
    const sizeBytes = s.size;
    const lastModified = s.mtime.toISOString();
    const ageMs = Date.now() - s.mtimeMs;

    let status: MemoryFileStatus;
    if (sizeBytes === 0) {
      status = 'empty';
    } else if (ageMs > STALE_THRESHOLD_MS) {
      status = 'stale';
    } else {
      status = 'healthy';
    }

    return { name: fileName, exists: true, sizeBytes, lastModified, status };
  } catch {
    return { name: fileName, exists: false, sizeBytes: 0, lastModified: null, status: 'missing' };
  }
}

async function scanAgentMemoryFiles(agentId: string, workspaceDir: string): Promise<MemoryFileHealth[]> {
  const files: MemoryFileHealth[] = [];

  // Check MEMORY.md
  const memoryMdPath = join(workspaceDir, 'MEMORY.md');
  files.push(await getFileHealth(memoryMdPath, 'MEMORY.md'));

  // Check memory/ directory files
  const memoryDir = join(workspaceDir, 'memory');
  try {
    const entries = await readdir(memoryDir);
    for (const fname of entries) {
      const fpath = join(memoryDir, fname);
      try {
        const s = await stat(fpath);
        if (s.isFile()) {
          files.push(await getFileHealth(fpath, `memory/${fname}`));
        }
      } catch {
        // skip
      }
    }
  } catch {
    // no memory/ directory
  }

  return files;
}

export async function getMemoryHealth(): Promise<MemoryHealthResult> {
  const agents: MemoryHealthItem[] = [];

  try {
    // Get agent list from config (exclude deleted agents)
    const fileReader = getFileReader();
    const agentConfigs = await fileReader.listAgentConfigs().catch(() => []);
    const configuredAgentIds = new Set(agentConfigs.map((a) => a.id));

    // Scan workspace directories
    let workspaceDirs: string[];
    try {
      const all = await readdir(OPENCLAW_ROOT);
      workspaceDirs = all.filter((d) => d.startsWith('workspace-agent-'));
    } catch {
      return { agents: [], generatedAt: new Date().toISOString() };
    }

    for (const dir of workspaceDirs) {
      const agentId = dir.replace(/^workspace-/, '');
      // Only include agents that are in the current config
      if (!configuredAgentIds.has(agentId) && configuredAgentIds.size > 0) {
        // Skip agents that are no longer in config (already deleted)
        // But if configuredAgentIds is empty (no config found), show all
        continue;
      }
      const workspacePath = join(OPENCLAW_ROOT, dir);
      const files = await scanAgentMemoryFiles(agentId, workspacePath);
      agents.push({ agentId, files });
    }
  } catch (err) {
    log('warn', `[MemoryHealthService] Failed to compute memory health: ${err}`);
  }

  return {
    agents,
    generatedAt: new Date().toISOString(),
  };
}
