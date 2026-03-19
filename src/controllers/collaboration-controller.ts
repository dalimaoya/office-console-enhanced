/**
 * CollaborationController — 会话/Subagent 协作关系 API
 *
 * Iter-3 重构：接入 CollaborationService（GatewayWsClient + 文件降级）
 * - getCollaboration: 返回历史 subagent runs（保留旧逻辑，兼容前端）
 * - getSessions: 新增，返回 session 列表（双源）
 * - getSession: 新增，返回 session 详情
 * - getMessages: 新增，返回 session 消息列表
 */

import type { Request, Response, NextFunction } from 'express';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sendSuccess } from '../utils/responses.js';
import { listSessions, getSession, getSessionMessages, getCollaborationGraph } from '../services/collaboration-service.js';

const OPENCLAW_ROOT = '/root/.openclaw';
const RUNS_FILE = join(OPENCLAW_ROOT, 'subagents', 'runs.json');

interface LegacySessionItem {
  sessionKey: string;
  agentId: string;
  type: string;
  status: string;
  startedAt: string;
  parentSessionKey?: string;
}

function extractAgentId(sessionKey: string): string {
  const parts = sessionKey.split(':');
  if (parts.length >= 2) return parts[1];
  return sessionKey;
}

function extractType(sessionKey: string): string {
  const parts = sessionKey.split(':');
  if (parts.length >= 3) return parts[2];
  return 'unknown';
}

function inferStatus(run: any): string {
  if (run.endedAt) {
    return run.outcome?.status === 'ok' ? 'completed' : 'failed';
  }
  if (run.startedAt) return 'running';
  return 'pending';
}

/** GET /api/v1/collaboration — 兼容旧端点：subagent runs 列表 */
export async function getCollaboration(req: Request, res: Response, next: NextFunction) {
  try {
    let runsData: any;
    try {
      const raw = await readFile(RUNS_FILE, 'utf-8');
      runsData = JSON.parse(raw);
    } catch {
      return sendSuccess(res, { data: [], note: 'session data not accessible' });
    }

    const runs = runsData.runs || {};
    const items: LegacySessionItem[] = [];

    for (const run of Object.values(runs) as any[]) {
      const sessionKey = run.childSessionKey || run.runId;
      const agentId = run.childSessionKey ? extractAgentId(run.childSessionKey) : 'unknown';
      const type = run.childSessionKey ? extractType(run.childSessionKey) : 'run';

      items.push({
        sessionKey,
        agentId,
        type,
        status: inferStatus(run),
        startedAt: run.startedAt ? new Date(run.startedAt).toISOString() : new Date(run.createdAt).toISOString(),
        ...(run.controllerSessionKey ? { parentSessionKey: run.controllerSessionKey } : {}),
      });
    }

    items.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    return sendSuccess(res, items);
  } catch (error) {
    next(error);
  }
}

/** GET /api/v1/collaboration/graph — 协作流向图（nodes + edges） */
export async function getCollaborationGraphHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const graph = await getCollaborationGraph();
    return res.json({
      success: true,
      data: {
        nodes: graph.nodes,
        edges: graph.edges,
      },
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      source: graph.source,
    });
  } catch (error) {
    next(error);
  }
}

/** GET /api/v1/sessions — session 列表（Gateway 优先，文件降级） */
export async function getSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await listSessions();
    return res.json({
      success: true,
      data: result.data,
      total: result.data.length,
      source: result.source,
    });
  } catch (error) {
    next(error);
  }
}

/** GET /api/v1/sessions/:id — session 详情 */
export async function getSessionById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await getSession(id);

    if (!result.data) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: `Session not found: ${id}` },
        source: result.source,
      });
    }

    return res.json({
      success: true,
      data: result.data,
      source: result.source,
    });
  } catch (error) {
    next(error);
  }
}

/** GET /api/v1/sessions/:id/messages — session 消息列表（支持 ?limit=N） */
export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const limitParam = Number(req.query.limit) || 20;
    const limit = Math.min(Math.max(1, limitParam), 100); // clamp 1~100

    const result = await getSessionMessages(id, limit);

    return res.json({
      success: true,
      sessionId: id,
      messages: result.messages,
      total: result.total,
      limit,
      source: result.source,
    });
  } catch (error) {
    next(error);
  }
}
