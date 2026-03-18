/**
 * FileWatcher — 文件系统变更监控
 *
 * Iter-1 新增：监控项目目录变更，联动 SSE 推送到浏览器
 * 替代轮询刷新机制，实现近实时文件感知
 */

import { watch, existsSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { log } from '../utils/logger.js';

export interface FileChangeEvent {
  eventType: 'rename' | 'change';
  filename: string;
  dir: string;
  timestamp: number;
}

export class FileWatcher extends EventEmitter {
  private watchers: ReturnType<typeof watch>[] = [];
  private debounceMap = new Map<string, NodeJS.Timeout>();
  private readonly debounceMs: number;

  constructor(debounceMs = 200) {
    super();
    this.debounceMs = debounceMs;
  }

  /** 监控某个目录（包含子目录）的文件变更 */
  watchDirectory(dir: string, recursive = true): boolean {
    if (!existsSync(dir)) {
      log('warn', 'file_watcher_dir_not_found', { dir });
      return false;
    }

    try {
      const watcher = watch(dir, { recursive }, (eventType, filename) => {
        if (!filename) return;
        // 过滤隐藏文件和 node_modules
        if (filename.startsWith('.') || filename.includes('node_modules')) return;

        // 防抖：同一文件 debounceMs 内只触发一次
        const key = `${dir}::${filename}`;
        if (this.debounceMap.has(key)) {
          clearTimeout(this.debounceMap.get(key)!);
        }

        const timer = setTimeout(() => {
          this.debounceMap.delete(key);
          const event: FileChangeEvent = {
            eventType: eventType as 'rename' | 'change',
            filename,
            dir,
            timestamp: Date.now(),
          };
          this.emit('change', event);
          log('info', 'file_watcher_change', { dir, filename, eventType });
        }, this.debounceMs);

        this.debounceMap.set(key, timer);
      });

      watcher.on('error', (err) => {
        log('warn', 'file_watcher_error', { dir, err: String(err) });
      });

      this.watchers.push(watcher);
      log('info', 'file_watcher_started', { dir, recursive });
      return true;
    } catch (err) {
      log('warn', 'file_watcher_start_failed', { dir, err: String(err) });
      return false;
    }
  }

  /** 停止所有监控 */
  close(): void {
    for (const timer of this.debounceMap.values()) {
      clearTimeout(timer);
    }
    this.debounceMap.clear();

    for (const watcher of this.watchers) {
      try { watcher.close(); } catch { /* ignore */ }
    }
    this.watchers = [];
    log('info', 'file_watcher_closed', {});
  }

  get watcherCount(): number {
    return this.watchers.length;
  }
}

/** 全局单例 */
let _instance: FileWatcher | null = null;

export function initFileWatcher(debounceMs?: number): FileWatcher {
  _instance = new FileWatcher(debounceMs);
  return _instance;
}

export function getFileWatcher(): FileWatcher {
  if (!_instance) {
    _instance = new FileWatcher();
  }
  return _instance;
}
