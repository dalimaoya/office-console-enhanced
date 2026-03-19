import type { NextFunction, Request, Response } from 'express';
import { stateMachineService } from '../services/state-machine-service.js';
import { sendSuccess, sendError } from '../utils/responses.js';

/**
 * GET /api/v1/projects/status
 * Returns current project stage and metadata.
 */
export async function getProjectStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = typeof req.query.projectId === 'string'
      ? req.query.projectId
      : undefined;

    const status = await stateMachineService.getCurrentStage(projectId);
    return sendSuccess(res, status);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/projects/transition
 * Trigger a stage transition.
 * Body: { nextStage: string, reason: string, actor?: string }
 */
export async function postProjectTransition(req: Request, res: Response, next: NextFunction) {
  try {
    const { nextStage, reason, actor } = req.body as {
      nextStage?: string;
      reason?: string;
      actor?: string;
    };

    if (!nextStage || typeof nextStage !== 'string') {
      return sendError(res, 400, 'MISSING_PARAM', 'nextStage is required');
    }
    if (!reason || typeof reason !== 'string') {
      return sendError(res, 400, 'MISSING_PARAM', 'reason is required');
    }

    const projectId = typeof req.query.projectId === 'string'
      ? req.query.projectId
      : undefined;

    const result = await stateMachineService.transitionStage(
      projectId,
      nextStage,
      reason,
      actor ?? 'api-caller',
    );

    if (!result.success) {
      return sendError(res, 400, result.code, result.error, 
        'allowedTargets' in result && result.allowedTargets
          ? `Allowed targets: ${result.allowedTargets.join(', ')}`
          : undefined,
      );
    }

    return sendSuccess(res, {
      projectId: result.state.projectId,
      currentStage: result.state.currentStage,
      previousStage: result.state.previousStage,
      blockReason: result.state.blockReason,
      lastTransition: result.state.lastTransition,
    });
  } catch (error) {
    next(error);
  }
}
