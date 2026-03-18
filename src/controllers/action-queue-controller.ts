/**
 * ActionQueueController — 待办/异常聚合端点
 *
 * Iter-2 新增：
 * - GET /api/v1/action-queue
 *
 * CC 借鉴补齐：
 * - POST /api/v1/action-queue/:itemId/ack
 */

import type { Request, Response, NextFunction } from 'express';
import { getActionQueue, ackItem as ackItemService } from '../services/action-queue-service.js';
import { sendSuccess, sendError } from '../utils/responses.js';

export async function getActionQueueHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getActionQueue();
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/action-queue/:itemId/ack
 * 确认一条 action-queue 条目，支持自定义有效期（durationMinutes，默认60分钟）
 * 确认后该条目从待处理列表中消失，过期后自动重现
 */
export async function ackItem(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // READONLY_MODE 保护
    if (process.env.READONLY_MODE === 'true') {
      return sendError(res, 403, 'READONLY_MODE', 'Server is in read-only mode');
    }

    const itemId = req.params['itemId'] as string;
    const durationMinutes = Number(req.body?.durationMinutes ?? 60);

    if (!itemId) {
      return sendError(res, 400, 'MISSING_ITEM_ID', 'itemId is required');
    }

    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      return sendError(res, 400, 'INVALID_DURATION', 'durationMinutes must be a positive number');
    }

    const record = await ackItemService(itemId, durationMinutes);

    return sendSuccess(res, {
      acknowledged: true,
      expiresAt: record.expiresAt,
    });
  } catch (error) {
    next(error);
  }
}
