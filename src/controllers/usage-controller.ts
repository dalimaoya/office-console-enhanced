/**
 * UsageController — Token 消耗/成本数据 API
 *
 * Iter-5 新增：扫描 agent sessions JSONL，汇总 token 用量和成本
 * P0-2 新增：byAgent / contextPressure 方法
 */

import type { Request, Response, NextFunction } from 'express';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { sendSuccess } from '../utils/responses.js';
import { getUsageByAgent, getContextPressure, getUsageByModel, resolveUsageWindow } from '../services/usage-service.js';
import { checkAndNotifyContextPressure, checkAndNotifyDailyCost } from '../services/notification-service.js';
import { appendTimelineEvent } from '../services/timeline-service.js';

const OPENCLAW_ROOT = '/root/.openclaw';
const AGENTS_DIR = join(OPENCLAW_ROOT, 'agents');

interface AgentUsage {
  agentId: string;
  tokens: number;
  cost: number;
}

interface UsageResponse {
  totalTokens: number;
  totalCost: number;
  byAgent: AgentUsage[];
  period: string;
  from: number;
  to: number;
  note?: string;
}

async function getAgentUsage(agentId: string, fromTs: number, toTs: number): Promise<AgentUsage> {
  const sessionsDir = join(AGENTS_DIR, agentId, 'sessions');
  let totalTokens = 0;
  let totalCost = 0;

  try {
    const files = await readdir(sessionsDir);
    const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));

    for (const file of jsonlFiles) {
      try {
        const raw = await readFile(join(sessionsDir, file), 'utf-8');
        const lines = raw.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (entry.type === 'message' && entry.message?.usage) {
              const ts = entry.timestamp ? new Date(entry.timestamp).getTime() : null;
              if (ts !== null && !Number.isNaN(ts) && (ts < fromTs || ts > toTs)) continue;
              const usage = entry.message.usage;
              totalTokens += usage.totalTokens || 0;
              totalCost += usage.cost?.total || 0;
            }
          } catch {
            // skip malformed lines
          }
        }
      } catch {
        // skip unreadable files
      }
    }
  } catch {
    // sessions dir not accessible
  }

  return { agentId, tokens: totalTokens, cost: Number(totalCost.toFixed(6)) };
}

export async function getUsage(req: Request, res: Response, next: NextFunction) {
  try {
    const window = resolveUsageWindow({
      period: typeof req.query.period === 'string' ? req.query.period : undefined,
      from: typeof req.query.from === 'string' ? req.query.from : undefined,
      to: typeof req.query.to === 'string' ? req.query.to : undefined,
    });

    let agentIds: string[];
    try {
      agentIds = await readdir(AGENTS_DIR);
    } catch {
      const mockResponse: UsageResponse = {
        totalTokens: 0,
        totalCost: 0,
        byAgent: [],
        period: window.period,
        from: window.fromTs,
        to: window.toTs,
        note: 'usage data unavailable, showing structure',
      };
      return sendSuccess(res, mockResponse);
    }

    const byAgent: AgentUsage[] = [];
    for (const agentId of agentIds) {
      const usage = await getAgentUsage(agentId, window.fromTs, window.toTs);
      if (usage.tokens > 0 || usage.cost > 0) {
        byAgent.push(usage);
      }
    }

    byAgent.sort((a, b) => b.tokens - a.tokens);

    const totalTokens = byAgent.reduce((sum, a) => sum + a.tokens, 0);
    const totalCost = Number(byAgent.reduce((sum, a) => sum + a.cost, 0).toFixed(6));

    const result: UsageResponse = {
      totalTokens,
      totalCost,
      byAgent,
      period: window.period,
      from: window.fromTs,
      to: window.toTs,
      ...(byAgent.length === 0 ? { note: 'usage data unavailable, showing structure' } : {}),
    };

    checkAndNotifyDailyCost(totalCost);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function byAgent(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getUsageByAgent({
      period: typeof req.query.period === 'string' ? req.query.period : undefined,
      from: typeof req.query.from === 'string' ? req.query.from : undefined,
      to: typeof req.query.to === 'string' ? req.query.to : undefined,
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function byModel(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getUsageByModel({
      period: typeof req.query.period === 'string' ? req.query.period : undefined,
      from: typeof req.query.from === 'string' ? req.query.from : undefined,
      to: typeof req.query.to === 'string' ? req.query.to : undefined,
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function contextPressure(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getContextPressure({
      period: typeof req.query.period === 'string' ? req.query.period : undefined,
      from: typeof req.query.from === 'string' ? req.query.from : undefined,
      to: typeof req.query.to === 'string' ? req.query.to : undefined,
    });
    checkAndNotifyContextPressure(result.data);
    await appendTimelineEvent({
      type: 'usage_context_pressure_evaluated',
      summary: `上下文压力已评估（${result.period}）`,
      data: { period: result.period, from: result.from, to: result.to, top: result.data.slice(0, 5) },
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}
