export interface DiffSummary {
  added_lines: number;
  removed_lines: number;
  summary: string;
}

function normalizeLines(input: string): string[] {
  return input.replace(/\r\n/g, '\n').split('\n');
}

export function generateDiffSummary(before: string, after: string): DiffSummary {
  const beforeLines = normalizeLines(before);
  const afterLines = normalizeLines(after);

  let prefix = 0;
  while (
    prefix < beforeLines.length &&
    prefix < afterLines.length &&
    beforeLines[prefix] === afterLines[prefix]
  ) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix < beforeLines.length - prefix &&
    suffix < afterLines.length - prefix &&
    beforeLines[beforeLines.length - 1 - suffix] === afterLines[afterLines.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const removed_lines = Math.max(0, beforeLines.length - prefix - suffix);
  const added_lines = Math.max(0, afterLines.length - prefix - suffix);

  const parts: string[] = [];
  if (added_lines > 0) parts.push(`+${added_lines}行`);
  if (removed_lines > 0) parts.push(`-${removed_lines}行`);
  const summary = parts.length > 0 ? parts.join(' ') : '无变更';

  return { added_lines, removed_lines, summary };
}
