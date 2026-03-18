/**
 * FileReader — 直接读取 OpenClaw 运行时文件
 *
 * Iter-1 新增：替代 execFile('openclaw', ...) 的核心数据层
 * 零网络开销，毫秒级响应
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';

export interface FileReaderConfig {
  /** OpenClaw 根目录，默认 ~/.openclaw */
  openclawRoot: string;
}

export interface AgentConfig {
  id: string;
  name?: string;
  workspace?: string;
  agentDir?: string;
  model?: {
    primary?: string;
    fallbacks?: string[];
  };
  identity?: {
    name?: string;
    emoji?: string;
  };
}

export interface OpenClawConfig {
  meta?: {
    lastTouchedVersion?: string;
    lastTouchedAt?: string;
  };
  agents?: {
    defaults?: any;
    list?: AgentConfig[];
  };
  [key: string]: any;
}

export class OpenClawFileReader {
  readonly root: string;

  constructor(config: FileReaderConfig) {
    this.root = resolve(config.openclawRoot.replace(/^~/, homedir()));
  }

  /** 读取 openclaw.json 主配置 */
  async readConfig(): Promise<OpenClawConfig> {
    return this.readJson(join(this.root, 'openclaw.json'));
  }

  /** 获取所有 agent 目录名 */
  async listAgentDirs(): Promise<string[]> {
    try {
      const entries = await readdir(join(this.root, 'agents'));
      return entries;
    } catch {
      return [];
    }
  }

  /** 从 openclaw.json 获取 agent 配置列表 */
  async listAgentConfigs(): Promise<AgentConfig[]> {
    const config = await this.readConfig();
    return config.agents?.list ?? [];
  }

  /** 获取指定 agent 的配置 */
  async readAgentConfig(agentId: string): Promise<AgentConfig | null> {
    const agents = await this.listAgentConfigs();
    return agents.find((a) => a.id === agentId) ?? null;
  }

  /** 列出某 agent 的 session 文件列表 */
  async listSessionFiles(agentId: string): Promise<string[]> {
    const sessionsDir = join(this.root, 'agents', agentId, 'sessions');
    try {
      const files = await readdir(sessionsDir);
      // 只返回活跃 session（非 .deleted / .reset 文件）
      return files.filter((f) => f.endsWith('.jsonl') && !f.includes('.deleted') && !f.includes('.reset'));
    } catch {
      return [];
    }
  }

  /** 获取某 agent 最近 session 的修改时间（用于推算活跃状态） */
  async getAgentLastActiveMs(agentId: string): Promise<number | null> {
    const sessionsDir = join(this.root, 'agents', agentId, 'sessions');
    try {
      const files = await readdir(sessionsDir);
      const active = files.filter((f) => f.endsWith('.jsonl') && !f.includes('.deleted') && !f.includes('.reset'));
      if (!active.length) return null;

      // 取最新修改时间
      const stats = await Promise.all(
        active.map((f) => stat(join(sessionsDir, f)).then((s) => s.mtimeMs).catch(() => 0))
      );
      const max = Math.max(...stats);
      return max > 0 ? max : null;
    } catch {
      return null;
    }
  }

  /** 读取 agent workspace 内某文件（如 SOUL.md / IDENTITY.md） */
  async readWorkspaceFile(agentId: string, relativePath: string): Promise<string | null> {
    const agentCfg = await this.readAgentConfig(agentId);
    if (!agentCfg?.workspace) return null;
    try {
      return await readFile(join(agentCfg.workspace, relativePath), 'utf-8');
    } catch {
      return null;
    }
  }

  /** 读取项目文件 */
  async readProjectFile(filePath: string): Promise<string> {
    return readFile(filePath, 'utf-8');
  }

  /** 列出目录内容 */
  async listDir(dirPath: string): Promise<string[]> {
    try {
      return await readdir(dirPath);
    } catch {
      return [];
    }
  }

  /** 通用 JSON 读取 */
  async readJson<T = any>(filePath: string): Promise<T> {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  }

  /** 获取文件 stat（存在性检查 + 修改时间） */
  async fileStat(filePath: string): Promise<{ exists: boolean; mtimeMs: number }> {
    try {
      const s = await stat(filePath);
      return { exists: true, mtimeMs: s.mtimeMs };
    } catch {
      return { exists: false, mtimeMs: 0 };
    }
  }
}

/** 全局单例（由 server.ts 初始化后注入） */
let _instance: OpenClawFileReader | null = null;

export function initFileReader(config: FileReaderConfig): OpenClawFileReader {
  _instance = new OpenClawFileReader(config);
  return _instance;
}

export function getFileReader(): OpenClawFileReader {
  if (!_instance) {
    // 兜底：使用默认路径
    _instance = new OpenClawFileReader({ openclawRoot: '~/.openclaw' });
  }
  return _instance;
}
