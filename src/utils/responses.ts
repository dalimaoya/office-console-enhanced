import type { Response } from 'express';
import type { WarningPayload } from '../types/api.js';

function setResponseMeta(res: Response, meta: {
  cacheStatus?: 'hit' | 'miss' | 'stale';
  warningType?: string;
  errorCode?: string;
  detail?: string;
}) {
  // Ensure responseMeta exists
  if (!res.locals.responseMeta) {
    res.locals.responseMeta = {};
  }
  
  // Only set defined values
  if (meta.cacheStatus !== undefined) {
    res.locals.responseMeta.cacheStatus = meta.cacheStatus;
  }
  if (meta.warningType !== undefined) {
    res.locals.responseMeta.warningType = meta.warningType;
  }
  if (meta.errorCode !== undefined) {
    res.locals.responseMeta.errorCode = meta.errorCode;
  }
  if (meta.detail !== undefined) {
    res.locals.responseMeta.detail = meta.detail;
  }
}

export function sendSuccess<T>(res: Response, data: T, extras?: { cached?: boolean; stale?: boolean; warning?: WarningPayload }) {
  const cacheStatus = typeof extras?.cached === 'boolean'
    ? (extras.stale ? 'stale' : (extras.cached ? 'hit' : 'miss'))
    : undefined;

  if (cacheStatus) {
    res.setHeader('X-Cache-Status', cacheStatus);
  }
  if (extras?.warning?.type) {
    res.setHeader('X-Warning-Type', extras.warning.type);
  }

  setResponseMeta(res, {
    cacheStatus,
    warningType: extras?.warning?.type,
    detail: extras?.warning?.message,
  });

  return res.json({ success: true, data, ...(extras ?? {}) });
}

export function sendError(res: Response, statusCode: number, code: string, message: string, detail?: string) {
  res.setHeader('X-Error-Code', code);
  setResponseMeta(res, { errorCode: code, detail });
  return res.status(statusCode).json({
    success: false,
    error: { code, message, ...(detail ? { detail } : {}) },
  });
}
