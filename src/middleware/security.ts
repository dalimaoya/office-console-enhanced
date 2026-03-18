import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { auditService } from '../services/audit-service.js';
import { ReadonlyModeError, TokenAuthError, IpNotAllowedError, DryRunRequiredError } from '../utils/security-errors.js';

/**
 * Token 鉴权中间件
 * 如果设置了 OC_CONSOLE_TOKEN，所有 API 请求需要携带有效的 token
 */
export function tokenAuth(req: Request, res: Response, next: NextFunction) {
  const traceId = res.locals.requestId;
  const userAgent = req.headers['user-agent'] ?? '';
  const ip = req.ip || 'unknown';

  // 如果未配置 token，跳过鉴权
  if (!env.consoleToken) {
    auditService.logTokenVerification(
      traceId,
      ip,
      req.method,
      req.path,
      userAgent,
      true,
      'token_not_required'
    );
    return next();
  }

  // 支持 Bearer token header 或 query parameter
  const providedToken = req.headers.authorization?.replace('Bearer ', '')
    || req.headers['x-console-token'] as string
    || req.query.token as string;

  const isAuthenticated = providedToken === env.consoleToken;

  // 记录审计日志
  auditService.logTokenVerification(
    traceId,
    ip,
    req.method,
    req.path,
    userAgent,
    isAuthenticated,
    isAuthenticated ? 'token_valid' : 'token_invalid_or_missing'
  );

  if (!isAuthenticated) {
    throw new TokenAuthError();
  }

  next();
}

/**
 * 只读模式检查中间件
 * 检查请求是否来自白名单 IP（在只读模式下允许写操作）
 */
function isWhitelistedIp(ip: string): boolean {
  // 如果允许所有来源，直接返回 true
  if (env.allowedWriteOrigins.includes('*') || env.allowedWriteOrigins.includes('0.0.0.0')) {
    return true;
  }

  // 检查是否为白名单 IP
  return env.allowedWriteOrigins.some(allowedIp => {
    if (allowedIp.includes('/')) {
      // CIDR 格式，简化处理：只检查精确匹配和通配符
      return allowedIp === ip;
    }
    return allowedIp === ip;
  });
}

/**
 * 只读模式守卫中间件
 * 在只读模式下，拦截所有非白名单 IP 的写操作
 */
export function readonlyGuard(req: Request, res: Response, next: NextFunction) {
  const traceId = res.locals.requestId;
  const userAgent = req.headers['user-agent'] ?? '';
  const ip = req.ip || 'unknown';

  // 如果是只读模式且是写操作
  if (env.readonlyMode && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    
    // 检查是否在白名单中
    if (isWhitelistedIp(ip)) {
      // 白名单 IP，允许继续
      auditService.logTokenVerification(
        traceId,
        ip,
        req.method,
        req.path,
        userAgent,
        true,
        'ip_whitelist_bypass_allowed'
      );
      return next();
    }

    // 非白名单 IP，记录并拒绝
    auditService.logReadonlyReject(
      traceId,
      ip,
      req.method,
      req.path,
      userAgent,
      `readonly_mode_reject: ${req.method} ${req.path} from IP ${ip}`
    );

    auditService.logIpWhitelistReject(
      traceId,
      ip,
      req.method,
      req.path,
      userAgent,
      env.allowedWriteOrigins
    );

    throw new ReadonlyModeError();
  }

  next();
}

/**
 * 扩展 Express 的 Request 类型
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * 当前操作是否为 dry-run 模式
       */
      dryRun?: boolean;
      
      /**
       * 安全上下文，包含鉴权状态等信息
       */
      securityContext?: {
        authenticated: boolean;
        ip: string;
        traceId: string;
      };
    }
  }
}

/**
 * 写操作 Gate 中间件
 * 负责处理 dry-run 模式和执行审计日志
 */
export function writeGate(req: Request, res: Response, next: NextFunction) {
  const traceId = res.locals.requestId;
  const userAgent = req.headers['user-agent'] ?? '';
  const ip = req.ip || 'unknown';

  // 仅为写操作应用 writeGate（GET/HEAD/OPTIONS 跳过）
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // 解析 dry-run 参数
  // body.dryRun=false → 强制执行（req.dryRun=false）
  // body.dryRun=true  → 强制 dry-run（req.dryRun=true）
  // 未指定           → 使用 env.dryRunDefault
  let dryRunOverride: boolean | undefined;
  if (req.body?.dryRun !== undefined) {
    dryRunOverride = Boolean(req.body.dryRun);  // 直接映射：false=执行, true=dry-run
  } else if (req.query.dryRun !== undefined) {
    dryRunOverride = req.query.dryRun !== 'false';  // query: dryRun=false → 执行
  }

  // 设置 dry-run 状态
  req.dryRun = dryRunOverride !== undefined ? dryRunOverride : env.dryRunDefault;

  // 构建操作详情用于审计
  const operationDetail = {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body ? { ...req.body, dryRun: req.dryRun } : undefined,
    dryRun: req.dryRun,
  };

  // 记录审计日志
  if (req.dryRun) {
    auditService.logDryRunOperation(traceId, ip, req.method, req.path, userAgent, operationDetail);
    
    // 如果是 dry-run 且不是来自 body/query 的显式指定，返回提示（仅对某些操作）
    if (dryRunOverride === undefined && req.method === 'POST' && req.path.includes('/apply')) {
      // 不直接拦截，但可以添加标记供后续处理
      res.locals.dryRunAlert = true;
    }
  } else {
    auditService.logWriteOperation(traceId, ip, req.method, req.path, userAgent, operationDetail);
  }

  next();
}

/**
 * 组合的安全中间件
 * 应用顺序：tokenAuth → readonlyGuard → writeGate
 */
export const securityMiddleware = [tokenAuth, readonlyGuard, writeGate];