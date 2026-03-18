/**
 * CronController — Cron 定时任务健康监控端点
 *
 * Iter-2 新增：
 * - GET /api/v1/cron
 */

import type { Request, Response, NextFunction } from 'express';
import { getCronStatus } from '../services/cron-service.js';
import { sendSuccess } from '../utils/responses.js';

export async function getCronHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await getCronStatus();
    // Merge note into response if present
    const responseData: Record<string, unknown> = { items: result.data };
    if (result.note) {
      responseData['note'] = result.note;
    }
    return sendSuccess(res, responseData);
  } catch (error) {
    next(error);
  }
}
