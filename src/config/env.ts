import path from 'node:path';
import { homedir } from 'node:os';

export const env = {
  port: Number(process.env.PORT ?? 3014),
  host: process.env.HOST ?? '0.0.0.0',
  commandTimeoutMs: Number(process.env.COMMAND_TIMEOUT_MS ?? 10_000),
  healthTimeoutMs: Number(process.env.HEALTH_TIMEOUT_MS ?? 1_500),
  gatewayHealthUrl: process.env.GATEWAY_HEALTH_URL ?? 'http://127.0.0.1:18789/health',
  mockGatewayMode: process.env.MOCK_GATEWAY_MODE ?? '',
  mockConfigApplyFailure: process.env.MOCK_CONFIG_APPLY_FAILURE ?? '',
  templatesDir: process.env.TEMPLATES_DIR ?? path.resolve(process.cwd(), 'src', 'templates'),
  cacheTtlMs: {
    dashboard: 30_000,
    agents: 60_000,
    'templates.list': 300_000,
    health: 15_000,
  },
  staleTtlMs: {
    dashboard: 10 * 60_000,
    agents: 10 * 60_000,
    'templates.list': 30 * 60_000,
    health: 60_000,
  },

  // ── Iter-1 新增：数据层配置 ─────────────────────────────────────────────

  /**
   * 是否优先使用文件直读路径（FileReader + GatewayWsClient）
   * 设为 false 可强制回退到 CLI adapter（渐进式迁移安全阀）
   * 默认：true
   */
  useFileReader: (process.env.USE_FILE_READER ?? 'true') !== 'false',

  /**
   * OpenClaw 根目录，默认 ~/.openclaw
   */
  openclawRoot: process.env.OPENCLAW_ROOT ?? path.join(homedir(), '.openclaw'),

  /**
   * Gateway WebSocket URL
   */
  gatewayWsUrl: process.env.GATEWAY_WS_URL ?? 'ws://127.0.0.1:18789',

  /**
   * Gateway Token（可选，从环境变量或 openclaw.json 读取）
   */
  gatewayToken: process.env.OC_GATEWAY_TOKEN ?? '',

  /**
   * Gateway WS 重连间隔 ms
   */
  gatewayWsReconnectMs: Number(process.env.GATEWAY_WS_RECONNECT_MS ?? 3_000),

  /**
   * SSE 心跳间隔 ms（防超时断连）
   */
  sseHeartbeatIntervalMs: Number(process.env.SSE_HEARTBEAT_INTERVAL_MS ?? 25_000),

  /**
   * 项目根目录（用于 FileWatcher 监控）
   */
  projectRoot: process.env.PROJECT_ROOT ?? path.join(
    homedir(),
    '.openclaw',
    'workspace',
    'projects',
    'office-console-enhanced',
  ),

  // ── Iter-2 新增：安全框架配置 ─────────────────────────────────────────────

  /**
   * 只读模式（READONLY_MODE）
   * `true` 时禁止所有写操作（POST/PUT/PATCH/DELETE）
   * 默认：true（安全优先）
   */
  readonlyMode: (process.env.READONLY_MODE ?? 'true') !== 'false',

  /**
   * 本地控制台 Token（OC_CONSOLE_TOKEN）
   * 用于多控制台环境或外部访问控制的简单鉴权
   * 可选，未设置时跳过鉴权
   */
  consoleToken: process.env.OC_CONSOLE_TOKEN ?? '',

  /**
   * 写操作默认 dry-run（OC_DRY_RUN_DEFAULT）
   * `true` 时所有写操作默认进入预演模式
   * 客户端必须显式指定 `dryRun=false` 才真正执行
   * 默认：true（安全优先）
   */
  dryRunDefault: (process.env.OC_DRY_RUN_DEFAULT ?? 'true') !== 'false',

  /**
   * 是否要求高风险操作显式确认（REQUIRE_DRYRUN_CONFIRM）
   * `true` 时，POST/PUT/PATCH/DELETE 若未携带 X-Confirm: true，返回 dry-run 响应
   * 默认：false
   */
  requireDryrunConfirm: (process.env.REQUIRE_DRYRUN_CONFIRM ?? 'false') === 'true',

  /**
   * 允许写入的 IP 白名单（OC_ALLOWED_WRITE_ORIGINS）
   * 只读模式下，哪些来源的请求可以绕过只读限制
   * 默认仅允许 localhost（127.0.0.1、::1）
   */
  allowedWriteOrigins: (process.env.OC_ALLOWED_WRITE_ORIGINS ?? '127.0.0.1,::1')
    .split(',')
    .map(ip => ip.trim())
    .filter(ip => ip.length > 0),

  /**
   * 审计日志目录，默认项目目录 logs/ 下
   */
  auditLogDir: process.env.AUDIT_LOG_DIR ?? path.join(
    homedir(),
    '.openclaw',
    'workspace',
    'projects',
    'office-console-enhanced',
    'logs',
  ),
};
