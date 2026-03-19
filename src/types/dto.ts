export type AgentRuntimeStatus = 'working' | 'idle' | 'blocked' | 'backlog' | 'error' | 'offline' | 'unknown';
export type ContextPressureLevel = 'normal' | 'warning' | 'critical';
export type ProjectStage = 'init' | 'active' | 'review' | 'closing' | 'archived' | 'blocked';
export type DiagnosticCheckStatus = 'pass' | 'fail' | 'warn';
export type SystemHealthStatus = 'normal' | 'warning' | 'error' | 'unknown';
export type PerformanceHealth = 'healthy' | 'degrading' | 'failing';
export type AlertLevel = 'warning' | 'error';
export type DashboardAlertType = 'agent_health' | 'task_failure' | 'system_performance';

export interface AlertThresholds {
  contextPressurePercent: number;
  agentIdleMinutes: number;
  costDailyUSD: number;
}

export interface ContextPressureItem {
  agentId: string;
  contextWindowMax: number;
  contextUsedEstimate: number;
  pressureRatio: number;
  level: ContextPressureLevel;
  estimated: boolean;
}

export interface UsageModelBreakdown {
  tokenIn: number;
  tokenOut: number;
  totalToken: number;
  costEstimateUSD: number;
}

export interface UsageData {
  agentId: string;
  displayName: string;
  model: string;
  tokenIn: number;
  tokenOut: number;
  totalToken: number;
  costEstimateUSD: number;
  sessionCount: number;
  estimated: boolean;
  modelBreakdown: Record<string, UsageModelBreakdown>;
}

export interface AgentStatusDetail {
  state: AgentRuntimeStatus;
  lastActiveAt: string | null;
  currentTask: string | null;
  pendingTaskCount: number;
}

export interface AgentStatus {
  id: string;
  displayName: string;
  status: AgentRuntimeStatus;
  lastActiveAt: string | null;
  currentTask: string | null;
  contextPressure?: ContextPressureItem | null;
  summaryTags: string[];
  statusDetail?: AgentStatusDetail;
}

export interface DashboardQuickStat {
  name: string;
  value: string;
  trend: string;
}

export interface DashboardWorkspaceActivity {
  name: string;
  status: string;
  agentCount: number;
  lastUpdated: string;
}

export interface DashboardAlert {
  level: AlertLevel;
  type: DashboardAlertType;
  message: string;
  suggestion: string;
  timestamp: string;
}

export interface ReadinessCheckItem {
  check: string;
  status: DiagnosticCheckStatus;
  detail?: string;
}

export interface ReadinessDimension {
  name: string;
  score: number;
  items: ReadinessCheckItem[];
}

export interface ReadinessScore {
  overall: number;
  dimensions: ReadinessDimension[];
  computedAt: string;
}

export interface DashboardData {
  system: {
    status: SystemHealthStatus;
    uptime: string;
    version: string;
    lastCheck: string;
    performance: {
      avgResponseMs: number;
      health: PerformanceHealth;
    };
  };
  agents: {
    total: number;
    active: number;
    statusBreakdown: Record<string, number>;
    quickStats: DashboardQuickStat[];
  };
  workspaces: {
    activeCount: number;
    recentActivity: DashboardWorkspaceActivity[];
  };
  usage: {
    todayTokens: number;
    todayCost: number;
    period: string;
  };
  alerts: DashboardAlert[];
  readinessScore?: ReadinessScore;
}

export interface DiagnosticCheck {
  name: string;
  status: DiagnosticCheckStatus;
  message: string;
}

export interface DiagnosticResult {
  ok: boolean;
  checks: DiagnosticCheck[];
  summary: string;
}

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

export interface EventLogError {
  code?: string;
  summary?: string;
  detail?: string;
}

export interface EventLogEntry {
  ts: string;
  event_type: string;
  source_role: string;
  description: string;
  object_id: string | null;
  prev_state?: Record<string, unknown> | null;
  next_state?: Record<string, unknown> | null;
  error?: EventLogError | null;
  context?: Record<string, unknown> | null;
}

export interface TransitionRecord {
  from: ProjectStage;
  to: ProjectStage;
  reason: string;
  timestamp: string;
  actor: string;
}

export interface ProjectStatus {
  projectId: string;
  currentStage: ProjectStage;
  previousStage: ProjectStage | null;
  blockReason: string | null;
  lastTransition: TransitionRecord | null;
}
