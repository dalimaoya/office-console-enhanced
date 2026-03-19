import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const TIMELINE_LOG_PATH = path.resolve(process.cwd(), 'data', 'timeline.log');

export interface TimelineEventInput {
  type: string;
  agentId?: string;
  taskId?: string;
  summary: string;
  data?: Record<string, unknown>;
}

export interface TimelineEvent extends TimelineEventInput {
  ts: string;
}

export async function appendTimelineEvent(event: TimelineEventInput): Promise<void> {
  try {
    await mkdir(path.dirname(TIMELINE_LOG_PATH), { recursive: true });
    const record: TimelineEvent = {
      ts: new Date().toISOString(),
      ...event,
    };
    await appendFile(TIMELINE_LOG_PATH, `${JSON.stringify(record)}\n`, 'utf8');
  } catch {
    // timeline 写入失败不影响主流程
  }
}

export async function readTimelineEvents(limit = 50, type?: string): Promise<TimelineEvent[]> {
  try {
    const raw = await readFile(TIMELINE_LOG_PATH, 'utf8');
    const items = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as TimelineEvent;
        } catch {
          return null;
        }
      })
      .filter((item): item is TimelineEvent => Boolean(item));

    const filtered = type ? items.filter((item) => item.type === type) : items;
    return filtered.reverse().slice(0, Math.max(1, limit));
  } catch {
    return [];
  }
}
