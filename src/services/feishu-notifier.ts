/**
 * FeishuNotifier — 飞书轻量通知服务
 *
 * Iter-6 新增：
 * - 使用飞书 Bot Webhook（最简单方案，无需完整 API 接入）
 * - URL: https://open.feishu.cn/open-apis/bot/v2/hook/{hook_id}
 * - 发送纯文本消息（避免卡片接入的复杂性）
 * - 触发条件：agent 状态异常（offline/error）、任务 blocked 状态
 * - 环境变量：FEISHU_WEBHOOK_URL（可选，未设置时静默跳过）
 *
 * 配置说明：
 *   1. 在飞书群中添加「自定义机器人」
 *   2. 复制 Webhook URL，格式为：
 *      https://open.feishu.cn/open-apis/bot/v2/hook/<UUID>
 *   3. 设置环境变量 FEISHU_WEBHOOK_URL=<上述 URL>
 *   4. 重启服务后通知即可生效
 *
 * 注意事项：
 *   - 如飞书群未开启自定义机器人，需联系管理员在群设置中开启
 *   - Webhook 默认无签名验证；如开启了签名验证，需同步配置 FEISHU_WEBHOOK_SECRET
 *   - 发送失败只记录日志，不影响主流程
 */

import { log } from '../utils/logger.js';

export interface FeishuNotifyOptions {
  /** Webhook URL，默认从 FEISHU_WEBHOOK_URL 读取 */
  webhookUrl?: string;
}

export class FeishuNotifier {
  private webhookUrl: string;

  constructor(options: FeishuNotifyOptions = {}) {
    this.webhookUrl = options.webhookUrl ?? process.env.FEISHU_WEBHOOK_URL ?? '';
  }

  /** 是否已配置 Webhook */
  get isConfigured(): boolean {
    return this.webhookUrl.length > 0;
  }

  /**
   * 发送纯文本通知
   * 如果未配置 FEISHU_WEBHOOK_URL，静默跳过（不抛错）
   */
  async sendText(text: string): Promise<void> {
    if (!this.isConfigured) {
      // 未配置时静默跳过，避免产生噪音日志
      return;
    }

    const body = JSON.stringify({
      msg_type: 'text',
      content: { text },
    });

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        log('warn', 'feishu_notify_http_error', {
          status: response.status,
          body: errorText.slice(0, 200),
        });
        return;
      }

      const result = await response.json() as { code?: number; msg?: string };

      if (result.code !== 0) {
        log('warn', 'feishu_notify_api_error', { code: result.code, msg: result.msg });
      } else {
        log('info', 'feishu_notify_sent', { text: text.slice(0, 80) });
      }
    } catch (err) {
      // 网络异常不影响主流程
      log('warn', 'feishu_notify_failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * agent 状态异常通知（offline / error）
   */
  async notifyAgentStatus(agentId: string, status: string, detail?: string): Promise<void> {
    const lines = [`[办公控制台告警] Agent 状态异常`, `Agent: ${agentId}`, `状态: ${status}`];
    if (detail) lines.push(`详情: ${detail}`);
    lines.push(`时间: ${new Date().toISOString()}`);
    await this.sendText(lines.join('\n'));
  }

  /**
   * 任务 blocked 通知
   */
  async notifyTaskBlocked(taskId: string, title?: string, reason?: string): Promise<void> {
    const lines = [`[办公控制台告警] 任务被阻塞`, `任务ID: ${taskId}`];
    if (title) lines.push(`标题: ${title}`);
    if (reason) lines.push(`阻塞原因: ${reason}`);
    lines.push(`时间: ${new Date().toISOString()}`);
    await this.sendText(lines.join('\n'));
  }
}

/** 全局单例 */
let _instance: FeishuNotifier | null = null;

export function getFeishuNotifier(): FeishuNotifier {
  if (!_instance) {
    _instance = new FeishuNotifier();
  }
  return _instance;
}

export function initFeishuNotifier(options?: FeishuNotifyOptions): FeishuNotifier {
  _instance = new FeishuNotifier(options);
  return _instance;
}
