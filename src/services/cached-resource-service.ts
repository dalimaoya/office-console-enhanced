import { memoryCache } from '../cache/memory-cache.js';
import { env } from '../config/env.js';
import type { CacheNamespace } from '../types/domain.js';
import { AppError, GatewayTimeoutError, GatewayUnavailableError } from '../utils/errors.js';
import { log } from '../utils/logger.js';

export class CachedResourceService {
  async getWithFallback<T>(key: CacheNamespace, loader: () => Promise<T>) {
    const now = Date.now();
    const cached = memoryCache.get<T>(key);
    if (cached && cached.expiresAt > now) {
      log('info', 'cache_hit', {
        resource: key,
        ageMs: now - cached.fetchedAt,
        expiresInMs: cached.expiresAt - now,
      });
      return { data: cached.value, cached: true, stale: false };
    }

    try {
      const fresh = await loader();
      memoryCache.set(key, {
        value: fresh,
        fetchedAt: now,
        expiresAt: now + env.cacheTtlMs[key],
        staleUntil: now + env.staleTtlMs[key],
      });
      log('info', 'cache_refresh_success', {
        resource: key,
        cacheTtlMs: env.cacheTtlMs[key],
        staleTtlMs: env.staleTtlMs[key],
        hadCachedSnapshot: Boolean(cached),
      });
      return { data: fresh, cached: false, stale: false };
    } catch (error) {
      if ((error instanceof GatewayUnavailableError || error instanceof GatewayTimeoutError) && cached && cached.staleUntil > now) {
        log('warn', 'cache_stale_fallback', {
          resource: key,
          errorCode: error.code,
          detail: error.detail,
          staleRemainingMs: cached.staleUntil - now,
        });
        return {
          data: cached.value,
          cached: true,
          stale: true,
          warning: { type: 'gateway_unreachable', message: '使用最近一次缓存数据，Gateway 当前不可用' },
        };
      }
      log(error instanceof GatewayUnavailableError || error instanceof GatewayTimeoutError ? 'warn' : 'error', 'cache_refresh_failed', {
        resource: key,
        hasCachedSnapshot: Boolean(cached),
        errorCode: error instanceof AppError ? error.code : undefined,
        detail: error instanceof AppError ? error.detail : undefined,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

export const cachedResourceService = new CachedResourceService();
