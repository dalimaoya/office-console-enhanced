import type { NextFunction, Request, Response } from 'express';
import { diagnosticService } from '../services/diagnostic-service.js';

export async function getDiagnostic(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await diagnosticService.run();
    return res.json(result);
  } catch (error) {
    next(error);
  }
}
