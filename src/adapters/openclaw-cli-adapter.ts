import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { env } from '../config/env.js';
import { AppError, GatewayTimeoutError, GatewayUnavailableError } from '../utils/errors.js';
import { log } from '../utils/logger.js';

const execFileAsync = promisify(execFile);

function normalizeStdout(stdout: string) {
  return stdout.replace(/^Gateway call:[^\n]*\n/, '').trim();
}

function extractJsonLikeSegment(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const firstBrace = Math.min(
    ...[trimmed.indexOf('{'), trimmed.indexOf('[')].filter((index) => index >= 0),
  );
  if (!Number.isFinite(firstBrace)) return null;
  return trimmed.slice(firstBrace);
}

function mapValidateDetail(raw: string) {
  const segment = extractJsonLikeSegment(raw);
  if (!segment) return raw.trim() || 'config validate failed';

  try {
    const parsed = JSON.parse(segment) as any;
    if (Array.isArray(parsed?.errors) && parsed.errors.length > 0) {
      return parsed.errors.map((item: any) => {
        const path = item?.instancePath || item?.path || item?.field || item?.keywordLocation;
        const message = item?.message || item?.detail || JSON.stringify(item);
        return path ? `${path}: ${message}` : message;
      }).join(' | ');
    }
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item: any) => {
        const path = item?.instancePath || item?.path || item?.field;
        const message = item?.message || item?.detail || JSON.stringify(item);
        return path ? `${path}: ${message}` : message;
      }).join(' | ');
    }
    if (typeof parsed?.message === 'string') return parsed.message;
    if (typeof parsed?.error === 'string') return parsed.error;
    if (parsed?.valid === false) return JSON.stringify(parsed);
  } catch {
    return raw.trim() || 'config validate failed';
  }

  return raw.trim() || 'config validate failed';
}

function mapCliFailureDetail(error: unknown) {
  if (!error || typeof error !== 'object') {
    return String(error);
  }
  const payload = error as { stdout?: string; stderr?: string; message?: string };
  return [payload.stdout, payload.stderr, payload.message].filter(Boolean).join('\n').trim() || 'openclaw CLI command failed';
}

export class OpenClawCliAdapter {
  async gatewayCall<T>(method: string, params: Record<string, unknown> = {}) {
    if (env.mockGatewayMode === 'offline') {
      throw new GatewayUnavailableError();
    }
    try {
      const { stdout } = await execFileAsync('openclaw', [
        'gateway', 'call', method, '--json', '--params', JSON.stringify(params), '--timeout', String(env.commandTimeoutMs),
      ], { timeout: env.commandTimeoutMs, maxBuffer: 10 * 1024 * 1024 });
      return JSON.parse(normalizeStdout(stdout)) as T;
    } catch (error) {
      return this.mapExecError(error, method);
    }
  }

  async configGet<T>(configPath: string) {
    try {
      const { stdout } = await execFileAsync('openclaw', ['config', 'get', configPath, '--json'], {
        timeout: env.commandTimeoutMs,
        maxBuffer: 10 * 1024 * 1024,
      });
      return JSON.parse(stdout.trim()) as T;
    } catch (error) {
      const detail = mapCliFailureDetail(error);
      log('error', 'openclaw_config_get_failed', { configPath, detail });
      throw new AppError('TEMPLATE_APPLY_FAILED', 500, 'Template apply failed', `config get ${configPath} failed: ${detail}`);
    }
  }

  async configSet(configPath: string, value: unknown) {
    try {
      await execFileAsync('openclaw', ['config', 'set', configPath, JSON.stringify(value), '--strict-json'], {
        timeout: env.commandTimeoutMs,
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch (error) {
      const detail = mapCliFailureDetail(error);
      log('error', 'openclaw_config_set_failed', { configPath, detail });
      throw new AppError('TEMPLATE_APPLY_FAILED', 500, 'Template apply failed', `config set ${configPath} failed: ${detail}`);
    }
  }

  async configValidate() {
    try {
      const { stdout } = await execFileAsync('openclaw', ['config', 'validate', '--json'], {
        timeout: env.commandTimeoutMs,
        maxBuffer: 10 * 1024 * 1024,
      });
      const parsed = JSON.parse(stdout.trim()) as { valid?: boolean; errors?: unknown[]; message?: string };
      if (parsed?.valid === false) {
        throw new AppError('TEMPLATE_APPLY_FAILED', 500, 'Template apply failed', mapValidateDetail(stdout));
      }
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      const stdout = typeof error?.stdout === 'string' ? error.stdout : '';
      const stderr = typeof error?.stderr === 'string' ? error.stderr : '';
      const detail = mapValidateDetail([stdout, stderr, error instanceof Error ? error.message : String(error)].filter(Boolean).join('\n'));
      throw new AppError('TEMPLATE_APPLY_FAILED', 500, 'Template apply failed', detail);
    }
  }

  async healthCheck() {
    if (env.mockGatewayMode === 'offline') {
      throw new GatewayUnavailableError();
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.healthTimeoutMs);
    try {
      const response = await fetch(env.gatewayHealthUrl, { signal: controller.signal });
      if (!response.ok) {
        throw new GatewayUnavailableError(`Gateway health probe failed with ${response.status}`);
      }
      return response.json() as Promise<{ ok?: boolean }>;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new GatewayTimeoutError();
      }
      throw new GatewayUnavailableError(undefined, error instanceof Error ? error.message : String(error));
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapExecError(error: unknown, action: string): never {
    const detail = mapCliFailureDetail(error);
    if (detail.includes('timed out')) {
      throw new GatewayTimeoutError(undefined, `${action}: ${detail}`);
    }
    throw new GatewayUnavailableError(undefined, `${action}: ${detail}`);
  }
}

export const openclawCliAdapter = new OpenClawCliAdapter();
