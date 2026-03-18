import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger.js';

function getRequestId(req: Request) {
  const headerValue = req.header('x-request-id');
  return (headerValue && headerValue.trim()) || randomUUID();
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();
  const requestId = getRequestId(req);
  res.locals.requestId = requestId;
  res.locals.responseMeta = res.locals.responseMeta ?? {}; // Ensure responseMeta exists
  res.setHeader('X-Request-Id', requestId);

  log('info', 'http_request_started', {
    requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent') ?? 'unknown',
  });

  res.on('finish', () => {
    // Safely access responseMeta, ensuring it exists
    const responseMeta = res.locals.responseMeta ?? {};
    const cacheStatus = responseMeta.cacheStatus ?? res.getHeader('X-Cache-Status');
    const warningType = responseMeta.warningType ?? res.getHeader('X-Warning-Type');
    const errorCode = responseMeta.errorCode ?? res.getHeader('X-Error-Code');
    const detail = responseMeta.detail;
    
    log(res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info', 'http_request_completed', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      ...(cacheStatus !== undefined && { cacheStatus }),
      ...(warningType !== undefined && { warningType }),
      ...(errorCode !== undefined && { errorCode }),
      ...(detail !== undefined && { detail }),
    });
  });
  next();
}
