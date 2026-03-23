import type { NextFunction, Request, Response } from 'express';
import { projectInstanceService, type ProjectInstance } from '../services/project-instance-service.js';
import { appendTimelineEvent } from '../services/timeline-service.js';
import { sendSuccess, sendError } from '../utils/responses.js';

function withLegacyInstanceAliases(instance: ProjectInstance | { instanceId: string; status: string }) {
  return {
    ...instance,
    id: instance.instanceId,
  };
}

export async function listInstances(_req: Request, res: Response, next: NextFunction) {
  try {
    const instances = (await projectInstanceService.listInstances()).map(withLegacyInstanceAliases);
    return sendSuccess(res, {
      instances,
      items: instances,
      total: instances.length,
    });
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
    const instance = withLegacyInstanceAliases(await projectInstanceService.createInstance(name, tplId));
    await appendTimelineEvent({
      type: 'project_instance_created',
      summary: `项目实例已创建：${name}`,
      data: instance,
    });
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
    const payload = withLegacyInstanceAliases({ instanceId: id, status: 'archived' });
    await appendTimelineEvent({
      type: 'project_instance_archived',
      summary: `项目实例已归档：${id}`,
      data: payload,
    });
    return sendSuccess(res, payload);
  } catch (error) {
    next(error);
  }
}
