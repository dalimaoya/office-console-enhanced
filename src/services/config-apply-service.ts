import { openclawCliAdapter } from '../adapters/openclaw-cli-adapter.js';
import { env } from '../config/env.js';
import type { TemplateApplyPayload, TemplateApplyPreview } from '../types/domain.js';
import { AppError } from '../utils/errors.js';
import { log } from '../utils/logger.js';
import { templateService } from './template-service.js';

const ALLOWED_FIELDS = ['model', 'skills', 'identity'] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

function normalizeInput(value: string) {
  return value.trim();
}

export class ConfigApplyService {
  /**
   * 获取模板应用预演结果（dry-run 模式）
   */
  async getTemplateApplyPreview(templateId: string, targetAgentId: string): Promise<TemplateApplyPreview> {
    const normalizedTemplateId = normalizeInput(templateId);
    const normalizedTargetAgentId = normalizeInput(targetAgentId);

    if (!normalizedTemplateId) {
      throw new AppError('BAD_REQUEST', 400, 'templateId is required');
    }
    if (!normalizedTargetAgentId) {
      throw new AppError('BAD_REQUEST', 400, 'targetAgentId is required');
    }

    const template = templateService.getTemplate(normalizedTemplateId);
    const agentsList = await openclawCliAdapter.configGet<any[]>('agents.list');
    if (!Array.isArray(agentsList)) {
      throw new AppError('TEMPLATE_APPLY_FAILED', 500, 'Template apply failed', 'openclaw config get agents.list did not return an array');
    }

    const targetIndex = agentsList.findIndex((item) => item?.id === normalizedTargetAgentId);
    if (targetIndex === -1) {
      throw new AppError('AGENT_NOT_FOUND', 404, 'Target agent not found', `targetAgentId=${normalizedTargetAgentId}`);
    }

    const configKeys = Object.keys(template.config);
    const invalidKeys = configKeys.filter((key) => !ALLOWED_FIELDS.includes(key as AllowedField));
    if (invalidKeys.length > 0) {
      throw new AppError('TEMPLATE_INVALID', 422, 'Template YAML is invalid', `non-whitelisted config fields: ${invalidKeys.join(', ')}`);
    }

    if (configKeys.length === 0) {
      throw new AppError('TEMPLATE_INVALID', 422, 'Template YAML is invalid', 'config must include at least one allowed field');
    }

    const currentAgent = agentsList[targetIndex];
    if (!currentAgent || typeof currentAgent !== 'object') {
      throw new AppError('TEMPLATE_APPLY_FAILED', 500, 'Template apply failed', `target agent config at index ${targetIndex} is invalid`);
    }

    const appliedFields = configKeys.filter((key) => key in template.config);
    const changes: Record<string, { from: any; to: any }> = {};
    for (const field of appliedFields) {
      const from = currentAgent[field];
      const to = template.config[field];
      if (JSON.stringify(from) !== JSON.stringify(to)) {
        changes[field] = { from, to };
      }
    }

    // 预演结果，不会实际执行
    log('info', 'config_apply_preview', {
      templateId: normalizedTemplateId,
      targetAgentId: normalizedTargetAgentId,
      targetIndex,
      appliedFields,
      changes: Object.keys(changes),
      mockMode: Boolean(env.mockConfigApplyFailure),
    });

    return {
      templateId: normalizedTemplateId,
      targetAgentId: normalizedTargetAgentId,
      previewAt: new Date().toISOString(),
      changes,
      appliedFields,
      willBeApplied: Object.keys(changes).length > 0,
      validationPassed: true,
      dryRun: true,
    };
  }

  /**
   * 实际应用模板（执行模式）
   */
  async applyTemplate(templateId: string, targetAgentId: string): Promise<TemplateApplyPayload> {
    const normalizedTemplateId = normalizeInput(templateId);
    const normalizedTargetAgentId = normalizeInput(targetAgentId);

    if (!normalizedTemplateId) {
      throw new AppError('BAD_REQUEST', 400, 'templateId is required');
    }
    if (!normalizedTargetAgentId) {
      throw new AppError('BAD_REQUEST', 400, 'targetAgentId is required');
    }

    log('info', 'config_apply_started', {
      templateId: normalizedTemplateId,
      targetAgentId: normalizedTargetAgentId,
      mockMode: Boolean(env.mockConfigApplyFailure),
      executionMode: 'actual',
    });

    const template = templateService.getTemplate(normalizedTemplateId);
    const agentsList = await openclawCliAdapter.configGet<any[]>('agents.list');
    if (!Array.isArray(agentsList)) {
      throw new AppError('TEMPLATE_APPLY_FAILED', 500, 'Template apply failed', 'openclaw config get agents.list did not return an array');
    }

    const targetIndex = agentsList.findIndex((item) => item?.id === normalizedTargetAgentId);
    if (targetIndex === -1) {
      throw new AppError('AGENT_NOT_FOUND', 404, 'Target agent not found', `targetAgentId=${normalizedTargetAgentId}`);
    }

    const configKeys = Object.keys(template.config);
    const invalidKeys = configKeys.filter((key) => !ALLOWED_FIELDS.includes(key as AllowedField));
    if (invalidKeys.length > 0) {
      throw new AppError('TEMPLATE_INVALID', 422, 'Template YAML is invalid', `non-whitelisted config fields: ${invalidKeys.join(', ')}`);
    }

    if (configKeys.length === 0) {
      throw new AppError('TEMPLATE_INVALID', 422, 'Template YAML is invalid', 'config must include at least one allowed field');
    }

    if (env.mockConfigApplyFailure) {
      throw new AppError('TEMPLATE_APPLY_FAILED', 500, 'Template apply failed', `mock apply failure: ${env.mockConfigApplyFailure}`);
    }

    const currentAgent = agentsList[targetIndex];
    if (!currentAgent || typeof currentAgent !== 'object') {
      throw new AppError('TEMPLATE_APPLY_FAILED', 500, 'Template apply failed', `target agent config at index ${targetIndex} is invalid`);
    }

    const appliedFields = configKeys.filter((key) => key in template.config);
    const mergedAgent = { ...currentAgent } as Record<string, unknown>;
    for (const field of appliedFields) {
      mergedAgent[field] = template.config[field];
    }

    try {
      await openclawCliAdapter.configSet(`agents.list[${targetIndex}]`, mergedAgent);
      await openclawCliAdapter.configValidate();
      log('info', 'config_apply_succeeded', {
        templateId: normalizedTemplateId,
        targetAgentId: normalizedTargetAgentId,
        targetIndex,
        appliedFields,
        executionMode: 'actual',
      });
    } catch (error) {
      log('error', 'config_apply_failed', {
        templateId: normalizedTemplateId,
        targetAgentId: normalizedTargetAgentId,
        targetIndex,
        appliedFields,
        executionMode: 'actual',
        detail: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof AppError) throw error;
      throw new AppError('TEMPLATE_APPLY_FAILED', 500, 'Template apply failed', error instanceof Error ? error.message : String(error));
    }

    return {
      templateId: normalizedTemplateId,
      targetAgentId: normalizedTargetAgentId,
      appliedAt: new Date().toISOString(),
      message: 'Template applied successfully',
      appliedFields,
      effectiveScope: 'agent_config',
      runtimeEffect: 'validated_config_updated',
    };
  }
}

export const configApplyService = new ConfigApplyService();
