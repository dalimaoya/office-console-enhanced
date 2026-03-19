import type { Request, Response, NextFunction } from 'express';
import { cachedResourceService } from '../services/cached-resource-service.js';
import { dashboardService } from '../services/dashboard-service.js';
import { eventLogService } from '../services/event-log-service.js';
import { sendSuccess } from '../utils/responses.js';
import type { DashboardData } from '../types/dto.js';

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await cachedResourceService.getWithFallback('dashboard', () => dashboardService.getDashboard());
    const data: DashboardData = result.data;

    eventLogService.append({
      event_type: 'system.healthcheck_passed',
      source_role: 'office-dashboard-adapter',
      description: 'Dashboard 请求成功',
      object_id: 'project-office-console-enhanced',
      context: {
        path: req.originalUrl,
        method: req.method,
        cached: result.cached,
        stale: result.stale ?? false,
      },
    });

    return sendSuccess(res, data, { cached: result.cached, stale: result.stale, warning: result.warning });
  } catch (error) {
    eventLogService.append({
      event_type: 'system.healthcheck_failed',
      source_role: 'office-dashboard-adapter',
      description: 'Dashboard 请求失败',
      object_id: 'project-office-console-enhanced',
      error: error instanceof Error ? { summary: error.message, detail: error.stack } : { summary: String(error) },
      context: {
        path: req.originalUrl,
        method: req.method,
      },
    });
    next(error);
  }
}
