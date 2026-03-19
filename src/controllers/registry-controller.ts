import type { NextFunction, Request, Response } from 'express';
import { registryService } from '../services/registry-service.js';
import { sendSuccess, sendError } from '../utils/responses.js';

export async function getRegistry(req: Request, res: Response, next: NextFunction) {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;

    const items = await registryService.query({ status, type, limit });
    return sendSuccess(res, { items, total: items.length });
  } catch (error) {
    next(error);
  }
}

export async function getRegistryById(req: Request, res: Response, next: NextFunction) {
  try {
    const object_id = req.params.object_id as string | undefined;
    if (!object_id) {
      return sendError(res, 400, 'MISSING_PARAM', 'object_id is required');
    }

    const entry = await registryService.getById(object_id);
    if (!entry) {
      return sendError(res, 404, 'NOT_FOUND', `Object ${object_id} not found`);
    }

    return sendSuccess(res, entry);
  } catch (error) {
    next(error);
  }
}
