import type { NextFunction, Request, Response } from 'express';
import { diagnosticService } from '../services/diagnostic-service.js';
import { appendTimelineEvent } from '../services/timeline-service.js';
import { sendSuccess } from '../utils/responses.js';

export async function getDiagnostic(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await diagnosticService.run();
    await appendTimelineEvent({
      type: 'diagnostic_run',
      summary: `环境诊断完成：${result.summary}`,
      data: { ok: result.ok, checks: result.checks },
    });
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
