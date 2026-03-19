import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface AlertThresholds {
  contextPressurePercent: number;
  agentIdleMinutes: number;
  costDailyUSD: number;
}

const ALERT_CONFIG_PATH = path.resolve(process.cwd(), 'data', 'alert-config.json');

const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  contextPressurePercent: 80,
  agentIdleMinutes: 120,
  costDailyUSD: 100,
};

function normalizeNumber(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : fallback;
}

function normalizeThresholds(input: Partial<AlertThresholds> | null | undefined): AlertThresholds {
  return {
    contextPressurePercent: normalizeNumber(input?.contextPressurePercent, DEFAULT_ALERT_THRESHOLDS.contextPressurePercent),
    agentIdleMinutes: normalizeNumber(input?.agentIdleMinutes, DEFAULT_ALERT_THRESHOLDS.agentIdleMinutes),
    costDailyUSD: normalizeNumber(input?.costDailyUSD, DEFAULT_ALERT_THRESHOLDS.costDailyUSD),
  };
}

async function ensureAlertConfigDir(): Promise<void> {
  await mkdir(path.dirname(ALERT_CONFIG_PATH), { recursive: true });
}

export async function getAlertThresholds(): Promise<AlertThresholds> {
  await ensureAlertConfigDir();

  try {
    const raw = await readFile(ALERT_CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return normalizeThresholds(parsed);
  } catch {
    return { ...DEFAULT_ALERT_THRESHOLDS };
  }
}

export async function updateAlertThresholds(input: Partial<AlertThresholds>): Promise<AlertThresholds> {
  const current = await getAlertThresholds();
  const next = normalizeThresholds({
    ...current,
    ...input,
  });

  await ensureAlertConfigDir();
  await writeFile(ALERT_CONFIG_PATH, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  return next;
}

export function getDefaultAlertThresholds(): AlertThresholds {
  return { ...DEFAULT_ALERT_THRESHOLDS };
}
