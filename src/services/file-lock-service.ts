import { writeFile, unlink, stat } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_TIMEOUT_MS = 5000;
const POLL_INTERVAL_MS = 50;

class FileLockService {
  private readonly activeLocks = new Set<string>();

  private lockPath(filePath: string): string {
    return `${filePath}.lock`;
  }

  /**
   * Acquire a file lock. Creates a `.lock` file atomically.
   * If lock already exists and is stale (older than timeoutMs), force-remove it.
   * Retries until timeoutMs elapsed.
   */
  async acquireLock(filePath: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<boolean> {
    const lockFile = this.lockPath(filePath);
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        // wx = exclusive create – fails if file already exists
        await writeFile(lockFile, JSON.stringify({ pid: process.pid, ts: Date.now() }), { flag: 'wx' });
        this.activeLocks.add(filePath);
        return true;
      } catch (err: any) {
        if (err?.code === 'EEXIST') {
          // Lock file exists – check if stale
          try {
            const st = await stat(lockFile);
            if (Date.now() - st.mtimeMs > timeoutMs) {
              // Stale lock – force remove and retry immediately
              await unlink(lockFile).catch(() => {});
              continue;
            }
          } catch {
            // Lock file disappeared between check – retry
            continue;
          }
          // Wait a bit before retrying
          await this.sleep(POLL_INTERVAL_MS);
        } else {
          throw err;
        }
      }
    }

    return false; // timed out
  }

  /**
   * Release a file lock by removing the `.lock` file.
   */
  async releaseLock(filePath: string): Promise<void> {
    const lockFile = this.lockPath(filePath);
    this.activeLocks.delete(filePath);
    await unlink(lockFile).catch(() => {});
  }

  /**
   * Execute a callback while holding the lock.
   */
  async withLock<T>(filePath: string, fn: () => Promise<T>, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<T> {
    const acquired = await this.acquireLock(filePath, timeoutMs);
    if (!acquired) {
      throw new Error(`Failed to acquire lock for ${path.basename(filePath)} within ${timeoutMs}ms`);
    }
    try {
      return await fn();
    } finally {
      await this.releaseLock(filePath);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const fileLockService = new FileLockService();
