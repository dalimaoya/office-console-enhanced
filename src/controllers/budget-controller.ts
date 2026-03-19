import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/responses.js';
import { getBudgetPolicy, getBudgetStatus, updateBudgetPolicy } from '../services/budget-service.js';

export async function getBudgetPolicyHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const policy = await getBudgetPolicy();
    return res.json(policy);
  } catch (error) {
    next(error);
  }
}

export async function putBudgetPolicyHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body ?? {};
    const numericKeys = [
      'daily_warn_usd',
      'daily_over_usd',
      'context_pressure_warn',
      'context_pressure_over',
    ] as const;

    for (const key of numericKeys) {
      if (body[key] !== undefined) {
        const value = Number(body[key]);
        if (!Number.isFinite(value) || value < 0) {
          return sendError(res, 400, 'INVALID_POLICY', `${key} must be a non-negative number`);
        }
      }
    }

    const policy = await updateBudgetPolicy(body);
    return res.json(policy);
  } catch (error) {
    next(error);
  }
}

export async function getBudgetStatusHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const status = await getBudgetStatus();
    return res.json(status);
  } catch (error) {
    next(error);
  }
}
