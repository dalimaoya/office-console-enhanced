/**
 * SearchController — 全站搜索 API
 *
 * GET /api/v1/search?q=<keyword>&type=<agent|task|session|all>
 */

import type { Request, Response, NextFunction } from 'express';
import { search } from '../services/search-service.js';
import { sendSuccess, sendError } from '../utils/responses.js';

export async function searchAll(req: Request, res: Response, next: NextFunction) {
  try {
    const q = String(req.query.q ?? '').trim();
    const type = String(req.query.type ?? 'all').trim();

    if (!q) {
      return sendError(res, 400, 'MISSING_KEYWORD', 'Query parameter "q" is required');
    }

    const validTypes = ['agent', 'task', 'session', 'all'];
    const searchType = validTypes.includes(type) ? type : 'all';

    const startMs = Date.now();
    const result = await search(q, searchType);
    const durationMs = Date.now() - startMs;

    return res.json({
      success: true,
      data: result,
      query: q,
      type: searchType,
      durationMs,
    });
  } catch (error) {
    next(error);
  }
}
