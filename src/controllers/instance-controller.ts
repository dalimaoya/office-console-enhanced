import type { NextFunction, Request, Response } from 'express';
import { projectInstanceService } from '../services/project-instance-service.js';
import { sendSuccess, sendError } from '../utils/responses.js';

export async function listInstances(_req: Request, res: Response, next: NextFunction) {
  try {
    const instances = await projectInstanceService.listInstances();
    return sendSuccess(res, { instances, total: instances.length });
  } catch (error) {
    next(error);
  }
}

export async function createInstance(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, templateId } = req.body as { name?: string; templateId?: string };
    if (!name || typeof name !== 'string') {
      return sendError(res, 400, 'MISSING_PARAM', 'name is required');
    }
    const tplId = typeof templateId === 'string' ? templateId : undefined;
    const instance = await projectInstanceService.createInstance(name, tplId);
    return sendSuccess(res, instance);
  } catch (error) {
    next(error);
  }
}

export async function archiveInstance(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string | undefined;
    if (!id) {
      return sendError(res, 400, 'MISSING_PARAM', 'instance id is required');
    }
    const ok = await projectInstanceService.archiveInstance(id);
    if (!ok) {
      return sendError(res, 404, 'NOT_FOUND', `Instance ${id} not found`);
    }
    return sendSuccess(res, { instanceId: id, status: 'archived' });
  } catch (error) {
    next(error);
  }
}
