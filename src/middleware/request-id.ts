import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

/**
 * 请求ID追踪中间件
 * 
 * 功能：
 * 1. 从请求头读取 x-request-id，如果没有则生成8位UUID
 * 2. 设置响应头 x-request-id
 * 3. 将requestId附加到请求对象，供后续中间件和控制器使用
 * 4. 在日志中输出requestId（通过res.locals.requestId传递给logger中间件）
 */
export function requestId() {
  return (req: Request, res: Response, next: NextFunction) => {
    // 从请求头读取或生成8位的requestId
    let id = req.headers['x-request-id'] as string;
    
    if (!id || id.trim() === '') {
      // 生成8位UUID：取标准UUID的前8位字符
      id = randomUUID().split('-')[0].slice(0, 8);
    } else {
      // 清理并限制长度为8位
      id = id.trim().slice(0, 8);
    }
    
    // 设置请求和响应头
    req.headers['x-request-id'] = id;
    res.setHeader('x-request-id', id);
    
    // 将requestId存储在res.locals中，供后续中间件（如requestLogger）使用
    res.locals.requestId = id;
    
    // 将requestId附加到请求对象，方便控制器访问
    (req as any).requestId = id;
    
    next();
  };
}