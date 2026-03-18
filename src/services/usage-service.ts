/**
 * UsageService — Token 归因聚合 + 上下文压力评估
 *
 * P0-2: 成本感知 API
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { getFileReader } from '../data/file-reader.js';
import { log } from '../utils/logger.js';

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
  'codex': 200000,
  default: 128000,
};

function getContextWindow(model?: string): number {
  if (!model) return MODEL_CONTEXT_WINDOWS.default;
  for (const [key, size] of Object.entries(MODEL_CONTEXT_WINDOWS)) {
    if (model.toLowerCase().includes(key.toLowerCase())) return size;
  }
  return MODEL_CONTEXT_WINDOWS.default;
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
  period: string
): Promise<{
  tokenIn: number;
  tokenOut: number;
  totalToken: number;
  costEstimateUSD: number;
  sessionCount: number;
  estimated: boolean;
  recentSessionSizeTokens: number;
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
  const modelBreakdown: Record<string, ModelUsageStat> = {};

  try {
    const files = await readdir(sessionsDir).catch(() => [] as string[]);
    const jsonlFiles = files.filter(
      (f) => f.endsWith('.jsonl') && !f.includes('.deleted') && !f.includes('.reset')
    );

    const cutoff =
      period === 'today'
        ? new Date(Date.now() - 24 * 60 * 60 * 1000)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const file of jsonlFiles) {
      try {
        const fileStat = await stat(join(sessionsDir, file)).catch(() => null);
        if (!fileStat) continue;

        const raw = await readFile(join(sessionsDir, file), 'utf-8');
        const lines = raw.split('\n').filter(Boolean);
        if (!lines.length) continue;

        sessionCount++;
        let fileHasExactTokens = false;

        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            const ts = entry.timestamp ? new Date(entry.timestamp) : null;
            if (ts && ts < cutoff) continue;

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
                // Track model breakdown
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

        // If no exact token data, estimate from raw content
        if (!fileHasExactTokens) {
          const estTokens = estimateTokens(raw);
          totalToken += estTokens;
          tokenIn += Math.ceil(estTokens * 0.7);
          tokenOut += Math.ceil(estTokens * 0.3);
          estimated = true;
        }

        // Track most recent session size for context pressure
        if (fileStat.mtimeMs > Date.now() - 60 * 60 * 1000) {
          recentSessionSizeTokens = Math.max(recentSessionSizeTokens, estimateTokens(raw));
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

  // Round modelBreakdown costs
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
    modelBreakdown,
  };
}

export async function getUsageByAgent(period = 'today'): Promise<{
  data: AgentUsageDetail[];
  period: string;
  generatedAt: string;
}> {
  const fileReader = getFileReader();
  const agentConfigs = await fileReader.listAgentConfigs().catch(() => []);

  const results: AgentUsageDetail[] = [];

  await Promise.all(
    agentConfigs.map(async (agent) => {
      const sessionData = await readAgentSessionData(agent.id, period);
      const displayName = agent.identity?.name ?? agent.name ?? agent.id;
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

  // Sort by total tokens descending
  results.sort((a, b) => b.totalToken - a.totalToken);

  return {
    data: results,
    period,
    generatedAt: new Date().toISOString(),
  };
}

// CC 借鉴 P0-5：按 model 维度汇总用量
export interface ModelUsageAggregated extends ModelUsageStat {
  model: string;
  agentCount: number;
}

export async function getUsageByModel(period = 'today'): Promise<{
  data: ModelUsageAggregated[];
  period: string;
  generatedAt: string;
}> {
  const fileReader = getFileReader();
  const agentConfigs = await fileReader.listAgentConfigs().catch(() => []);

  const modelMap: Record<string, ModelUsageAggregated> = {};

  await Promise.all(
    agentConfigs.map(async (agent) => {
      const sessionData = await readAgentSessionData(agent.id, period);
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

  // Round costs and sort by total tokens desc
  const data = Object.values(modelMap).map((item) => ({
    ...item,
    costEstimateUSD: Number(item.costEstimateUSD.toFixed(6)),
  })).sort((a, b) => b.totalToken - a.totalToken);

  return { data, period, generatedAt: new Date().toISOString() };
}

export async function getContextPressure(): Promise<{
  data: ContextPressureItem[];
}> {
  const fileReader = getFileReader();
  const agentConfigs = await fileReader.listAgentConfigs().catch(() => []);

  const results: ContextPressureItem[] = [];

  await Promise.all(
    agentConfigs.map(async (agent) => {
      const sessionData = await readAgentSessionData(agent.id, 'today');
      const model = agent.model?.primary ?? 'unknown';
      const contextWindowMax = getContextWindow(model);
      const contextUsedEstimate = sessionData.recentSessionSizeTokens || Math.min(sessionData.totalToken, contextWindowMax);
      const pressureRatio = contextWindowMax > 0 ? contextUsedEstimate / contextWindowMax : 0;

      let level: 'normal' | 'warning' | 'critical' = 'normal';
      if (pressureRatio >= 0.8) level = 'critical';
      else if (pressureRatio >= 0.5) level = 'warning';

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

  // Sort by pressureRatio descending
  results.sort((a, b) => b.pressureRatio - a.pressureRatio);

  return { data: results };
}
