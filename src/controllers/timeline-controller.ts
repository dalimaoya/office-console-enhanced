import type { Request, Response, NextFunction } from 'express';
import { readTimelineEvents } from '../services/timeline-service.js';

export async function getTimeline(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const events = await readTimelineEvents(limit, type);
    return res.json({ events, total: events.length });
  } catch (error) {
    next(error);
  }
}
