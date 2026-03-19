import { appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';

export interface RegistryEntry {
  object_id: string;
  type: string;
  title: string;
  project: string;
  owner: string;
  status: string;
  created_at: string;
  file_path: string;
}

export interface RegistryQuery {
  status?: string;
  type?: string;
  limit?: number;
}

const REGISTRY_PATH = path.resolve(
  '/root/.openclaw/workspace/projects/office-console-enhanced/registry/objects.md',
);

/**
 * Parse a Markdown table from objects.md into structured records.
 * Robust: skips blank lines, comment lines, header/separator rows.
 */
function parseMarkdownTable(raw: string): RegistryEntry[] {
  const lines = raw.split('\n');
  const entries: RegistryEntry[] = [];
  let headerFound = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // skip empty lines & comment-like lines
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('**') || trimmed.startsWith('---')) {
      continue;
    }

    // must be a pipe-delimited row
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
      continue;
    }

    const cells = trimmed
      .slice(1, -1) // strip leading/trailing |
      .split('|')
      .map((c) => c.trim());

    // detect separator row (e.g. |---|---|...)
    if (cells.every((c) => /^[-: ]+$/.test(c))) {
      headerFound = true; // next rows are data
      continue;
    }

    // detect header row (contains column names)
    if (!headerFound) {
      // First pipe row before separator is the header – skip it
      continue;
    }

    // data row – expect 8 columns
    if (cells.length < 6) continue;

    entries.push({
      object_id: cells[0] ?? '',
      type: cells[1] ?? '',
      title: cells[2] ?? '',
      project: cells[3] ?? '',
      owner: cells[4] ?? '',
      status: cells[5] ?? '',
      created_at: cells[6] ?? '',
      file_path: cells[7] ?? '',
    });
  }

  return entries;
}

class RegistryService {
  private readonly registryPath = REGISTRY_PATH;

  /**
   * Read and parse the registry, with optional filters.
   */
  async query(q: RegistryQuery = {}): Promise<RegistryEntry[]> {
    let raw: string;
    try {
      raw = await readFile(this.registryPath, 'utf8');
    } catch {
      // file missing or unreadable → empty result
      return [];
    }

    let items = parseMarkdownTable(raw);

    if (q.status) {
      items = items.filter((e) => e.status === q.status);
    }
    if (q.type) {
      items = items.filter((e) => e.type === q.type);
    }

    const limit = Math.min(Math.max(Number(q.limit) || 100, 1), 500);
    return items.slice(0, limit);
  }

  /**
   * Find a single object by its object_id.
   */
  async getById(objectId: string): Promise<RegistryEntry | null> {
    const items = await this.query();
    return items.find((e) => e.object_id === objectId) ?? null;
  }

  /**
   * Append a new record to objects.md (Markdown table row).
   * Internal-only; not exposed via API in phase 1.
   */
  async appendObject(entry: RegistryEntry): Promise<void> {
    const row = `| ${entry.object_id} | ${entry.type} | ${entry.title} | ${entry.project} | ${entry.owner} | ${entry.status} | ${entry.created_at} | ${entry.file_path} |\n`;
    await appendFile(this.registryPath, row, 'utf8');
  }
}

export const registryService = new RegistryService();
