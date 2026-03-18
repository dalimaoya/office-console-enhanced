import type { Request, Response, NextFunction } from 'express';
import { cachedResourceService } from '../services/cached-resource-service.js';
import { configApplyService } from '../services/config-apply-service.js';
import { templateService } from '../services/template-service.js';
import { sendSuccess } from '../utils/responses.js';
import { DryRunRequiredError } from '../utils/security-errors.js';
import { auditService } from '../services/audit-service.js';

export async function getTemplates(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await cachedResourceService.getWithFallback('templates.list', async () => {
      const items = templateService.listTemplates();
      return { items, total: items.length };
    });
    return sendSuccess(res, result.data, { cached: result.cached, stale: result.stale, warning: result.warning });
  } catch (error) {
    next(error);
  }
}

export async function getTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const templateId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const template = templateService.getTemplate(templateId);
    return sendSuccess(res, template);
  } catch (error) {
    next(error);
  }
}

export async function applyTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const templateId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const targetAgentId = req.body?.targetAgentId ?? '';
    const isDryRun = req.dryRun ?? true; // 从 writeGate 中间件获取
    
    // 如果是 dry-run 模式，返回预演结果
    if (isDryRun) {
      const previewResult = await configApplyService.getTemplateApplyPreview(templateId, targetAgentId);
      const auditData = {
        templateId,
        targetAgentId,
        previewResult,
        actualApplied: false,
        dryRun: true,
      };
      
      // 如果是 dry-run 但客户端想要实际执行，需要显式确认
      if (req.body?.dryRun === false) {
        throw new DryRunRequiredError();
      }
      
      return sendSuccess(res, {
        ...previewResult,
        dryRun: true,
        message: '这是预演模式（dry-run）结果，没有实际执行。如需实际应用，请在请求中设置 dryRun=false 参数',
        note: 'dry-run 默认开启以保护系统安全。当您确定要应用更改时，请重新发送请求并设置 dryRun=false',
      });
    }
    
    // 实际应用模板
    const result = await configApplyService.applyTemplate(templateId, targetAgentId);
    const auditData = {
      templateId,
      targetAgentId,
      result,
      actualApplied: true,
      dryRun: false,
    };
    
    return sendSuccess(res, {
      ...result,
      dryRun: false,
      message: '模板已成功应用（实际执行模式）',
    });
  } catch (error) {
    next(error);
  }
}
