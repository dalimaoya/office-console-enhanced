import type { Request, Response, NextFunction } from 'express';
import { agentService } from '../services/agent-service.js';
import { sendSuccess } from '../utils/responses.js';
import { checkAndNotifyIdleAgents } from '../services/notification-service.js';
import type { AgentStatus } from '../types/dto.js';

export async function getAgents(_req: Request, res: Response, next: NextFunction) {
  try {
    const items = (await agentService.listAgents()).map((item): AgentStatus => ({
      id: item.id,
      displayName: item.name,
      status: item.status,
      lastActiveAt: item.lastActive,
      currentTask: item.statusDetail?.currentTask ?? null,
      contextPressure: null,
      summaryTags: item.summaryTags,
      statusDetail: item.statusDetail
        ? {
            state: item.statusDetail.state,
            lastActiveAt: item.statusDetail.lastActiveAt,
            currentTask: item.statusDetail.currentTask,
            pendingTaskCount: item.statusDetail.pendingTaskCount,
          }
        : undefined,
    }));
    const data = { items, total: items.length };

    // Iter-3：异步非阻塞检查 agent idle 状态，触发飞书告警
    if (data.items) {
      const idleInfos = data.items.map((a) => ({
        agentId: a.id,
        lastActiveAt: a.lastActiveAt ?? null,
      }));
      checkAndNotifyIdleAgents(idleInfos);
    }

    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
