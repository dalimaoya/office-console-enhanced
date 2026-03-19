import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type NotificationType = 'info' | 'warn' | 'error' | 'success';
export type NotificationStatus = 'unread' | 'read' | 'snoozed';

export interface PersistentNotification {
  id: string;
  ts: string;
  type: NotificationType;
  title: string;
  body: string;
  source: string;
  status: NotificationStatus;
  snoozed_until: string | null;
}

const NOTIFICATIONS_PATH = path.resolve(process.cwd(), 'data', 'notifications.json');

async function ensureDataFile(): Promise<void> {
  await mkdir(path.dirname(NOTIFICATIONS_PATH), { recursive: true });
  try {
    await readFile(NOTIFICATIONS_PATH, 'utf8');
  } catch {
    await writeFile(NOTIFICATIONS_PATH, '[]\n', 'utf8');
  }
}

async function readNotifications(): Promise<PersistentNotification[]> {
  await ensureDataFile();
  try {
    const raw = await readFile(NOTIFICATIONS_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeNotifications(items: PersistentNotification[]): Promise<void> {
  await ensureDataFile();
  await writeFile(NOTIFICATIONS_PATH, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
}

function sortByTsDesc(items: PersistentNotification[]): PersistentNotification[] {
  return [...items].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
}

export async function listNotifications(params?: {
  status?: NotificationStatus;
  limit?: number;
}): Promise<{ items: PersistentNotification[]; unread_count: number }> {
  const all = await readNotifications();
  const unread_count = all.filter((item) => item.status === 'unread').length;
  const filtered = params?.status ? all.filter((item) => item.status === params.status) : all;
  const sorted = sortByTsDesc(filtered);
  const limit = Math.max(1, Math.min(params?.limit ?? 20, 200));
  return {
    items: sorted.slice(0, limit),
    unread_count,
  };
}

export async function getUnreadNotificationCount(): Promise<number> {
  const all = await readNotifications();
  return all.filter((item) => item.status === 'unread').length;
}

export async function acknowledgeNotification(id: string): Promise<boolean> {
  const all = await readNotifications();
  const index = all.findIndex((item) => item.id === id);
  if (index === -1) return false;
  all[index] = { ...all[index], status: 'read', snoozed_until: null };
  await writeNotifications(all);
  return true;
}

export async function snoozeNotification(id: string, minutes: number): Promise<string | null> {
  const all = await readNotifications();
  const index = all.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  all[index] = { ...all[index], status: 'snoozed', snoozed_until: snoozedUntil };
  await writeNotifications(all);
  return snoozedUntil;
}

export async function createNotification(input: {
  type: NotificationType;
  title: string;
  body: string;
  source: string;
}): Promise<string> {
  const all = await readNotifications();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  all.push({
    id,
    ts: new Date().toISOString(),
    type: input.type,
    title: input.title,
    body: input.body,
    source: input.source,
    status: 'unread',
    snoozed_until: null,
  });
  await writeNotifications(all);
  return id;
}
