import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { eventLogService } from './event-log-service.js';

// ── Stage definitions ──────────────────────────────────────────────

export type ProjectStage = 'init' | 'active' | 'review' | 'closing' | 'archived' | 'blocked';

const ORDERED_STAGES: ProjectStage[] = ['init', 'active', 'review', 'closing', 'archived'];

/**
 * Transition matrix: current → set of allowed targets.
 * blocked is handled specially (any non-archived stage can enter; restore returns to previous).
 */
const FORWARD_TRANSITIONS: Record<string, ProjectStage[]> = {
  init: ['active', 'blocked'],
  active: ['review', 'blocked'],
  review: ['closing', 'active', 'blocked'],   // active = rollback
  closing: ['archived', 'review', 'blocked'],  // review = rollback
  archived: [],                                 // terminal
  blocked: [],                                  // restore handled separately
};

// ── State persistence model ────────────────────────────────────────

export interface TransitionRecord {
  from: ProjectStage;
  to: ProjectStage;
  reason: string;
  timestamp: string;
  actor: string;
}

export interface ProjectState {
  projectId: string;
  currentStage: ProjectStage;
  previousStage: ProjectStage | null;
  blockReason: string | null;
  lastTransition: TransitionRecord | null;
  history: TransitionRecord[];
}

// ── Service ────────────────────────────────────────────────────────

const DEFAULT_PROJECT_ID = 'office-console-enhanced';

const STATE_FILE = path.resolve(process.cwd(), 'data', 'project-state.json');

function defaultState(projectId: string): ProjectState {
  return {
    projectId,
    currentStage: 'init',
    previousStage: null,
    blockReason: null,
    lastTransition: null,
    history: [],
  };
}

function isValidStage(s: string): s is ProjectStage {
  return ORDERED_STAGES.includes(s as ProjectStage) || s === 'blocked';
}

class StateMachineService {
  // ── Read state ─────────────────────────────────────────────────

  async loadState(projectId: string = DEFAULT_PROJECT_ID): Promise<ProjectState> {
    try {
      const raw = await readFile(STATE_FILE, 'utf8');
      const state = JSON.parse(raw) as ProjectState;
      if (state.projectId === projectId) return state;
    } catch {
      // file missing / corrupt → default
    }
    return defaultState(projectId);
  }

  private async saveState(state: ProjectState): Promise<void> {
    await mkdir(path.dirname(STATE_FILE), { recursive: true });
    await writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  }

  // ── Public API ─────────────────────────────────────────────────

  async getCurrentStage(projectId: string = DEFAULT_PROJECT_ID): Promise<{
    projectId: string;
    currentStage: ProjectStage;
    previousStage: ProjectStage | null;
    blockReason: string | null;
    lastTransition: TransitionRecord | null;
  }> {
    const s = await this.loadState(projectId);
    return {
      projectId: s.projectId,
      currentStage: s.currentStage,
      previousStage: s.previousStage,
      blockReason: s.blockReason,
      lastTransition: s.lastTransition,
    };
  }

  async transitionStage(
    projectId: string = DEFAULT_PROJECT_ID,
    nextStage: string,
    reason: string,
    actor: string = 'system',
  ): Promise<{ success: true; state: ProjectState } | { success: false; error: string; code: string; allowedTargets?: ProjectStage[] }> {
    if (!isValidStage(nextStage)) {
      return { success: false, error: `Unknown stage: ${nextStage}`, code: 'UNKNOWN_STAGE' };
    }

    const state = await this.loadState(projectId);
    const current = state.currentStage;

    // ── Handle restore from blocked ──
    if (current === 'blocked') {
      if (nextStage === 'blocked') {
        return { success: false, error: 'Already blocked', code: 'ALREADY_BLOCKED' };
      }
      // Can only restore to previousStage
      if (state.previousStage && nextStage !== state.previousStage) {
        return {
          success: false,
          error: `Blocked projects can only restore to previous stage (${state.previousStage})`,
          code: 'BLOCKED_RESTORE_MISMATCH',
          allowedTargets: [state.previousStage],
        };
      }
      // Restore
      return this.applyTransition(state, nextStage as ProjectStage, reason, actor, true);
    }

    // ── Handle entering blocked ──
    if (nextStage === 'blocked') {
      if (current === 'archived') {
        return { success: false, error: 'Archived projects cannot be blocked', code: 'PROJECT_ARCHIVED' };
      }
      state.previousStage = current;
      state.blockReason = reason;
      return this.applyTransition(state, 'blocked', reason, actor, false);
    }

    // ── Normal / rollback transition ──
    if (current === 'archived') {
      return { success: false, error: 'Archived projects cannot transition', code: 'PROJECT_ARCHIVED' };
    }

    const allowed = FORWARD_TRANSITIONS[current] ?? [];
    if (!allowed.includes(nextStage as ProjectStage)) {
      return {
        success: false,
        error: `Transition from "${current}" to "${nextStage}" is not allowed`,
        code: 'INVALID_TRANSITION',
        allowedTargets: allowed.filter((s) => s !== 'blocked'),
      };
    }

    return this.applyTransition(state, nextStage as ProjectStage, reason, actor, false);
  }

  // ── Internal ───────────────────────────────────────────────────

  private async applyTransition(
    state: ProjectState,
    nextStage: ProjectStage,
    reason: string,
    actor: string,
    isRestore: boolean,
  ): Promise<{ success: true; state: ProjectState }> {
    const prev = state.currentStage;

    const record: TransitionRecord = {
      from: prev,
      to: nextStage,
      reason,
      timestamp: new Date().toISOString(),
      actor,
    };

    state.currentStage = nextStage;
    state.lastTransition = record;
    state.history.push(record);

    // Clear block metadata on restore or when leaving blocked
    if (isRestore || (prev === 'blocked' && nextStage !== 'blocked')) {
      state.previousStage = null;
      state.blockReason = null;
    }

    // If entering blocked, previousStage was already set by caller
    // If normal forward/rollback, clear previousStage (not blocked)
    if (nextStage !== 'blocked' && prev !== 'blocked') {
      state.previousStage = null;
      state.blockReason = null;
    }

    await this.saveState(state);

    // Log event
    eventLogService.append({
      event_type: 'object.status_changed',
      source_role: actor,
      description: `项目阶段转移: ${prev} → ${nextStage}${reason ? ` (${reason})` : ''}`,
      object_id: `project-${state.projectId}`,
      prev_state: { stage: prev },
      next_state: { stage: nextStage },
      context: { reason, actor, isRestore },
    });

    return { success: true, state };
  }
}

export const stateMachineService = new StateMachineService();
