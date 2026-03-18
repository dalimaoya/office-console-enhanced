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
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { getActionQueue } from '../services/action-queue-service.js';
import { sendSuccess, sendError } from '../utils/responses.js';

const ACK_FILE = '/root/.openclaw/workspace/projects/office-console-enhanced/data/action-queue-acks.json';
const ACK_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7天

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
 * 确认一条 action-queue 条目，7天内不重复提示
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
    const { note } = req.body ?? {};

    if (!itemId) {
      return sendError(res, 400, 'MISSING_ITEM_ID', 'itemId is required');
    }

    // 读取现有 acks
    let acks: Record<string, { acknowledged: boolean; ackedAt: string; note?: string; ackExpiresAt: string }> = {};
    if (existsSync(ACK_FILE)) {
      const raw = await readFile(ACK_FILE, 'utf-8');
      acks = JSON.parse(raw);
    } else {
      await mkdir(dirname(ACK_FILE), { recursive: true });
    }

    const now = new Date();
    const ackedAt = now.toISOString();
    const ackExpiresAt = new Date(now.getTime() + ACK_TTL_MS).toISOString();

    acks[itemId] = {
      acknowledged: true,
      ackedAt,
      ...(note ? { note } : {}),
      ackExpiresAt,
    };

    await writeFile(ACK_FILE, JSON.stringify(acks, null, 2), 'utf-8');

    return sendSuccess(res, {
      itemId,
      acknowledged: true,
      ackedAt,
      note: note ?? null,
      ackExpiresAt,
    });
  } catch (error) {
    next(error);
  }
}
