export type CacheNamespace = 'dashboard' | 'agents' | 'templates.list' | 'health';

export type CacheRecord<T> = {
  value: T;
  fetchedAt: number;
  expiresAt: number;
  staleUntil: number;
};

export type TemplateMeta = {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
};

export type TemplateDefinition = TemplateMeta & {
  config: Record<string, unknown>;
  rawYaml: string;
};

export type AgentStatus = 'working' | 'idle' | 'blocked' | 'backlog' | 'error' | 'offline' | 'unknown';

export type AgentStatusDetail = {
  state: AgentStatus;
  lastActiveAt: string | null;
  currentTask: string | null;
  pendingTaskCount: number;
};

export type AgentSummary = {
  id: string;
  name: string;
  status: AgentStatus;
  lastActive: string | null;
  summaryTags: string[];
  statusDetail?: AgentStatusDetail;
};

export type DashboardPayload = {
  system: {
    status: 'normal' | 'warning' | 'error' | 'unknown';
    uptime: string;
    version: string;
    lastCheck: string;
    performance: {
      avgResponseMs: number;
      health: 'healthy' | 'degrading' | 'failing';
    };
  };
  agents: {
    total: number;
    active: number;
    statusBreakdown: Record<string, number>;
    quickStats: Array<{ name: string; value: string; trend: string }>;
  };
  workspaces: {
    activeCount: number;
    recentActivity: Array<{
      name: string;
      status: string;
      agentCount: number;
      lastUpdated: string;
    }>;
  };
  alerts: Array<{
    level: 'warning' | 'error';
    type: 'agent_health' | 'task_failure' | 'system_performance';
    message: string;
    suggestion: string;
    timestamp: string;
  }>;
};

export type HealthPayload = {
  service: { status: 'ok' };
  gateway: { status: 'ok' | 'degraded' | 'unreachable' };
  checkedAt: string;
};

export type TemplateApplyPayload = {
  templateId: string;
  targetAgentId: string;
  appliedAt: string;
  message: string;
  appliedFields: string[];
  effectiveScope: 'agent_config';
  runtimeEffect: 'validated_config_updated';
};

export type TemplateApplyPreview = {
  templateId: string;
  targetAgentId: string;
  previewAt: string;
  changes: Record<string, { from: any; to: any }>;
  appliedFields: string[];
  willBeApplied: boolean;
  validationPassed: boolean;
  dryRun: boolean;
};
