const AGENT_DISPLAY_NAME_FALLBACK: Record<string, string> = {
  'orchestrator-teemo': '项目指挥官',
  'product-ekko': '产品经理',
  'architect-jax': '架构师',
  'frontend-ezreal': '前端工程师',
  'backend-leona': '后端工程师',
  'codingqa-galio': '质量工程师',
  'ui-lux': '设计师',
  'aioffice-jayce': '办公顾问',
  'technical-advisor-ryze': '技术顾问',
  main: '平台总控',
};

export function resolveAgentDisplayName(agentId: string, ...candidates: Array<string | null | undefined>): string {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return AGENT_DISPLAY_NAME_FALLBACK[agentId] ?? agentId;
}
