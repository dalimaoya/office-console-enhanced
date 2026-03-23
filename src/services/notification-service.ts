/**
 * NotificationService — 飞书告警场景扩展
 *
 * Iter-3 新增：
 * - Context 压力 ≥ 80% 时触发飞书告警
 * - Agent idle 超过 2 小时时触发飞书告警
 *
 * 触发机制：异步非阻塞，不影响 HTTP 响应
 * 实现：复用 FeishuNotifier（基于 FEISHU_WEBHOOK_URL 环境变量）
 */

import { getFeishuNotifier } from './feishu-notifier.js';
import { log } from '../utils/logger.js';
import type { ContextPressureItem } from './usage-service.js';
import { getAlertThresholds } from './settings-service.js';
import { appendTimelineEvent } from './timeline-service.js';

// 避免短时间内对同一 agent 重复发送通知（简单内存防重）
const contextAlertSentAt = new Map<string, number>();
const idleAlertSentAt = new Map<string, number>();
let dailyCostAlertSentAt = 0;

const CONTEXT_ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 分钟内不重复通知
const IDLE_ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 60 分钟内不重复通知
const DAILY_COST_ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 60 分钟内不重复通知

/**
 * 检查 context 压力，超过配置阈值时异步发送飞书告警
 * 设计为非阻塞：调用方 await 此函数后立即继续，通知在后台发送
 */
export function checkAndNotifyContextPressure(items: ContextPressureItem[]): void {
  // 使用 void + Promise 实现真正非阻塞
  void (async () => {
    const notifier = getFeishuNotifier();
    if (!notifier.isConfigured) return;

    const thresholds = await getAlertThresholds();
    const contextPressureThreshold = thresholds.contextPressurePercent / 100;

    for (const item of items) {
      if (item.pressureRatio <= contextPressureThreshold) continue;

      const now = Date.now();
      const lastSent = contextAlertSentAt.get(item.agentId) ?? 0;
      if (now - lastSent < CONTEXT_ALERT_COOLDOWN_MS) continue;

      contextAlertSentAt.set(item.agentId, now);
      const ratio = Math.round(item.pressureRatio * 100);
      const message = `⚠️ [${item.agentId}] context 窗口已用 ${ratio}%，请关注`;

      try {
        await notifier.sendText(message);
        await appendTimelineEvent({
          type: 'alert_context_pressure_triggered',
          agentId: item.agentId,
          summary: `[${item.agentId}] context 压力达到 ${ratio}%`,
          data: { ratio, thresholdPercent: thresholds.contextPressurePercent },
        });
        log('info', 'notify_context_pressure_sent', { agentId: item.agentId, ratio });
      } catch (err) {
        log('warn', 'notify_context_pressure_failed', {
          agentId: item.agentId,
          err: String(err),
        });
      }
    }
  })();
}

export interface AgentIdleInfo {
  agentId: string;
  lastActiveAt: string | null; // ISO string 或 null
}

/**
 * 检查 agent idle 时间，超过配置阈值时异步发送飞书告警
 * 设计为非阻塞
 */
export function checkAndNotifyIdleAgents(agents: AgentIdleInfo[]): void {
  void (async () => {
    const notifier = getFeishuNotifier();
    if (!notifier.isConfigured) return;

    const thresholds = await getAlertThresholds();
    const idleThresholdMs = thresholds.agentIdleMinutes * 60 * 1000;
    const now = Date.now();

    for (const agent of agents) {
      if (!agent.lastActiveAt) continue;

      const lastActive = new Date(agent.lastActiveAt).getTime();
      if (isNaN(lastActive)) continue;

      const idleMs = now - lastActive;
      if (idleMs < idleThresholdMs) continue;

      const lastSent = idleAlertSentAt.get(agent.agentId) ?? 0;
      if (now - lastSent < IDLE_ALERT_COOLDOWN_MS) continue;

      idleAlertSentAt.set(agent.agentId, now);
      const idleHours = (idleMs / (60 * 60 * 1000)).toFixed(1);
      const message = `😴 [${agent.agentId}] 已空闲 ${idleHours}h，超过阈值 ${thresholds.agentIdleMinutes} 分钟，是否需要任务？`;

      try {
        await notifier.sendText(message);
        await appendTimelineEvent({
          type: 'alert_idle_agent_triggered',
          agentId: agent.agentId,
          summary: `[${agent.agentId}] 空闲 ${idleHours}h 超过阈值`,
          data: { idleHours: Number(idleHours), thresholdMinutes: thresholds.agentIdleMinutes },
        });
        log('info', 'notify_idle_agent_sent', { agentId: agent.agentId, idleHours, thresholdMinutes: thresholds.agentIdleMinutes });
      } catch (err) {
        log('warn', 'notify_idle_agent_failed', {
          agentId: agent.agentId,
          err: String(err),
        });
      }
    }
  })();
}

export function checkAndNotifyDailyCost(dailyCostUSD: number): void {
  void (async () => {
    const notifier = getFeishuNotifier();
    if (!notifier.isConfigured) return;

    const thresholds = await getAlertThresholds();
    if (dailyCostUSD <= thresholds.costDailyUSD) return;

    const now = Date.now();
    if (now - dailyCostAlertSentAt < DAILY_COST_ALERT_COOLDOWN_MS) return;

    dailyCostAlertSentAt = now;
    const message = `💸 今日费用 $${dailyCostUSD.toFixed(2)}，已超过告警阈值 $${thresholds.costDailyUSD.toFixed(2)}`;

    try {
      await notifier.sendText(message);
      await appendTimelineEvent({
        type: 'alert_daily_cost_triggered',
        summary: `今日费用 $${dailyCostUSD.toFixed(2)} 超过阈值`,
        data: {
          dailyCostUSD: Number(dailyCostUSD.toFixed(4)),
          thresholdUSD: thresholds.costDailyUSD,
        },
      });
      log('info', 'notify_daily_cost_sent', {
        dailyCostUSD: Number(dailyCostUSD.toFixed(4)),
        thresholdUSD: thresholds.costDailyUSD,
      });
    } catch (err) {
      log('warn', 'notify_daily_cost_failed', { err: String(err) });
    }
  })();
}
