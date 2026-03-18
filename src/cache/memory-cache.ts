import fs from 'node:fs';
import path from 'node:path';
import type { CacheNamespace, CacheRecord } from '../types/domain.js';

const SNAPSHOT_DIR = path.resolve(process.cwd(), 'data');
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, 'cache-snapshots.json');

type CacheSnapshotShape = Partial<Record<CacheNamespace, CacheRecord<unknown>>>;

function isCacheRecord(value: unknown): value is CacheRecord<unknown> {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.fetchedAt === 'number'
    && typeof record.expiresAt === 'number'
    && typeof record.staleUntil === 'number'
    && 'value' in record;
}

export class MemoryCache {
  private readonly store = new Map<string, CacheRecord<unknown>>();

  constructor() {
    this.loadSnapshots();
  }

  get<T>(key: CacheNamespace): CacheRecord<T> | null {
    return (this.store.get(key) as CacheRecord<T> | undefined) ?? null;
  }

  set<T>(key: CacheNamespace, value: CacheRecord<T>) {
    this.store.set(key, value as CacheRecord<unknown>);
    this.persistSnapshots();
  }

  private loadSnapshots() {
    try {
      if (!fs.existsSync(SNAPSHOT_FILE)) return;
      const parsed = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8')) as CacheSnapshotShape;
      for (const [key, value] of Object.entries(parsed)) {
        if (isCacheRecord(value)) {
          this.store.set(key, value);
        }
      }
    } catch {
      // ignore invalid snapshots and start with empty in-memory cache
    }
  }

  private persistSnapshots() {
    try {
      fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
      const payload = Object.fromEntries(this.store.entries());
      fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(payload, null, 2));
    } catch {
      // snapshot persistence is best-effort for MVP verification support
    }
  }
}

export const memoryCache = new MemoryCache();
