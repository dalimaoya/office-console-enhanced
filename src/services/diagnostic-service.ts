import { execFile } from 'node:child_process';
import { constants } from 'node:fs';
import { access, mkdir, open } from 'node:fs/promises';
import { promisify } from 'node:util';
import { env } from '../config/env.js';

const execFileAsync = promisify(execFile);
const GATEWAY_WS_URL = 'ws://127.0.0.1:18789';
const REGISTRY_FILE = '/root/.openclaw/workspace/projects/office-console-enhanced/registry/objects.md';
const EVENT_LOG_FILE = 'data/events.ndjson';

type CheckStatus = 'pass' | 'fail' | 'warn';

export interface DiagnosticCheckResult {
  name: string;
  status: CheckStatus;
  message: string;
}

export interface DiagnosticResult {
  ok: boolean;
  checks: DiagnosticCheckResult[];
  summary: string;
}

function timeoutMessage(ms: number) {
  return `检查超时（${ms}ms）`;
}

function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: () => T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(onTimeout()), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(onTimeout());
      });
  });
}

async function checkGatewayConnection(): Promise<DiagnosticCheckResult> {
  const startedAt = Date.now();
  try {
    const WS = (globalThis as typeof globalThis & { WebSocket?: typeof WebSocket }).WebSocket;
    if (!WS) {
      return { name: 'Gateway连接', status: 'fail', message: '当前 Node 运行时不支持 WebSocket' };
    }

    return await new Promise<DiagnosticCheckResult>((resolve) => {
      const ws = new WS(GATEWAY_WS_URL);
      let settled = false;

      const finish = (result: DiagnosticCheckResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { ws.close(); } catch { /* ignore */ }
        resolve(result);
      };

      const timer = setTimeout(() => {
        finish({
          name: 'Gateway连接',
          status: 'fail',
          message: `连接 ${GATEWAY_WS_URL} 超时（3s）`,
        });
      }, 3000);

      ws.addEventListener('open', () => {
        try {
          ws.send(JSON.stringify({ jsonrpc: '2.0', id: 'diagnostic-ping', method: 'ping', params: {} }));
        } catch (error) {
          finish({
            name: 'Gateway连接',
            status: 'fail',
            message: `WebSocket 已连通但 ping 发送失败：${error instanceof Error ? error.message : String(error)}`,
          });
        }
      });

      ws.addEventListener('message', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(String(event.data)) as { id?: string; result?: unknown; error?: { message?: string } };
          if (payload.id === 'diagnostic-ping') {
            const latencyMs = Date.now() - startedAt;
            if (payload.error) {
              finish({ name: 'Gateway连接', status: 'fail', message: `ping 返回错误：${payload.error.message ?? 'unknown error'}` });
              return;
            }
            finish({ name: 'Gateway连接', status: 'pass', message: `WebSocket 可达，ping/pong 正常（${latencyMs}ms）` });
          }
        } catch {
          // ignore unrelated/non-json messages
        }
      });

      ws.addEventListener('error', () => {
        finish({ name: 'Gateway连接', status: 'fail', message: `无法连接到 ${GATEWAY_WS_URL}` });
      });

      ws.addEventListener('close', () => {
        if (!settled) {
          finish({ name: 'Gateway连接', status: 'fail', message: '连接在收到 pong 前关闭' });
        }
      });
    });
  } catch (error) {
    return { name: 'Gateway连接', status: 'fail', message: `检查失败：${error instanceof Error ? error.message : String(error)}` };
  }
}

async function checkOpenClawProcess(): Promise<DiagnosticCheckResult> {
  try {
    const { stdout, stderr } = await execFileAsync('openclaw', ['status'], {
      timeout: 3000,
      maxBuffer: 1024 * 1024,
    });
    const output = `${stdout}${stderr}`.trim();
    return {
      name: 'OpenClaw进程',
      status: 'pass',
      message: output ? `openclaw status 正常：${output.split('\n')[0]}` : 'openclaw status 执行成功',
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { name: 'OpenClaw进程', status: 'fail', message: `openclaw status 执行失败：${detail}` };
  }
}

async function checkRegistryFile(): Promise<DiagnosticCheckResult> {
  try {
    await access(REGISTRY_FILE, constants.F_OK | constants.R_OK);
    return { name: '关键文件存在性', status: 'pass', message: `已找到 ${REGISTRY_FILE}` };
  } catch {
    return { name: '关键文件存在性', status: 'fail', message: `缺少关键文件：${REGISTRY_FILE}` };
  }
}

async function checkEventLogWritable(): Promise<DiagnosticCheckResult> {
  try {
    const filePath = new URL(EVENT_LOG_FILE, `file://${process.cwd()}/`).pathname;
    await mkdir(new URL('.', `file://${filePath}`).pathname, { recursive: true });
    const handle = await open(filePath, 'a');
    await handle.close();
    await access(filePath, constants.W_OK);
    return { name: '事件日志文件', status: 'pass', message: `${EVENT_LOG_FILE} 可写` };
  } catch (error) {
    return {
      name: '事件日志文件',
      status: 'fail',
      message: `${EVENT_LOG_FILE} 不可写：${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function checkFeishuWebhook(): Promise<DiagnosticCheckResult> {
  const webhookUrl = process.env['FEISHU_WEBHOOK_URL']?.trim() ?? '';
  if (webhookUrl) {
    return { name: '飞书Webhook', status: 'pass', message: 'FEISHU_WEBHOOK_URL 已配置' };
  }
  return { name: '飞书Webhook', status: 'warn', message: 'FEISHU_WEBHOOK_URL 未配置' };
}

async function checkSelfStatusEndpoint(): Promise<DiagnosticCheckResult> {
  const url = `http://127.0.0.1:${env.port}/api/v1/status`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
    if (response.status === 200) {
      return { name: '端口健康', status: 'pass', message: `${url} 返回 200` };
    }
    return { name: '端口健康', status: 'fail', message: `${url} 返回 ${response.status}` };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { name: '端口健康', status: 'fail', message: `访问 ${url} 失败：${detail}` };
  }
}

export class DiagnosticService {
  async run(): Promise<DiagnosticResult> {
    const checks: DiagnosticCheckResult[] = await withTimeout(
      Promise.all([
        checkGatewayConnection(),
        checkOpenClawProcess(),
        checkRegistryFile(),
        checkEventLogWritable(),
        checkFeishuWebhook(),
        checkSelfStatusEndpoint(),
      ]),
      5000,
      () => [
        { name: 'Gateway连接', status: 'fail', message: timeoutMessage(5000) },
        { name: 'OpenClaw进程', status: 'fail', message: timeoutMessage(5000) },
        { name: '关键文件存在性', status: 'fail', message: timeoutMessage(5000) },
        { name: '事件日志文件', status: 'fail', message: timeoutMessage(5000) },
        { name: '飞书Webhook', status: 'warn', message: timeoutMessage(5000) },
        { name: '端口健康', status: 'fail', message: timeoutMessage(5000) },
      ],
    );

    const passed = checks.filter((item) => item.status === 'pass').length;
    const hasFail = checks.some((item) => item.status === 'fail');

    return {
      ok: !hasFail,
      checks,
      summary: `${passed}/${checks.length} checks passed`,
    };
  }
}

export const diagnosticService = new DiagnosticService();
