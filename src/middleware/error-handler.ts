import type { NextFunction, Request, Response } from 'express';
import { AppError, GatewayTimeoutError, GatewayUnavailableError } from '../utils/errors.js';
import { 
  ReadonlyModeError, 
  TokenAuthError, 
  IpNotAllowedError, 
  DryRunRequiredError 
} from '../utils/security-errors.js';
import { log } from '../utils/logger.js';
import { sendError } from '../utils/responses.js';

function logHandledError(error: AppError | GatewayTimeoutError | GatewayUnavailableError, req: Request, res: Response) {
  log(error.statusCode >= 500 ? 'error' : 'warn', 'request_failed', {
    requestId: res.locals.requestId,
    method: req.method,
    path: req.originalUrl,
    code: error.code,
    statusCode: error.statusCode,
    message: error.message,
    detail: error.detail,
  });
}

function logUnhandledError(error: unknown, req: Request, res: Response) {
  const errorDetail = error instanceof Error
    ? { message: error.message, stack: error.stack }
    : String(error);
    
  log('error', 'unhandled_error', {
    requestId: res.locals.requestId,
    method: req.method,
    path: req.originalUrl,
    detail: errorDetail,
  });
}

// 用户友好的安全错误消息映射
const userFriendlySecurityMessages: Record<string, { statusCode: number; message: string }> = {
  'READONLY_MODE': { 
    statusCode: 403, 
    message: '控制台当前处于只读模式，写操作已禁用。如需修改配置，请先将 READONLY_MODE 设置为 false' 
  },
  'UNAUTHORIZED': { 
    statusCode: 401, 
    message: '访问权限验证失败。请提供有效的控制台访问令牌' 
  },
  'IP_NOT_ALLOWED': { 
    statusCode: 403, 
    message: '当前 IP 地址不被允许执行写操作。只读模式下仅白名单 IP 可以执行写操作' 
  },
  'DRY_RUN_REQUIRED': { 
    statusCode: 428, 
    message: '写操作需要显式确认：请设置 dryRun=false 来真正执行此操作（dry-run 默认开启，保护您的系统安全）' 
  },
  'GATEWAY_UNAVAILABLE': {
    statusCode: 503,
    message: '无法连接到 OpenClaw Gateway，请确认 Gateway 服务是否正在运行'
  },
  'GATEWAY_TIMEOUT': {
    statusCode: 504,
    message: 'OpenClaw Gateway 响应超时，请稍后重试或检查网络连接'
  }
};

// 用户友好的错误消息映射（通用）
const userFriendlyMessages: Record<string, string> = {
  'INTERNAL_ERROR': '服务器内部错误，请稍后重试',
  'VALIDATION_ERROR': '请求参数验证失败，请检查输入数据',
  'NOT_FOUND': '请求的资源不存在',
  'METHOD_NOT_ALLOWED': '该请求方法不被允许',
  'BAD_REQUEST': '请求格式不正确'
};

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  // 处理安全框架错误（提供用户友好消息）
  if (error instanceof ReadonlyModeError) {
    const friendlyError = userFriendlySecurityMessages['READONLY_MODE'];
    logHandledError(error, req, res);
    return sendError(res, friendlyError.statusCode, error.code, friendlyError.message);
  }
  
  if (error instanceof TokenAuthError) {
    const friendlyError = userFriendlySecurityMessages['UNAUTHORIZED'];
    logHandledError(error, req, res);
    return sendError(res, friendlyError.statusCode, error.code, friendlyError.message);
  }
  
  if (error instanceof IpNotAllowedError) {
    const friendlyError = userFriendlySecurityMessages['IP_NOT_ALLOWED'];
    logHandledError(error, req, res);
    return sendError(res, friendlyError.statusCode, error.code, friendlyError.message);
  }
  
  if (error instanceof DryRunRequiredError) {
    const friendlyError = userFriendlySecurityMessages['DRY_RUN_REQUIRED'];
    logHandledError(error, req, res);
    return sendError(res, friendlyError.statusCode, error.code, friendlyError.message);
  }

  // 处理现有的错误类型
  if (error instanceof GatewayTimeoutError) {
    const friendlyError = userFriendlySecurityMessages['GATEWAY_TIMEOUT'];
    logHandledError(error, req, res);
    return sendError(res, friendlyError.statusCode, error.code, friendlyError.message, error.detail);
  }
  
  if (error instanceof GatewayUnavailableError) {
    const friendlyError = userFriendlySecurityMessages['GATEWAY_UNAVAILABLE'];
    logHandledError(error, req, res);
    return sendError(res, friendlyError.statusCode, error.code, friendlyError.message, error.detail);
  }

  if (error instanceof AppError) {
    // 尝试找到用户友好的消息，如果找不到则使用原始消息
    const friendlyMessage = userFriendlySecurityMessages[error.code]?.message 
      || userFriendlyMessages[error.code] 
      || error.message;
    
    const statusCode = userFriendlySecurityMessages[error.code]?.statusCode || error.statusCode;
    
    logHandledError(error, req, res);
    return sendError(res, statusCode, error.code, friendlyMessage, error.detail);
  }

  // 处理未知错误
  logUnhandledError(error, req, res);
  const friendlyMessage = userFriendlyMessages['INTERNAL_ERROR'] || 'Internal server error';
  return sendError(res, 500, 'INTERNAL_ERROR', friendlyMessage, 'An unexpected error occurred');
}
