import { AppError } from './errors.js';

/**
 * 安全框架错误：只读模式禁止写操作
 */
export class ReadonlyModeError extends AppError {
  constructor(message = '控制台当前处于只读模式，写操作已禁用') {
    super('READONLY_MODE', 403, message);
  }
}

/**
 * 安全框架错误：Token 验证失败
 */
export class TokenAuthError extends AppError {
  constructor(message = 'Invalid or missing console token') {
    super('UNAUTHORIZED', 401, message);
  }
}

/**
 * 安全框架错误：IP 不在白名单中
 */
export class IpNotAllowedError extends AppError {
  constructor(ip: string) {
    super('IP_NOT_ALLOWED', 403, `IP ${ip} is not allowed to perform write operations in readonly mode`);
  }
}

/**
 * 安全框架错误：操作需要 dry-run=false 确认
 */
export class DryRunRequiredError extends AppError {
  constructor() {
    super('DRY_RUN_REQUIRED', 428, '写操作需要显式确认: 请设置 dryRun=false 来真正执行此操作');
  }
}

/**
 * 安全审计事件类型
 */
export interface SecurityAuditEvent {
  timestamp: string;
  traceId: string;
  eventType: 'token_verification' | 'readonly_reject' | 'dry_run_operation' | 'write_operation' | 'ip_whitelist_reject';
  userId?: string;
  userAgent?: string;
  ip: string;
  method: string;
  path: string;
  detail: Record<string, any>;
}