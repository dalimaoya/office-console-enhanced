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
import { getUsageByAgent, getContextPressure, getUsageByModel } from '../services/usage-service.js';
import { checkAndNotifyContextPressure } from '../services/notification-service.js';

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
  note?: string;
}

async function getAgentUsage(agentId: string, period: string): Promise<AgentUsage> {
  const sessionsDir = join(AGENTS_DIR, agentId, 'sessions');
  let totalTokens = 0;
  let totalCost = 0;

  try {
    const files = await readdir(sessionsDir);
    const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));

    const cutoff = period === 'today'
      ? new Date(Date.now() - 24 * 60 * 60 * 1000)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const file of jsonlFiles) {
      try {
        const raw = await readFile(join(sessionsDir, file), 'utf-8');
        const lines = raw.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (entry.type === 'message' && entry.message?.usage) {
              const ts = entry.timestamp ? new Date(entry.timestamp) : null;
              if (ts && ts < cutoff) continue;
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
    const period = String(req.query.period || 'today');
    const validPeriod = ['today', 'week'].includes(period) ? period : 'today';

    let agentIds: string[];
    try {
      agentIds = await readdir(AGENTS_DIR);
    } catch {
      const mockResponse: UsageResponse = {
        totalTokens: 0,
        totalCost: 0,
        byAgent: [],
        period: validPeriod,
        note: 'usage data unavailable, showing structure',
      };
      return sendSuccess(res, mockResponse);
    }

    const byAgent: AgentUsage[] = [];
    for (const agentId of agentIds) {
      const usage = await getAgentUsage(agentId, validPeriod);
      if (usage.tokens > 0 || usage.cost > 0) {
        byAgent.push(usage);
      }
    }

    // Sort by tokens descending
    byAgent.sort((a, b) => b.tokens - a.tokens);

    const totalTokens = byAgent.reduce((sum, a) => sum + a.tokens, 0);
    const totalCost = Number(byAgent.reduce((sum, a) => sum + a.cost, 0).toFixed(6));

    const result: UsageResponse = {
      totalTokens,
      totalCost,
      byAgent,
      period: validPeriod,
      ...(byAgent.length === 0 ? { note: 'usage data unavailable, showing structure' } : {}),
    };

    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

// P0-2: Token 归因明细
export async function byAgent(req: Request, res: Response, next: NextFunction) {
  try {
    const period = String(req.query.period || 'today');
    const validPeriod = ['today', 'week'].includes(period) ? period : 'today';
    const result = await getUsageByAgent(validPeriod);
    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// CC 借鉴 P0-5：按 Model 维度用量汇总
export async function byModel(req: Request, res: Response, next: NextFunction) {
  try {
    const period = String(req.query.period || 'today');
    const validPeriod = ['today', 'week'].includes(period) ? period : 'today';
    const result = await getUsageByModel(validPeriod);
    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// P0-2: 上下文压力评估
export async function contextPressure(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getContextPressure();
    // Iter-3：异步非阻塞触发飞书告警（不等待，不阻塞响应）
    checkAndNotifyContextPressure(result.data);
    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}
