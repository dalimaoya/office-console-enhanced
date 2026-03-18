import fs from 'node:fs';
import path from 'node:path';
import { log } from '../utils/logger.js';
import { env } from '../config/env.js';
import type { SecurityAuditEvent } from '../utils/security-errors.js';

/**
 * 安全审计日志服务
 * 记录所有安全相关事件：token 验证、只读拒绝、dry-run 操作、实际写操作等
 */
export class AuditService {
  private auditLogPath: string;

  constructor() {
    this.auditLogPath = path.join(env.auditLogDir, 'write-audit.jsonl');
    this.ensureAuditLogDirectory();
  }

  private ensureAuditLogDirectory() {
    if (!fs.existsSync(env.auditLogDir)) {
      fs.mkdirSync(env.auditLogDir, { recursive: true });
    }
  }

  /**
   * 记录安全审计事件
   */
  logSecurityEvent(event: SecurityAuditEvent): void {
    try {
      const logEntry = JSON.stringify(event) + '\n';
      fs.appendFileSync(this.auditLogPath, logEntry, { encoding: 'utf-8' });
      
      // 同时在应用日志中记录（便于调试）
      log('info', 'security_audit_event', {
        traceId: event.traceId,
        eventType: event.eventType,
        method: event.method,
        path: event.path,
        ip: event.ip,
        detail: event.detail,
      });
    } catch (error) {
      log('error', 'audit_log_failed', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * 为请求记录 token 验证结果
   */
  logTokenVerification(
    traceId: string,
    ip: string,
    method: string,
    path: string,
    userAgent: string,
    isAuthenticated: boolean,
    reason: string
  ): void {
    this.logSecurityEvent({
      timestamp: new Date().toISOString(),
      traceId,
      eventType: 'token_verification',
      ip,
      method,
      path,
      userAgent,
      detail: { isAuthenticated, reason },
    });
  }

  /**
   * 记录只读模式下的操作拒绝
   */
  logReadonlyReject(
    traceId: string,
    ip: string,
    method: string,
    path: string,
    userAgent: string,
    reason: string
  ): void {
    this.logSecurityEvent({
      timestamp: new Date().toISOString(),
      traceId,
      eventType: 'readonly_reject',
      ip,
      method,
      path,
      userAgent,
      detail: { reason },
    });
  }

  /**
   * 记录 IP 白名单拒绝
   */
  logIpWhitelistReject(
    traceId: string,
    ip: string,
    method: string,
    path: string,
    userAgent: string,
    allowedOrigins: string[]
  ): void {
    this.logSecurityEvent({
      timestamp: new Date().toISOString(),
      traceId,
      eventType: 'ip_whitelist_reject',
      ip,
      method,
      path,
      userAgent,
      detail: { allowedOrigins },
    });
  }

  /**
   * 记录 dry-run 操作（预演模式）
   */
  logDryRunOperation(
    traceId: string,
    ip: string,
    method: string,
    path: string,
    userAgent: string,
    operation: Record<string, any>
  ): void {
    this.logSecurityEvent({
      timestamp: new Date().toISOString(),
      traceId,
      eventType: 'dry_run_operation',
      ip,
      method,
      path,
      userAgent,
      detail: { operation, dryRun: true },
    });
  }

  /**
   * 记录实际写操作
   */
  logWriteOperation(
    traceId: string,
    ip: string,
    method: string,
    path: string,
    userAgent: string,
    operation: Record<string, any>
  ): void {
    this.logSecurityEvent({
      timestamp: new Date().toISOString(),
      traceId,
      eventType: 'write_operation',
      ip,
      method,
      path,
      userAgent,
      detail: { operation, dryRun: false },
    });
  }

  /**
   * 获取最近的审计日志（用于调试和查看）
   */
  getRecentAuditLogs(limit = 100): string[] {
    try {
      if (!fs.existsSync(this.auditLogPath)) {
        return [];
      }
      const content = fs.readFileSync(this.auditLogPath, 'utf-8');
      const lines = content.trim().split('\n');
      return lines.slice(-limit);
    } catch (error) {
      log('error', 'read_audit_log_failed', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }
}

// 单例实例
export const auditService = new AuditService();