export type LogLevel = 'info' | 'warn' | 'error';

function sanitizeMeta(meta: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(meta).filter(([, value]) => value !== undefined));
}

export function log(level: LogLevel, event: string, meta: Record<string, unknown> = {}) {
  const line = {
    ts: new Date().toISOString(),
    level,
    event,
    ...sanitizeMeta(meta),
  };
  const rendered = JSON.stringify(line);
  if (level === 'error') {
    console.error(rendered);
    return;
  }
  if (level === 'warn') {
    console.warn(rendered);
    return;
  }
  console.log(rendered);
}
