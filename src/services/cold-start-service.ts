/**
 * ColdStartService — 冷启动快照服务（二期）
 *
 * 新会话/新角色进入时，能在10秒内重建项目上下文。
 * - 聚合项目阶段、活跃对象、最近事件、Agent 状态、阻塞项
 * - 定时更新（5分钟间隔）
 * - 快照写入 data/cold-start-snapshot.json
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { stateMachineService } from './state-machine-service.js';
import { registryService } from './registry-service.js';
import { eventLogService } from './event-log-service.js';
import { agentService } from './agent-service.js';
import { log } from '../utils/logger.js';

// ── Snapshot types ─────────────────────────────────────────────────

export interface ColdStartSnapshot {
  generatedAt: string;
  projectStage: {
    currentStage: string;
    previousStage: string | null;
    blockReason: string | null;
  };
  activeObjectCount: number;
  activeObjects: Array<{
    object_id: string;
    type: string;
    title: string;
    owner: string;
    status: string;
  }>;
  recentEvents: Array<{
    ts: string;
    event_type: string;
    source_role: string;
    description: string;
  }>;
  agentSummary: Array<{
    id: string;
    name: string;
    status: string;
    currentTask: string | null;
  }>;
  blockers: Array<{
    source: string;
    id: string;
    description: string;
  }>;
}

// ── Constants ──────────────────────────────────────────────────────

const SNAPSHOT_PATH = path.resolve(process.cwd(), 'data', 'cold-start-snapshot.json');
const UPDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ── Service ────────────────────────────────────────────────────────

class ColdStartService {
  private snapshot: ColdStartSnapshot | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  /**
   * Build a fresh cold-start snapshot by aggregating data from all services.
   */
  async buildSnapshot(): Promise<ColdStartSnapshot> {
    const [stageInfo, activeObjects, recentEvents, agents] = await Promise.all([
      stateMachineService.getCurrentStage().catch(() => ({
        currentStage: 'unknown' as const,
        previousStage: null,
        blockReason: null,
      })),
      registryService.query({ status: 'active', limit: 10 }).catch(() => []),
      eventLogService.readRecent({ limit: 5 }).catch(() => []),
      agentService.listAgents().catch(() => []),
    ]);

    // Derive blockers from multiple sources
    const blockers: ColdStartSnapshot['blockers'] = [];

    // 1. Project-level block
    if (stageInfo.currentStage === 'blocked' && stageInfo.blockReason) {
      blockers.push({
        source: 'project-state',
        id: 'project-blocked',
        description: stageInfo.blockReason,
      });
    }

    // 2. Blocked agents
    for (const agent of agents) {
      if (agent.status === 'blocked') {
        blockers.push({
          source: 'agent',
          id: agent.id,
          description: agent.statusDetail?.currentTask ?? `Agent ${agent.name} is blocked`,
        });
      }
    }

    // 3. Blocked registry objects
    const blockedObjects = await registryService.query({ status: 'blocked', limit: 5 }).catch(() => []);
    for (const obj of blockedObjects) {
      blockers.push({
        source: 'registry',
        id: obj.object_id,
        description: obj.title,
      });
    }

    const snapshot: ColdStartSnapshot = {
      generatedAt: new Date().toISOString(),
      projectStage: {
        currentStage: stageInfo.currentStage,
        previousStage: stageInfo.previousStage ?? null,
        blockReason: stageInfo.blockReason ?? null,
      },
      activeObjectCount: activeObjects.length,
      activeObjects: activeObjects.map((o) => ({
        object_id: o.object_id,
        type: o.type,
        title: o.title,
        owner: o.owner,
        status: o.status,
      })),
      recentEvents: recentEvents.map((e) => ({
        ts: e.ts,
        event_type: e.event_type,
        source_role: e.source_role,
        description: e.description,
      })),
      agentSummary: agents.map((a) => ({
        id: a.id,
        name: a.name,
        status: a.status,
        currentTask: a.statusDetail?.currentTask ?? null,
      })),
      blockers,
    };

    // Persist to disk
    try {
      await mkdir(path.dirname(SNAPSHOT_PATH), { recursive: true });
      await writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), 'utf8');
    } catch (err) {
      log('warn', 'cold_start_snapshot_write_failed', {
        err: err instanceof Error ? err.message : String(err),
      });
    }

    this.snapshot = snapshot;
    return snapshot;
  }

  /**
   * Get the current cached snapshot (or build one if none exists).
   */
  async getSnapshot(): Promise<ColdStartSnapshot> {
    if (this.snapshot) return this.snapshot;
    return this.buildSnapshot();
  }

  /**
   * Start the service: build initial snapshot + schedule periodic updates.
   */
  start(): void {
    // Initial build (non-blocking)
    void this.buildSnapshot()
      .then(() => log('info', 'cold_start_initial_snapshot_built', {}))
      .catch((err) =>
        log('warn', 'cold_start_initial_snapshot_failed', {
          err: err instanceof Error ? err.message : String(err),
        }),
      );

    // Periodic refresh
    this.timer = setInterval(() => {
      void this.buildSnapshot().catch((err) =>
        log('warn', 'cold_start_periodic_snapshot_failed', {
          err: err instanceof Error ? err.message : String(err),
        }),
      );
    }, UPDATE_INTERVAL_MS);

    // Allow process to exit even if timer is still running
    if (this.timer.unref) {
      this.timer.unref();
    }

    log('info', 'cold_start_service_started', { intervalMs: UPDATE_INTERVAL_MS });
  }

  /**
   * Stop periodic updates.
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const coldStartService = new ColdStartService();
