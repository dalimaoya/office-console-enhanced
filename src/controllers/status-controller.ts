import type { Request, Response, NextFunction } from 'express';
import { agentService } from '../services/agent-service.js';
import { env } from '../config/env.js';
import { getUnreadNotificationCount } from '../services/persistent-notifications-service.js';

export async function getStatus(_req: Request, res: Response, next: NextFunction) {
  try {
    const agents = await agentService.listAgents();
    const unreadCount = await getUnreadNotificationCount();
    const working = agents.filter((agent) => agent.status === 'working').length;
    const idle = agents.filter((agent) => agent.status === 'idle').length;

    return res.json({
      ok: true,
      version: '1.0',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      agents: {
        total: agents.length,
        working,
        idle,
      },
      security: {
        readonly: env.readonlyMode,
        require_dryrun: env.requireDryrunConfirm,
      },
      notifications: {
        unread_count: unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
}
