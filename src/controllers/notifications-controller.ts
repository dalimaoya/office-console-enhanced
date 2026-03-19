import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/responses.js';
import {
  acknowledgeNotification,
  createNotification,
  listNotifications,
  snoozeNotification,
  type NotificationStatus,
  type NotificationType,
} from '../services/persistent-notifications-service.js';

const VALID_STATUS: NotificationStatus[] = ['unread', 'read', 'snoozed'];
const VALID_TYPES: NotificationType[] = ['info', 'warn', 'error', 'success'];

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    if (status && !VALID_STATUS.includes(status as NotificationStatus)) {
      return sendError(res, 400, 'INVALID_STATUS', 'status must be unread/read/snoozed');
    }
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 200);
    const result = await listNotifications({ status: status as NotificationStatus | undefined, limit });
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function ackNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const ok = await acknowledgeNotification(String(req.params.id));
    if (!ok) {
      return sendError(res, 404, 'NOT_FOUND', 'notification not found');
    }
    return res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export async function snoozeNotificationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const minutes = Number(req.body?.minutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return sendError(res, 400, 'INVALID_MINUTES', 'minutes must be a positive number');
    }
    const snoozed_until = await snoozeNotification(String(req.params.id), minutes);
    if (!snoozed_until) {
      return sendError(res, 404, 'NOT_FOUND', 'notification not found');
    }
    return res.json({ ok: true, snoozed_until });
  } catch (error) {
    next(error);
  }
}

export async function createNotificationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, title, body, source } = req.body ?? {};
    if (!VALID_TYPES.includes(type)) {
      return sendError(res, 400, 'INVALID_TYPE', 'type must be info/warn/error/success');
    }
    if (![title, body, source].every((value) => typeof value === 'string' && value.trim())) {
      return sendError(res, 400, 'INVALID_BODY', 'type/title/body/source are required');
    }
    const id = await createNotification({
      type,
      title: title.trim(),
      body: body.trim(),
      source: source.trim(),
    });
    return res.json({ ok: true, id });
  } catch (error) {
    next(error);
  }
}
