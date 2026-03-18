import type { Request, Response, NextFunction } from 'express';
import { cachedResourceService } from '../services/cached-resource-service.js';
import { agentService } from '../services/agent-service.js';
import { sendSuccess } from '../utils/responses.js';
import { checkAndNotifyIdleAgents } from '../services/notification-service.js';
import type { AgentSummary } from '../types/domain.js';

export async function getAgents(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await cachedResourceService.getWithFallback('agents', async () => {
      const items = await agentService.listAgents();
      return { items, total: items.length };
    });

    // Iter-3：异步非阻塞检查 agent idle 状态，触发飞书告警
    if (result.data?.items) {
      const idleInfos = (result.data.items as AgentSummary[]).map((a) => ({
        agentId: a.id,
        lastActiveAt: a.lastActive ?? null,
      }));
      checkAndNotifyIdleAgents(idleInfos);
    }

    return sendSuccess(res, result.data, { cached: result.cached, stale: result.stale, warning: result.warning });
  } catch (error) {
    next(error);
  }
}
