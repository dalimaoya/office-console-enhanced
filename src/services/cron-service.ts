/**
 * CronService — Cron 定时任务健康监控服务
 *
 * Iter-2 新增：
 * - 读取 openclaw.json 中的 cron 配置
 * - 若无配置，返回空数组 + note
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { log } from '../utils/logger.js';
import { env } from '../config/env.js';

export interface CronEntry {
  name: string;
  schedule: string;
  lastRunAt: string | null;
  lastStatus: string | null;
  nextRunAt: string | null;
}

export interface CronResult {
  data: CronEntry[];
  note?: string;
}

function computeNextRunAt(schedule: string): string | null {
  // Simple stub: return null (full cron-parser would be a dep; keep it lean)
  try {
    // Could integrate cron-parser here; for now return null
    return null;
  } catch {
    return null;
  }
}

async function readOpenclawJson(): Promise<Record<string, unknown> | null> {
  const candidates = [
    join(env.openclawRoot, 'openclaw.json'),
    '/root/.openclaw/openclaw.json',
  ];
  for (const candidate of candidates) {
    try {
      const raw = await readFile(candidate, 'utf-8');
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      // try next
    }
  }
  return null;
}

export async function getCronStatus(): Promise<CronResult> {
  try {
    const config = await readOpenclawJson();

    if (!config) {
      return { data: [], note: 'no cron configuration found' };
    }

    // openclaw.json may have a top-level "cron" key (array or object)
    const cronRaw = config['cron'];
    if (!cronRaw) {
      return { data: [], note: 'no cron configuration found' };
    }

    const cronArray: CronEntry[] = [];

    if (Array.isArray(cronRaw)) {
      for (const item of cronRaw) {
        if (typeof item === 'object' && item !== null) {
          const entry = item as Record<string, unknown>;
          cronArray.push({
            name: String(entry['name'] ?? entry['id'] ?? 'unnamed'),
            schedule: String(entry['schedule'] ?? entry['cron'] ?? ''),
            lastRunAt: entry['lastRunAt'] ? String(entry['lastRunAt']) : null,
            lastStatus: entry['lastStatus'] ? String(entry['lastStatus']) : null,
            nextRunAt: entry['nextRunAt']
              ? String(entry['nextRunAt'])
              : computeNextRunAt(String(entry['schedule'] ?? '')),
          });
        }
      }
    } else if (typeof cronRaw === 'object' && cronRaw !== null) {
      // Map-style: { "job-name": { schedule, ... } }
      for (const [name, value] of Object.entries(cronRaw as Record<string, unknown>)) {
        if (typeof value === 'object' && value !== null) {
          const entry = value as Record<string, unknown>;
          cronArray.push({
            name,
            schedule: String(entry['schedule'] ?? entry['cron'] ?? ''),
            lastRunAt: entry['lastRunAt'] ? String(entry['lastRunAt']) : null,
            lastStatus: entry['lastStatus'] ? String(entry['lastStatus']) : null,
            nextRunAt: entry['nextRunAt']
              ? String(entry['nextRunAt'])
              : computeNextRunAt(String(entry['schedule'] ?? '')),
          });
        } else if (typeof value === 'string') {
          cronArray.push({
            name,
            schedule: value,
            lastRunAt: null,
            lastStatus: null,
            nextRunAt: computeNextRunAt(value),
          });
        }
      }
    }

    if (cronArray.length === 0) {
      return { data: [], note: 'no cron configuration found' };
    }

    return { data: cronArray };
  } catch (err) {
    log('warn', `[CronService] Failed to read cron config: ${err}`);
    return { data: [], note: 'no cron configuration found' };
  }
}
