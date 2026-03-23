import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getUsageByAgent, getContextPressure } from './usage-service.js';
import { getAlertThresholds, updateAlertThresholds } from './settings-service.js';

export interface BudgetPolicy {
  daily_warn_usd: number;
  daily_over_usd: number;
  context_pressure_warn: number;
  context_pressure_over: number;
}

export interface BudgetStatusResponse {
  daily_cost_usd: number;
  status: 'ok' | 'warn' | 'over';
  context_pressure: number;
  context_status: 'ok' | 'warn' | 'over';
  policy: BudgetPolicy;
}

const BUDGET_POLICY_PATH = path.resolve(process.cwd(), 'data', 'budget-policy.json');

const DEFAULT_POLICY: BudgetPolicy = {
  daily_warn_usd: 1.0,
  daily_over_usd: 5.0,
  context_pressure_warn: 0.7,
  context_pressure_over: 0.9,
};

async function ensurePolicyDir(): Promise<void> {
  await mkdir(path.dirname(BUDGET_POLICY_PATH), { recursive: true });
}

export async function getBudgetPolicy(): Promise<BudgetPolicy> {
  const thresholds = await getAlertThresholds().catch(() => null);
  if (thresholds) {
    const dailyThreshold = Number(thresholds.costDailyUSD ?? DEFAULT_POLICY.daily_over_usd);
    const contextThreshold = Number((thresholds.contextPressurePercent ?? DEFAULT_POLICY.context_pressure_over * 100) / 100);
    return {
      daily_warn_usd: dailyThreshold,
      daily_over_usd: dailyThreshold,
      context_pressure_warn: contextThreshold,
      context_pressure_over: contextThreshold,
    };
  }

  await ensurePolicyDir();
  try {
    const raw = await readFile(BUDGET_POLICY_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      daily_warn_usd: Number(parsed.daily_warn_usd ?? DEFAULT_POLICY.daily_warn_usd),
      daily_over_usd: Number(parsed.daily_over_usd ?? DEFAULT_POLICY.daily_over_usd),
      context_pressure_warn: Number(parsed.context_pressure_warn ?? DEFAULT_POLICY.context_pressure_warn),
      context_pressure_over: Number(parsed.context_pressure_over ?? DEFAULT_POLICY.context_pressure_over),
    };
  } catch {
    return { ...DEFAULT_POLICY };
  }
}

export async function updateBudgetPolicy(input: Partial<BudgetPolicy>): Promise<BudgetPolicy> {
  const current = await getBudgetPolicy();
  const next: BudgetPolicy = {
    daily_warn_usd: Number(input.daily_warn_usd ?? current.daily_warn_usd),
    daily_over_usd: Number(input.daily_over_usd ?? input.daily_warn_usd ?? current.daily_over_usd),
    context_pressure_warn: Number(input.context_pressure_warn ?? current.context_pressure_warn),
    context_pressure_over: Number(input.context_pressure_over ?? input.context_pressure_warn ?? current.context_pressure_over),
  };

  await updateAlertThresholds({
    costDailyUSD: next.daily_over_usd,
    contextPressurePercent: Number((next.context_pressure_over * 100).toFixed(2)),
  });

  await ensurePolicyDir();
  await writeFile(BUDGET_POLICY_PATH, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  return next;
}

function levelByThreshold(value: number, warn: number, over: number): 'ok' | 'warn' | 'over' {
  if (value >= over) return 'over';
  if (value >= warn) return 'warn';
  return 'ok';
}

export async function getBudgetStatus(): Promise<BudgetStatusResponse> {
  const [policy, usage, context] = await Promise.all([
    getBudgetPolicy(),
    getUsageByAgent({ period: 'today' }),
    getContextPressure(),
  ]);

  const dailyCost = Number(
    usage.data.reduce((sum, item) => sum + item.costEstimateUSD, 0).toFixed(6)
  );
  const contextPressure = Number(
    Math.max(0, ...context.data.map((item) => item.pressureRatio)).toFixed(4)
  );

  return {
    daily_cost_usd: dailyCost,
    status: dailyCost > policy.daily_over_usd ? 'over' : 'ok',
    context_pressure: contextPressure,
    context_status: contextPressure > policy.context_pressure_over ? 'over' : 'ok',
    policy,
  };
}
