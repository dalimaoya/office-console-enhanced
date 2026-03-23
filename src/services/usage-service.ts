/**
 * UsageService — Token 归因聚合 + 上下文压力评估
 *
 * P0-2: 成本感知 API
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { getFileReader } from '../data/file-reader.js';
import { getAlertThresholds } from './settings-service.js';
import { resolveAgentDisplayName } from '../utils/agent-display-name.js';

const OPENCLAW_ROOT = '/root/.openclaw';
const AGENTS_DIR = join(OPENCLAW_ROOT, 'agents');

// Known model context window sizes (tokens)
const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  'gpt-4': 128000,
  'gpt-4o': 128000,
  'gpt-5': 200000,
  'gpt-5.4': 200000,
  'claude-3': 200000,
  'claude-3-5': 200000,
  'claude-sonnet': 200000,
  'claude-opus': 200000,
  codex: 200000,
  default: 128000,
};

export interface UsageQueryWindow {
  period?: string;
  from?: number | string | null;
  to?: number | string | null;
}

export interface ResolvedUsageWindow {
  period: string;
  fromTs: number;
  toTs: number;
}

function getContextWindow(model?: string): number {
  if (!model) return MODEL_CONTEXT_WINDOWS.default;
  for (const [key, size] of Object.entries(MODEL_CONTEXT_WINDOWS)) {
    if (model.toLowerCase().includes(key.toLowerCase())) return size;
  }
  return MODEL_CONTEXT_WINDOWS.default;
}

function parseTimestamp(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  return num > 1e12 ? Math.floor(num) : Math.floor(num * 1000);
}

export function resolveUsageWindow(query: UsageQueryWindow = {}): ResolvedUsageWindow {
  const now = Date.now();
  const fromTs = parseTimestamp(query.from);
  const toTs = parseTimestamp(query.to);

  if (fromTs !== null || toTs !== null) {
    const safeToTs = toTs ?? now;
    const safeFromTs = fromTs ?? Math.max(0, safeToTs - 24 * 60 * 60 * 1000);
    const normalizedFrom = Math.min(safeFromTs, safeToTs);
    const normalizedTo = Math.max(safeFromTs, safeToTs);
    return {
      period: 'custom',
      fromTs: normalizedFrom,
      toTs: normalizedTo,
    };
  }

  const period = typeof query.period === 'string' ? query.period : 'today';
  if (period === 'month') {
    return { period, fromTs: now - 30 * 24 * 60 * 60 * 1000, toTs: now };
  }
  if (period === 'week') {
    return { period, fromTs: now - 7 * 24 * 60 * 60 * 1000, toTs: now };
  }
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  return { period: 'today', fromTs: startOfToday.getTime(), toTs: now };
}

function isTimestampInWindow(timestamp: string | undefined, window: ResolvedUsageWindow): boolean {
  if (!timestamp) return true;
  const ts = new Date(timestamp).getTime();
  if (Number.isNaN(ts)) return true;
  return ts >= window.fromTs && ts <= window.toTs;
}

// CC 借鉴 P0-5：Model 维度用量细分
export interface ModelUsageStat {
  tokenIn: number;
  tokenOut: number;
  totalToken: number;
  costEstimateUSD: number;
}

export interface AgentUsageDetail {
  agentId: string;
  displayName: string;
  model: string;
  tokenIn: number;
  tokenOut: number;
  totalToken: number;
  costEstimateUSD: number;
  sessionCount: number;
  estimated: boolean;
  modelBreakdown: Record<string, ModelUsageStat>;
}

export interface ContextPressureItem {
  agentId: string;
  contextWindowMax: number;
  contextUsedEstimate: number;
  pressureRatio: number;
  level: 'normal' | 'warning' | 'critical';
  estimated: boolean;
}

/** Rough token estimation from character count */
function estimateTokens(text: string): number {
  // ~4 chars per token for English, ~2 chars per token for Chinese
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars / 2 + otherChars / 4);
}

async function readAgentSessionData(
  agentId: string,
  window: ResolvedUsageWindow
): Promise<{
  tokenIn: number;
  tokenOut: number;
  totalToken: number;
  costEstimateUSD: number;
  sessionCount: number;
  estimated: boolean;
  recentSessionSizeTokens: number;
  latestSessionSizeTokens: number;
  modelBreakdown: Record<string, ModelUsageStat>;
}> {
  const sessionsDir = join(AGENTS_DIR, agentId, 'sessions');
  let tokenIn = 0;
  let tokenOut = 0;
  let totalToken = 0;
  let costEstimateUSD = 0;
  let sessionCount = 0;
  let estimated = false;
  let recentSessionSizeTokens = 0;
  let latestSessionSizeTokens = 0;
  let latestSessionMtimeMs = 0;
  const modelBreakdown: Record<string, ModelUsageStat> = {};

  try {
    const files = await readdir(sessionsDir).catch(() => [] as string[]);
    const jsonlFiles = files.filter(
      (f) => f.endsWith('.jsonl') && !f.includes('.deleted') && !f.includes('.reset')
    );

    for (const file of jsonlFiles) {
      try {
        const filePath = join(sessionsDir, file);
        const fileStat = await stat(filePath).catch(() => null);
        if (!fileStat) continue;

        const raw = await readFile(filePath, 'utf-8');
        const lines = raw.split('\n').filter(Boolean);
        if (!lines.length) continue;

        let fileHasExactTokens = false;
        let fileMatchedWindow = false;

        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            const timestamp = typeof entry.timestamp === 'string' ? entry.timestamp : undefined;
            if (!isTimestampInWindow(timestamp, window)) continue;
            fileMatchedWindow = true;

            if (entry.type === 'message' && entry.message?.usage) {
              const usage = entry.message.usage;
              const entryModel: string = entry.message?.model ?? entry.model ?? 'unknown';
              if (usage.inputTokens !== undefined || usage.outputTokens !== undefined) {
                const tIn = usage.inputTokens ?? 0;
                const tOut = usage.outputTokens ?? 0;
                const tTotal = usage.totalTokens ?? tIn + tOut;
                const cost = usage.cost?.total ?? 0;
                tokenIn += tIn;
                tokenOut += tOut;
                totalToken += tTotal;
                costEstimateUSD += cost;
                fileHasExactTokens = true;
                if (!modelBreakdown[entryModel]) {
                  modelBreakdown[entryModel] = { tokenIn: 0, tokenOut: 0, totalToken: 0, costEstimateUSD: 0 };
                }
                modelBreakdown[entryModel].tokenIn += tIn;
                modelBreakdown[entryModel].tokenOut += tOut;
                modelBreakdown[entryModel].totalToken += tTotal;
                modelBreakdown[entryModel].costEstimateUSD += cost;
              } else if (usage.totalTokens) {
                const tTotal = usage.totalTokens;
                const cost = usage.cost?.total ?? 0;
                totalToken += tTotal;
                costEstimateUSD += cost;
                fileHasExactTokens = true;
                if (!modelBreakdown[entryModel]) {
                  modelBreakdown[entryModel] = { tokenIn: 0, tokenOut: 0, totalToken: 0, costEstimateUSD: 0 };
                }
                modelBreakdown[entryModel].totalToken += tTotal;
                modelBreakdown[entryModel].costEstimateUSD += cost;
              }
            }
          } catch {
            // skip malformed lines
          }
        }

        if (!fileMatchedWindow) continue;

        sessionCount++;

        // If no exact token data, estimate from raw content
        if (!fileHasExactTokens) {
          const estTokens = estimateTokens(raw);
          totalToken += estTokens;
          tokenIn += Math.ceil(estTokens * 0.7);
          tokenOut += Math.ceil(estTokens * 0.3);
          estimated = true;
        }

        const sessionSizeTokens = estimateTokens(raw);

        // Keep backward-compatible window-local size for historic views
        if (fileStat.mtimeMs >= window.fromTs && fileStat.mtimeMs <= window.toTs) {
          recentSessionSizeTokens = Math.max(recentSessionSizeTokens, sessionSizeTokens);
        }

        // Context pressure should reflect current/latest session, not a window aggregate
        if (fileStat.mtimeMs >= latestSessionMtimeMs) {
          latestSessionMtimeMs = fileStat.mtimeMs;
          latestSessionSizeTokens = sessionSizeTokens;
        }
      } catch {
        // skip unreadable files
      }
    }

    // Estimate cost if not found in data
    if (costEstimateUSD === 0 && totalToken > 0) {
      // rough estimate: $0.002 per 1k tokens
      costEstimateUSD = (totalToken / 1000) * 0.002;
      estimated = true;
    }
  } catch {
    // agent sessions dir not accessible
  }

  for (const key of Object.keys(modelBreakdown)) {
    modelBreakdown[key].costEstimateUSD = Number(modelBreakdown[key].costEstimateUSD.toFixed(6));
  }

  return {
    tokenIn,
    tokenOut,
    totalToken,
    costEstimateUSD: Number(costEstimateUSD.toFixed(6)),
    sessionCount,
    estimated,
    recentSessionSizeTokens,
    latestSessionSizeTokens,
    modelBreakdown,
  };
}

export async function getUsageByAgent(query: UsageQueryWindow = {}): Promise<{
  data: AgentUsageDetail[];
  period: string;
  generatedAt: string;
  from: number;
  to: number;
}> {
  const fileReader = getFileReader();
  const agentConfigs = await fileReader.listAgentConfigs().catch(() => []);
  const window = resolveUsageWindow(query);

  const results: AgentUsageDetail[] = [];

  await Promise.all(
    agentConfigs.map(async (agent) => {
      const sessionData = await readAgentSessionData(agent.id, window);
      const displayName = resolveAgentDisplayName(agent.id, agent.identity?.name, agent.name);
      const model = agent.model?.primary ?? 'unknown';

      results.push({
        agentId: agent.id,
        displayName,
        model,
        tokenIn: sessionData.tokenIn,
        tokenOut: sessionData.tokenOut,
        totalToken: sessionData.totalToken,
        costEstimateUSD: sessionData.costEstimateUSD,
        sessionCount: sessionData.sessionCount,
        estimated: sessionData.estimated,
        modelBreakdown: sessionData.modelBreakdown,
      });
    })
  );

  results.sort((a, b) => b.totalToken - a.totalToken);

  return {
    data: results,
    period: window.period,
    generatedAt: new Date().toISOString(),
    from: window.fromTs,
    to: window.toTs,
  };
}

export interface ModelUsageAggregated extends ModelUsageStat {
  model: string;
  agentCount: number;
}

export async function getUsageByModel(query: UsageQueryWindow = {}): Promise<{
  data: ModelUsageAggregated[];
  period: string;
  generatedAt: string;
  from: number;
  to: number;
}> {
  const fileReader = getFileReader();
  const agentConfigs = await fileReader.listAgentConfigs().catch(() => []);
  const window = resolveUsageWindow(query);

  const modelMap: Record<string, ModelUsageAggregated> = {};

  await Promise.all(
    agentConfigs.map(async (agent) => {
      const sessionData = await readAgentSessionData(agent.id, window);
      for (const [modelName, stats] of Object.entries(sessionData.modelBreakdown)) {
        if (!modelMap[modelName]) {
          modelMap[modelName] = { model: modelName, tokenIn: 0, tokenOut: 0, totalToken: 0, costEstimateUSD: 0, agentCount: 0 };
        }
        modelMap[modelName].tokenIn += stats.tokenIn;
        modelMap[modelName].tokenOut += stats.tokenOut;
        modelMap[modelName].totalToken += stats.totalToken;
        modelMap[modelName].costEstimateUSD += stats.costEstimateUSD;
        modelMap[modelName].agentCount += 1;
      }
    })
  );

  const data = Object.values(modelMap).map((item) => ({
    ...item,
    costEstimateUSD: Number(item.costEstimateUSD.toFixed(6)),
  })).sort((a, b) => b.totalToken - a.totalToken);

  return { data, period: window.period, generatedAt: new Date().toISOString(), from: window.fromTs, to: window.toTs };
}

export async function getContextPressure(query: UsageQueryWindow = {}): Promise<{
  data: ContextPressureItem[];
  period: string;
  generatedAt: string;
  from: number;
  to: number;
}> {
  const fileReader = getFileReader();
  const agentConfigs = await fileReader.listAgentConfigs().catch(() => []);
  const window = resolveUsageWindow(query);
  const thresholds = await getAlertThresholds().catch(() => ({ contextPressurePercent: 80 }));
  const overThresholdRatio = Math.max(0, thresholds.contextPressurePercent) / 100;
  const warnThresholdRatio = Math.max(0, Math.min(overThresholdRatio * 0.75, overThresholdRatio));

  const results: ContextPressureItem[] = [];

  await Promise.all(
    agentConfigs.map(async (agent) => {
      const sessionData = await readAgentSessionData(agent.id, window);
      const model = agent.model?.primary ?? 'unknown';
      const contextWindowMax = getContextWindow(model);
      const rawContextUsedEstimate = sessionData.latestSessionSizeTokens
        || sessionData.recentSessionSizeTokens
        || Math.min(sessionData.totalToken, contextWindowMax);
      const contextUsedEstimate = contextWindowMax > 0
        ? Math.min(rawContextUsedEstimate, contextWindowMax)
        : rawContextUsedEstimate;
      const pressureRatio = contextWindowMax > 0 ? contextUsedEstimate / contextWindowMax : 0;

      let level: 'normal' | 'warning' | 'critical' = 'normal';
      if (pressureRatio >= overThresholdRatio) level = 'critical';
      else if (pressureRatio >= warnThresholdRatio) level = 'warning';

      results.push({
        agentId: agent.id,
        contextWindowMax,
        contextUsedEstimate,
        pressureRatio: Number(pressureRatio.toFixed(4)),
        level,
        estimated: true,
      });
    })
  );

  results.sort((a, b) => b.pressureRatio - a.pressureRatio);

  return {
    data: results,
    period: window.period,
    generatedAt: new Date().toISOString(),
    from: window.fromTs,
    to: window.toTs,
  };
}
