/**
 * ActionQueueService — 待办/异常聚合服务
 *
 * Iter-2 新增：
 * - 从 tasks/ 目录聚合 status=blocked 的任务
 * - 从 agent 状态推断异常（idle 超过 1 小时 / error 状态）
 */

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { getFileReader } from '../data/file-reader.js';
import { log } from '../utils/logger.js';

const TASKS_DIR = '/root/.openclaw/workspace/projects/office-console-enhanced/tasks';
const IDLE_WARNING_THRESHOLD_MS = 60 * 60_000; // 1 hour

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
  const [blocked, warnings] = await Promise.all([readBlockedTasks(), readAgentWarnings()]);
  return {
    blocked,
    warnings,
    totalCount: blocked.length + warnings.length,
  };
}
