import type { Request, Response, NextFunction } from 'express';
import { cachedResourceService } from '../services/cached-resource-service.js';
import { healthService } from '../services/health-service.js';
import { sendSuccess } from '../utils/responses.js';

export async function getHealth(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await cachedResourceService.getWithFallback('health', () => healthService.getHealth());
    return sendSuccess(res, result.data, { cached: result.cached, stale: result.stale, warning: result.warning });
  } catch (error) {
    next(error);
  }
}
