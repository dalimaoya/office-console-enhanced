import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { env } from '../config/env.js';
import type { TemplateDefinition, TemplateMeta } from '../types/domain.js';
import { AppError } from '../utils/errors.js';

export class TemplateService {
  listTemplates(): TemplateMeta[] {
    return this.loadAllTemplates().map(({ rawYaml: _rawYaml, config: _config, ...meta }) => meta);
  }

  getTemplate(templateId: string): TemplateDefinition {
    const filePath = path.join(env.templatesDir, `${templateId}.yaml`);
    if (!fs.existsSync(filePath)) {
      throw new AppError('TEMPLATE_NOT_FOUND', 404, `Template '${templateId}' not found`);
    }

    const rawYaml = fs.readFileSync(filePath, 'utf8');
    let parsed: unknown;
    try {
      parsed = yaml.load(rawYaml);
    } catch (error) {
      throw new AppError('TEMPLATE_INVALID', 422, 'Template YAML is invalid', error instanceof Error ? error.message : String(error));
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new AppError('TEMPLATE_INVALID', 422, 'Template YAML is invalid');
    }

    const candidate = parsed as Record<string, unknown>;
    const required = ['id', 'name', 'description', 'version', 'category', 'config'];
    for (const field of required) {
      if (!(field in candidate)) {
        throw new AppError('TEMPLATE_INVALID', 422, `Template YAML is invalid`, `missing field: ${field}`);
      }
    }

    if (!candidate.config || typeof candidate.config !== 'object') {
      throw new AppError('TEMPLATE_INVALID', 422, 'Template YAML is invalid', 'config must be an object');
    }

    return {
      id: String(candidate.id),
      name: String(candidate.name),
      description: String(candidate.description),
      version: String(candidate.version),
      category: String(candidate.category),
      config: candidate.config as Record<string, unknown>,
      rawYaml,
    };
  }

  private loadAllTemplates() {
    const files = fs.readdirSync(env.templatesDir).filter((file) => file.endsWith('.yaml')).sort();
    return files.map((file) => this.getTemplate(path.basename(file, '.yaml')));
  }
}

export const templateService = new TemplateService();
