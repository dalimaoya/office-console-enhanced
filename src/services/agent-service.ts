/**
 * AgentService — Agent 状态服务
 *
 * Iter-1 重构：
 * - 优先使用 FileReader 直读 openclaw.json + session 目录（~毫秒级）
 * - 保留 CLI adapter 作为 fallback（env.useFileReader=false 时启用）
 * - 数据结构与现有 DTO 完全兼容（AgentSummary 未变）
 *
 * P0-3 重构：
 * - 状态从 normal/warning/error 扩展为 working/idle/blocked/backlog/error/offline
 * - 新增 statusDetail: { lastActiveAt, currentTask, pendingTaskCount }
 */

import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { AgentSummary, AgentStatus, AgentStatusDetail } from '../types/domain.js';
import { openclawCliAdapter } from '../adapters/openclaw-cli-adapter.js';
import { getFileReader } from '../data/file-reader.js';
import { env } from '../config/env.js';
import { log } from '../utils/logger.js';

const OPENCLAW_ROOT = '/root/.openclaw';
const TASKS_DIR = '/root/.openclaw/workspace/projects/office-console-enhanced/tasks';
const WORKING_THRESHOLD_MS = 5 * 60_000;        // 5 min
const IDLE_THRESHOLD_MS = 6 * 60 * 60_000;       // 6 hours

interface TaskInfo {
  title: string;
  status: string;
  owner: string;
}

async function readTaskInfos(): Promise<TaskInfo[]> {
  try {
    const { readFile, readdir: rd } = await import('node:fs/promises');
    const files = await rd(TASKS_DIR).catch(() => [] as string[]);
    const mdFiles = files.filter((f) => f.endsWith('.md'));

    const infos: TaskInfo[] = [];
    for (const file of mdFiles) {
      try {
        const content = await readFile(join(TASKS_DIR, file), 'utf-8');
        const lines = content.split('\n');
        let title = '';
        let status = 'unknown';
        let owner = '';

        for (const line of lines) {
          if (!title && line.startsWith('# ')) title = line.slice(2).trim();
          const sm = line.match(/^[-*]\s*(?:状态|status)[：:]\s*(.+)/i);
          if (sm) status = sm[1].trim();
          const om = line.match(/^[-*]\s*(?:负责人|owner)[：:]\s*(.+)/i);
          if (om) owner = om[1].trim();
        }
        infos.push({ title: title || file, status, owner });
      } catch {}
    }
    return infos;
  } catch {
    return [];
  }
}

async function deriveAgentStatus(
  agentId: string,
  lastActiveMs: number | null,
  workspaceExists: boolean,
  allTasks: TaskInfo[]
): Promise<{ status: AgentStatus; statusDetail: AgentStatusDetail }> {
  // offline: workspace doesn't exist or not accessible
  if (!workspaceExists) {
    return {
      status: 'offline',
      statusDetail: {
        state: 'offline',
        lastActiveAt: lastActiveMs ? new Date(lastActiveMs).toISOString() : null,
        currentTask: null,
        pendingTaskCount: 0,
      },
    };
  }

  // Tasks relevant to this agent
  const agentTasks = allTasks.filter((t) => {
    const ownerLower = t.owner.toLowerCase();
    const idLower = agentId.toLowerCase();
    // match by agent id or common name fragment (e.g. "leona" in "backend-leona")
    const idParts = agentId.split('-');
    return idParts.some((part) => ownerLower.includes(part.toLowerCase())) || ownerLower.includes(idLower);
  });

  const blockedTask = agentTasks.find((t) => /blocked|阻塞/.test(t.status.toLowerCase()));
  const pendingTasks = agentTasks.filter((t) => /active|pending|in.progress|进行中|待/.test(t.status.toLowerCase()));
  const currentTask = pendingTasks[0]?.title ?? blockedTask?.title ?? null;
  const pendingTaskCount = pendingTasks.length;

  const ageMs = lastActiveMs ? Date.now() - lastActiveMs : Infinity;

  let status: AgentStatus;

  if (!lastActiveMs) {
    // No session history
    if (blockedTask) {
      status = 'blocked';
    } else if (pendingTaskCount > 0) {
      status = 'backlog';
    } else {
      status = 'offline';
    }
  } else if (ageMs <= WORKING_THRESHOLD_MS) {
    status = 'working';
  } else if (blockedTask) {
    status = 'blocked';
  } else if (pendingTaskCount > 0 && ageMs > WORKING_THRESHOLD_MS) {
    status = 'backlog';
  } else if (ageMs <= IDLE_THRESHOLD_MS) {
    status = 'idle';
  } else {
    status = 'idle';
  }

  return {
    status,
    statusDetail: {
      state: status,
      lastActiveAt: lastActiveMs ? new Date(lastActiveMs).toISOString() : null,
      currentTask,
      pendingTaskCount,
    },
  };
}

async function checkWorkspaceExists(agentId: string): Promise<boolean> {
  try {
    const fileReader = getFileReader();
    const agentCfg = await fileReader.readAgentConfig(agentId);
    if (!agentCfg?.workspace) {
      // fallback: check if agents dir exists
      await stat(join(OPENCLAW_ROOT, 'agents', agentId));
    } else {
      await stat(agentCfg.workspace);
    }
    return true;
  } catch {
    return false;
  }
}

export class AgentService {
  async listAgents(): Promise<AgentSummary[]> {
    if (env.useFileReader) {
      try {
        return await this.listAgentsViaFileReader();
      } catch (err) {
        log('warn', 'agent_service_file_reader_failed_fallback_to_cli', {
          err: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return this.listAgentsViaCli();
  }

  // ─── 文件直读路径（Iter-1 新路径）────────────────────────────────────────

  private async listAgentsViaFileReader(): Promise<AgentSummary[]> {
    const fileReader = getFileReader();
    const agentConfigs = await fileReader.listAgentConfigs();

    if (!agentConfigs.length) {
      throw new Error('No agent configs found in openclaw.json');
    }

    // Load all task infos once
    const allTasks = await readTaskInfos();

    const results = await Promise.all(
      agentConfigs.map(async (agent) => {
        const lastActiveMs = await fileReader.getAgentLastActiveMs(agent.id).catch(() => null);
        const workspaceExists = await checkWorkspaceExists(agent.id);

        const identityName = agent.identity?.name ?? agent.name ?? agent.id;
        const roleTag = agent.id.split('-').slice(-1)[0] ?? 'agent';

        const { status, statusDetail } = await deriveAgentStatus(
          agent.id,
          lastActiveMs,
          workspaceExists,
          allTasks
        );

        return {
          id: agent.id,
          name: identityName,
          status,
          lastActive: lastActiveMs ? new Date(lastActiveMs).toISOString() : null,
          summaryTags: [roleTag, status],
          statusDetail,
        } satisfies AgentSummary;
      })
    );

    return results;
  }

  // ─── CLI fallback 路径（保留原有逻辑）────────────────────────────────────

  private async listAgentsViaCli(): Promise<AgentSummary[]> {
    const [agentsResult, statusResult] = await Promise.all([
      openclawCliAdapter.gatewayCall<any>('agents.list'),
      openclawCliAdapter.gatewayCall<any>('status'),
    ]);

    const allTasks = await readTaskInfos();

    const recentByAgent = new Map<string, any[]>();
    for (const item of statusResult?.sessions?.byAgent ?? []) {
      recentByAgent.set(item.agentId, item.recent ?? []);
    }
    const heartbeatByAgent = new Map<string, any>();
    for (const item of statusResult?.heartbeat?.agents ?? []) {
      heartbeatByAgent.set(item.agentId, item);
    }

    const results = await Promise.all(
      (agentsResult?.agents ?? []).map(async (agent: any) => {
        const recent = recentByAgent.get(agent.id) ?? [];
        const last = recent[0];
        const lastActiveMs = last?.updatedAt ? Number(last.updatedAt) : null;
        const workspaceExists = await checkWorkspaceExists(agent.id);

        const { status, statusDetail } = await deriveAgentStatus(
          agent.id,
          lastActiveMs,
          workspaceExists,
          allTasks
        );

        return {
          id: agent.id,
          name: agent.identity?.name ?? agent.name ?? agent.id,
          status,
          lastActive: lastActiveMs ? new Date(lastActiveMs).toISOString() : null,
          summaryTags: [agent.id.split('-').slice(-1)[0] ?? 'agent', status],
          statusDetail,
        } satisfies AgentSummary;
      })
    );

    return results;
  }
}

export const agentService = new AgentService();
