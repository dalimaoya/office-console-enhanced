import { appendFile, mkdir, open, readFile } from 'node:fs/promises';
import path from 'node:path';

export type EventLogDomain = 'system' | 'role' | 'object' | 'security';
export type EventLogType =
  | 'system.start'
  | 'system.stop'
  | 'system.restart'
  | 'system.healthcheck_passed'
  | 'system.healthcheck_failed'
  | 'system.dependency_error'
  | 'system.dependency_recovered'
  | 'role.task_started'
  | 'role.task_completed'
  | 'role.task_blocked'
  | 'role.task_escalated'
  | 'role.handoff_sent'
  | 'role.handoff_received'
  | 'object.created'
  | 'object.updated'
  | 'object.status_changed'
  | 'object.registered'
  | 'object.handoff_linked'
  | 'object.archived'
  | 'security.readonly_enabled'
  | 'security.dryrun_executed'
  | 'security.operation_denied'
  | 'security.permission_missing'
  | 'security.write_blocked';

export interface EventLogRecord {
  ts: string;
  event_type: EventLogType;
  source_role: string;
  description: string;
  object_id: string | null;
  prev_state?: Record<string, unknown> | null;
  next_state?: Record<string, unknown> | null;
  error?: {
    code?: string;
    summary?: string;
    detail?: string;
  } | null;
  context?: Record<string, unknown> | null;
}

export interface EventLogQuery {
  limit?: number;
  type?: string;
  role?: string;
}

const EVENT_LOG_PATH = path.resolve(process.cwd(), 'data', 'events.ndjson');

function getDomain(eventType: string): EventLogDomain | null {
  const domain = eventType.split('.')[0];
  if (domain === 'system' || domain === 'role' || domain === 'object' || domain === 'security') {
    return domain;
  }
  return null;
}

class EventLogService {
  private readonly logPath = EVENT_LOG_PATH;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.ensureLogFile();
  }

  private async ensureLogFile(): Promise<void> {
    try {
      await mkdir(path.dirname(this.logPath), { recursive: true });
      const handle = await open(this.logPath, 'a');
      await handle.close();
    } catch {
      // best-effort only
    }
  }

  init(): void {
    void this.initPromise;
  }

  append(input: Omit<EventLogRecord, 'ts'> & { ts?: string }): void {
    void (async () => {
      try {
        await this.initPromise;
        const record: EventLogRecord = {
          ts: input.ts ?? new Date().toISOString(),
          event_type: input.event_type,
          source_role: input.source_role,
          description: input.description,
          object_id: input.object_id ?? null,
          ...(input.prev_state !== undefined ? { prev_state: input.prev_state } : {}),
          ...(input.next_state !== undefined ? { next_state: input.next_state } : {}),
          ...(input.error !== undefined ? { error: input.error } : {}),
          ...(input.context !== undefined ? { context: input.context } : {}),
        };
        await appendFile(this.logPath, `${JSON.stringify(record)}\n`, 'utf8');
      } catch {
        // event log write must never break main flow
      }
    })();
  }

  async readRecent(query: EventLogQuery = {}): Promise<EventLogRecord[]> {
    try {
      await this.initPromise;
      const raw = await readFile(this.logPath, 'utf8');
      const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
      const items = raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line) as EventLogRecord;
          } catch {
            return null;
          }
        })
        .filter((item): item is EventLogRecord => Boolean(item));

      const filtered = items.filter((item) => {
        if (query.type) {
          const domain = getDomain(item.event_type);
          if (item.event_type !== query.type && domain !== query.type) {
            return false;
          }
        }
        if (query.role && item.source_role !== query.role) {
          return false;
        }
        return true;
      });

      return filtered.reverse().slice(0, limit);
    } catch {
      return [];
    }
  }
}

export const eventLogService = new EventLogService();
export const EVENT_LOG_FILE_PATH = EVENT_LOG_PATH;
