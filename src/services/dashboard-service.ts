import { performance } from 'node:perf_hooks';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { openclawCliAdapter } from '../adapters/openclaw-cli-adapter.js';
import type { AgentSummary, DashboardPayload } from '../types/domain.js';
import { agentService } from './agent-service.js';
import { computeReadinessScore } from './readiness-service.js';

const AGENTS_DIR = '/root/.openclaw/agents';
// 单次 Gateway 调用最大等待时间（毫秒）
const GATEWAY_CALL_TIMEOUT_MS = 800;

/** 为 Promise 添加超时，超时返回 fallback */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/** 读取今日所有 agent 的 token 用量（直接读取 JSONL，无 CLI 开销） */
async function readTodayUsage(): Promise<{ todayTokens: number; todayCost: number }> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let todayTokens = 0;
  let todayCost = 0;

  try {
    const agentDirs = await readdir(AGENTS_DIR);
    await Promise.all(
      agentDirs.map(async (agentId) => {
        const sessionsDir = join(AGENTS_DIR, agentId, 'sessions');
        try {
          const files = await readdir(sessionsDir);
          const jsonlFiles = files.filter((f) => f.endsWith('.jsonl') && !f.includes('.deleted') && !f.includes('.reset'));
          await Promise.all(
            jsonlFiles.map(async (file) => {
              try {
                const raw = await readFile(join(sessionsDir, file), 'utf-8');
                for (const line of raw.split('\n')) {
                  if (!line) continue;
                  try {
                    const entry = JSON.parse(line);
                    if (entry.type === 'message' && entry.message?.usage) {
                      const ts = entry.timestamp ? new Date(entry.timestamp) : null;
                      if (ts && ts < cutoff) continue;
                      todayTokens += entry.message.usage.totalTokens || 0;
                      todayCost += entry.message.usage.cost?.total || 0;
                    }
                  } catch { /* skip malformed lines */ }
                }
              } catch { /* skip unreadable files */ }
            })
          );
        } catch { /* skip agents without sessions dir */ }
      })
    );
  } catch { /* skip if agents dir not accessible */ }

  return { todayTokens, todayCost: Number(todayCost.toFixed(6)) };
}

export class DashboardService {
  async getDashboard(): Promise<DashboardPayload> {
    const sourceDurationsMs: Record<string, number> = {};
    const timed = async <T>(name: string, fn: () => Promise<T>, fallback: T) => {
      const started = performance.now();
      const value = await withTimeout(fn(), GATEWAY_CALL_TIMEOUT_MS, fallback);
      sourceDurationsMs[name] = Math.round(performance.now() - started);
      return value;
    };

    const [health, status, agents, config, todayUsage, readinessScore] = await Promise.all([
      timed('health', () => openclawCliAdapter.healthCheck(), { ok: false }),
      timed('status', () => openclawCliAdapter.gatewayCall<any>('status'), null),
      timed('agents', () => agentService.listAgents(), [] as AgentSummary[]),
      timed('config', () => openclawCliAdapter.gatewayCall<any>('config.get'), null),
      readTodayUsage(),
      computeReadinessScore().catch(() => undefined),
    ]);

    return this.mapDashboard({ health, status, agents, config, sourceDurationsMs, todayUsage, readinessScore });
  }

  private mapDashboard(input: { health: { ok?: boolean }; status: any; agents: AgentSummary[]; config: any; sourceDurationsMs: Record<string, number>; todayUsage: { todayTokens: number; todayCost: number }; readinessScore?: any }): DashboardPayload {
    const statusBreakdown: DashboardPayload['agents']['statusBreakdown'] = { working: 0, idle: 0, blocked: 0, backlog: 0, error: 0, offline: 0, unknown: 0 };
    for (const item of input.agents) {
      if (statusBreakdown[item.status] !== undefined) statusBreakdown[item.status] += 1;
      else statusBreakdown[item.status] = 1;
    }
    const avgResponseMs = Math.round(Object.values(input.sourceDurationsMs).reduce((sum, value) => sum + value, 0) / Math.max(Object.keys(input.sourceDurationsMs).length, 1));
    const workspaces = this.aggregateWorkspaces(input.config?.parsed?.agents?.list ?? [], input.agents);
    const alerts = this.buildAlerts(input.agents, avgResponseMs, !input.health.ok);
    const successRate = Math.round(((statusBreakdown.working ?? 0) + (statusBreakdown.idle ?? 0)) / Math.max(input.agents.length, 1) * 100);

    return {
      system: {
        status: alerts.some((item) => item.level === 'error') ? 'error' : alerts.length ? 'warning' : 'normal',
        uptime: this.formatUptime(input.status?.sessions?.recent ?? []),
        version: `OpenClaw v${input.status?.runtimeVersion ?? 'unknown'}`,
        lastCheck: new Date().toISOString(),
        performance: {
          avgResponseMs,
          health: avgResponseMs <= 1500 ? 'healthy' : avgResponseMs <= 2500 ? 'degrading' : 'failing',
        },
      },
      agents: {
        total: input.agents.length,
        active: input.agents.filter((item) => item.status === 'working' || item.status === 'idle').length,
        statusBreakdown,
        quickStats: [
          { name: 'Task Success Rate', value: `${successRate}%`, trend: 'stable' },
          { name: 'Avg Response Time', value: `${(avgResponseMs / 1000).toFixed(1)}s`, trend: avgResponseMs <= 1500 ? 'improving' : 'degrading' },
        ],
      },
      workspaces: {
        activeCount: workspaces.filter((item) => item.status === 'active').length,
        recentActivity: workspaces,
      },
      usage: {
        todayTokens: input.todayUsage.todayTokens,
        todayCost: input.todayUsage.todayCost,
        period: 'today',
      },
      alerts,
      ...(input.readinessScore ? { readinessScore: input.readinessScore } : {}),
    };
  }

  private aggregateWorkspaces(configAgents: any[], agents: AgentSummary[]) {
    const lastActiveById = new Map(agents.map((item) => [item.id, item.lastActive]));
    const buckets = new Map<string, { name: string; status: string; agentCount: number; lastUpdated: string }>();
    for (const configAgent of configAgents) {
      const key = configAgent.workspace ? (String(configAgent.workspace).split('/').pop() ?? '未配置工作区') : '未配置工作区';
      const current = buckets.get(key) ?? { name: key, status: 'idle', agentCount: 0, lastUpdated: '暂无记录' };
      current.agentCount += 1;
      const lastActive = lastActiveById.get(configAgent.id);
      if (typeof lastActive === 'string') {
        current.status = 'active';
        current.lastUpdated = lastActive;
      }
      buckets.set(key, current);
    }
    return [...buckets.values()].slice(0, 5);
  }

  private buildAlerts(agents: AgentSummary[], avgResponseMs: number, gatewayOffline: boolean): DashboardPayload['alerts'] {
    const now = new Date().toISOString();
    const alerts: DashboardPayload['alerts'] = [];
    if (gatewayOffline) {
      alerts.push({ level: 'error', type: 'system_performance', message: 'Gateway 健康探针异常，系统状态不可完全确认', suggestion: '检查 OpenClaw Gateway 进程与本地端口 18789', timestamp: now });
    }
    if (avgResponseMs > 1800) {
      alerts.push({ level: avgResponseMs > 2500 ? 'error' : 'warning', type: 'system_performance', message: `适配层最近一次聚合耗时偏高（${avgResponseMs}ms）`, suggestion: '优先依赖缓存结果，并检查 Gateway CLI/RPC 响应时间', timestamp: now });
    }
    for (const item of agents.filter((agent) => agent.status === 'error' || agent.status === 'offline').slice(0, 3)) {
      alerts.push({ level: 'warning', type: 'agent_health', message: `Agent '${item.name}' 最近活跃时间过久，当前可能离线`, suggestion: '检查对应工作区运行情况', timestamp: item.lastActive ?? now });
    }
    return alerts;
  }

  private formatUptime(recentSessions: any[]) {
    const timestamps = recentSessions.map((item) => Number(item.updatedAt)).filter(Boolean);
    if (!timestamps.length) return 'unknown';
    const oldest = Math.min(...timestamps);
    const totalMinutes = Math.max(0, Math.floor((Date.now() - oldest) / 60_000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
}

export const dashboardService = new DashboardService();
