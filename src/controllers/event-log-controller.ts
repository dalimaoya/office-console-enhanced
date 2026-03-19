import type { NextFunction, Request, Response } from 'express';
import { eventLogService } from '../services/event-log-service.js';
import { sendSuccess } from '../utils/responses.js';

export async function getEventLog(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;
    const items = await eventLogService.readRecent({ limit, type, role });
    return sendSuccess(res, { items, total: items.length });
  } catch (error) {
    next(error);
  }
}
