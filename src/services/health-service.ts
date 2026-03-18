import { openclawCliAdapter } from '../adapters/openclaw-cli-adapter.js';
import type { HealthPayload } from '../types/domain.js';

export class HealthService {
  async getHealth(): Promise<HealthPayload> {
    const gateway = await openclawCliAdapter.healthCheck();
    return {
      service: { status: 'ok' },
      gateway: { status: gateway.ok ? 'ok' : 'degraded' },
      checkedAt: new Date().toISOString(),
    };
  }
}

export const healthService = new HealthService();
