import type { Request, Response, NextFunction } from 'express';
import { agentService } from '../services/agent-service.js';
import { sendSuccess } from '../utils/responses.js';
import { checkAndNotifyIdleAgents } from '../services/notification-service.js';
import type { AgentSummary } from '../types/domain.js';

export async function getAgents(_req: Request, res: Response, next: NextFunction) {
  try {
    const items = await agentService.listAgents();
    const data = { items, total: items.length };

    // Iter-3：异步非阻塞检查 agent idle 状态，触发飞书告警
    if (data.items) {
      const idleInfos = (data.items as AgentSummary[]).map((a) => ({
        agentId: a.id,
        lastActiveAt: a.lastActive ?? null,
      }));
      checkAndNotifyIdleAgents(idleInfos);
    }

    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
