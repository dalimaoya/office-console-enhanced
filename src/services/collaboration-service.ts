/**
 * CollaborationService — Session 数据双源聚合
 *
 * Iter-3 重构：
 * - 优先通过 GatewayWsClient 获取真实 session 数据
 * - Gateway 不可用时降级读取文件系统 ~/.openclaw/agents/*\/sessions/
 * - 降级响应追加 "source": "file-fallback"
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { getGatewayWsClient } from '../data/gateway-ws-client.js';
import { log } from '../utils/logger.js';

const OPENCLAW_ROOT = '/root/.openclaw';
const AGENTS_DIR = join(OPENCLAW_ROOT, 'agents');

export interface SessionItem {
  id: string;
  agentId: string;
  channel: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  startedAt: string;
  messageCount: number;
  parentSessionId?: string;
  source?: 'gateway' | 'file-fallback';
}

export interface SessionDetail extends SessionItem {
  endedAt?: string;
  model?: string;
  lastMessageAt?: string;
  messageSummary?: string;
}

export interface SessionMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp?: string;
  tokens?: number;
}

export interface SessionMessagesResult {
  sessionId: string;
  messages: SessionMessage[];
  total: number;
  source: 'gateway' | 'file-fallback';
}

// ─── Gateway 数据源 ─────────────────────────────────────────────────────────

async function fetchSessionsFromGateway(): Promise<SessionItem[] | null> {
  const client = getGatewayWsClient();
  if (!client || !client.isConnected) return null;

  try {
    const result = await client.call<{ sessions?: any[]; items?: any[] }>('sessions_list', {}, 8000);
    const raw = result?.sessions ?? result?.items ?? (Array.isArray(result) ? result : []);

    return raw.map((s: any) => ({
      id: s.id ?? s.sessionId ?? s.sessionKey ?? String(s),
      agentId: s.agentId ?? s.agent_id ?? extractAgentFromKey(s.id ?? ''),
      channel: s.channel ?? 'unknown',
      status: normalizeStatus(s.status),
      startedAt: s.startedAt ?? s.created_at ?? new Date().toISOString(),
      messageCount: s.messageCount ?? s.message_count ?? 0,
      ...(s.parentSessionId || s.parent_session_id
        ? { parentSessionId: s.parentSessionId ?? s.parent_session_id }
        : {}),
      source: 'gateway' as const,
    }));
  } catch (err) {
    log('warn', 'sessions_gateway_fetch_failed', { err: String(err) });
    return null;
  }
}

async function fetchSessionDetailFromGateway(sessionId: string): Promise<SessionDetail | null> {
  const client = getGatewayWsClient();
  if (!client || !client.isConnected) return null;

  try {
    const result = await client.call<any>('sessions_list', {}, 8000);
    const raw = result?.sessions ?? result?.items ?? (Array.isArray(result) ? result : []);
    const s = raw.find((x: any) => (x.id ?? x.sessionId ?? x.sessionKey) === sessionId);
    if (!s) return null;

    return {
      id: s.id ?? s.sessionId ?? s.sessionKey,
      agentId: s.agentId ?? extractAgentFromKey(s.id ?? ''),
      channel: s.channel ?? 'unknown',
      status: normalizeStatus(s.status),
      startedAt: s.startedAt ?? new Date().toISOString(),
      messageCount: s.messageCount ?? 0,
      endedAt: s.endedAt ?? undefined,
      model: s.model ?? undefined,
      lastMessageAt: s.lastMessageAt ?? undefined,
      source: 'gateway',
    };
  } catch (err) {
    log('warn', 'session_detail_gateway_failed', { sessionId, err: String(err) });
    return null;
  }
}

async function fetchMessagesFromGateway(
  sessionId: string,
  limit: number
): Promise<SessionMessagesResult | null> {
  const client = getGatewayWsClient();
  if (!client || !client.isConnected) return null;

  try {
    const result = await client.call<any>(
      'sessions_history',
      { sessionId, limit },
      10000
    );

    const raw: any[] = result?.messages ?? result?.history ?? (Array.isArray(result) ? result : []);
    const messages: SessionMessage[] = raw.slice(0, limit).map((m: any) => ({
      role: m.role ?? 'assistant',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content ?? ''),
      timestamp: m.timestamp ?? m.created_at ?? undefined,
      tokens: m.tokens ?? m.usage?.totalTokens ?? undefined,
    }));

    return { sessionId, messages, total: raw.length, source: 'gateway' };
  } catch (err) {
    log('warn', 'session_messages_gateway_failed', { sessionId, err: String(err) });
    return null;
  }
}

// ─── 文件系统降级 ────────────────────────────────────────────────────────────

async function fetchSessionsFromFiles(): Promise<SessionItem[]> {
  const items: SessionItem[] = [];

  let agentDirs: string[] = [];
  try {
    agentDirs = await readdir(AGENTS_DIR);
  } catch {
    return items;
  }

  for (const agentId of agentDirs) {
    const sessionsDir = join(AGENTS_DIR, agentId, 'sessions');
    try {
      const files = await readdir(sessionsDir).catch(() => [] as string[]);
      const jsonlFiles = files.filter(
        (f) => f.endsWith('.jsonl') && !f.includes('.deleted') && !f.includes('.reset')
      );

      for (const file of jsonlFiles) {
        try {
          const fileStat = await stat(join(sessionsDir, file)).catch(() => null);
          if (!fileStat) continue;

          const sessionId = file.replace('.jsonl', '');
          const startedAt = new Date(fileStat.birthtimeMs).toISOString();
          const lastModified = new Date(fileStat.mtimeMs).toISOString();
          const isRecent = fileStat.mtimeMs > Date.now() - 60 * 60 * 1000; // within 1 hour

          // Estimate message count from file size
          const messageCount = Math.ceil(fileStat.size / 500);

          items.push({
            id: sessionId,
            agentId,
            channel: 'file',
            status: isRecent ? 'running' : 'completed',
            startedAt,
            messageCount,
            lastMessageAt: lastModified,
            source: 'file-fallback',
          } as SessionItem);
        } catch {
          // skip unreadable
        }
      }
    } catch {
      // skip agent dir
    }
  }

  items.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  return items;
}

async function fetchSessionDetailFromFiles(sessionId: string): Promise<SessionDetail | null> {
  let agentDirs: string[] = [];
  try {
    agentDirs = await readdir(AGENTS_DIR);
  } catch {
    return null;
  }

  for (const agentId of agentDirs) {
    const filePath = join(AGENTS_DIR, agentId, 'sessions', `${sessionId}.jsonl`);
    try {
      const fileStat = await stat(filePath).catch(() => null);
      if (!fileStat) continue;

      const isRecent = fileStat.mtimeMs > Date.now() - 60 * 60 * 1000;

      return {
        id: sessionId,
        agentId,
        channel: 'file',
        status: isRecent ? 'running' : 'completed',
        startedAt: new Date(fileStat.birthtimeMs).toISOString(),
        endedAt: isRecent ? undefined : new Date(fileStat.mtimeMs).toISOString(),
        messageCount: Math.ceil(fileStat.size / 500),
        source: 'file-fallback',
      };
    } catch {
      // continue searching
    }
  }

  return null;
}

async function fetchMessagesFromFiles(
  sessionId: string,
  limit: number
): Promise<SessionMessagesResult | null> {
  let agentDirs: string[] = [];
  try {
    agentDirs = await readdir(AGENTS_DIR);
  } catch {
    return null;
  }

  for (const agentId of agentDirs) {
    const filePath = join(AGENTS_DIR, agentId, 'sessions', `${sessionId}.jsonl`);
    try {
      const raw = await readFile(filePath, 'utf-8').catch(() => null);
      if (raw === null) continue;

      const lines = raw.split('\n').filter(Boolean);
      const messages: SessionMessage[] = [];

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.type === 'message' && entry.message) {
            const msg = entry.message;
            const role = msg.role ?? (entry.direction === 'in' ? 'user' : 'assistant');
            const content =
              typeof msg.content === 'string'
                ? msg.content
                : Array.isArray(msg.content)
                ? msg.content.map((c: any) => c.text ?? '').join('')
                : '';
            messages.push({
              role,
              content: content.slice(0, 2000), // cap content length
              timestamp: entry.timestamp ?? undefined,
              tokens: msg.usage?.totalTokens ?? undefined,
            });
          }
        } catch {
          // skip malformed
        }
      }

      const sliced = messages.slice(-limit);
      return { sessionId, messages: sliced, total: messages.length, source: 'file-fallback' };
    } catch {
      // continue
    }
  }

  return null;
}

// ─── 辅助函数 ────────────────────────────────────────────────────────────────

function extractAgentFromKey(key: string): string {
  // Format: agent:agent-backend-leona:subagent:xxx
  const parts = key.split(':');
  if (parts.length >= 2) return parts[1];
  return key;
}

function normalizeStatus(s: string): SessionItem['status'] {
  if (!s) return 'pending';
  s = s.toLowerCase();
  if (s === 'running' || s === 'active') return 'running';
  if (s === 'completed' || s === 'done' || s === 'success' || s === 'ok') return 'completed';
  if (s === 'failed' || s === 'error') return 'failed';
  return 'pending';
}

// ─── 公开 API ─────────────────────────────────────────────────────────────────

export async function listSessions(): Promise<{ data: SessionItem[]; source: string }> {
  const gwSessions = await fetchSessionsFromGateway();
  if (gwSessions !== null) {
    return { data: gwSessions, source: 'gateway' };
  }

  log('info', 'sessions_fallback_to_files', {});
  const fileSessions = await fetchSessionsFromFiles();
  return { data: fileSessions, source: 'file-fallback' };
}

export async function getSession(
  sessionId: string
): Promise<{ data: SessionDetail | null; source: string }> {
  const gwDetail = await fetchSessionDetailFromGateway(sessionId);
  if (gwDetail !== null) {
    return { data: gwDetail, source: 'gateway' };
  }

  const fileDetail = await fetchSessionDetailFromFiles(sessionId);
  return { data: fileDetail, source: 'file-fallback' };
}

export async function getSessionMessages(
  sessionId: string,
  limit: number
): Promise<SessionMessagesResult> {
  const gwMessages = await fetchMessagesFromGateway(sessionId, limit);
  if (gwMessages !== null) return gwMessages;

  const fileMessages = await fetchMessagesFromFiles(sessionId, limit);
  if (fileMessages !== null) return fileMessages;

  return { sessionId, messages: [], total: 0, source: 'file-fallback' };
}
