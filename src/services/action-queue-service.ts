/**
 * ActionQueueService — 待办/异常聚合服务
 *
 * Iter-2 新增：
 * - 从 tasks/ 目录聚合 status=blocked 的任务
 * - 从 agent 状态推断异常（idle 超过 1 小时 / error 状态）
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { getFileReader } from '../data/file-reader.js';
import { log } from '../utils/logger.js';

const TASKS_DIR = '/root/.openclaw/workspace/projects/office-console-enhanced/tasks';
const IDLE_WARNING_THRESHOLD_MS = 60 * 60_000; // 1 hour

// CC 借鉴 P0-2：ACK 持久化文件（运行时数据）
const ACK_FILE = '/root/.openclaw/workspace/projects/office-console-enhanced/runtime/acks.json';
const DEFAULT_ACK_DURATION_MINUTES = 60;

export interface AckRecord {
  acknowledgedAt: string;
  expiresAt: string;
}

/** 加载 acks，返回未过期的记录（自动清理过期） */
export async function loadAcks(): Promise<Record<string, AckRecord>> {
  try {
    if (!existsSync(ACK_FILE)) return {};
    const raw = await readFile(ACK_FILE, 'utf-8');
    const all: Record<string, AckRecord> = JSON.parse(raw);
    const now = new Date();
    // Only return non-expired acks
    const valid: Record<string, AckRecord> = {};
    for (const [id, record] of Object.entries(all)) {
      if (new Date(record.expiresAt) > now) {
        valid[id] = record;
      }
    }
    return valid;
  } catch {
    return {};
  }
}

/** 持久化 acks 到文件 */
export async function saveAcks(acks: Record<string, AckRecord>): Promise<void> {
  try {
    await mkdir(dirname(ACK_FILE), { recursive: true });
    await writeFile(ACK_FILE, JSON.stringify(acks, null, 2), 'utf-8');
  } catch (err) {
    log('warn', `[ActionQueueService] Failed to save acks: ${err}`);
  }
}

/** 确认一个条目，设置有效期 */
export async function ackItem(itemId: string, durationMinutes: number = DEFAULT_ACK_DURATION_MINUTES): Promise<AckRecord> {
  const acks = await loadAcks();
  const now = new Date();
  const record: AckRecord = {
    acknowledgedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + durationMinutes * 60_000).toISOString(),
  };
  acks[itemId] = record;
  await saveAcks(acks);
  return record;
}

export interface BlockedTask {
  type: 'task';
  id: string;
  title: string;
  agentId: string;
  reason: string;
  since: string | null;
}

export interface AgentWarning {
  type: 'agent';
  agentId: string;
  message: string;
  level: 'warning' | 'error';
}

export interface ActionQueueResult {
  blocked: BlockedTask[];
  warnings: AgentWarning[];
  totalCount: number;
}

async function readBlockedTasks(): Promise<BlockedTask[]> {
  try {
    const files = await readdir(TASKS_DIR).catch(() => [] as string[]);
    const mdFiles = files.filter((f) => f.endsWith('.md'));
    const blocked: BlockedTask[] = [];

    for (const file of mdFiles) {
      try {
        const content = await readFile(join(TASKS_DIR, file), 'utf-8');
        const lines = content.split('\n');

        let title = '';
        let status = '';
        let owner = '';
        let reason = '';
        let since: string | null = null;

        for (const line of lines) {
          if (!title && line.startsWith('# ')) title = line.slice(2).trim();
          const statusMatch = line.match(/^[-*]\s*(?:状态|status)[：:]\s*(.+)/i);
          if (statusMatch) status = statusMatch[1].trim().toLowerCase();
          const ownerMatch = line.match(/^[-*]\s*(?:负责人|owner|assignee)[：:]\s*(.+)/i);
          if (ownerMatch) owner = ownerMatch[1].trim();
          const blockerMatch = line.match(/^[-*]\s*(?:阻塞原因|blocker|blocked\s*reason)[：:]\s*(.+)/i);
          if (blockerMatch) reason = blockerMatch[1].trim();
          const sinceMatch = line.match(/^[-*]\s*(?:创建时间|created|since)[：:]\s*(.+)/i);
          if (sinceMatch) since = sinceMatch[1].trim();
        }

        if (status === 'blocked') {
          blocked.push({
            type: 'task',
            id: file.replace(/\.md$/, ''),
            title: title || file,
            agentId: owner || 'unknown',
            reason: reason || '无明确阻塞原因',
            since,
          });
        }
      } catch {
        // skip unreadable file
      }
    }
    return blocked;
  } catch (err) {
    log('warn', `[ActionQueueService] Failed to read tasks: ${err}`);
    return [];
  }
}

async function readAgentWarnings(): Promise<AgentWarning[]> {
  const warnings: AgentWarning[] = [];
  try {
    const fileReader = getFileReader();
    const agentConfigs = await fileReader.listAgentConfigs();
    const now = Date.now();

    for (const agent of agentConfigs) {
      const agentId = agent.id;
      const lastActiveMs = await fileReader.getAgentLastActiveMs(agentId);

      if (lastActiveMs !== null && now - lastActiveMs > IDLE_WARNING_THRESHOLD_MS) {
        const idleMin = Math.floor((now - lastActiveMs) / 60_000);
        warnings.push({
          type: 'agent',
          agentId,
          message: `Agent ${agentId} 已空闲 ${idleMin} 分钟，超过阈值（60分钟）`,
          level: 'warning',
        });
      }
    }
  } catch (err) {
    log('warn', `[ActionQueueService] Failed to read agent warnings: ${err}`);
  }
  return warnings;
}

export async function getActionQueue(): Promise<ActionQueueResult> {
  const [blocked, warnings, acks] = await Promise.all([readBlockedTasks(), readAgentWarnings(), loadAcks()]);

  // Filter out acknowledged (non-expired) items
  const filteredBlocked = blocked.filter((item) => !acks[item.id]);
  const filteredWarnings = warnings.filter((item) => !acks[`agent:${item.agentId}`]);

  return {
    blocked: filteredBlocked,
    warnings: filteredWarnings,
    totalCount: filteredBlocked.length + filteredWarnings.length,
  };
}
