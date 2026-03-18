/**
 * SearchService — 全站搜索服务
 *
 * 支持搜索 agent / task / session 三种类型
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { getFileReader } from '../data/file-reader.js';
import { log } from '../utils/logger.js';

const OPENCLAW_ROOT = '/root/.openclaw';
const TASKS_DIR = '/root/.openclaw/workspace/projects/office-console-enhanced/tasks';

export interface SearchResultAgent {
  type: 'agent';
  id: string;
  name: string;
  model?: string;
  matchedField: string;
  snippet: string;
}

export interface SearchResultTask {
  type: 'task';
  id: string;
  title: string;
  status: string;
  owner: string;
  matchedField: string;
  snippet: string;
}

export interface SearchResultSession {
  type: 'session';
  id: string;
  agentId: string;
  channel: string;
  status: string;
  matchedField: string;
  snippet: string;
}

export type SearchResult = SearchResultAgent | SearchResultTask | SearchResultSession;

export interface SearchResponse {
  agents: SearchResultAgent[];
  tasks: SearchResultTask[];
  sessions: SearchResultSession[];
  total: number;
}

function containsKeyword(text: string, keyword: string): boolean {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

function extractSnippet(text: string, keyword: string, maxLen = 120): string {
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return text.slice(0, maxLen);
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + keyword.length + 40);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
}

async function searchAgents(keyword: string): Promise<SearchResultAgent[]> {
  const results: SearchResultAgent[] = [];
  try {
    const fileReader = getFileReader();
    const agentConfigs = await fileReader.listAgentConfigs();

    for (const agent of agentConfigs) {
      const id = agent.id ?? '';
      const name = agent.identity?.name ?? agent.name ?? agent.id ?? '';
      const model = agent.model?.primary ?? '';

      let matched = false;
      let matchedField = '';
      let snippet = '';

      if (containsKeyword(id, keyword)) {
        matched = true;
        matchedField = 'id';
        snippet = extractSnippet(id, keyword);
      } else if (containsKeyword(name, keyword)) {
        matched = true;
        matchedField = 'name';
        snippet = extractSnippet(name, keyword);
      } else if (model && containsKeyword(model, keyword)) {
        matched = true;
        matchedField = 'model';
        snippet = extractSnippet(model, keyword);
      } else {
        // Try SOUL.md / IDENTITY.md content
        for (const fname of ['SOUL.md', 'IDENTITY.md']) {
          const content = await fileReader.readWorkspaceFile(agent.id, fname).catch(() => null);
          if (content && containsKeyword(content, keyword)) {
            matched = true;
            matchedField = fname;
            snippet = extractSnippet(content, keyword);
            break;
          }
        }
      }

      if (matched) {
        results.push({ type: 'agent', id, name, model: model || undefined, matchedField, snippet });
        if (results.length >= 20) break;
      }
    }
  } catch (err) {
    log('warn', 'search_agents_error', { err: String(err) });
  }
  return results;
}

async function parseTaskFrontmatter(content: string): Promise<{ title: string; status: string; owner: string }> {
  const lines = content.split('\n');
  let title = '';
  let status = 'unknown';
  let owner = '';

  for (const line of lines) {
    if (!title && line.startsWith('# ')) {
      title = line.slice(2).trim();
    }
    const statusMatch = line.match(/^[-*]\s*(?:状态|status)[：:]\s*(.+)/i);
    if (statusMatch) status = statusMatch[1].trim();

    const ownerMatch = line.match(/^[-*]\s*(?:负责人|owner)[：:]\s*(.+)/i);
    if (ownerMatch) owner = ownerMatch[1].trim();
  }

  return { title: title || '(untitled)', status, owner };
}

async function searchTasks(keyword: string): Promise<SearchResultTask[]> {
  const results: SearchResultTask[] = [];
  try {
    const files = await readdir(TASKS_DIR).catch(() => [] as string[]);
    const mdFiles = files.filter((f) => f.endsWith('.md'));

    for (const file of mdFiles) {
      const filePath = join(TASKS_DIR, file);
      const content = await readFile(filePath, 'utf-8').catch(() => '');
      if (!containsKeyword(content, keyword)) continue;

      const { title, status, owner } = await parseTaskFrontmatter(content);
      const matchedField = containsKeyword(title, keyword)
        ? 'title'
        : containsKeyword(status, keyword)
        ? 'status'
        : containsKeyword(owner, keyword)
        ? 'owner'
        : 'body';
      const snippet = extractSnippet(content, keyword);

      results.push({
        type: 'task',
        id: file.replace('.md', ''),
        title,
        status,
        owner,
        matchedField,
        snippet,
      });

      if (results.length >= 20) break;
    }
  } catch (err) {
    log('warn', 'search_tasks_error', { err: String(err) });
  }
  return results;
}

async function searchSessions(keyword: string): Promise<SearchResultSession[]> {
  const results: SearchResultSession[] = [];
  try {
    const agentsDir = join(OPENCLAW_ROOT, 'agents');
    const agentDirs = await readdir(agentsDir).catch(() => [] as string[]);

    for (const agentId of agentDirs) {
      if (results.length >= 20) break;
      const sessionsDir = join(agentsDir, agentId, 'sessions');
      const files = await readdir(sessionsDir).catch(() => [] as string[]);
      const jsonlFiles = files.filter((f) => f.endsWith('.jsonl')).slice(0, 5); // limit per agent

      for (const file of jsonlFiles) {
        if (results.length >= 20) break;
        const content = await readFile(join(sessionsDir, file), 'utf-8').catch(() => '');
        if (!containsKeyword(content, keyword)) continue;

        // Try to parse first line for channel info
        const firstLine = content.split('\n')[0];
        let channel = 'unknown';
        let status = 'unknown';
        try {
          const parsed = JSON.parse(firstLine);
          channel = parsed.channel ?? parsed.source ?? 'unknown';
          status = parsed.status ?? 'active';
        } catch {}

        // Search in content
        const matchedField = containsKeyword(agentId, keyword)
          ? 'agentId'
          : containsKeyword(channel, keyword)
          ? 'channel'
          : 'content';
        const snippet = extractSnippet(content, keyword, 120);

        results.push({
          type: 'session',
          id: file.replace('.jsonl', ''),
          agentId,
          channel,
          status,
          matchedField,
          snippet,
        });
      }
    }
  } catch (err) {
    log('warn', 'search_sessions_error', { err: String(err) });
  }
  return results;
}

export async function search(keyword: string, type: string): Promise<SearchResponse> {
  const searchType = type || 'all';
  const [agents, tasks, sessions] = await Promise.all([
    searchType === 'all' || searchType === 'agent' ? searchAgents(keyword) : Promise.resolve([]),
    searchType === 'all' || searchType === 'task' ? searchTasks(keyword) : Promise.resolve([]),
    searchType === 'all' || searchType === 'session' ? searchSessions(keyword) : Promise.resolve([]),
  ]);

  return {
    agents,
    tasks,
    sessions,
    total: agents.length + tasks.length + sessions.length,
  };
}
