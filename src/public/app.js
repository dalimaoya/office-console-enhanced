// ─── Agent Chinese Name Map ───────────────────────────────────────────────────
const AGENT_CHINESE_NAMES = {
  'agent-orchestrator-teemo': '提莫（总控）',
  'orchestrator-teemo':       '提莫（总控）',
  'agent-product-ekko':       '艾克（产品）',
  'product-ekko':             '艾克（产品）',
  'agent-architect-jax':      '贾克斯（架构）',
  'architect-jax':            '贾克斯（架构）',
  'agent-frontend-ezreal':    '伊泽瑞尔（前端）',
  'frontend-ezreal':          '伊泽瑞尔（前端）',
  'agent-backend-leona':      '蕾欧娜（后端）',
  'backend-leona':            '蕾欧娜（后端）',
  'agent-codingqa-galio':     '加里奥（测试）',
  'codingqa-galio':           '加里奥（测试）',
  'agent-ui-lux':             '拉克丝（UI）',
  'ui-lux':                   '拉克丝（UI）',
  'agent-aioffice-jayce':     '杰斯（办公顾问）',
  'aioffice-jayce':           '杰斯（办公顾问）',
  'agent-technical-advisor-codex': '瑞兹（技术顾问）',
  'technical-advisor-codex':  '瑞兹（技术顾问）',
  'technical-advisor-ryze':   '瑞兹（技术顾问）',
};

// ─── Channel Icon Map ─────────────────────────────────────────────────────────
const CHANNEL_ICONS = {
  feishu:       '📨 飞书',
  feishu_group: '📨 飞书群',
  telegram:     '📱 Telegram',
  discord:      '💬 Discord',
  slack:        '💬 Slack',
  api:          '🔌 API',
  subagent:     '🔗 子任务',
  web:          '🌐 Web',
};

// ─── Session Status Map ───────────────────────────────────────────────────────
const SESSION_STATUS_MAP = {
  running:   '🟢 运行中',
  active:    '🟢 运行中',
  completed: '✅ 已完成',
  failed:    '❌ 失败',
  error:     '❌ 失败',
  pending:   '⏳ 等待中',
  paused:    '⏸️ 已暂停',
};

// ─── Mock Sessions (fallback when APIs unavailable) ──────────────────────────
const MOCK_SESSIONS = [
  { id: 'mock-001', agentId: 'agent-frontend-ezreal', channel: 'feishu', status: 'running',   startedAt: new Date().toISOString(), parentSessionId: null },
  { id: 'mock-002', agentId: 'agent-backend-leona',   channel: 'feishu', status: 'completed', startedAt: new Date(Date.now() - 3600000).toISOString(), parentSessionId: null },
  { id: 'mock-003', agentId: 'agent-orchestrator-teemo', channel: 'feishu', status: 'pending', startedAt: new Date(Date.now() - 1800000).toISOString(), parentSessionId: 'mock-001' },
];

// ─── Static Tasks Data ───────────────────────────────────────────────────────
const STATIC_TASKS = [
  // Active
  { id: 'iter4-ezreal', filename: '2026-03-17-iter4-frontend-tasks-docs-ezreal.md', name: 'Iter-4 前端内容填充 — Tasks 和 Docs 分区', status: 'active', role: 'frontend-ezreal', date: '2026-03-17', size: '进行中', preview: '# Iter-4 前端内容填充 — Tasks 和 Docs 分区\n\n- 时间：2026-03-17 UTC\n- 角色：frontend-ezreal\n- 阶段：Iter-4 — Tasks 和 Docs 分区内容填充\n\n## 核心任务\n\n实现 Tasks 看板视图与 Docs 文档浏览器，替换 Iter-3 占位符。\n\n## 验收标准\n\nTasks 和 Docs 分区有实质内容，不是空壳占位符。' },
  // Done (recent first)
  { id: 'iter3-ezreal', filename: '2026-03-17-iter3-frontend-navigation-ezreal.md', name: 'Iter-3 前端分区化改造 — 8 大功能分区导航框架', status: 'done', role: 'frontend-ezreal', date: '2026-03-17', size: '3.9 KB', preview: '# Iter-3 前端分区化改造任务记录\n\n- 时间：2026-03-17 UTC\n- 角色：frontend-ezreal\n- 类型：前端改造\n\n8 大分区导航框架，替换单页 Dashboard 为 SPA 多分区结构。\n\n完成状态：✓ 已交付' },
  { id: 'iter2-leona', filename: '2026-03-17-iter2-security-leona.md', name: 'Iter-2 后端安全框架引入', status: 'done', role: 'backend-leona', date: '2026-03-17', size: '9.2 KB', preview: '# Iter-2 后端安全框架引入 — 安全检查与实现结果\n\n- 时间: 2026-03-17 UTC\n- 角色: backend-leona\n- 任务来源: Teemo 调度，Iter-2 安全框架开发\n\nREADONLY_MODE + Token 鉴权 + 写操作 Gate 全量实现。\n\n完成状态：✓ 已交付' },
  { id: 'iter1-sse', filename: '2026-03-17-iter1-frontend-sse-ezreal.md', name: 'Iter-1 前端 SSE 接入', status: 'done', role: 'frontend-ezreal', date: '2026-03-17', size: '6.5 KB', preview: '# Iter-1 前端 SSE 接入任务记录\n\n- 时间：2026-03-16 UTC（夜间全力推进模式）\n- 执行角色：Ezreal（frontend-ezreal）\n- 阶段：Iter-1 — 前端 SSE 接入，替换轮询刷新机制\n\nSSE 实时推送接入，替换原 setInterval 轮询。\n\n完成状态：✓ 已交付' },
  { id: 'iter1-backend', filename: '2026-03-17-iter1-backend-datalayer-leona.md', name: 'Iter-1 后端数据层重构', status: 'done', role: 'backend-leona', date: '2026-03-17', size: '5.3 KB', preview: '# Iter-1 后端数据层重构任务记录\n\n- 时间：2026-03-16 UTC（夜间全力推进模式）\n- 执行角色：Leona（backend-leona）\n- 阶段：Iter-1 — 数据层替换\n\n文件直读替换 CLI 子进程调用，引入 chokidar 文件监听。\n\n完成状态：✓ 已交付' },
  { id: 'mvp-refresh', filename: '2026-03-17-mvp-frontend-refresh-states-phase8-ezreal.md', name: 'MVP Phase 8 前端刷新状态可视化增强', status: 'done', role: 'frontend-ezreal', date: '2026-03-17', size: '5.9 KB', preview: '# MVP 前端刷新状态可视化增强记录（Phase 8 / Ezreal）\n\n- 时间：2026-03-17\n- 角色：frontend-ezreal\n- 阶段：MVP 持续开发 / 前端刷新状态可视化增强\n\n刷新计时器、缓存状态指示器、操作防重复点击。\n\n完成状态：✓ 已交付' },
  { id: 'mvp-obs', filename: '2026-03-14-mvp-frontend-observability-phase7-ezreal.md', name: 'MVP Phase 7 前端响应头链路贯通验证', status: 'done', role: 'frontend-ezreal', date: '2026-03-14', size: '10.9 KB', preview: '# MVP 前端响应头链路贯通验证记录（Phase 7 / Ezreal）\n\n- 时间：2026-03-14 UTC\n- 角色：frontend-ezreal\n\nX-Request-Id / X-Cache-Status / X-Error-Code 全链路透传验证。\n\n完成状态：✓ 已交付' },
  { id: 'mvp-ui', filename: '2026-03-14-mvp-ui-polish-phase4-lux.md', name: 'MVP Phase 4 UI 落地校正', status: 'done', role: 'ui-lux', date: '2026-03-14', size: '9.0 KB', preview: '# MVP UI 落地校正记录（Phase 4 / Lux）\n\n- 时间：2026-03-14 UTC\n- 角色：ui-lux\n\nCSS 设计系统落地，暗色主题，响应式布局完成。\n\n完成状态：✓ 已交付' },
  { id: 'mvp-debug', filename: '2026-03-14-mvp-frontend-debug-alignment-phase5-ezreal.md', name: 'MVP Phase 5 前端调试对齐', status: 'done', role: 'frontend-ezreal', date: '2026-03-14', size: '7.6 KB', preview: '# MVP 前端调试对齐记录（Phase 5 / Ezreal）\n\n- 时间：2026-03-14 UTC\n- 角色：frontend-ezreal\n\n调试 meta 面板，X-Request-Id 链路对齐。\n\n完成状态：✓ 已交付' },
  { id: 'mvp-backend-obs', filename: '2026-03-14-mvp-backend-observability-phase6-leona.md', name: 'MVP Phase 6 后端可观测性增强', status: 'done', role: 'backend-leona', date: '2026-03-14', size: '8.3 KB', preview: '# MVP 后端可观测性与留样支持增强记录（Phase 6 / Leona）\n\n- 时间：2026-03-14 UTC\n- 角色：backend-leona\n\n响应头链路 X-Request-Id、X-Cache-Status 全链路透传实现。\n\n完成状态：✓ 已交付' },
  { id: 'mvp-fe-iter3', filename: '2026-03-14-mvp-frontend-iteration-phase3-ezreal.md', name: 'MVP Phase 3 前端迭代', status: 'done', role: 'frontend-ezreal', date: '2026-03-14', size: '8.2 KB', preview: '# MVP 前端迭代记录（Phase 3 / Ezreal）\n\n- 时间：2026-03-14 UTC\n- 角色：frontend-ezreal\n\nstale 降级展示、错误卡片优化。\n\n完成状态：✓ 已交付' },
  { id: 'mvp-backend-iter3', filename: '2026-03-14-mvp-backend-iteration-phase3-leona.md', name: 'MVP Phase 3 后端迭代', status: 'done', role: 'backend-leona', date: '2026-03-14', size: '7.2 KB', preview: '# MVP 后端迭代记录（Phase 3 / Leona）\n\n- 时间：2026-03-14 UTC\n- 角色：backend-leona\n\n缓存 stale 降级、健康检查端点增强。\n\n完成状态：✓ 已交付' },
  { id: 'mvp-backend-tail', filename: '2026-03-14-mvp-backend-tail-closure-leona.md', name: 'MVP 后端尾项处理', status: 'done', role: 'backend-leona', date: '2026-03-14', size: '7.2 KB', preview: '# MVP 后端尾项处理记录（Tail Closure / Leona）\n\n- 时间：2026-03-14 UTC\n- 角色：backend-leona\n\ncache-fallback 策略整合，错误响应规范化。\n\n完成状态：✓ 已交付' },
  { id: 'mvp-fe-fix', filename: '2026-03-14-mvp-frontend-fix-phase2-ezreal.md', name: 'MVP Phase 2 前端定点修正', status: 'done', role: 'frontend-ezreal', date: '2026-03-14', size: '7.3 KB', preview: '# MVP 前端定点修正记录（Phase 2 / Ezreal）\n\n- 时间：2026-03-14 UTC\n- 角色：frontend-ezreal\n\n接口错误处理，stale 降级提示，按钮防抖。\n\n完成状态：✓ 已交付' },
  { id: 'mvp-backend-fix', filename: '2026-03-14-mvp-backend-fix-phase2-leona.md', name: 'MVP Phase 2 后端定点修正', status: 'done', role: 'backend-leona', date: '2026-03-14', size: '5.7 KB', preview: '# MVP 后端定点修正记录（Phase 2 / Leona）\n\n- 时间：2026-03-14 UTC\n- 角色：backend-leona\n\nDashboard API 修复，健康检查端点，错误格式统一。\n\n完成状态：✓ 已交付' },
  { id: 'mvp-fe-impl', filename: '2026-03-14-mvp-frontend-implementation-phase1-ezreal.md', name: 'MVP Phase 1 前端实现', status: 'done', role: 'frontend-ezreal', date: '2026-03-14', size: '7.2 KB', preview: '# MVP 前端实现阶段记录（Phase 1 / Ezreal）\n\n- 时间：2026-03-14 UTC\n- 角色：frontend-ezreal\n\nDashboard 页面首次实现，API 接入，数据渲染。\n\n完成状态：✓ 已交付' },
  { id: 'mvp-backend-impl', filename: '2026-03-14-mvp-backend-implementation-phase1-leona.md', name: 'MVP Phase 1 后端实现', status: 'done', role: 'backend-leona', date: '2026-03-14', size: '6.4 KB', preview: '# MVP 后端实现阶段记录（Phase 1 / Leona）\n\n- 时间：2026-03-14 UTC\n- 角色：backend-leona\n\nExpress 服务器搭建，Dashboard/Agents/Templates API 实现。\n\n完成状态：✓ 已交付' },
  { id: 'cache-fallback', filename: '2026-03-14-cache-fallback-implementation-leona.md', name: '缓存降级策略实施', status: 'done', role: 'backend-leona', date: '2026-03-14', size: '4.0 KB', preview: '# 缓存降级策略实施任务\n\n缓存 stale 降级设计与实现。stale=true 降级行为确定为正式方案。\n\n完成状态：✓ 已交付' },
  { id: 'week1', filename: '2026-03-13-week1-validation-tasks.md', name: '第一周技术验证任务清单', status: 'done', role: 'orchestrator-teemo', date: '2026-03-13', size: '4.5 KB', preview: '# 第一周技术验证任务清单\n\n## 验证目标与范围\n\n授权范围：开发准备 + 第一周 Gateway 对接验证，不进入完整开发实施。\n\n完成状态：✓ 已交付' },
];

// ─── CC 借鉴升级：新增常量与辅助函数 ──────────────────────────────────────
// Agent emoji 映射（按 agentId 关键词）
const AGENT_EMOJI = {
  'teemo': '🎯', 'ekko': '📋', 'jax': '🏗️',
  'ezreal': '⚡', 'leona': '🛡️', 'galio': '🔍',
  'lux': '✨', 'jayce': '⚙️', 'ryze': '🧙',
  'orchestrator-teemo': '🎯', 'product-ekko': '📋', 'architect-jax': '🏗️',
  'frontend-ezreal': '⚡', 'backend-leona': '🛡️', 'codingqa-galio': '🔍',
  'ui-lux': '✨', 'aioffice-jayce': '⚙️', 'technical-advisor-codex': '🧙', 'technical-advisor-ryze': '🧙'
};

// 数字计数动画（JS requestAnimationFrame）
function animateCounter(el) {
  const target = parseInt(el.dataset.counterTarget) || 0;
  if (target <= 0 || isNaN(target)) {
    el.textContent = '0';
    return;
  }
  let current = 0;
  const step = Math.max(1, Math.floor(target / 20));
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current.toLocaleString('zh-CN');
    if (current >= target) clearInterval(interval);
  }, 50);
}

// Token 数字 KPI 紧凑格式（避免长数字）
function fmtTokensKPI(n) {
  if (n >= 1e8) return `${(n / 1e8).toFixed(2)} 亿`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)} 万`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} K`;
  return String(n);
}

// KPI 卡片配色（基于状态）
function getKpiCardTone(value, warnThreshold = 0, errorThreshold = 0) {
  if (errorThreshold && value >= errorThreshold) return 'tone-error';
  if (warnThreshold && value >= warnThreshold) return 'tone-warn';
  return 'tone-ok';
}

// ─── Docs State ──────────────────────────────────────────────────────────────
const docsState = {
  list: null,       // DocItem[] from /api/v1/docs
  pending: false,
  error: null,
  selectedFilename: null,
  contentCache: {}, // filename → content string
};

// ─── Simple Markdown → HTML renderer ─────────────────────────────────────────
function renderMarkdown(md) {
  if (!md) return '';
  let html = escapeHtml(md);
  // Code blocks
  html = html.replace(/```[\s\S]*?```/g, (m) => {
    const inner = m.slice(3, -3).replace(/^\w*\n/, '');
    return `<pre><code>${inner}</code></pre>`;
  });
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // HR
  html = html.replace(/^---$/gm, '<hr>');
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Blockquote
  html = html.replace(/^&gt; ⚠️ (.+)$/gm, '<div class="api-note">⚠️ $1</div>');
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  // Ordered list items
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  // Unordered list items
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  // Wrap consecutive <li> groups
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  // Paragraphs: non-empty lines that are not HTML tags
  html = html.replace(/^(?!<[a-zA-Z/])(.+)$/gm, '<p>$1</p>');
  // Remove empty <p></p>
  html = html.replace(/<p>\s*<\/p>/g, '');
  return html;
}

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  route: 'overview',
  selectedTemplateId: null,
  selectedAgentId: '',
  selectedTaskId: null,
  selectedDocId: null,
  dashboard: null,
  health: null,
  templates: [],
  agents: [],
  agentsData: null,
  templatesPayload: null,
  agentsPayload: null,
  templateDetailPayload: null,
  pending: {
    dashboard: false,
    health: false,
    config: false,
    apply: false,
    agents: false,
  },
  applyFeedback: {
    kind: '',
    text: '',
    title: '',
    detail: '',
    debugMeta: null,
  },
  debugMeta: {
    dashboard: null,
    health: null,
    templates: null,
    agents: null,
    templateDetail: null,
  },
  refreshPerformance: {
    dashboard: { start: null, end: null, duration: null, requestId: null },
    health: { start: null, end: null, duration: null, requestId: null },
    config: { start: null, end: null, duration: null, requestId: null },
  },
  refreshHistory: [],
  // CC 借鉴升级：Inspector 状态
  inspectorCollapsed: (localStorage.getItem('openclaw:inspector-collapsed:v1') === 'true') || false,
  // KPI 数据缓存
  kpiSummary: {
    activeAgents: 0, totalAgents: 0,
    activeTasks: 0, blockedTasks: 0, totalTasks: 0,
    todayTokens: 0, todayCost: 0,
    gatewayConnected: false,
    queueCount: 0
  },
  sse: {
    status: 'disconnected',
    lastPing: null,
    errorCount: 0,
    reconnectTimeout: null,
    reconnectDelay: 1000,  // exponential backoff base (ms)
  },
  security: {
    readonlyMode: true,   // 默认只读，从 /api/v1/events/status 获取或保持静态值
    tokenAuth: false,
  },
};

// ─── Route metadata ───────────────────────────────────────────────────────────
const ROUTES = {
  overview:      { label: '总览',       icon: '🏠' },
  agents:        { label: 'Agent 状态', icon: '🤖' },
  collaboration: { label: '协作',       icon: '🔗' },
  tasks:         { label: '任务',       icon: '📋' },
  timeline:      { label: '时间线',     icon: '🕘' },
  usage:         { label: '用量',       icon: '📊' },
  memory:        { label: '记忆',       icon: '🧠' },
  docs:          { label: '文档',       icon: '📄' },
  settings:      { label: '设置',       icon: '⚙️' },
};

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const $ = (selector) => document.querySelector(selector);
const els = {
  pageTitle:      $('#page-title'),
  topbarEyebrow:  $('#topbar-eyebrow'),
  refreshPage:    $('#refresh-page'),
  refreshHealth:  $('#refresh-health'),
  refreshConfig:  $('#refresh-config'),
  refreshAgents:  $('#refresh-agents'),
  healthPill:     $('#health-pill'),
  sseStatus:      $('#sse-status'),
  readonlyPill:   $('#readonly-mode-pill'),
  // overview
  dashboardState:   $('#dashboard-state'),
  dashboardMeta:    $('#dashboard-meta'),
  dashboardMetrics: $('#dashboard-metrics'),
  healthState:      $('#health-state'),
  workspaceList:    $('#workspace-list'),
  alertsList:       $('#alerts-list'),
  // agents
  agentsState:  $('#agents-state'),
  agentsList:   $('#agents-list'),
  // settings
  configState:    $('#config-state-inline'),
  templatesList:  $('#templates-list'),
  templateMeta:   $('#template-meta'),
  templateDetail: $('#template-detail'),
};

// ─── Utilities ────────────────────────────────────────────────────────────────
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}


function initTheme() {
  const saved = localStorage.getItem('office-console-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved === 'light' ? 'light' : '');
  updateThemeBtn(saved);
}
function toggleTheme() {
  const current = localStorage.getItem('office-console-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('office-console-theme', next);
  document.documentElement.setAttribute('data-theme', next === 'light' ? 'light' : '');
  updateThemeBtn(next);
}
function updateThemeBtn(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = theme === 'light' ? '🌙' : '🌓';
}

// 保存当前页面和滚动位置
function savePageState() {
  const active = document.querySelector('.nav-link.active');
  if (active) sessionStorage.setItem('last-route', active.dataset.route || '');
  sessionStorage.setItem('scroll-y', window.scrollY.toString());
}

// 恢复页面和滚动位置
function restorePageState() {
  const lastRoute = sessionStorage.getItem('last-route');
  if (lastRoute) {
    const btn = document.querySelector(`.nav-link[data-route="${lastRoute}"]`);
    if (btn) btn.click();
  }
  const scrollY = parseInt(sessionStorage.getItem('scroll-y') || '0');
  if (scrollY > 0) setTimeout(() => window.scrollTo(0, scrollY), 100);
}

function updateStatusStrip(status) {
  const conn = document.getElementById('strip-connection');
  const agents = document.getElementById('strip-agents');
  const sec = document.getElementById('strip-security');
  const ver = document.getElementById('strip-version');
  if (conn) conn.textContent = '🟢 已连接';
  if (agents && status.agents) agents.textContent = `${status.agents.working || 0}工作 / ${status.agents.total || 0}Agent`;
  if (sec && status.security) sec.textContent = status.security.readonly ? '🔒 只读' : '🔓 正常';
  if (ver && status.version) ver.textContent = `v${status.version}`;
}

// ─── 本地化工具函数 ────────────────────────────────────────────────────────────
function formatDateCN(ts) {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    // UTC+8 offset
    const cst = new Date(d.getTime() + 8 * 60 * 60 * 1000);
    const y   = cst.getUTCFullYear();
    const mo  = String(cst.getUTCMonth() + 1).padStart(2, '0');
    const day = String(cst.getUTCDate()).padStart(2, '0');
    const h   = String(cst.getUTCHours()).padStart(2, '0');
    const min = String(cst.getUTCMinutes()).padStart(2, '0');
    const s   = String(cst.getUTCSeconds()).padStart(2, '0');
    return `${y}年${mo}月${day}日 ${h}:${min}:${s}`;
  } catch { return String(ts); }
}

function formatFileSizeCN(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function normalizeErrorPayload(error, fallbackCode = 'NETWORK_ERROR', fallbackMessage = 'network error') {
  return {
    success: false,
    error: {
      code: error?.code || fallbackCode,
      message: error?.message || fallbackMessage,
      ...(error?.detail ? { detail: error.detail } : {}),
    },
  };
}

function stateClass(kind) {
  return kind === 'error' ? 'error'
    : kind === 'warning' ? 'warning'
    : kind === 'success' ? 'success'
    : 'loading';
}

function renderStatusBox(element, { kind, text }) {
  if (!element) return;
  element.className = `state-box ${stateClass(kind)}`;
  element.textContent = text;
}

function setButtonLoading(button, loading, loadingText, idleText) {
  if (!button) return;
  button.disabled = loading;
  button.textContent = loading ? loadingText : idleText;
}

function formatChinaDateTime(value, fallback = '—') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
}

function formatChinaTime(value, fallback = '—') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleTimeString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getMeaningfulSource(value) {
  if (value == null) return '';
  const normalized = String(value).trim();
  if (!normalized) return '';
  const lowered = normalized.toLowerCase();
  if (lowered === 'unknown' || normalized === '未知') return '';
  return normalized;
}

function getSourceLabel(payload) {
  if (!payload?.success) return '';
  const source = payload.mode === 'file_reader' ? '文件直读'
    : payload.mode === 'cli_fallback' ? 'CLI降级'
    : '';
  const tags = [source];
  if (payload.cached || payload.stale) tags.push('已缓存');
  return tags.filter(Boolean).join(' · ');
}

function formatDashboardMeta(payload, lastCheck) {
  const parts = [];
  const sourceLabel = getSourceLabel(payload);
  const checkedAt = formatChinaTime(lastCheck, '');
  if (sourceLabel) parts.push(sourceLabel);
  if (checkedAt) parts.push(`检查时间：${checkedAt}（北京时间）`);
  return parts.join(' · ') || '检查时间：—';
}

function formatStatusText(value, fallback = '状态未知') {
  const normalized = String(value || '').trim();
  if (!normalized) return fallback;
  const lowered = normalized.toLowerCase();
  const map = {
    ok: '正常',
    healthy: '健康',
    good: '良好',
    running: '运行中',
    normal: '正常',
    connected: '已连接',
    degraded: '已降级',
    partial: '部分可用',
    warning: '警告',
    slow: '较慢',
    timeout: '超时',
    error: '异常',
    unhealthy: '不健康',
    critical: '严重异常',
    failed: '失败',
    offline: '离线',
    down: '不可用',
    unknown: fallback,
  };
  return map[lowered] || normalized;
}

function renderStatusRow(label, value, valueClass = '') {
  return `
    <div class="status-row">
      <span class="status-label">${escapeHtml(label)}</span>
      <span class="status-value${valueClass ? ` ${valueClass}` : ''}">${escapeHtml(String(value || '—'))}</span>
    </div>`;
}

function applyDataStateMessage(payload, loadingText, successText) {
  if (!payload) return { kind: 'loading', text: loadingText };
  if (!payload.success) return { kind: 'error', text: `${payload.error.code}｜${payload.error.message}` };
  if (payload.stale) return { kind: 'warning', text: payload.warning?.message || '当前展示为 stale 降级缓存数据' };
  return { kind: 'success', text: successText };
}

function applyDataStateMessageWithSSE(payload, loadingText, successText) {
  const baseState = applyDataStateMessage(payload, loadingText, successText);
  if (state.sse.status === 'connected' && baseState.kind === 'success') {
    return { ...baseState, text: `${baseState.text} 🔄 实时更新中` };
  }
  return baseState;
}

function extractDebugMeta(response) {
  if (!response?.headers) return null;
  const requestId = response.headers.get('x-request-id') || '';
  const cacheStatus = response.headers.get('x-cache-status') || '';
  const errorCode = response.headers.get('x-error-code') || '';
  const warningType = response.headers.get('x-warning-type') || '';
  if (!requestId && !cacheStatus && !errorCode && !warningType) return null;
  return { requestId, cacheStatus, errorCode, warningType };
}

function renderDebugMeta() {
  return '';
}


function renderErrorCard(payload, actionText = '请稍后重试') {
  const error = payload?.error || {};
  return `
    <div class="state-box error stack">
      <div><strong>${escapeHtml(error.code || 'UNKNOWN_ERROR')}</strong>｜${escapeHtml(error.message || '请求失败')}</div>
      ${error.detail ? `<div class="detail-box"><div class="muted">detail</div><pre>${escapeHtml(error.detail)}</pre></div>` : ''}
      <div class="muted">${escapeHtml(actionText)}</div>
    </div>`;
  updateFeishuEmptyState();
}


function renderDataSourceSummary(label, payload) {
  const stateText = !payload ? '加载中' : !payload.success ? '失败' : payload.stale ? '已缓存' : '正常';
  const desc = !payload ? '加载中'
    : !payload.success ? `${payload.error.code}｜${payload.error.message}`
    : payload.stale ? (payload.warning?.message || '当前展示的是缓存数据')
    : '数据可正常操作';
  return `
    <div class="summary-card ${stateClass(!payload ? 'loading' : !payload.success ? 'error' : payload.stale ? 'warning' : 'success')}">
      <div class="muted">${escapeHtml(label)}</div>
      <strong>${escapeHtml(stateText)}</strong>
      <div class="muted">${escapeHtml(desc)}</div>
    </div>`;
  updateFeishuEmptyState();
}


async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const debugMeta = extractDebugMeta(response);
  const rawText = await response.text();
  let payload;
  try {
    payload = rawText ? JSON.parse(rawText) : {};
  } catch {
    payload = normalizeErrorPayload({
      code: 'INVALID_JSON_RESPONSE',
      message: `接口返回了非 JSON 响应（HTTP ${response.status}）`,
      detail: rawText.slice(0, 400),
    });
  }
  return { ok: response.ok, status: response.status, payload, debugMeta };
}

// ─── Hash Routing ─────────────────────────────────────────────────────────────
function routeFromHash() {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  return ROUTES[hash] ? hash : 'overview';
}

function setRoute(route) {
  if (!ROUTES[route]) route = 'overview';
  savePageState();
  state.route = route;

  // update URL hash without pushing to history
  const currentHash = window.location.hash.replace('#', '');
  if (currentHash !== route) {
    window.history.replaceState({}, '', `#${route}`);
  }

  // update nav highlights
  document.querySelectorAll('.nav-link').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.route === route);
  });

  // show/hide sections with fade transition
  document.querySelectorAll('.page').forEach((page) => {
    const isTarget = page.id === `${route}-page`;
    if (isTarget) {
      page.classList.add('active');
      requestAnimationFrame(() => page.classList.add('is-visible'));
    } else {
      page.classList.remove('is-visible');
      page.classList.remove('active');
    }
  });

  updateOnboardingBannerVisibility();
  updateFeishuEmptyState();
  if (route === 'timeline') loadTimeline();

  // update page title
  const meta = ROUTES[route];
  if (els.pageTitle) els.pageTitle.textContent = meta.label;
  if (els.topbarEyebrow) els.topbarEyebrow.textContent = `${meta.icon} ${meta.label}`;
}

function navigateTo(route) {
  if (!ROUTES[route]) route = 'overview';
  if (route === state.route) {
    // 已在目标页，强制重载数据
    loadRouteData(route);
    return;
  }
  setRoute(route);
  loadRouteData(route);
}

function goToSettings() {
  const settingsRoute = ROUTES.settings ? 'settings' : 'overview';
  const btn = document.querySelector(`.nav-link[data-route="${settingsRoute}"]`);
  if (btn) {
    btn.click();
    return;
  }
  if (typeof navigateTo === 'function') {
    navigateTo(settingsRoute);
    return;
  }
  if (typeof switchPage === 'function') {
    switchPage(settingsRoute);
    return;
  }
  if (typeof showPage === 'function') {
    showPage(settingsRoute);
  }
}
window.navigateTo = navigateTo;
window.goToSettings = goToSettings;
window._appState = state; // expose for inline event handlers

function isFeishuConfigured() {
  const localToken = (localStorage.getItem('feishu_token') || '').trim();
  const localWebhook = (localStorage.getItem('feishu_webhook') || '').trim();
  if (localToken || localWebhook) return true;
  const runtimeConfigured = window.feishuConfigured === true;
  const settingsConfigured = Boolean(settingsState?.data?.success && (settingsState.data.data?.feishuWebhook?.configured || settingsState.data.data?.feishu?.configured));
  const wiringConfigured = Boolean(wiringState?.data?.success && (wiringState.data.data?.feishu?.webhookConfigured || wiringState.data.data?.feishu?.configured));
  return runtimeConfigured || settingsConfigured || wiringConfigured;
}

function updateFeishuEmptyState() {
  const el = document.getElementById('feishu-empty-state');
  if (!el) return;
  const show = !isFeishuConfigured();
  el.style.display = show ? 'flex' : 'none';
}

function initFeishuEmptyState() {
  const cta = document.getElementById('feishu-empty-state-cta');
  if (cta && !cta.dataset.bound) {
    cta.dataset.bound = 'true';
    cta.addEventListener('click', () => goToSettings());
  }
  updateFeishuEmptyState();
}

function updateOnboardingBannerVisibility() {
  const banner = document.getElementById('onboarding-banner');
  if (!banner) return;
  const hidden = localStorage.getItem('oc_onboarding_dismissed') === '1';
  banner.style.display = hidden ? 'none' : 'flex';
}

function initOnboardingBanner() {
  const banner = document.getElementById('onboarding-banner');
  const closeBtn = document.getElementById('onboarding-banner-close');
  if (!banner) return;
  updateOnboardingBannerVisibility();
  if (closeBtn && !closeBtn.dataset.bound) {
    closeBtn.dataset.bound = 'true';
    closeBtn.addEventListener('click', () => {
      banner.classList.add('is-hidden');
      localStorage.setItem('oc_onboarding_dismissed', '1');
      banner.addEventListener('transitionend', () => {
        banner.style.display = 'none';
        banner.classList.remove('is-hidden');
      }, { once: true });
    });
  }
}

function applyReadonlyStateToTaskButtons(container = document) {
  const readonly = Boolean(state.security.readonlyMode);
  container.querySelectorAll('.btn-change-status, #btn-create-task, .btn-task-delete, .btn-task-add, .btn-task-create, .btn-task-new').forEach((btn) => {
    btn.disabled = readonly;
    btn.classList.toggle('is-readonly-disabled', readonly);
    btn.style.opacity = readonly ? '0.4' : '';
    btn.style.cursor = readonly ? 'not-allowed' : '';
    btn.title = readonly ? '当前为只读模式，无法执行任务写操作' : '';
  });
}

// ─── Security status ──────────────────────────────────────────────────────────
async function loadSecurityStatus() {
  // 优先从 /api/v1/settings 获取，降级从 /api/v1/events/status
  let loaded = false;
  try {
    const { payload } = await apiFetch('/api/v1/settings');
    if (payload?.success && payload.data) {
      state.security.readonlyMode = payload.data.readonlyMode ?? true;
      state.security.tokenAuth    = payload.data.tokenAuth    ?? false;
      loaded = true;
    }
  } catch { /* ignore */ }
  if (!loaded) {
    try {
      const { payload } = await apiFetch('/api/v1/events/status');
      if (payload?.success && payload.data) {
        state.security.readonlyMode = payload.data.readonlyMode ?? true;
        state.security.tokenAuth    = payload.data.tokenAuth    ?? false;
      }
    } catch { /* use static defaults */ }
  }
  renderSecurityStatus();
}

function renderSecurityStatus() {
  const { readonlyMode } = state.security;
  if (els.readonlyPill) {
    if (readonlyMode) {
      els.readonlyPill.textContent = '🔒 只读';
      els.readonlyPill.className = 'pill readonly';
      els.readonlyPill.title = '控制台处于只读模式，写操作已禁用';
    } else {
      els.readonlyPill.textContent = '🔓 读写';
      els.readonlyPill.className = 'pill readwrite';
      els.readonlyPill.title = '控制台处于读写模式';
    }
  }

  // settings page security section
  const modeDisplay = $('#security-mode-display');
  const tokenDisplay = $('#token-auth-display');
  const tokenLabel  = $('#token-auth-label');

  if (modeDisplay) {
    modeDisplay.innerHTML = readonlyMode
      ? `<span class="security-icon">🔒</span><span class="security-label readonly-text">只读模式</span>`
      : `<span class="security-icon">🔓</span><span class="security-label readwrite-text">读写模式</span>`;
  }
  if (tokenLabel) {
    tokenLabel.textContent = state.security.tokenAuth ? '已配置' : '未配置（本地模式）';
  }

  applyReadonlyStateToTaskButtons();
  updateStatusStrip({ security: { readonly: readonlyMode } });
}

// ─── Toast Notification System ───────────────────────────────────────────────
(function initToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
})();

const TOAST_ICONS = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
const MAX_TOASTS = 3;
const activeToasts = [];

function showToast({ type = 'info', message = '', duration } = {}) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  // Cap at MAX_TOASTS — remove oldest if needed
  while (activeToasts.length >= MAX_TOASTS) {
    const oldest = activeToasts.shift();
    if (oldest && oldest.parentNode) dismissToast(oldest, true);
  }

  // Determine auto-dismiss duration
  const autoDismiss = duration !== undefined ? duration
    : type === 'error' ? 0
    : 3000;

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] || 'ℹ️'}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    <button class="toast-close" title="关闭">✕</button>`;

  el.addEventListener('click', () => dismissToast(el));
  el.querySelector('.toast-close').addEventListener('click', (e) => {
    e.stopPropagation();
    dismissToast(el);
  });

  container.appendChild(el);
  activeToasts.push(el);

  if (autoDismiss > 0) {
    setTimeout(() => dismissToast(el), autoDismiss);
  }
}

function dismissToast(el, immediate = false) {
  if (!el || !el.parentNode) return;
  const idx = activeToasts.indexOf(el);
  if (idx !== -1) activeToasts.splice(idx, 1);

  if (immediate) {
    el.remove();
    return;
  }
  el.classList.add('toast-out');
  setTimeout(() => { if (el.parentNode) el.remove(); }, 250);
}

// ─── SSE ──────────────────────────────────────────────────────────────────────
let sseConnection = null;

function updateSseStatus(status, emoji, title) {
  state.sse.status = status;
  if (els.sseStatus) {
    els.sseStatus.className = `pill ${status}`;
    els.sseStatus.textContent = `${emoji} ${title}`;
    els.sseStatus.title = `SSE 连接: ${title}`;
  }
}

function connectSSE() {
  if (sseConnection) {
    try { sseConnection.close(); } catch { /* ignore */ }
    sseConnection = null;
  }
  if (state.sse.reconnectTimeout) {
    clearTimeout(state.sse.reconnectTimeout);
    state.sse.reconnectTimeout = null;
  }

  updateSseStatus('connecting', '🟡', '连接中');

  try {
    sseConnection = new EventSource('/api/v1/events');

    sseConnection.addEventListener('open', () => {
      const wasDisconnected = state.sse.status === 'reconnecting' || state.sse.status === 'disconnected';
      updateSseStatus('connected', '🟢', '已连接');
      const stripConnection = document.getElementById('strip-connection');
      if (stripConnection) stripConnection.textContent = '🟢 已连接';
      state.sse.errorCount = 0;
      state.sse.reconnectDelay = 1000;  // reset backoff on successful connect
      state.sse.lastPing = Date.now();
      if (wasDisconnected) {
        showToast({ type: 'success', message: '实时连接已恢复' });
        // Refresh current section data after reconnect
        refreshCurrentPage();
      }
    });

    sseConnection.addEventListener('error', () => {
      state.sse.errorCount++;
      updateSseStatus('reconnecting', '🟡', '重连中');
      const stripConnection = document.getElementById('strip-connection');
      if (stripConnection) stripConnection.textContent = '🔴 断开';
      showToast({ type: 'warning', message: '实时连接已断开，尝试重连...', duration: 0 });
      if (state.sse.reconnectTimeout) clearTimeout(state.sse.reconnectTimeout);
      // Exponential backoff: 1s → 2s → 4s → 8s → max 30s
      const delay = Math.min(state.sse.reconnectDelay, 30000);
      state.sse.reconnectDelay = Math.min(state.sse.reconnectDelay * 2, 30000);
      state.sse.reconnectTimeout = setTimeout(() => connectSSE(), delay);
    });

    sseConnection.addEventListener('ping', () => { state.sse.lastPing = Date.now(); });
    sseConnection.addEventListener('connected', () => {});

    sseConnection.addEventListener('agent-update', async () => {
      if (state.route === 'agents') await loadAgents();
      if (state.route === 'overview') await loadDashboard();
    });

    sseConnection.addEventListener('task-update', async () => {
      if (state.route === 'overview') await loadDashboard();
    });

    sseConnection.addEventListener('file-change', async () => {
      if (state.route === 'settings') await Promise.all([loadConfigOverview(), loadSettings()]);
      else if (state.route === 'overview') await loadDashboard();
    });

  } catch {
    updateSseStatus('disconnected', '🔴', '已断开');
    const stripConnection = document.getElementById('strip-connection');
    if (stripConnection) stripConnection.textContent = '🔴 断开';
    state.sse.reconnectTimeout = setTimeout(() => connectSSE(), 3000);
  }
}

function initSSE() {
  connectSSE();
  // Visibility-aware reconnect: when user returns to tab, reconnect immediately if SSE is down
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.sse.status !== 'connected') {
      state.sse.reconnectDelay = 1000;  // reset backoff for manual reconnect
      if (state.sse.reconnectTimeout) {
        clearTimeout(state.sse.reconnectTimeout);
        state.sse.reconnectTimeout = null;
      }
      connectSSE();
    }
  });
}

// ─── Data loaders ─────────────────────────────────────────────────────────────

// Overview / Dashboard
async function loadDashboard() {
  state.pending.dashboard = true;
  setButtonLoading(els.refreshPage, true, '刷新中…', '强制重新加载');
  renderStatusBox(els.dashboardState, { kind: 'loading', text: '文件直读中…' });
  // 骨架屏：KPI 卡片占位
  if (els.dashboardMetrics) els.dashboardMetrics.innerHTML = skeletonKpiCards(5);
  try {
    const { payload, debugMeta } = await apiFetch('/api/v1/dashboard');
    state.dashboard = payload;
    state.debugMeta.dashboard = debugMeta;
  } catch (error) {
    state.dashboard = normalizeErrorPayload({ message: error.message || 'network error' });
    state.debugMeta.dashboard = null;
  } finally {
    state.pending.dashboard = false;
    if (!state.pending.health && !state.pending.config) {
      setButtonLoading(els.refreshPage, false, '刷新中…', '强制重新加载');
    }
  }
  renderDashboard();
}

async function loadHealth() {
  state.pending.health = true;
  setButtonLoading(els.refreshHealth, true, '刷新中…', '刷新健康');
  setButtonLoading(els.refreshPage, true, '刷新中…', '强制重新加载');
  if (els.healthState) els.healthState.innerHTML = '<div class="muted">健康状态加载中…</div>';
  try {
    const { payload, debugMeta } = await apiFetch('/api/v1/health');
    state.health = payload;
    state.debugMeta.health = debugMeta;
  } catch (error) {
    state.health = normalizeErrorPayload({ message: error.message || 'network error' });
    state.debugMeta.health = null;
  } finally {
    state.pending.health = false;
    setButtonLoading(els.refreshHealth, false, '刷新中…', '刷新健康');
    if (!state.pending.dashboard && !state.pending.config) {
      setButtonLoading(els.refreshPage, false, '刷新中…', '强制重新加载');
    }
  }
  renderHealth();
}

// Agents
async function loadAgents() {
  state.pending.agents = true;
  setButtonLoading(els.refreshAgents, true, '刷新中…', '刷新 Agents');
  setButtonLoading(els.refreshPage, true, '刷新中…', '强制重新加载');
  renderStatusBox(els.agentsState, { kind: 'loading', text: 'Agent 列表加载中…' });
  // 骨架屏：3 个 agent-card 占位
  const zonesContainerSkeleton = document.getElementById('agents-zones-container');
  if (zonesContainerSkeleton) zonesContainerSkeleton.innerHTML = skeletonAgentCards(3);
  try {
    const { payload, debugMeta } = await apiFetch('/api/v1/agents');
    state.agentsData = payload;
    state.debugMeta.agents = debugMeta;
  } catch (error) {
    state.agentsData = normalizeErrorPayload({ message: error.message || 'network error' });
    state.debugMeta.agents = null;
  } finally {
    state.pending.agents = false;
    setButtonLoading(els.refreshAgents, false, '刷新中…', '刷新 Agents');
    if (!state.pending.dashboard && !state.pending.config) {
      setButtonLoading(els.refreshPage, false, '刷新中…', '强制重新加载');
    }
  }
  renderAgents();
  // P1-5: overview 页时同步刷新 agent summary 速览
  if (state.route === 'overview') updateOverviewExtras();
}

// ─── Settings API ─────────────────────────────────────────────────────────────
const settingsState = { data: null, pending: false };

async function loadSettings() {
  settingsState.pending = true;
  const stateEl = document.querySelector('#settings-api-state');
  if (stateEl) { stateEl.className = 'state-box loading'; stateEl.textContent = '安全设置加载中…'; }
  try {
    const { payload } = await apiFetch('/api/v1/settings');
    settingsState.data = payload;
  } catch (err) {
    settingsState.data = normalizeErrorPayload({ message: err.message || 'network error' });
  } finally {
    settingsState.pending = false;
  }
  renderSettingsPanel();
}

function renderSettingsPanel() {
  const stateEl = document.querySelector('#settings-api-state');
  const payload = settingsState.data;

  if (!payload) {
    if (stateEl) { stateEl.className = 'state-box loading'; stateEl.textContent = '安全设置加载中…'; }
    return;
  }
  if (!payload.success) {
    if (stateEl) { stateEl.className = 'state-box error'; stateEl.textContent = `${payload.error?.code || 'ERROR'}｜${payload.error?.message || '请求失败'}`; }
    // Fill placeholders with fallback
    const dryrunLabel = document.querySelector('#dryrun-label');
    if (dryrunLabel) dryrunLabel.textContent = '数据不可用';
    const versionLabel = document.querySelector('#version-inline-label');
    if (versionLabel) versionLabel.textContent = '数据不可用';
    renderFeishuStatus(null);
    return;
  }

  const d = payload.data || {};

  // Sync into shared security state
  state.security.readonlyMode = d.readonlyMode ?? state.security.readonlyMode;
  state.security.tokenAuth    = d.tokenAuth    ?? state.security.tokenAuth;

  if (stateEl) { stateEl.className = 'state-box success'; stateEl.textContent = '安全设置已加载'; }

  // 访问模式
  const modeDisplay = document.querySelector('#security-mode-display');
  if (modeDisplay) {
    modeDisplay.innerHTML = d.readonlyMode
      ? `<span class="security-icon">🔒</span><span class="security-label readonly-text">只读模式</span>`
      : `<span class="security-icon">🔓</span><span class="security-label readwrite-text">读写模式</span>`;
  }

  // Token 鉴权
  const tokenLabel = document.querySelector('#token-auth-label');
  if (tokenLabel) tokenLabel.textContent = d.tokenAuth ? '✅ 已开启' : '⭕ 未开启';

  // Dry-run（预演模式）
  const dryrunLabel = document.querySelector('#dryrun-label');
  if (dryrunLabel) dryrunLabel.textContent = d.dryRun ? '✅ 已开启' : '⭕ 未开启';

  // 版本 / 运行时
  const versionLabel = document.querySelector('#version-inline-label');
  const uptimeDesc   = document.querySelector('#uptime-desc');
  if (versionLabel) versionLabel.textContent = d.version ? `v${d.version}` : '未知';
  if (uptimeDesc) {
    const parts = [];
    if (d.uptime)  parts.push(`运行 ${escapeHtml(String(d.uptime))}`);
    if (d.startedAt) {
      parts.push(`启动时间：${formatDateCN(d.startedAt)}`);
    }
    uptimeDesc.textContent = parts.length ? parts.join(' · ') : '—';
  }

  // 飞书通知
  renderFeishuStatus(d.feishuWebhook ?? d.feishu ?? null);

  // 同步 topbar pill
  renderSecurityStatus();
}

function renderFeishuStatus(feishu) {
  const el = document.querySelector('#feishu-notify-status');
  if (!el) return;
  const configured = feishu?.configured ?? false;
  window.feishuConfigured = configured;
  const webhookDesc = configured
    ? `<div><span class="muted">FEISHU_WEBHOOK_URL：</span><span class="pill success">✅ 已配置</span></div>`
    : `<div><span class="muted">FEISHU_WEBHOOK_URL：</span><span class="pill neutral">⬜ 未配置</span></div>
       <div class="muted">配置方法：设置环境变量 FEISHU_WEBHOOK_URL 为飞书机器人 Webhook 地址。</div>`;
  el.innerHTML = `
    <div class="list-card stack gap-sm">
      ${webhookDesc}
      <div class="muted">触发条件：agent 运行异常、任务 blocked 时自动推送飞书通知。</div>
      ${feishu === null ? '<div class="muted">⚠️ 飞书通知数据不可用，请检查 /api/v1/settings 接口。</div>' : ''}
    </div>`;
  updateFeishuEmptyState();
}

async function loadFeishuWebhookStatus() {
  const el = document.getElementById('feishu-webhook-status');
  if (!el) return;
  try {
    const { payload } = await apiFetch('/api/v1/settings/wiring-status');
    const data = payload?.data || payload || {};
    const checks = Array.isArray(data.checks) ? data.checks : [];
    const feishuCheck = checks.find(c => c?.id?.includes('feishu') || c?.label?.includes('飞书'));
    if (feishuCheck) {
      const configured = feishuCheck.status === 'ok';
      el.textContent = configured ? '已配置' : '未配置';
      el.className = 'badge ' + (configured ? 'tone-ok' : 'tone-warn');
      return;
    }

    const feishu = data.feishu || {};
    const configured = Boolean(feishu.webhookConfigured || feishu.configured || feishu.url);
    el.textContent = configured ? '已配置' : '未配置';
    el.className = 'badge ' + (configured ? 'tone-ok' : 'tone-warn');
  } catch {
    el.textContent = '未配置';
    el.className = 'badge tone-warn';
  }
}


// Settings / Config
async function loadConfigOverview() {
  state.pending.config = true;
  setButtonLoading(els.refreshConfig, true, '刷新中…', '刷新模板/Agent');
  setButtonLoading(els.refreshPage, true, '刷新中…', '强制重新加载');
  renderStatusBox(els.configState, { kind: 'loading', text: '模板与 Agent 数据加载中…' });
  try {
    const [templatesRes, agentsRes] = await Promise.all([
      apiFetch('/api/v1/config/templates'),
      apiFetch('/api/v1/agents'),
    ]);
    state.templatesPayload = templatesRes.payload;
    state.agentsPayload    = agentsRes.payload;
    state.debugMeta.templates = templatesRes.debugMeta;
    state.debugMeta.agents    = agentsRes.debugMeta;
    state.templates = templatesRes.payload.success ? (templatesRes.payload.data.items || []) : [];
    state.agents    = agentsRes.payload.success    ? (agentsRes.payload.data.items    || []) : [];

    if (!state.templates.find((item) => item.id === state.selectedTemplateId)) {
      state.selectedTemplateId = state.templates[0]?.id || null;
      state.templateDetailPayload = null;
      clearApplyFeedback();
    }
    if (!state.agents.find((item) => item.id === state.selectedAgentId)) {
      state.selectedAgentId = '';
    }
  } catch (error) {
    state.templatesPayload = normalizeErrorPayload({ message: error.message || 'network error' });
    state.agentsPayload    = normalizeErrorPayload({ message: error.message || 'network error' });
    state.debugMeta.templates = null;
    state.debugMeta.agents    = null;
    state.templates = [];
    state.agents    = [];
    state.selectedTemplateId = null;
    state.selectedAgentId    = '';
    state.templateDetailPayload = null;
  } finally {
    state.pending.config = false;
    setButtonLoading(els.refreshConfig, false, '刷新中…', '刷新模板/Agent');
    if (!state.pending.dashboard && !state.pending.health) {
      setButtonLoading(els.refreshPage, false, '刷新中…', '强制重新加载');
    }
  }

  renderConfig();
  renderSecurityStatus();
  if (state.selectedTemplateId) {
    await loadTemplateDetail(state.selectedTemplateId);
  } else {
    if (els.templateMeta) els.templateMeta.textContent = '暂无模板';
    if (els.templateDetail) els.templateDetail.innerHTML = `
      <div class="empty-box stack">
        <strong>当前没有可展示模板</strong>
        <div class="muted">请先检查 /api/v1/config/templates 返回，或点击"刷新模板/Agent"重试。</div>
      </div>`;
  }
}

async function loadTemplateDetail(templateId) {
  state.selectedTemplateId = templateId;
  if (els.templateMeta) els.templateMeta.textContent = '详情加载中…';
  if (els.templateDetail) els.templateDetail.innerHTML = '<div class="empty-box">模板详情加载中…</div>';
  try {
    const { payload, debugMeta } = await apiFetch(`/api/v1/config/templates/${templateId}`);
    state.templateDetailPayload = payload;
    state.debugMeta.templateDetail = debugMeta;
  } catch (error) {
    state.templateDetailPayload = normalizeErrorPayload({ message: error.message || 'network error' });
    state.debugMeta.templateDetail = null;
  }
  renderTemplatesList();
  renderTemplateDetail();
}

// ─── Render functions ─────────────────────────────────────────────────────────

function renderDashboard() {
  const payload = state.dashboard;
  renderStatusBox(els.dashboardState, applyDataStateMessageWithSSE(payload, 'Dashboard 加载中…', 'Dashboard 数据已更新'));

  if (!payload?.success) {
    if (els.dashboardMeta) els.dashboardMeta.textContent = '请求失败';
    if (els.dashboardMetrics) els.dashboardMetrics.innerHTML = `
      ${renderErrorCard(payload, '请检查 /api/v1/dashboard 返回，或点击"强制重新加载"重试。')}
      ${renderDebugMeta(state.debugMeta.dashboard, 'Dashboard 调试头')}`;
    if (els.workspaceList) els.workspaceList.innerHTML = '<div class="empty-box">Dashboard 失败时不展示工作区活动。</div>';
    if (els.alertsList) els.alertsList.innerHTML = '<div class="empty-box">Dashboard 失败时不展示告警摘要。</div>';
    // KPI 失败状态更新
    updateDashboardKPIs(null);
    return;
  }

  const { system = {}, agents = {}, workspaces = {}, alerts = [], usage = {} } = payload.data || {};
  if (els.dashboardMeta) els.dashboardMeta.textContent = formatDashboardMeta(payload, system.lastCheck);

  // 更新 KPI 数据（优先用 dashboard 直接返回的 usage 字段，fallback 到 usageState）
  updateDashboardKPIs({
    system, agents, alerts,
    blockedTasks: getBlockedTasksCount(),
    todayTokens: usage.todayTokens || getTodayTokens(),
    todayCost: usage.todayCost || getTodayCost(),
    gatewayConnected: isGatewayConnected(),
    queueCount: getQueueCount()
  });

  // 系统健康状态横幅卡
  const sysStatus  = system.status  || 'unknown';
  const sysHealth  = system.health  || sysStatus;
  const sysUptime  = system.uptime  || '—';
  const avgResponse = system.performance?.avgResponseMs != null ? `${system.performance.avgResponseMs}ms` : '—';

  let bannerCls = 'health-offline';
  let bannerIcon = '⚫';
  let bannerTitle = '系统状态未知';
  let bannerDetail = '无法获取系统健康数据，请检查 Gateway 连接。';
  const normalStatuses = ['ok', 'healthy', 'good', 'running', 'normal'];
  const warnStatuses   = ['warning', 'degraded', 'partial', 'busy'];
  const errorStatuses  = ['error', 'unhealthy', 'critical', 'failed'];
  if (normalStatuses.some(s => sysHealth.toLowerCase().includes(s) || sysStatus.toLowerCase().includes(s))) {
    bannerCls = 'health-ok'; bannerIcon = '✅';
    bannerTitle = '系统运行正常';
    bannerDetail = `所有组件响应正常 · 运行时长 ${sysUptime}`;
  } else if (warnStatuses.some(s => sysHealth.toLowerCase().includes(s) || sysStatus.toLowerCase().includes(s))) {
    bannerCls = 'health-warn'; bannerIcon = '⚠️';
    bannerTitle = '系统有警告';
    bannerDetail = `部分组件可能降级 · 运行时长 ${sysUptime}`;
  } else if (errorStatuses.some(s => sysHealth.toLowerCase().includes(s) || sysStatus.toLowerCase().includes(s))) {
    bannerCls = 'health-error'; bannerIcon = '❌';
    bannerTitle = '系统异常';
    bannerDetail = `检测到错误状态，建议检查各组件 · 运行时长 ${sysUptime}`;
  }

  if (els.dashboardMetrics) els.dashboardMetrics.innerHTML = `
    ${payload.stale ? `<div class="state-box warning" style="margin-bottom:var(--space-sm)">当前展示的是 stale 降级缓存数据，建议稍后点击"强制重新加载"确认最新状态。</div>` : ''}
    <div class="system-health-banner ${bannerCls}">
      <div class="health-banner-icon">${bannerIcon}</div>
      <div class="health-banner-text">
        <div class="health-banner-title">${escapeHtml(bannerTitle)}</div>
        <div class="health-banner-meta">${escapeHtml(bannerDetail)}</div>
      </div>
      <div class="health-banner-stats">
        <div class="health-stat">
          <div class="health-stat-value">${escapeHtml(String(agents.active ?? 0))}/${escapeHtml(String(agents.total ?? 0))}</div>
          <div class="health-stat-label">Agent 活跃</div>
        </div>
        <div class="health-stat">
          <div class="health-stat-value">${escapeHtml(avgResponse)}</div>
          <div class="health-stat-label">平均响应</div>
        </div>
      </div>
    </div>
    ${renderDebugMeta(state.debugMeta.dashboard, 'Dashboard 调试头')}`;

  const recentActivity = workspaces.recentActivity || [];
  if (els.workspaceList) els.workspaceList.innerHTML = recentActivity.length
    ? recentActivity.map((item) => `
      <div class="workspace-card">
        <strong>${escapeHtml(item.name)}</strong>
        <div class="muted">状态：${escapeHtml(item.status)} · Agent：${escapeHtml(String(item.agentCount))}</div>
        <div class="muted">最近更新：${escapeHtml(item.lastUpdated)}</div>
      </div>`).join('')
    : '<div class="empty-box">暂无工作区活动数据。</div>';

  if (els.alertsList) els.alertsList.innerHTML = alerts.length
    ? alerts.map((item) => `
      <div class="alert-card">
        <strong>${escapeHtml(String(item.level || '').toUpperCase())} · ${escapeHtml(item.type)}</strong>
        <div>${escapeHtml(item.message)}</div>
        <div class="muted">建议：${escapeHtml(item.suggestion || '无')}</div>
        <div class="muted">${escapeHtml(item.timestamp)}</div>
      </div>`).join('')
    : '<div class="empty-box">当前无告警，实时 SSE 推送将自动更新新告警。</div>';
}

// 更新 KPI 卡片和系统状态摘要
function updateDashboardKPIs(data) {
  // 获取状态栏元素
  const statusBadge = document.getElementById('system-status-badge');
  const statusMeta = document.getElementById('system-status-meta');
  
  // KPI 卡片元素
  const kpiActiveAgents = document.getElementById('kpi-active-agents');
  const kpiActiveAgentsMeta = document.getElementById('kpi-active-agents-meta');
  const kpiTasks = document.getElementById('kpi-tasks');
  const kpiTasksMeta = document.getElementById('kpi-tasks-meta');
  const kpiUsage = document.getElementById('kpi-usage');
  const kpiUsageMeta = document.getElementById('kpi-usage-meta');
  const kpiGateway = document.getElementById('kpi-gateway');
  const kpiGatewayMeta = document.getElementById('kpi-gateway-meta');
  const kpiQueue = document.getElementById('kpi-queue');
  const kpiQueueMeta = document.getElementById('kpi-queue-meta');
  
  // KPI 卡片容器
  const kpiCardTasks = document.getElementById('kpi-card-tasks');
  const kpiCardGateway = document.getElementById('kpi-card-gateway');
  const kpiCardQueue = document.getElementById('kpi-card-queue');

  if (!data) {
    // 默认数据
    if (statusBadge) {
      statusBadge.className = 'badge info';
      statusBadge.textContent = '系统检查中…';
    }
    if (statusMeta) statusMeta.textContent = '';
    
    const defaultValues = {
      activeAgents: 0, totalAgents: 0,
      activeTasks: 0, blockedTasks: 0, totalTasks: STATIC_TASKS.length,
      todayTokens: 0, todayCost: 0,
      gateway: false,
      queueCount: 0,
      systemStatus: 'loading'
    };
    
    // 更新 KPI 卡片
    if (kpiActiveAgents) {
      kpiActiveAgents.dataset.counterTarget = defaultValues.activeAgents.toString();
      kpiActiveAgents.textContent = '0';
      if (kpiActiveAgentsMeta) kpiActiveAgentsMeta.textContent = `共 ${defaultValues.totalAgents} 个`;
    }
    if (kpiTasks) {
      kpiTasks.dataset.counterTarget = defaultValues.activeTasks.toString();
      kpiTasks.textContent = '0';
      if (kpiTasksMeta) kpiTasksMeta.textContent = `${defaultValues.blockedTasks} 阻塞`;
      if (kpiCardTasks) kpiCardTasks.className = `kpi-card ${getKpiCardTone(defaultValues.blockedTasks, 1, 3)}`;
    }
    if (kpiUsage) {
      kpiUsage.dataset.counterTarget = defaultValues.todayTokens.toString();
      kpiUsage.textContent = '0';
      if (kpiUsageMeta) kpiUsageMeta.textContent = 'tokens';
    }
    if (kpiGateway) {
      kpiGateway.textContent = defaultValues.gateway ? '🟢' : '—';
      kpiGateway.style.color = defaultValues.gateway ? 'var(--status-done)' : 'var(--muted)';
      if (kpiGatewayMeta) kpiGatewayMeta.textContent = defaultValues.gateway ? '已连接' : '检查中';
      if (kpiCardGateway) kpiCardGateway.className = `kpi-card ${getKpiCardTone(defaultValues.gateway ? 0 : 1, 0, 1)}`;
    }
    if (kpiQueue) {
      kpiQueue.dataset.counterTarget = defaultValues.queueCount.toString();
      kpiQueue.textContent = '0';
      if (kpiQueueMeta) kpiQueueMeta.textContent = '待处理';
      if (kpiCardQueue) kpiCardQueue.className = `kpi-card ${getKpiCardTone(defaultValues.queueCount, 1, 5)}`;
    }
    
    // 启动计数动画
    setTimeout(() => {
      document.querySelectorAll('[data-counter-target]').forEach(animateCounter);
    }, 100);
    
    return;
  }

  const { system, agents, alerts, blockedTasks = 0, todayTokens = 0, todayCost = 0, 
          gatewayConnected = false, queueCount = 0 } = data;
  
  // 系统状态
  const systemStatus = system?.status || 'unknown';
  const systemHealth = system?.health || 'unknown';
  const overallStatus = systemHealth !== 'unknown' ? systemHealth : systemStatus;
  
  let statusClass = 'badge running';
  let statusText = '系统正常';
  if (overallStatus === 'ok' || overallStatus === 'healthy' || overallStatus === 'good') {
    statusClass = 'badge running';
    statusText = '系统正常';
  } else if (overallStatus === 'warning' || overallStatus === 'degraded') {
    statusClass = 'badge warn';
    statusText = '有警告需关注';
  } else if (overallStatus === 'error' || overallStatus === 'unhealthy' || overallStatus === 'critical') {
    statusClass = 'badge error';
    statusText = '系统异常';
  } else if (overallStatus === 'offline' || overallStatus === 'down') {
    statusClass = 'badge idle';
    statusText = '系统离线';
  }
  
  // 如果有告警或阻塞任务，更新状态
  if ((alerts && alerts.length > 0) || queueCount > 0 || blockedTasks > 0) {
    statusClass = queueCount > 0 ? 'badge error' : 'badge warn';
    const count = (alerts?.length || 0) + queueCount + blockedTasks;
    statusText = `有 ${count} 项需要关注`;
  }
  
  if (statusBadge) {
    statusBadge.className = statusClass;
    statusBadge.textContent = statusText;
  }
  if (statusMeta) {
    const metaParts = [];
    if (agents?.total) metaParts.push(`${agents.active || 0}/${agents.total} Agent 活跃`);
    if (todayTokens > 0) metaParts.push(`${formatNumber(todayTokens)} tokens`);
    if (queueCount > 0) metaParts.push(`${queueCount} 待处理`);
    statusMeta.textContent = metaParts.join(' · ');
  }
  
  // 更新统计数据到 state
  state.kpiSummary = {
    activeAgents: agents?.active || 0,
    totalAgents: agents?.total || 0,
    activeTasks: STATIC_TASKS.filter(t => t.status === 'active').length,
    blockedTasks: blockedTasks,
    totalTasks: STATIC_TASKS.length,
    todayTokens: todayTokens,
    todayCost: todayCost,
    gatewayConnected: gatewayConnected,
    queueCount: queueCount
  };
  
  // 更新 KPI 卡片
  if (kpiActiveAgents) {
    kpiActiveAgents.dataset.counterTarget = (agents?.active || 0).toString();
    if (kpiActiveAgentsMeta) kpiActiveAgentsMeta.textContent = `共 ${agents?.total || 0} 个 · ${agents?.errorCount || 0} 异常`;
  }
  if (kpiTasks) {
    const activeTasks = STATIC_TASKS.filter(t => t.status === 'active').length;
    kpiTasks.dataset.counterTarget = activeTasks.toString();
    if (kpiTasksMeta) kpiTasksMeta.textContent = `${blockedTasks} 阻塞`;
    if (kpiCardTasks) kpiCardTasks.className = `kpi-card ${getKpiCardTone(blockedTasks, 1, 3)}`;
  }
  if (kpiUsage) {
    // 直接显示紧凑格式，不走原始数字计数动画
    kpiUsage.textContent = fmtTokensKPI(todayTokens);
    delete kpiUsage.dataset.counterTarget;
    const costText = todayCost > 0 ? `≈ $${todayCost.toFixed(4)} USD` : '费用 ≈ $0';
    if (kpiUsageMeta) kpiUsageMeta.textContent = `${costText}`;
  }
  if (kpiGateway) {
    kpiGateway.textContent = gatewayConnected ? '🟢' : '🔴';
    kpiGateway.style.color = gatewayConnected ? 'var(--status-done)' : 'var(--status-error)';
    if (kpiGatewayMeta) kpiGatewayMeta.textContent = gatewayConnected ? '已连接' : '未连接';
    if (kpiCardGateway) kpiCardGateway.className = `kpi-card ${getKpiCardTone(gatewayConnected ? 0 : 1, 0, 1)}`;
  }
  if (kpiQueue) {
    kpiQueue.dataset.counterTarget = queueCount.toString();
    if (kpiQueueMeta) kpiQueueMeta.textContent = queueCount > 0 ? '待处理' : '无待处理';
    if (kpiCardQueue) kpiCardQueue.className = `kpi-card ${getKpiCardTone(queueCount, 1, 5)}`;
  }
  
  // 启动计数动画
  setTimeout(() => {
    document.querySelectorAll('[data-counter-target]').forEach(animateCounter);
  }, 100);
  
  // 更新 Inspector
  updateInspectorSidebar();

  // P1-5: 更新 Overview 就绪度 + Agent Summary（仅在 overview 页）
  if (state.route === 'overview') {
    updateOverviewExtras();
  }
}

// 辅助函数
function getBlockedTasksCount() {
  return STATIC_TASKS.filter(t => t.status === 'blocked').length;
}

function getTodayTokens() {
  return usageState.data?.data?.totalTokens || 0;
}

function getTodayCost() {
  return usageState.data?.data?.totalCost || 0;
}

function isGatewayConnected() {
  return state.health?.data?.gateway?.status === 'ok';
}

function getQueueCount() {
  const queueData = actionQueueState.data?.data;
  if (!queueData) return 0;
  const blocked = Array.isArray(queueData.blocked) ? queueData.blocked.length : 0;
  const warnings = Array.isArray(queueData.warnings) ? queueData.warnings.length : 0;
  return blocked + warnings;
}

function formatNumber(num) {
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e4) return `${(num / 1e4).toFixed(1)}万`;
  return num.toLocaleString('zh-CN');
}

function renderHealth() {
  const payload = state.health;
  if (!payload) {
    if (els.healthPill) { els.healthPill.className = 'pill neutral'; els.healthPill.textContent = '等待检查'; }
    return;
  }
  if (!payload.success) {
    if (els.healthPill) { els.healthPill.className = 'pill danger'; els.healthPill.textContent = '健康检查失败'; }
    if (els.healthState) els.healthState.innerHTML = `
      ${renderErrorCard(payload, '请检查 Gateway / 服务状态后重试健康刷新。')}
      ${renderDebugMeta(state.debugMeta.health, 'Health 调试头')}`;
    return;
  }
  const stale = Boolean(payload.stale);
  const gatewayStatus = payload.data?.gateway?.status || 'unknown';
  const pillClass = stale || gatewayStatus !== 'ok' ? 'warning' : 'success';
  if (els.healthPill) {
    els.healthPill.className = `pill ${pillClass}`;
    els.healthPill.textContent = stale ? '缓存健康数据' : gatewayStatus === 'ok' ? 'Gateway 正常' : `Gateway ${formatStatusText(gatewayStatus, '状态未知')}`;
  }
  const checkedAtText = formatChinaDateTime(payload.data?.checkedAt, '—');
  const rawSource = getMeaningfulSource(payload.data?.source);
  const sourceText = rawSource || getMeaningfulSource(getSourceLabel(payload));
  if (els.healthState) els.healthState.innerHTML = `
    <div class="stack gap-sm">
      ${stale ? `<div class="state-box warning">当前健康信息来自缓存数据。</div>` : ''}
      <div class="list-card stack gap-sm">
        ${renderStatusRow('服务状态', formatStatusText(payload.data?.service?.status, '状态未知'))}
        ${renderStatusRow('Gateway', formatStatusText(gatewayStatus, '状态未知'))}
        ${renderStatusRow('检查时间', `${checkedAtText}（北京时间）`)}
        ${sourceText ? renderStatusRow('数据来源', sourceText) : ''}
        ${payload.warning?.message ? renderStatusRow('提示信息', payload.warning.message) : ''}
      </div>
      ${renderDebugMeta(state.debugMeta.health, 'Health 调试头')}
    </div>`;
  updateFeishuEmptyState();
}


function renderAgents() {
  const payload = state.agentsData;
  renderStatusBox(els.agentsState, applyDataStateMessageWithSSE(
    payload, 'Agent 列表加载中…', 'Agent 列表已更新'
  ));

  const zonesContainer = document.getElementById('agents-zones-container');
  if (!zonesContainer) return;

  if (!payload) {
    zonesContainer.innerHTML = '<div class="empty-box">加载中…</div>';
    return;
  }

  if (!payload.success) {
    zonesContainer.innerHTML = renderErrorCard(payload, '请检查 /api/v1/agents 接口或点击"刷新 Agents"重试。');
    return;
  }

  const items = payload.data?.items || [];
  if (!items.length) {
    zonesContainer.innerHTML = '<div class="empty-box">当前没有 Agent 数据。</div>';
    return;
  }

  // 按状态分组
  const groups = {
    working: [],  // 活跃/工作中
    idle: [],     // 空闲/正常
    blocked: [],  // 阻塞/错误
    backlog: [],  // 待处理
    other: []     // 其他状态
  };
  
  items.forEach(agent => {
    const status = agent.statusDetail?.status || agent.status;
    if (status === 'working' || status === 'active') {
      groups.working.push(agent);
    } else if (status === 'idle' || status === 'normal') {
      groups.idle.push(agent);
    } else if (status === 'blocked' || status === 'error' || status === 'warning') {
      groups.blocked.push(agent);
    } else if (status === 'backlog') {
      groups.backlog.push(agent);
    } else {
      groups.other.push(agent);
    }
  });

  function getAgentEmoji(agentId) {
    const id = agentId.toLowerCase();
    for (const [key, emoji] of Object.entries(AGENT_EMOJI)) {
      if (id.includes(key.toLowerCase())) return emoji;
    }
    // 默认映射
    const defaultEmojiMap = {
      'teemo': '🎯', 'teemo': '🎯', 'orchestrator': '🎯',
      'ekko': '📋', 'product': '📋',
      'jax': '🏗️', 'architect': '🏗️',
      'ezreal': '⚡', 'frontend': '⚡',
      'leona': '🛡️', 'backend': '🛡️',
      'galio': '🔍', 'codingqa': '🔍', 'test': '🔍',
      'lux': '✨', 'ui': '✨', 'design': '✨',
      'jayce': '⚙️', 'aioffice': '⚙️', 'office': '⚙️',
      'ryze': '🧙', 'advisor': '🧙', 'codex': '🧙'
    };
    for (const [key, emoji] of Object.entries(defaultEmojiMap)) {
      if (id.includes(key.toLowerCase())) return emoji;
    }
    return '🤖';
  }

  function agentStatusPill(status) {
    const map = {
      working:  { cls: 'badge working',  label: '工作中' },
      active:   { cls: 'badge working',  label: '工作中' },
      idle:     { cls: 'badge idle',     label: '空闲' },
      normal:   { cls: 'badge idle',     label: '空闲' },
      blocked:  { cls: 'badge blocked',  label: '阻塞' },
      backlog:  { cls: 'badge warn',     label: '积压' },
      warning:  { cls: 'badge warn',     label: '警告' },
      error:    { cls: 'badge error',    label: '异常' },
      offline:  { cls: 'badge idle',     label: '离线' },
    };
    const entry = map[status] || { cls: 'badge idle', label: escapeHtml(status || '未知') };
    return `<span class="${entry.cls}">${entry.label}</span>`;
  }

  function renderAgentCard(agent) {
    const sd = agent.statusDetail || {};
    const lastActiveAt = sd.lastActiveAt || agent.lastActive;
    const emoji = getAgentEmoji(agent.id || agent.name);
    const agentId = agent.id || agent.name || '';
    const agentName = AGENT_CHINESE_NAMES[agentId] || AGENT_CHINESE_NAMES[agent.name] || agent.name || agentId;
    const roleDesc = agent.model ? `使用 ${agent.model}` : agent.workspace ? `工作区: ${agent.workspace}` : agent.description || 'OpenClaw Agent';
    const activeSessions = sd.activeSessions || sd.pendingTaskCount || 0;
    const status = sd.status || agent.status;

    // 最近活跃时间（人性化显示）
    function relativeTime(ts) {
      if (!ts) return '';
      const diff = Date.now() - new Date(ts).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1)  return '刚刚';
      if (mins < 60) return `${mins} 分钟前`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24)  return `${hrs} 小时前`;
      return `${Math.floor(hrs / 24)} 天前`;
    }
    
    // P1-6：状态角标颜色映射（CC借鉴：avatar 右下角小圆点）
    const dotColorMap = { working:'#22c55e', active:'#22c55e', idle:'#94a3b8', normal:'#94a3b8', offline:'#64748b', blocked:'#ef4444', error:'#ef4444', warning:'#f97316', backlog:'#f97316' };
    const statusDotColor = dotColorMap[status] || '#94a3b8';

    return `
    <article class="agent-card" data-agent-id="${escapeHtml(agentId)}">
      <div class="agent-card-head">
        <div style="position:relative;flex-shrink:0">
          <div class="agent-avatar-circle">${emoji}</div>
          <span title="${escapeHtml(status)}" style="position:absolute;bottom:-2px;right:-2px;width:10px;height:10px;border-radius:50%;border:2px solid var(--panel);background:${statusDotColor}"></span>
        </div>
        <div style="flex:1;min-width:0">
          <div class="agent-card-name">
            ${escapeHtml(agentName)}
          </div>
          <div class="agent-card-role">${escapeHtml(roleDesc)}</div>
        </div>
        ${agentStatusPill(status)}
      </div>
      <div class="agent-card-meta">
        ${activeSessions > 0 ? `<span>活跃会话 ${activeSessions}</span>` : ''}
        ${lastActiveAt ? `<span title="${escapeHtml(formatDateCN(lastActiveAt))}">⏱ ${escapeHtml(relativeTime(lastActiveAt))}</span>` : '<span class="dim">暂无活动记录</span>'}
      </div>
      ${sd.currentTask ? `<div class="agent-card-task" title="${escapeHtml(sd.currentTask)}">🔧 ${escapeHtml(sd.currentTask.length > 60 ? sd.currentTask.slice(0, 58) + '…' : sd.currentTask)}</div>` : ''}
      <div class="agent-card-actions">
        <button class="agent-action-btn" data-action="log"     data-agent-id="${escapeHtml(agentId)}">📋 查看日志</button>
        <button class="agent-action-btn" data-action="task"    data-agent-id="${escapeHtml(agentId)}">🔍 当前任务</button>
        <button class="agent-action-btn" data-action="copy-id" data-agent-id="${escapeHtml(agentId)}">📌 复制 ID</button>
      </div>
    </article>`;
  }

  let zonesHtml = '';
  
  // 活跃区
  if (groups.working.length > 0) {
    zonesHtml += `
    <div class="agent-zone" id="agents-working-zone">
      <div class="agent-zone-title">🟢 活跃中 (${groups.working.length})</div>
      <div class="agent-grid" id="agents-working-grid">
        ${groups.working.map(renderAgentCard).join('')}
      </div>
    </div>`;
  }
  
  // 空闲区
  if (groups.idle.length > 0) {
    zonesHtml += `
    <div class="agent-zone" id="agents-idle-zone">
      <div class="agent-zone-title">⚪ 空闲 (${groups.idle.length})</div>
      <div class="agent-grid" id="agents-idle-grid">
        ${groups.idle.map(renderAgentCard).join('')}
      </div>
    </div>`;
  }
  
  // 阻塞区（只在有阻塞时显示）
  if (groups.blocked.length > 0) {
    zonesHtml += `
    <div class="agent-zone" id="agents-blocked-zone">
      <div class="agent-zone-title">🔴 阻塞 (${groups.blocked.length})</div>
      <div class="agent-grid" id="agents-blocked-grid">
        ${groups.blocked.map(renderAgentCard).join('')}
      </div>
    </div>`;
  }
  
  // 待处理区
  if (groups.backlog.length > 0) {
    zonesHtml += `
    <div class="agent-zone" id="agents-backlog-zone">
      <div class="agent-zone-title">🔵 待处理 (${groups.backlog.length})</div>
      <div class="agent-grid" id="agents-backlog-grid">
        ${groups.backlog.map(renderAgentCard).join('')}
      </div>
    </div>`;
  }
  
  // 其他状态区（可选显示）
  if (groups.other.length > 0) {
    zonesHtml += `
    <div class="agent-zone" id="agents-other-zone">
      <div class="agent-zone-title">⚫ 其他状态 (${groups.other.length})</div>
      <div class="agent-grid" id="agents-other-grid">
        ${groups.other.map(renderAgentCard).join('')}
      </div>
    </div>`;
  }
  
  zonesContainer.innerHTML = zonesHtml;

  // 快捷操作：查看日志 / 当前任务 / 复制 ID
  zonesContainer.querySelectorAll('.agent-action-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action  = btn.dataset.action;
      const agentId = btn.dataset.agentId;
      if (action === 'copy-id') {
        navigator.clipboard?.writeText(agentId).then(() => {
          showToast({ type: 'success', message: `已复制：${agentId}` });
        }).catch(() => {
          showToast({ type: 'info', message: `Agent ID：${agentId}` });
        });
      } else if (action === 'log') {
        showToast({ type: 'info', message: `📋 ${agentId} 日志查看 — 请前往 Docs 分区或查询 /api/v1/agents/${encodeURIComponent(agentId)}/logs` });
      } else if (action === 'task') {
        // 找到该 agent 的当前任务
        const agentData = items.find((a) => a.id === agentId || a.name === agentId);
        const currentTask = agentData?.statusDetail?.currentTask || agentData?.currentTask;
        if (currentTask) {
          showToast({ type: 'info', message: `🔧 ${agentId}：${currentTask}`, duration: 5000 });
        } else {
          showToast({ type: 'info', message: `${agentId} 暂无进行中任务` });
        }
      }
    });
  });

  // 点击卡片主体（非按钮区域）可查看详情
  zonesContainer.querySelectorAll('.agent-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.agent-action-btn')) return;
      const agentId = card.dataset.agentId;
      const agentData = items.find((a) => a.id === agentId || a.name === agentId);
      if (agentData) {
        const name = AGENT_CHINESE_NAMES[agentId] || agentId;
        const status = agentData.statusDetail?.status || agentData.status || '未知';
        const task   = agentData.statusDetail?.currentTask || '无任务';
        openInspector(name, `
          <div class="stack gap-sm">
            <div><strong>状态：</strong>${escapeHtml(status)}</div>
            <div><strong>当前任务：</strong>${escapeHtml(task)}</div>
            <div><strong>模型：</strong>${escapeHtml(agentData.model || '—')}</div>
            <div><strong>工作区：</strong>${escapeHtml(agentData.workspace || '—')}</div>
            <div><strong>最近活跃：</strong>${escapeHtml(formatDateCN(agentData.statusDetail?.lastActiveAt || agentData.lastActive || '—'))}</div>
          </div>`);
      }
    });
  });
  
  // 更新 Inspector 活跃 Agent 计数
  updateInspectorSidebar();
}

function renderConfig() {
  const templatesState = applyDataStateMessageWithSSE(state.templatesPayload, '模板列表加载中…', '模板列表已更新');
  const agentsState    = applyDataStateMessageWithSSE(state.agentsPayload,    'Agent 列表加载中…', 'Agent 列表已更新');
  const finalState =
    templatesState.kind === 'error' || agentsState.kind === 'error'
      ? { kind: 'error', text: `模板：${templatesState.text}；Agent：${agentsState.text}` }
    : templatesState.kind === 'warning' || agentsState.kind === 'warning'
      ? { kind: 'warning', text: '存在 stale 数据，请注意当前展示可能不是最新运行态。' }
    : !state.templates.length
      ? { kind: 'warning', text: '模板数据已更新，但当前没有可展示模板。' }
    : !state.agents.length
      ? { kind: 'warning', text: '模板数据已更新，但当前没有可操作 Agent。' }
    : { kind: 'success', text: '模板与 Agent 数据已更新，可继续查看详情与执行 apply。' };
  renderStatusBox(els.configState, finalState);
  renderTemplatesList();
}

function renderTemplatesList() {
  const listPayload = state.templatesPayload;
  if (!listPayload || !els.templatesList) return;

  if (!listPayload.success) {
    els.templatesList.innerHTML = renderErrorCard(listPayload, '模板列表不可用时，无法继续选择模板。');
    return;
  }
  if (!state.templates.length) {
    els.templatesList.innerHTML = '<div class="empty-box">模板列表为空。</div>';
    return;
  }
  els.templatesList.innerHTML = `
    ${listPayload.stale ? '<div class="state-box warning">模板列表当前为 stale 缓存数据。</div>' : ''}
    ${state.templates.map((item) => `
      <button class="template-card ${item.id === state.selectedTemplateId ? 'active' : ''}" data-template-id="${item.id}">
        <h4>${escapeHtml(item.name)}</h4>
        <div class="muted">${escapeHtml(item.description)}</div>
        <div class="muted">${escapeHtml(item.category)} · v${escapeHtml(item.version)}</div>
      </button>`).join('')}`;
}

function clearApplyFeedback() {
  state.applyFeedback = { kind: '', text: '', title: '', detail: '', debugMeta: null };
}

function renderApplyFeedback() {
  if (!state.applyFeedback.text && !state.applyFeedback.detail) {
    return '<div id="apply-message" class="inline-message muted">选择目标 Agent 后即可应用模板。</div>';
  }
  return `
    <div id="apply-message" class="feedback-card ${state.applyFeedback.kind || 'loading'}" title="${escapeHtml(state.applyFeedback.title || '')}">
      <div class="feedback-title">${escapeHtml(state.applyFeedback.text || '')}</div>
      ${state.applyFeedback.detail ? `<pre class="feedback-detail">${escapeHtml(state.applyFeedback.detail)}</pre>` : ''}
      ${renderDebugMeta(state.applyFeedback.debugMeta, '本次 apply 调试头')}
    </div>`;
  updateFeishuEmptyState();
}


function renderConfigDebugSection() {
  return `
    <div class="debug-stack">
      ${renderDebugMeta(state.debugMeta.templates, '模板列表调试头')}
      ${renderDebugMeta(state.debugMeta.agents, 'Agent 列表调试头')}
      ${renderDebugMeta(state.debugMeta.templateDetail, '模板详情调试头')}
    </div>`;
  updateFeishuEmptyState();
}


function renderTemplateDetail() {
  if (!els.templateDetail) return;
  const payload = state.templateDetailPayload;
  if (!payload) return;

  if (!payload.success) {
    if (els.templateMeta) els.templateMeta.textContent = '详情失败';
    els.templateDetail.innerHTML = renderErrorCard(payload, '模板详情拉取失败时，暂不允许继续 apply。');
    return;
  }

  const { id, name, description, version, category, config, rawYaml } = payload.data;
  const agents = state.agents || [];
  const templatesSummary = renderDataSourceSummary('模板列表', state.templatesPayload);
  const agentsSummary    = renderDataSourceSummary('Agent 列表', state.agentsPayload);
  const canApply = !state.pending.apply && state.agentsPayload?.success && agents.length > 0;
  const selectedAgent = agents.find((agent) => agent.id === state.selectedAgentId);

  if (els.templateMeta) els.templateMeta.textContent = `${category} · v${version}`;
  els.templateDetail.innerHTML = `
    <div class="template-detail-header">
      <div>
        <h3>${escapeHtml(name)}</h3>
        <div class="muted">${escapeHtml(description)}</div>
        <div class="template-meta-row muted">ID: <span>${escapeHtml(id)}</span></div>
      </div>
      <span class="pill neutral">${Object.keys(config || {}).length} fields</span>
    </div>

    <div class="summary-grid">
      ${templatesSummary}
      ${agentsSummary}
    </div>

    ${(state.templatesPayload?.stale || state.agentsPayload?.stale)
      ? '<div class="state-box warning">当前 Config 页存在 stale 数据。</div>' : ''}
    ${!state.agentsPayload?.success
      ? '<div class="state-box error">Agent 列表当前不可用，无法执行模板应用。</div>' : ''}
    ${state.agentsPayload?.success && !agents.length
      ? '<div class="empty-box">当前没有可选 Agent，apply 暂不可操作。</div>' : ''}

    ${renderConfigDebugSection()}

    <label>
      <div class="muted">目标 Agent</div>
      <select id="apply-agent-select" ${canApply ? '' : 'disabled'}>
        <option value="">请选择目标 Agent</option>
        ${agents.map((agent) => `
          <option value="${escapeHtml(agent.id)}" ${agent.id === state.selectedAgentId ? 'selected' : ''}>
            ${escapeHtml(agent.name)} (${escapeHtml(agent.id)})
          </option>`).join('')}
      </select>
      <div class="muted">${selectedAgent
        ? `当前选择：${selectedAgent.name} (${selectedAgent.id})`
        : '尚未选择目标 Agent。'}</div>
    </label>

    <div class="form-actions">
      <button id="apply-template" class="primary-button" ${canApply ? '' : 'disabled'}>
        ${state.pending.apply ? '应用中…' : '应用模板'}
      </button>
      ${renderApplyFeedback()}
    </div>

    <div class="list-card stack gap-sm">
      <strong>config 预览</strong>
      <pre>${escapeHtml(JSON.stringify(config, null, 2))}</pre>
    </div>

    <div class="list-card stack gap-sm">
      <strong>rawYaml 只读预览</strong>
      <pre>${escapeHtml(rawYaml)}</pre>
    </div>`;

  const applyButton = $('#apply-template');
  const select      = $('#apply-agent-select');

  select?.addEventListener('change', () => {
    state.selectedAgentId = select.value || '';
    renderTemplateDetail();
  });

  applyButton?.addEventListener('click', async () => {
    const targetAgentId = select?.value || '';
    state.selectedAgentId = targetAgentId;

    if (!targetAgentId) {
      state.applyFeedback = {
        kind: 'warning', text: '请选择目标 Agent 后再应用。',
        title: '', detail: 'POST 仅接受 targetAgentId 作为必要请求体字段。', debugMeta: null,
      };
      renderTemplateDetail();
      return;
    }

    state.pending.apply = true;
    state.applyFeedback = {
      kind: 'loading', text: '应用中…', title: '',
      detail: `正在向 ${targetAgentId} 应用模板，完成后会更新反馈。`, debugMeta: null,
    };
    renderTemplateDetail();

    try {
      const { payload: applyPayload, debugMeta } = await apiFetch(
        `/api/v1/config/templates/${state.selectedTemplateId}/apply`,
        { method: 'POST', body: JSON.stringify({ targetAgentId }) }
      );

      if (!applyPayload.success) {
        state.applyFeedback = {
          kind: 'error',
          text: `${applyPayload.error.code}｜${applyPayload.error.message}`,
          title: applyPayload.error.detail || '',
          detail: applyPayload.error.detail || '后端未返回 detail。',
          debugMeta,
        };
        return;
      }

      state.applyFeedback = {
        kind: applyPayload.stale ? 'warning' : 'success',
        text: `${applyPayload.data.message} · ${applyPayload.data.targetAgentId}`,
        title: applyPayload.data.runtimeEffect ? `runtimeEffect: ${applyPayload.data.runtimeEffect}` : '',
        detail: [
          applyPayload.data.appliedFields?.length ? `appliedFields: ${applyPayload.data.appliedFields.join(', ')}` : '',
          applyPayload.data.effectiveScope  ? `effectiveScope: ${applyPayload.data.effectiveScope}` : '',
          applyPayload.data.runtimeEffect   ? `runtimeEffect: ${applyPayload.data.runtimeEffect}`  : '',
          applyPayload.data.appliedAt       ? `appliedAt: ${applyPayload.data.appliedAt}`           : '',
        ].filter(Boolean).join('\n'),
        debugMeta,
      };
    } catch (error) {
      state.applyFeedback = {
        kind: 'error', text: error.message || 'apply failed',
        title: '', detail: '前端请求阶段失败，请检查网络或服务可达性。', debugMeta: null,
      };
    } finally {
      state.pending.apply = false;
      renderTemplateDetail();
    }
  });
}

// ─── Skeleton helpers ─────────────────────────────────────────────────────────
function skeletonKpiCards(count = 5) {
  const card = `
    <div class="skeleton-kpi-card">
      <div class="skeleton-line" style="height:11px;width:55%"></div>
      <div class="skeleton-line" style="height:32px;width:60%"></div>
      <div class="skeleton-line" style="height:10px;width:40%"></div>
    </div>`;
  return `<div class="skeleton-kpi-grid">${card.repeat(count)}</div>`;
}

function skeletonAgentCards(count = 3) {
  const card = `
    <div class="skeleton-agent-card">
      <div style="display:flex;gap:10px;align-items:center">
        <div class="skeleton-line" style="width:40px;height:40px;border-radius:50%;flex-shrink:0"></div>
        <div style="flex:1;display:flex;flex-direction:column;gap:6px">
          <div class="skeleton-line" style="height:13px;width:65%"></div>
          <div class="skeleton-line" style="height:10px;width:45%"></div>
        </div>
      </div>
      <div class="skeleton-line" style="height:10px;width:80%;margin-top:4px"></div>
    </div>`;
  return `<div class="skeleton-agent-grid">${card.repeat(count)}</div>`;
}

function skeletonTaskRows(count = 4) {
  const row = `
    <div class="skeleton-task-row">
      <div class="skeleton-line" style="width:28px;height:11px;flex-shrink:0"></div>
      <div class="skeleton-line" style="flex:1;height:13px"></div>
      <div class="skeleton-line" style="width:60px;height:20px;flex-shrink:0;border-radius:20px"></div>
      <div class="skeleton-line" style="width:70px;height:11px;flex-shrink:0"></div>
      <div class="skeleton-line" style="width:80px;height:11px;flex-shrink:0"></div>
    </div>`;
  return `<div class="skeleton-task-list">${row.repeat(count)}</div>`;
}

// ─── Tasks State & Loader ─────────────────────────────────────────────────────
const tasksState = {
  data: null,   // Array from /api/v1/tasks, or null if not loaded / failed
  pending: false,
  error: null,
};

// Normalize a task record from API to the shape used in STATIC_TASKS
function normalizeApiTask(t, index) {
  return {
    id:       t.id       || t.taskId  || `task-api-${index}`,
    filename: t.filename || t.file    || '',
    name:     t.name     || t.title   || t.summary || `任务 #${index + 1}`,
    status:   t.status   || 'active',
    role:     t.role     || t.assignee || t.agentId || '',
    date:     t.date     || t.updatedAt || t.createdAt || '',
    size:     t.size     || '',
    preview:  t.preview  || t.description || t.content || '',
  };
}

async function loadTasks() {
  tasksState.pending = true;
  tasksState.error = null;

  // Show skeleton in tasks board while loading
  const board = document.querySelector('#tasks-board');
  if (board) board.innerHTML = skeletonTaskRows(4);

  try {
    const { payload } = await apiFetch('/api/v1/tasks');
    if (payload && payload.success) {
      const raw = Array.isArray(payload.data)
        ? payload.data
        : (payload.data?.items || payload.data?.tasks || []);
      tasksState.data = raw.map((t, i) => normalizeApiTask(t, i));
    } else {
      tasksState.data = null;
      tasksState.error = payload?.error?.message || '加载失败';
    }
  } catch (err) {
    tasksState.data = null;
    tasksState.error = err.message || '网络错误';
  } finally {
    tasksState.pending = false;
  }

  renderTasks();
}

// ─── Tasks rendering ──────────────────────────────────────────────────────────
function renderTasks() {
  const board = document.querySelector('#tasks-board');
  const countEl = document.querySelector('#tasks-count');
  const boardView = document.querySelector('#tasks-board-view');
  if (!board) return;

  // Quick Filter Chips - 确保只绑定一次
  const filterBar = document.querySelector('#tasks-quick-filters');
  if (filterBar && !filterBar.dataset.bound) {
    filterBar.dataset.bound = 'true';
    filterBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.quick-chip');
      if (!chip) return;
      const filter = chip.dataset.filter;
      // 重置所有chips
      filterBar.querySelectorAll('.quick-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      
      // 筛选任务行（列表视图）
      board.querySelectorAll('.task-row').forEach(row => {
        const taskId = row.dataset.taskId;
        const taskSource = tasksState.data || STATIC_TASKS;
        const task = taskSource.find(t => t.id === taskId);
        const status = task?.status || 'done';
        row.style.display = (filter === 'all' || status === filter) ? '' : 'none';
      });
      
      // 筛选看板视图
      if (boardView && !boardView.classList.contains('visible')) {
        // 暂不处理，看板视图保持全部显示
      }
    });
  }

  // Segment Switch - 确保只绑定一次
  const viewSwitch = document.querySelector('#tasks-view-switch');
  if (viewSwitch && !viewSwitch.dataset.bound) {
    viewSwitch.dataset.bound = 'true';
    viewSwitch.addEventListener('click', (e) => {
      const item = e.target.closest('.segment-item');
      if (!item) return;
      const view = item.dataset.view;
      // 更新激活状态
      viewSwitch.querySelectorAll('.segment-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      // 切换视图
      if (view === 'board') {
        board.style.display = 'none';
        if (boardView) {
          boardView.style.display = 'grid';
          boardView.classList.add('visible');
        }
      } else {
        board.style.display = '';
        if (boardView) {
          boardView.style.display = 'none';
          boardView.classList.remove('visible');
        }
      }
    });
  }

  // Inject create-task form above the board (idempotent)
  if (!document.querySelector('#task-create-form')) {
    board.insertAdjacentHTML('beforebegin', `<div id="task-create-form" style="margin-bottom:var(--space-4,16px);display:flex;gap:var(--space-2,8px)">
  <input id="new-task-title" type="text" placeholder="输入新任务标题..." style="flex:1;padding:8px 12px;border:1px solid #ddd;border-radius:var(--radius-md,8px);font-size:var(--text-base,14px)" />
  <button id="btn-create-task" style="padding:8px 16px;background:#4f46e5;color:#fff;border:none;border-radius:var(--radius-md,8px);cursor:pointer;font-size:var(--text-base,14px)">+ 新建</button>
</div>`);
  }

  applyReadonlyStateToTaskButtons();

  // 使用 API 数据或 fallback 到静态数据
  const activeTasks = tasksState.data || STATIC_TASKS;

  // 如果加载出错，显示错误提示但仍用静态数据
  if (tasksState.error && !tasksState.data) {
    showToast({ type: 'warning', message: `任务数据加载失败（${tasksState.error}），已使用本地数据`, duration: 4000 });
  }

  const grouped = { active: [], blocked: [], done: [] };
  for (const task of activeTasks) {
    (grouped[task.status] || grouped.done).push(task);
  }

  const colDefs = [
    { key: 'active',  label: '进行中', icon: '🔵' },
    { key: 'blocked', label: '阻塞中', icon: '🔴' },
    { key: 'done',    label: '已完成', icon: '✅' },
  ];

  // 任务状态 badge 映射
  function taskStatusBadge(status) {
    const map = {
      active:  { cls: 'badge info',  icon: '🔵', label: '进行中' },
      blocked: { cls: 'badge error', icon: '🔴', label: '阻塞中' },
      done:    { cls: 'badge ok',    icon: '✅', label: '已完成' },
    };
    const entry = map[status] || { cls: 'badge idle', icon: '⚫', label: escapeHtml(status || '未知') };
    return `<span class="${entry.cls}">${entry.icon} ${entry.label}</span>`;
  }

  // 角色缩写（显示更紧凑）
  function roleShortName(role) {
    const knownRole = AGENT_CHINESE_NAMES[role];
    if (knownRole) return knownRole.replace(/（.*）$/, '');
    return role.replace(/^agent-/, '').replace(/-/g, ' ');
  }

  // ─── 列表视图：逐行形式（#tasks-board）───────────────────────────────────
  board.innerHTML = `<div class="task-list-view">${
    activeTasks.length === 0
      ? '<div class="muted" style="padding:16px 0;text-align:center">暂无任务</div>'
      : activeTasks.map((task, index) => `
          <button class="task-row" data-task-id="${escapeHtml(task.id)}">
            <span class="task-row-num">#${index + 1}</span>
            <span class="task-row-title" title="${escapeHtml(task.name)}">${escapeHtml(task.name)}</span>
            ${taskStatusBadge(task.status)}
            <span class="task-row-role role-chip">${escapeHtml(roleShortName(task.role))}</span>
            <span class="task-row-date">📅 ${escapeHtml(task.date || '—')}</span>
          </button>`).join('')
  }</div>`;

  if (countEl) countEl.textContent = `共 ${activeTasks.length} 个任务`;

  // ─── 看板视图（#tasks-board-view）保持三列形态 ───────────────────────────
  if (boardView) {
    const pendingLane = boardView.querySelector('#lane-pending');
    const activeLane = boardView.querySelector('#lane-active');
    const doneLane = boardView.querySelector('#lane-done');
    
    // 根据任务状态构建看板（这里我们简化：pending = blocked, active = active, done = done）
    if (pendingLane) {
      const pendingCount = grouped.blocked.length;
      pendingLane.querySelector('.tasks-count-pending').textContent = `(${pendingCount})`;
      const laneContent = pendingLane.querySelector('.board-lane-content') || (() => {
        const div = document.createElement('div');
        div.className = 'board-lane-content';
        pendingLane.appendChild(div);
        return div;
      })();
      laneContent.innerHTML = grouped.blocked.map(task => `
        <button class="board-task-chip" data-task-id="${escapeHtml(task.id)}" title="${escapeHtml(task.name)}">
          <div style="font-weight:600;font-size:var(--text-sm)">${escapeHtml(task.name.length > 40 ? task.name.slice(0, 38) + '…' : task.name)}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
            <span class="badge error" style="font-size:10px;padding:1px 6px">🔴 阻塞</span>
            <small class="muted">${escapeHtml(roleShortName ? roleShortName(task.role) : task.role)}</small>
          </div>
        </button>
      `).join('');
      
      // 绑定点击事件
      laneContent.querySelectorAll('[data-task-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          const taskId = btn.dataset.taskId;
          state.selectedTaskId = taskId;
          renderTaskDetail(taskId);
        });
      });
    }
    
    if (activeLane) {
      const activeCount = grouped.active.length;
      activeLane.querySelector('.tasks-count-active').textContent = `(${activeCount})`;
      const laneContent = activeLane.querySelector('.board-lane-content') || (() => {
        const div = document.createElement('div');
        div.className = 'board-lane-content';
        activeLane.appendChild(div);
        return div;
      })();
      laneContent.innerHTML = grouped.active.map(task => `
        <button class="board-task-chip" data-task-id="${escapeHtml(task.id)}" title="${escapeHtml(task.name)}">
          <div style="font-weight:600;font-size:var(--text-sm)">${escapeHtml(task.name.length > 40 ? task.name.slice(0, 38) + '…' : task.name)}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
            <span class="badge info" style="font-size:10px;padding:1px 6px">🔵 进行中</span>
            <small class="muted">${escapeHtml(roleShortName ? roleShortName(task.role) : task.role)}</small>
          </div>
        </button>
      `).join('');
      
      laneContent.querySelectorAll('[data-task-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          const taskId = btn.dataset.taskId;
          state.selectedTaskId = taskId;
          renderTaskDetail(taskId);
        });
      });
    }
    
    if (doneLane) {
      const doneCount = grouped.done.length;
      doneLane.querySelector('.tasks-count-done').textContent = `(${doneCount})`;
      const laneContent = doneLane.querySelector('.board-lane-content') || (() => {
        const div = document.createElement('div');
        div.className = 'board-lane-content';
        doneLane.appendChild(div);
        return div;
      })();
      laneContent.innerHTML = grouped.done.map(task => `
        <button class="board-task-chip" data-task-id="${escapeHtml(task.id)}" title="${escapeHtml(task.name)}">
          <div style="font-weight:600;font-size:var(--text-sm);opacity:0.7">${escapeHtml(task.name.length > 40 ? task.name.slice(0, 38) + '…' : task.name)}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
            <span class="badge ok" style="font-size:10px;padding:1px 6px">✅ 已完成</span>
            <small class="muted">${escapeHtml(roleShortName ? roleShortName(task.role) : task.role)}</small>
          </div>
        </button>
      `).join('');
      
      laneContent.querySelectorAll('[data-task-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          const taskId = btn.dataset.taskId;
          state.selectedTaskId = taskId;
          renderTaskDetail(taskId);
        });
      });
    }
  }

  // Re-bind task click events (list rows + board view)
  const allTaskButtons = [
    ...board.querySelectorAll('[data-task-id]'),
    ...(boardView ? boardView.querySelectorAll('[data-task-id]') : []),
  ];
  allTaskButtons.forEach((btn) => {
    // avoid double-binding on board view (already bound above)
    if (btn.closest('#tasks-board-view') && btn.dataset.boundDetail) return;
    if (btn.closest('#tasks-board-view')) btn.dataset.boundDetail = 'true';
    btn.addEventListener('click', () => {
      const taskId = btn.dataset.taskId;
      if (state.selectedTaskId === taskId) {
        state.selectedTaskId = null;
        const panel = document.querySelector('#task-detail-panel');
        if (panel) panel.style.display = 'none';
      } else {
        state.selectedTaskId = taskId;
        renderTaskDetail(taskId);
      }
    });
  });
}

function renderTaskDetail(taskId) {
  const taskSource = tasksState.data || STATIC_TASKS;
  const task = taskSource.find((t) => t.id === taskId);
  const panel = document.querySelector('#task-detail-panel');
  const title = document.querySelector('#task-detail-title');
  const content = document.querySelector('#task-detail-content');
  if (!panel || !task) return;

  const statusOptions = ['active', 'blocked', 'done'];
  const statusLabels  = { active: '进行中', blocked: '阻塞中', done: '已完成' };

  panel.style.display = '';
  if (title) title.textContent = task.name;
  // 根据角色 ID 推断执行链（简化版）
  function buildExecChain(role) {
    const chainMap = {
      'product-ekko':   ['product-ekko', 'architect-jax', 'frontend-ezreal', 'codingqa-galio'],
      'architect-jax':  ['architect-jax', 'frontend-ezreal', 'codingqa-galio'],
      'frontend-ezreal':['frontend-ezreal', 'codingqa-galio'],
      'backend-leona':  ['backend-leona', 'codingqa-galio'],
      'ui-lux':         ['ui-lux', 'frontend-ezreal', 'codingqa-galio'],
      'aioffice-jayce': ['aioffice-jayce'],
      'codingqa-galio': ['codingqa-galio'],
      'orchestrator-teemo': ['orchestrator-teemo', 'product-ekko', 'frontend-ezreal'],
    };
    // 匹配
    for (const [key, chain] of Object.entries(chainMap)) {
      if (role && role.includes(key.split('-').pop())) return chain;
    }
    return [role].filter(Boolean);
  }

  function renderExecChain(role, taskStatus) {
    const chain = buildExecChain(role);
    if (chain.length <= 1) return '';
    const roleIndex = chain.findIndex(r => role && role.includes(r.split('-').pop()));
    const nodes = chain.map((r, i) => {
      const name  = AGENT_CHINESE_NAMES[r] || r.replace(/-/g, ' ');
      const isDone = taskStatus === 'done' || i < roleIndex;
      const isCurrent = i === roleIndex;
      const nodeClass = isDone ? 'chain-node done' : isCurrent ? 'chain-node current' : 'chain-node pending';
      const icon = isDone ? '✓' : isCurrent ? '⏳' : '○';
      return `<div class="${nodeClass}" title="${escapeHtml(name)}" style="display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px">
        <span style="width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;
          background:${isDone ? '#22c55e' : isCurrent ? '#f97316' : 'var(--panel-alt)'};
          color:${isDone || isCurrent ? '#fff' : 'var(--dim)'};
          border:1px solid ${isDone ? '#22c55e' : isCurrent ? '#f97316' : 'var(--border)'}">${icon}</span>
        <span style="color:${isDone ? 'var(--text)' : isCurrent ? 'var(--primary)' : 'var(--dim)'};max-width:56px;text-align:center;word-break:break-word">${escapeHtml(name.replace(/（.*）$/, ''))}</span>
      </div>`;
    });
    const withArrows = nodes.flatMap((n, i) => i < nodes.length - 1 ? [n, `<span style="color:var(--dim);font-size:12px;padding-top:8px">→</span>`] : [n]);
    return `
      <div style="margin:var(--space-sm) 0;padding:var(--space-sm) var(--space-md);background:var(--panel-alt);border-radius:var(--radius-md);border:1px solid var(--border)">
        <div class="muted" style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">执行链路</div>
        <div style="display:flex;align-items:flex-start;gap:4px;flex-wrap:wrap">${withArrows.join('')}</div>
      </div>`;
  }

  if (content) {
    content.innerHTML = `
      <div class="task-card-meta" style="font-size:13px;">
        <span>📅 最后修改：${escapeHtml(task.date)}</span>
        <span class="role-chip">${escapeHtml(task.role)}</span>
        <span>📁 ${escapeHtml(task.filename)}</span>
        <span class="badge ${task.status === 'active' ? 'info' : task.status === 'blocked' ? 'error' : 'ok'}">${task.status === 'active' ? '🔵 进行中' : task.status === 'done' ? '✅ 已完成' : task.status === 'blocked' ? '🔴 阻塞' : escapeHtml(task.status)}</span>
      </div>
      ${renderExecChain(task.role, task.status)}
      <div class="md-preview">${renderMarkdown(task.preview)}</div>
      <div class="task-status-actions" style="margin-top:var(--space-md);display:flex;gap:var(--space-sm);flex-wrap:wrap;align-items:center;">
        <span style="font-size:var(--text-sm);color:var(--muted);">变更状态：</span>
        ${statusOptions.filter((s) => s !== task.status).map((s) => `
          <button class="btn-change-status" data-task-id="${escapeHtml(task.id)}" data-new-status="${s}"
            style="padding:4px 12px;border-radius:var(--radius-md);border:1px solid var(--border);background:var(--panel-alt);color:var(--text);font-size:var(--text-sm);cursor:pointer;">
            → ${escapeHtml(statusLabels[s] || s)}
          </button>`).join('')}
      </div>`;

    // Bind status change buttons
    content.querySelectorAll('.btn-change-status').forEach((btn) => {
      btn.addEventListener('click', () => changeTaskStatus(btn.dataset.taskId, btn.dataset.newStatus));
    });
    applyReadonlyStateToTaskButtons(content);
  }

  openInspector(task.name, `
      <div class="stack gap-sm">
        <div><strong>任务状态：</strong>${escapeHtml(statusLabels[task.status] || task.status)}</div>
        <div><strong>负责角色：</strong>${escapeHtml(task.role)}</div>
        <div><strong>文件：</strong>${escapeHtml(task.filename || '—')}</div>
        <div><strong>最后修改：</strong>${escapeHtml(task.date || '—')}</div>
        <div><strong>摘要：</strong></div>
        <div class="muted">${escapeHtml((task.preview || '').slice(0, 240) || '暂无摘要')}</div>
      </div>`);
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function changeTaskStatus(taskId, newStatus) {
  if (state.security.readonlyMode) {
    showToast({ type: 'warning', message: '当前为只读模式，任务状态不可修改' });
    applyReadonlyStateToTaskButtons();
    return;
  }
  try {
    const res = await fetch(`/api/v1/tasks/${encodeURIComponent(taskId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      // Update local state (API data or static fallback)
      const taskSource = tasksState.data || STATIC_TASKS;
      const task = taskSource.find((t) => t.id === taskId);
      if (task) task.status = newStatus;
      showToast({ type: 'success', message: `任务状态已更新为"${newStatus === 'active' ? '进行中' : newStatus === 'done' ? '已完成' : '阻塞中'}"` });
      renderTasks();
      renderTaskDetail(taskId);
    } else {
      const body = await res.json().catch(() => ({}));
      const msg  = body?.error?.message || `状态变更失败（${res.status}）`;
      showToast({ type: 'error', message: msg });
    }
  } catch (err) {
    showToast({ type: 'error', message: `网络错误：${err.message || '请求失败'}` });
  }
}

// ─── Docs rendering ───────────────────────────────────────────────────────────
async function loadDocs() {
  if (docsState.pending) return;
  docsState.pending = true;
  docsState.error = null;

  const stateEl = document.querySelector('#docs-state');
  const refreshBtn = document.querySelector('#refresh-docs');
  if (stateEl) { stateEl.className = 'state-box loading'; stateEl.textContent = '文档列表加载中…'; }
  if (refreshBtn) { refreshBtn.disabled = true; refreshBtn.textContent = '刷新中…'; }

  try {
    const { payload } = await apiFetch('/api/v1/docs');
    if (payload && payload.success) {
      docsState.list = Array.isArray(payload.data) ? payload.data : [];
      docsState.error = null;
    } else {
      docsState.list = [];
      docsState.error = (payload && payload.error && payload.error.message) || '加载失败';
    }
  } catch (err) {
    docsState.list = [];
    docsState.error = err.message || '网络错误';
  } finally {
    docsState.pending = false;
    if (refreshBtn) { refreshBtn.disabled = false; refreshBtn.textContent = '刷新文档'; }
  }
  renderDocs();
}

function renderDocs() {
  const list = document.querySelector('#docs-list');
  const stateEl = document.querySelector('#docs-state');
  if (!list) return;

  if (docsState.pending) {
    if (stateEl) { stateEl.className = 'state-box loading'; stateEl.textContent = '文档列表加载中…'; }
    list.innerHTML = '';
    return;
  }

  if (docsState.error) {
    if (stateEl) { stateEl.className = 'state-box error'; stateEl.textContent = `加载失败：${docsState.error}`; }
    list.innerHTML = '<div class="empty-box">文档加载出错，请点击"刷新文档"重试。</div>';
    return;
  }

  if (!docsState.list) {
    // Not yet loaded — trigger load
    loadDocs();
    return;
  }

  const docs = docsState.list;

  if (stateEl) {
    stateEl.className = 'state-box success';
    stateEl.textContent = `已加载 ${docs.length} 篇文档`;
  }
  const countEl = document.querySelector('#docs-count');
  if (countEl) countEl.textContent = `共 ${docs.length} 篇文档`;

  if (!docs.length) {
    list.innerHTML = '<div class="empty-box">暂无文档。</div>';
    return;
  }

  list.innerHTML = docs.map((doc) => `
    <button class="doc-file-card ${doc.filename === docsState.selectedFilename ? 'active' : ''}" data-filename="${escapeHtml(doc.filename)}">
      <div class="doc-file-name">${escapeHtml(doc.name)}</div>
      <div class="doc-file-meta">
        <span>📅 ${escapeHtml(formatDateCN(doc.mtime))}</span>
        <span>📄 ${escapeHtml(formatFileSizeCN(doc.size))}</span>
      </div>
    </button>`).join('');

  // Bind click events
  list.querySelectorAll('[data-filename]').forEach((btn) => {
    btn.addEventListener('click', () => {
      docsState.selectedFilename = btn.dataset.filename;
      list.querySelectorAll('.doc-file-card').forEach((b) => {
        b.classList.toggle('active', b.dataset.filename === docsState.selectedFilename);
      });
      renderDocDetail(docsState.selectedFilename);
    });
  });

  // Re-render previously selected doc
  if (docsState.selectedFilename) renderDocDetail(docsState.selectedFilename);
}

async function renderDocDetail(filename) {
  const contentEl = document.querySelector('#doc-content');
  const metaEl    = document.querySelector('#doc-meta');
  if (!contentEl || !filename) return;

  // If cached, render immediately
  if (docsState.contentCache[filename]) {
    const cached = docsState.contentCache[filename];
    if (metaEl) metaEl.textContent = `${escapeHtml(filename)}`;
    contentEl.innerHTML = `<div class="md-preview">${renderMarkdown(cached)}</div>`;
    return;
  }

  // Fetch file content
  contentEl.innerHTML = '<div class="empty-box">内容加载中…</div>';
  if (metaEl) metaEl.textContent = filename;

  try {
    const { payload } = await apiFetch(`/api/v1/docs?file=${encodeURIComponent(filename)}`);
    if (payload && payload.success && payload.data && payload.data.content) {
      docsState.contentCache[filename] = payload.data.content;
      contentEl.innerHTML = `<div class="md-preview">${renderMarkdown(payload.data.content)}</div>`;
    } else {
      const errMsg = (payload && payload.error && payload.error.message) || '加载失败';
      contentEl.innerHTML = `<div class="empty-box">文档加载失败：${escapeHtml(errMsg)}</div>`;
    }
  } catch (err) {
    contentEl.innerHTML = `<div class="empty-box">网络错误：${escapeHtml(err.message || '请求失败')}</div>`;
  }
}

// ─── Collaboration ────────────────────────────────────────────────────────────

const collabState = { data: null, pending: false, dataSource: 'none' };

// Helper: resolve agentId to Chinese display name
function getAgentChineseName(agentId) {
  if (!agentId) return '—';
  const known = AGENT_CHINESE_NAMES[agentId];
  if (known) return known;
  // Try to find from agents data
  const items = state.agentsData?.data?.items || [];
  const agent = items.find((a) => a.id === agentId || a.name === agentId);
  if (agent) return agent.name || agentId;
  // Fallback: humanize
  return agentId.replace(/^agent-/, '').replace(/-/g, ' ');
}

// Helper: get channel display string
function getChannelIcon(channel) {
  return CHANNEL_ICONS[channel] || `📡 ${channel || '未知'}`;
}

// Normalize session from any API format to common shape
function normalizeSession(s) {
  return {
    id:              s.id            || s.sessionKey    || s.session_id || '—',
    agentId:         s.agentId       || s.agent_id      || '—',
    channel:         s.channel       || s.channelType   || s.channel_type || '',
    status:          s.status        || 'unknown',
    startedAt:       s.startedAt     || s.createdAt     || s.started_at || '',
    parentSessionId: s.parentSessionId || s.parentSessionKey || s.parent_id || null,
    type:            s.type          || '',
    _raw:            s,
  };
}

async function loadCollaboration() {
  collabState.pending = true;
  const stateEl    = document.querySelector('#collab-state');
  const refreshBtn = document.querySelector('#refresh-collab');
  if (stateEl)    { stateEl.className = 'state-box loading'; stateEl.textContent = '协作会话加载中…'; }
  if (refreshBtn) { refreshBtn.disabled = true; refreshBtn.textContent = '刷新中…'; }
  try {
    // Try new sessions API first (Leona implementing)
    let loaded = false;
    try {
      const { payload } = await apiFetch('/api/v1/sessions');
      if (payload?.success) {
        collabState.data = payload;
        collabState.dataSource = 'sessions';
        loaded = true;
      }
    } catch { /* fall through */ }

    if (!loaded) {
      // Fallback: collaboration API
      try {
        const { payload } = await apiFetch('/api/v1/collaboration');
        collabState.data = payload;
        collabState.dataSource = 'collaboration';
      } catch (err2) {
        // Last resort: use mock data
        collabState.data = { success: true, data: MOCK_SESSIONS, _mock: true };
        collabState.dataSource = 'mock';
      }
    }
  } catch (err) {
    collabState.data = normalizeErrorPayload({ message: err.message || 'network error' });
    collabState.dataSource = 'none';
  } finally {
    collabState.pending = false;
    if (refreshBtn) { refreshBtn.disabled = false; refreshBtn.textContent = '刷新协作'; }
  }
  renderCollaboration();
}

function renderCollaboration() {
  const stateEl = document.querySelector('#collab-state');
  const listEl  = document.querySelector('#collab-list');
  const payload = collabState.data;

  if (!payload) {
    if (stateEl) { stateEl.className = 'state-box loading'; stateEl.textContent = '协作会话加载中…'; }
    return;
  }
  if (!payload.success) {
    if (stateEl) { stateEl.className = 'state-box error'; stateEl.textContent = `${payload.error?.code || 'ERROR'}｜${payload.error?.message || '请求失败'}`; }
    if (listEl) listEl.innerHTML = renderErrorCard(payload, '请检查 /api/v1/sessions 或 /api/v1/collaboration 返回，或点击"刷新协作"重试。');
    return;
  }

  // Extract sessions array from normalized formats
  let sessions = [];
  if (collabState.dataSource === 'sessions' && payload.data?.items) {
    sessions = payload.data.items;
  } else if (collabState.dataSource === 'collaboration') {
    sessions = Array.isArray(payload.data) ? payload.data : (payload.data?.items || payload.data?.sessions || []);
  } else if (collabState.dataSource === 'mock') {
    sessions = payload.data || [];
  }

  // Normalize all sessions
  const normalizedSessions = sessions.map(normalizeSession);

  if (stateEl) {
    const ds = collabState.dataSource === 'mock' ? '（模拟演示）' : '';
    stateEl.className = 'state-box success';
    stateEl.textContent = `已加载 ${normalizedSessions.length} 条协作会话` + ds;
  }
  if (!listEl) return;
  if (!normalizedSessions.length) {
    listEl.innerHTML = '<div class="empty-box">当前没有协作会话数据。</div>';
    return;
  }

  // Build parent→children map
  const byId = {};
  for (const s of normalizedSessions) byId[s.id] = s;
  const roots = normalizedSessions.filter((s) => !s.parentSessionId || !byId[s.parentSessionId]);
  const children = {};
  for (const s of normalizedSessions) {
    if (s.parentSessionId && byId[s.parentSessionId]) {
      (children[s.parentSessionId] = children[s.parentSessionId] || []).push(s);
    }
  }

  // Status pill with refined labels
  function statusPill(status) {
    const label = SESSION_STATUS_MAP[status] || `📌 ${status || 'unknown'}`;
    const statusClass = status === 'running' || status === 'active' ? 'status-active'
      : status === 'completed' ? 'status-completed'
      : status === 'failed' || status === 'error' ? 'status-error'
      : status === 'pending' || status === 'paused' ? 'status-idle'
      : 'status-idle';
    return `<span class="pill ${statusClass}">${label}</span>`;
  }

  // Render a single session (recursive for children)
  function renderSession(s, depth = 0, isChild = false) {
    const indent = depth > 0 ? `style="margin-left: ${depth * 28}px; border-left: 2px solid rgba(104,161,255,0.3); padding-left: 12px;"` : '';
    const childMarker = isChild ? `<span class="collab-child-indicator">↳ 子任务</span>` : '';
    const chineseName = getAgentChineseName(s.agentId);
    const channelIcon = getChannelIcon(s.channel);
    
    return `
      <div class="collab-session ${isChild ? 'child' : ''}" data-session-id="${escapeHtml(s.id)}" ${indent}>
        <div class="collab-session-header">
          ${childMarker}
          <div class="collab-session-core">
            <div class="collab-row">
              <div class="collab-role"><strong>${escapeHtml(chineseName)}</strong></div>
              <div class="collab-channel muted">${channelIcon}</div>
              <div class="collab-spacer"></div>
              ${statusPill(s.status)}
            </div>
            <div class="collab-row">
              <div class="collab-id muted">ID: <code>${escapeHtml(s.id)}</code></div>
              <div class="collab-start muted">开始: ${formatDateCN(s.startedAt)}</div>
            </div>
            ${s.parentSessionId ? `<div class="collab-parent muted">父会话: <code>${escapeHtml(s.parentSessionId)}</code></div>` : ''}
          </div>
        </div>
      </div>
      ${(children[s.id] || []).map((c) => renderSession(c, depth + 1, true)).join('')}`;
  }

  listEl.innerHTML = roots.map((s) => renderSession(s, 0, false)).join('');

  // Add click handlers for session selection
  listEl.querySelectorAll('[data-session-id]').forEach((el) => {
    el.addEventListener('click', (e) => {
      // Don't trigger if clicking inside child elements that have their own actions
      if (e.target.closest('button') || e.target.closest('a')) return;
      const sessionId = el.dataset.sessionId;
      const session = normalizedSessions.find((s) => s.id === sessionId);
      if (session) openSessionDetail(session);
    });
  });
}

// ─── Session Detail Sidebar ──────────────────────────────────────────────────

const sessionDetailState = {
  open: false,
  session: null,
  messages: null,
  pending: false,
  messagesPending: false,
};

// Open sidebar with session details
function openSessionDetail(session) {
  sessionDetailState.open = true;
  sessionDetailState.session = session;
  sessionDetailState.messages = null;
  renderSessionDetail();

  // Fetch recent messages
  loadSessionMessages(session.id);
}

// Close sidebar
function closeSessionDetail() {
  sessionDetailState.open = false;
  renderSessionDetail();
}

// Load recent messages for a session
async function loadSessionMessages(sessionId) {
  sessionDetailState.messagesPending = true;
  renderSessionDetail();

  try {
    // Try new API first
    let loaded = false;
    try {
      const { payload } = await apiFetch(`/api/v1/sessions/${sessionId}/messages?limit=10`);
      if (payload?.success) {
        sessionDetailState.messages = Array.isArray(payload.data) ? payload.data : (payload.data?.items || payload.data?.messages || []);
        loaded = true;
      }
    } catch { /* fallthrough */ }

    if (!loaded) {
      // Try collaboration API fallback if needed
      const { payload } = await apiFetch(`/api/v1/collaboration/${sessionId}/messages?limit=10`);
      if (payload?.success) {
        sessionDetailState.messages = Array.isArray(payload.data) ? payload.data : (payload.data?.items || payload.data?.messages || []);
        loaded = true;
      }
    }

    if (!loaded) {
      // Mock data for demonstration
      sessionDetailState.messages = [
        { role: 'user', content: '请分析当前的 session 结构，并给出优化建议。', timestamp: new Date(Date.now() - 300000).toISOString() },
        { role: 'assistant', content: '根据当前 session 结构分析，父子关系树可以进一步优化，建议增加缩进层级和视觉引导线来提高可读性。', timestamp: new Date(Date.now() - 180000).toISOString() },
        { role: 'user', content: '具体有哪些可实施的改进方案？', timestamp: new Date(Date.now() - 120000).toISOString() },
        { role: 'assistant', content: '1. 父子关系使用树形连线；2. 子会话缩进 24px；3. 状态标签使用统一语义图标（已完成✅，失败❌）；4. 添加鼠标悬停高亮。', timestamp: new Date(Date.now() - 60000).toISOString() },
      ];
    }
  } catch (err) {
    sessionDetailState.messages = [];
    showToast({ type: 'error', message: '无法加载会话消息' });
  } finally {
    sessionDetailState.messagesPending = false;
    renderSessionDetail();
  }
}

// Render the session detail sidebar
function renderSessionDetail() {
  const sidebar = document.getElementById('session-detail-sidebar');
  const overlay = document.getElementById('session-detail-overlay');
  if (!sidebar || !overlay) return;

  if (!sessionDetailState.open) {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
    return;
  }

  const session = sessionDetailState.session;
  if (!session) return;

  sidebar.classList.add('open');
  overlay.classList.add('visible');

  const chineseName = getAgentChineseName(session.agentId);
  const channelIcon = getChannelIcon(session.channel);
  const statusLabel = SESSION_STATUS_MAP[session.status] || `📌 ${session.status}`;

  // Build sidebar HTML
  sidebar.innerHTML = `
    <div class="session-detail-header">
      <h3>会话详情</h3>
      <button class="session-detail-close" id="close-session-detail">✕</button>
    </div>

    <div class="session-detail-body">
      <!-- Basic info -->
      <div class="session-info-card">
        <div class="session-info-row">
          <span class="muted">会话 ID</span>
          <code>${escapeHtml(session.id)}</code>
        </div>
        <div class="session-info-row">
          <span class="muted">执行角色</span>
          <span><strong>${escapeHtml(chineseName)}</strong></span>
        </div>
        <div class="session-info-row">
          <span class="muted">来源</span>
          <span>${channelIcon}</span>
        </div>
        <div class="session-info-row">
          <span class="muted">开始时间</span>
          <span>${formatDateCN(session.startedAt)}</span>
        </div>
        <div class="session-info-row">
          <span class="muted">状态</span>
          <span class="pill ${
            session.status === 'running' || session.status === 'active' ? 'status-active' :
            session.status === 'completed' ? 'status-completed' :
            session.status === 'failed' || session.status === 'error' ? 'status-error' : 'status-idle'
          }">${statusLabel}</span>
        </div>
        ${session.parentSessionId ? `
        <div class="session-info-row">
          <span class="muted">父会话</span>
          <code class="parent-id">${escapeHtml(session.parentSessionId)}</code>
        </div>` : ''}
      </div>

      <!-- Recent messages -->
      <div class="session-messages-section">
        <h4>最近消息</h4>
        ${sessionDetailState.messagesPending ? `
          <div class="session-messages-loading">
            <span class="loading-dots"><span></span><span></span><span></span></span> 加载消息中…
          </div>
        ` : !sessionDetailState.messages || sessionDetailState.messages.length === 0 ? `
          <div class="empty-box mini">暂无消息记录</div>
        ` : `
          <div class="session-messages-list">
            ${sessionDetailState.messages.map((msg, idx) => {
              const roleIcon = msg.role === 'user' ? '👤' : msg.role === 'assistant' ? '🤖' : '💬';
              const roleName = msg.role === 'user' ? '用户' : msg.role === 'assistant' ? '助手' : msg.role;
              const content = String(msg.content || msg.text || '').slice(0, 200);
              const time = msg.timestamp || msg.createdAt || '';
              return `
                <div class="message-item ${msg.role}">
                  <div class="message-role">${roleIcon} ${escapeHtml(roleName)}</div>
                  <div class="message-time muted">${formatDateCN(time)}</div>
                  <div class="message-content">${escapeHtml(content)}${content.length >= 200 ? '…' : ''}</div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    </div>
  `;

  // Bind close button
  sidebar.querySelector('#close-session-detail')?.addEventListener('click', closeSessionDetail);
  overlay.addEventListener('click', closeSessionDetail);
}

// Create session detail sidebar DOM if not exists
function initSessionDetailSidebar() {
  if (document.getElementById('session-detail-sidebar')) return;

  const overlay = document.createElement('div');
  overlay.id = 'session-detail-overlay';
  overlay.className = 'session-detail-overlay';
  
  const sidebar = document.createElement('div');
  sidebar.id = 'session-detail-sidebar';
  sidebar.className = 'session-detail-sidebar';

  document.body.appendChild(overlay);
  document.body.appendChild(sidebar);
}

// ─── Usage ────────────────────────────────────────────────────────────────────

const usageState = { data: null, period: 'today', pending: false };

async function loadUsage(period) {
  if (period) usageState.period = period;
  usageState.pending = true;
  const stateEl = document.querySelector('#usage-state');
  if (stateEl) { stateEl.className = 'state-box loading'; stateEl.textContent = '用量数据加载中…'; }
  try {
    const [usageRes, byAgentRes, contextRes] = await Promise.all([
      apiFetch(`/api/v1/usage?period=${usageState.period}`),
      apiFetch('/api/v1/usage/by-agent'),
      apiFetch('/api/v1/usage/context-pressure'),
    ]);
    usageState.data          = usageRes.payload;
    usageState.byAgent       = byAgentRes.payload;
    usageState.contextPressure = contextRes.payload;
  } catch (err) {
    usageState.data          = normalizeErrorPayload({ message: err.message || 'network error' });
    usageState.byAgent       = null;
    usageState.contextPressure = null;
  } finally {
    usageState.pending = false;
  }
  renderUsage();
  renderUsageByAgent();
  renderContextPressure();
}

function renderUsage() {
  const stateEl   = document.querySelector('#usage-state');
  const summaryEl = document.querySelector('#usage-summary');
  const agentsEl  = document.querySelector('#usage-agents');
  const payload   = usageState.data;

  if (!payload) {
    if (stateEl) { stateEl.className = 'state-box loading'; stateEl.textContent = '用量数据加载中…'; }
    return;
  }
  if (!payload.success) {
    if (stateEl) { stateEl.className = 'state-box error'; stateEl.textContent = `${payload.error?.code || 'ERROR'}｜${payload.error?.message || '请求失败'}`; }
    if (summaryEl) summaryEl.innerHTML = renderErrorCard(payload, '请检查 /api/v1/usage 接口返回。');
    if (agentsEl) agentsEl.innerHTML = '';
    return;
  }

  const d = payload.data || payload;
  const totalTokens = d.totalTokens ?? 0;
  const totalCost   = d.totalCost ?? 0;
  const byAgent     = d.byAgent || [];
  const period      = d.period || usageState.period;

  const periodCN = period === 'today' ? '今日' : period === 'week' ? '本周' : escapeHtml(period);
  if (stateEl) { stateEl.className = 'state-box success'; stateEl.textContent = `用量数据已加载 · 统计周期：${periodCN}`; }

  function fmtTokens(n) {
    if (n >= 1e7) return `${(n / 1e7).toFixed(2)} 千万`;
    if (n >= 1e4) return `${(n / 1e4).toFixed(1)} 万`;
    return String(n);
  }
  function fmtCost(c) {
    if (!c && c !== 0) return '—';
    return `$${Number(c).toFixed(4)}`;
  }

  if (summaryEl) summaryEl.innerHTML = `
    <div class="usage-total-card">
      <div class="usage-total-label">总 Token</div>
      <div class="usage-total-value">${fmtTokens(totalTokens)}</div>
      <span class="usage-period-badge">${periodCN}</span>
    </div>
    <div class="usage-total-card">
      <div class="usage-total-label">总费用</div>
      <div class="usage-total-value">${fmtCost(totalCost)}</div>
      <span class="usage-period-badge">${byAgent.length} 个 Agent</span>
    </div>`;

  if (!agentsEl) return;
  if (!byAgent.length) {
    agentsEl.innerHTML = '<div class="empty-box">暂无按 Agent 分组的用量数据。</div>';
    return;
  }

  const maxTokens = Math.max(...byAgent.map((a) => a.tokens || 0), 1);
  // 从 usageState.byAgent 拿 displayName 做中文名映射
  const displayNameMap = {};
  const byAgentItems = Array.isArray(usageState.byAgent?.data) ? usageState.byAgent.data : [];
  byAgentItems.forEach((item) => { if (item.agentId) displayNameMap[item.agentId] = item.displayName || item.agentId; });

  agentsEl.innerHTML = byAgent
    .slice()
    .sort((a, b) => (b.tokens || 0) - (a.tokens || 0))
    .map((agent) => {
      const pct = ((agent.tokens || 0) / maxTokens * 100).toFixed(1);
      const label = displayNameMap[agent.agentId] || agent.agentId || '未知';
      return `
        <div class="usage-agent-row">
          <span class="usage-agent-name"><span class="muted">角色：</span>${escapeHtml(label)}</span>
          <div class="usage-bar-wrap"><div class="usage-bar-fill" style="width:${pct}%"></div></div>
          <span class="usage-tokens-text"><span class="muted">Token 用量：</span>${fmtTokens(agent.tokens || 0)}</span>
          <span class="usage-cost-text"><span class="muted">费用：</span>${fmtCost(agent.cost)}</span>
        </div>`;
    }).join('');
}

// ─── Usage by Agent (Token Attribution) ──────────────────────────────────────

function renderUsageByAgent() {
  const el      = document.querySelector('#usage-by-agent');
  const stateEl = document.querySelector('#usage-by-agent-state');
  const payload = usageState.byAgent;

  // 处理 Usage period switch
  const periodSwitch = document.querySelector('#usage-period-switch');
  if (periodSwitch && !periodSwitch.dataset.bound) {
    periodSwitch.dataset.bound = 'true';
    periodSwitch.addEventListener('click', (e) => {
      const item = e.target.closest('.segment-item');
      if (!item) return;
      const period = item.dataset.period;
      // 更新激活状态
      periodSwitch.querySelectorAll('.segment-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      // 加载新数据并更新饼图
      loadUsage(period);
    });
  }

  if (!el) return;

  if (!payload) {
    if (stateEl) stateEl.textContent = '加载中…';
    el.innerHTML = '<div class="empty-box">Token 归因数据加载中…</div>';
    // 隐藏饼图
    const pieContainer = document.getElementById('usage-pie-chart-container');
    if (pieContainer) pieContainer.style.display = 'none';
    return;
  }
  if (!payload.success) {
    if (stateEl) stateEl.textContent = `失败：${payload.error?.code || 'ERROR'}`;
    el.innerHTML = renderErrorCard(payload, '请检查 /api/v1/usage/by-agent 接口。');
    // 隐藏饼图
    const pieContainer = document.getElementById('usage-pie-chart-container');
    if (pieContainer) pieContainer.style.display = 'none';
    return;
  }

  const items = Array.isArray(payload.data) ? payload.data : (payload.data?.items || []);
  if (stateEl) stateEl.textContent = `${items.length} 个 Agent`;

  if (!items.length) {
    el.innerHTML = '<div class="empty-box">暂无 Token 归因数据。</div>';
    // 隐藏饼图
    const pieContainer = document.getElementById('usage-pie-chart-container');
    if (pieContainer) pieContainer.style.display = 'none';
    return;
  }

  // 如果有饼图数据则渲染饼图
  const pieContainer = document.getElementById('usage-pie-chart-container');
  if (pieContainer) {
    pieContainer.style.display = 'flex';
    renderUsagePieChart(items);
  }

  function fmtNum(n) {
    if (!n && n !== 0) return '—';
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
  }
  function fmtCostUSD(c) {
    if (!c && c !== 0) return '—';
    return `$${Number(c).toFixed(4)}`;
  }

  el.innerHTML = `
    <div style="overflow-x:auto">
      <table class="usage-attribution-table">
        <thead>
          <tr>
            <th>角色名</th>
            <th>模型</th>
            <th>Input Token</th>
            <th>Output Token</th>
            <th>估算费用（USD）</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item) => `
            <tr>
              <td>${escapeHtml(item.displayName || item.agentId || item.name || '—')}${item.estimated ? '<span class="estimated-badge">（估算）</span>' : ''}</td>
              <td class="muted">${escapeHtml(item.model || '—')}</td>
              <td>${fmtNum(item.tokenIn ?? item.inputTokens ?? item.input_tokens)}</td>
              <td>${fmtNum(item.tokenOut ?? item.outputTokens ?? item.output_tokens)}</td>
              <td>${fmtCostUSD(item.costEstimateUSD ?? item.estimatedCost ?? item.cost)}${item.estimated ? '<span class="estimated-badge">（估算）</span>' : ''}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  updateFeishuEmptyState();
}


// CSS 饼图渲染
function renderUsagePieChart(agentUsageData) {
  const pieEl = document.getElementById('usage-pie');
  const legendEl = document.getElementById('usage-pie-legend');
  const holeValueEl = document.getElementById('pie-hole-value');
  
  if (!pieEl || !legendEl || !holeValueEl) return;
  
  // 筛选和排序数据
  const filtered = agentUsageData.filter(d => {
    const total = d.totalToken ?? (((d.inputTokens ?? d.input_tokens ?? 0) + (d.outputTokens ?? d.output_tokens ?? 0)) || (d.tokens ?? 0));
    return total > 0 && d.agentId;
  }).map(d => ({
    id: d.agentId || d.name || `agent_${Math.random()}`,
    name: d.displayName || d.agentId || d.name || '未知',
    totalToken: d.totalToken ?? (((d.inputTokens ?? d.input_inputs ?? 0) + (d.outputTokens ?? d.output_tokens ?? 0)) || (d.tokens ?? 0)),
    cost: d.costEstimateUSD ?? d.estimatedCost ?? d.cost ?? 0,
    color: getAgentColor(d.agentId || d.name)
  })).sort((a, b) => b.totalToken - a.totalToken);
  
  if (filtered.length === 0) {
    pieEl.style.background = 'conic-gradient(var(--dim, #5c6e96) 0% 100%)';
    holeValueEl.textContent = '0';
    legendEl.innerHTML = '<div class="pie-legend-item">无用量数据</div>';
    return;
  }
  
  const total = filtered.reduce((sum, d) => sum + d.totalToken, 0);
  
  // 生成 conic-gradient 停止点
  let cursor = 0;
  const stops = filtered.map((d, i) => {
    const pct = (d.totalToken / total) * 100;
    const stop = `${d.color} ${cursor.toFixed(1)}% ${(cursor + pct).toFixed(1)}%`;
    cursor += pct;
    return stop;
  });
  
  // 设置饼图背景
  pieEl.style.background = `conic-gradient(${stops.join(', ')})`;
  
  // 更新中心洞的值
  holeValueEl.textContent = formatNumber(total);
  
  // 生成图例
  legendEl.innerHTML = filtered.map(d => {
    const pct = ((d.totalToken / total) * 100).toFixed(1);
    return `
      <div class="pie-legend-item">
        <span class="pie-legend-dot" style="background:${d.color}"></span>
        <span class="pie-legend-label" title="${escapeHtml(d.name)}">
          ${escapeHtml(truncateText(d.name, 15))}
        </span>
        <span class="pie-legend-value" style="margin-left:auto;font-size:var(--text-xs, 11px);color:var(--muted, #8fa0c7)">
          ${pct}%
        </span>
      </div>`;
  }).join('');
}

// 根据 agentId 获取颜色
function getAgentColor(agentId) {
  const colors = [
    '#4f9cf4', // 蓝色
    '#f4914f', // 橙色
    '#4ff4a6', // 绿色
    '#f4e44f', // 黄色
    '#c44ff4', // 紫色
    '#f44f4f', // 红色
    '#4fd4f4', // 浅蓝
    '#a64ff4', // 紫蓝
    '#4ff491', // 亮绿
    '#f4a64f', // 橙黄
  ];
  if (!agentId) return colors[0];
  
  // 简单哈希函数
  let hash = 0;
  for (let i = 0; i < agentId.length; i++) {
    hash = ((hash << 5) - hash) + agentId.charCodeAt(i);
    hash = hash & hash;
  }
  return colors[Math.abs(hash) % colors.length];
}

// 截断文本
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1) + '…';
}

// ─── Usage Context Pressure ───────────────────────────────────────────────────

function renderContextPressure() {
  const el      = document.querySelector('#usage-context-pressure');
  const stateEl = document.querySelector('#usage-context-pressure-state');
  const payload = usageState.contextPressure;

  if (!el) return;

  if (!payload) {
    if (stateEl) stateEl.textContent = '加载中…';
    el.innerHTML = '<div class="empty-box">上下文压力数据加载中…</div>';
    return;
  }
  if (!payload.success) {
    if (stateEl) stateEl.textContent = `失败：${payload.error?.code || 'ERROR'}`;
    el.innerHTML = renderErrorCard(payload, '请检查 /api/v1/usage/context-pressure 接口。');
    return;
  }

  const items = Array.isArray(payload.data) ? payload.data : (payload.data?.items || []);
  if (stateEl) stateEl.textContent = `${items.length} 个 Agent`;

  if (!items.length) {
    el.innerHTML = '<div class="empty-box">暂无上下文压力数据。</div>';
    return;
  }

  el.innerHTML = items.map((item) => {
    const used    = item.contextUsedEstimate ?? item.usedContext ?? item.used ?? 0;
    const max     = item.contextWindowMax ?? item.maxContext ?? item.max ?? 1;
    const level   = item.level ?? item.pressureLevel ?? 'normal';
    const ratio   = item.pressureRatio ?? (max > 0 ? used / max : 0);
    const pct     = Math.min(100, Math.round(ratio * 100));
    const barCls  = level === 'critical' ? 'critical' : level === 'warning' ? 'warning' : 'normal';
    return `
      <div class="context-pressure-row">
        <div class="context-pressure-header">
          <span class="context-pressure-label">🤖 ${escapeHtml(item.agentId || item.name || '—')}</span>
          <span class="context-pressure-value">${used.toLocaleString()} / ${max.toLocaleString()} tokens (${pct}%)</span>
        </div>
        <div class="context-bar-bg">
          <div class="context-bar-fill ${barCls}" style="width:${pct}%"></div>
        </div>
        <div style="font-size:var(--text-xs);color:var(--dim);margin-top:2px">
          压力等级：<span style="color:${level === 'critical' ? 'var(--status-error)' : level === 'warning' ? 'var(--status-warning)' : 'var(--status-done)'}">${level}</span>
        </div>
      </div>`;
  }).join('');
}

// ─── Memory ───────────────────────────────────────────────────────────────────

const memoryState = { list: null, selectedFile: null, fileContent: null, pending: false, contentPending: false };

async function loadMemory() {
  memoryState.pending = true;
  const stateEl   = document.querySelector('#memory-state');
  const refreshBtn = document.querySelector('#refresh-memory');
  if (stateEl)   { stateEl.className = 'state-box loading'; stateEl.textContent = '记忆文件加载中…'; }
  if (refreshBtn) { refreshBtn.disabled = true; refreshBtn.textContent = '刷新中…'; }
  try {
    const { payload } = await apiFetch('/api/v1/memory');
    memoryState.list = payload;
  } catch (err) {
    memoryState.list = normalizeErrorPayload({ message: err.message || 'network error' });
  } finally {
    memoryState.pending = false;
    if (refreshBtn) { refreshBtn.disabled = false; refreshBtn.textContent = '刷新'; }
  }
  renderMemoryList();
}

async function loadMemoryFile(filePath) {
  memoryState.selectedFile  = filePath;
  memoryState.contentPending = true;
  const contentEl = document.querySelector('#memory-content');
  const metaEl    = document.querySelector('#memory-file-meta');
  if (contentEl) contentEl.innerHTML = '<div class="empty-box">文件内容加载中…</div>';
  if (metaEl)    metaEl.textContent = '加载中…';

  // Update active state in list
  document.querySelectorAll('.memory-file-card').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.filePath === filePath);
  });

  try {
    const { payload } = await apiFetch(`/api/v1/memory?file=${encodeURIComponent(filePath)}`);
    memoryState.fileContent = payload;
  } catch (err) {
    memoryState.fileContent = normalizeErrorPayload({ message: err.message || 'network error' });
  } finally {
    memoryState.contentPending = false;
  }
  renderMemoryContent();
}

function renderMemoryList() {
  const stateEl = document.querySelector('#memory-state');
  const listEl  = document.querySelector('#memory-list');
  const payload = memoryState.list;

  if (!payload) {
    if (stateEl) { stateEl.className = 'state-box loading'; stateEl.textContent = '记忆文件加载中…'; }
    return;
  }
  if (!payload.success) {
    if (stateEl) { stateEl.className = 'state-box error'; stateEl.textContent = `${payload.error?.code || 'ERROR'}｜${payload.error?.message || '请求失败'}`; }
    if (listEl) listEl.innerHTML = renderErrorCard(payload, '请检查 /api/v1/memory 接口或点击"刷新"重试。');
    return;
  }

  const items = Array.isArray(payload.data) ? payload.data : (payload.data?.items || payload.data?.files || []);
  if (stateEl) { stateEl.className = 'state-box success'; stateEl.textContent = `已加载 ${items.length} 个记忆文件`; }

  if (!listEl) return;
  if (!items.length) {
    listEl.innerHTML = '<div class="empty-box">当前没有记忆文件数据。</div>';
    return;
  }

  // Group by agentId
  const byAgent = {};
  for (const item of items) {
    const key = item.agentId || '未知 Agent';
    (byAgent[key] = byAgent[key] || []).push(item);
  }

  function fmtSize(bytes) {
    return formatFileSizeCN(bytes);
  }
  function fmtMtime(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '—';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${mm}-${dd} ${hh}:${mi}`;
  }
  function shortFilename(path) {
    return path ? path.split('/').pop() : '—';
  }

  listEl.innerHTML = Object.entries(byAgent).map(([agentId, files]) => `
    <div class="memory-agent-group">
      <div class="memory-agent-label">🤖 ${escapeHtml(agentId)}</div>
      ${files.map((f) => `
        <button class="memory-file-card ${f.file === memoryState.selectedFile ? 'active' : ''}"
                data-file-path="${escapeHtml(f.file || '')}">
          <span class="memory-file-name"><span class="muted">文件：</span>${escapeHtml(shortFilename(f.file))}</span>
          <span class="memory-file-meta">
            <span class="memory-file-mtime"><span class="muted">更新时间：</span>${fmtMtime(f.mtime)}</span>
            <span class="memory-file-size"><span class="muted">大小：</span>${fmtSize(f.size)}</span>
          </span>
        </button>`).join('')}
    </div>`).join('');

  // Bind click events
  listEl.querySelectorAll('.memory-file-card').forEach((btn) => {
    btn.addEventListener('click', () => loadMemoryFile(btn.dataset.filePath));
  });

  // If a file was selected, re-render content
  if (memoryState.selectedFile) renderMemoryContent();
}

function renderMemoryContent() {
  const contentEl = document.querySelector('#memory-content');
  const metaEl    = document.querySelector('#memory-file-meta');
  const payload   = memoryState.fileContent;

  if (!payload) {
    if (contentEl) contentEl.innerHTML = '<div class="empty-box">请选择左侧文件查看内容。</div>';
    if (metaEl)    metaEl.textContent = '未选择文件';
    return;
  }
  if (!payload.success) {
    if (metaEl) metaEl.textContent = '加载失败';
    if (contentEl) contentEl.innerHTML = renderErrorCard(payload, '文件内容加载失败，请重试。');
    return;
  }

  const content   = payload.data?.content ?? payload.data ?? '';
  const filePath  = memoryState.selectedFile || '';
  const shortName = filePath.split('/').pop();
  if (metaEl) metaEl.textContent = shortName;
  if (contentEl) contentEl.innerHTML = `<div class="md-preview">${renderMarkdown(String(content))}</div>`;
}

// ─── Action Queue (Overview) ──────────────────────────────────────────────────

const actionQueueState = { data: null, pending: false };

async function loadActionQueue() {
  actionQueueState.pending = true;
  const contentEl = document.querySelector('#action-queue-content');
  if (contentEl) contentEl.innerHTML = '<div class="muted">加载中…</div>';
  try {
    const { payload } = await apiFetch('/api/v1/action-queue');
    actionQueueState.data = payload;
  } catch (err) {
    actionQueueState.data = normalizeErrorPayload({ message: err.message || 'network error' });
  } finally {
    actionQueueState.pending = false;
  }
  renderActionQueue();
}

function renderActionQueue() {
  const contentEl = document.querySelector('#action-queue-content');
  if (!contentEl) return;

  const payload = actionQueueState.data;
  if (!payload) {
    contentEl.innerHTML = '<div class="muted">加载中…</div>';
    return;
  }
  if (!payload.success) {
    contentEl.innerHTML = renderErrorCard(payload, '请检查 /api/v1/action-queue 接口返回。');
    return;
  }

  const blocked  = Array.isArray(payload.data?.blocked)  ? payload.data.blocked  : [];
  const warnings = Array.isArray(payload.data?.warnings) ? payload.data.warnings : [];

  if (!blocked.length && !warnings.length) {
    contentEl.innerHTML = `
      <div class="action-queue-empty">
        <span>✅ 当前无待处理事项</span>
      </div>`;
    return;
  }

  let html = '';

  if (blocked.length) {
    html += `<div class="aq-section-label">🔴 阻塞任务（${blocked.length}）</div>`;
    html += blocked.map((item) => `
      <button class="aq-task-card" data-nav="tasks">
        <div class="aq-task-name">${escapeHtml(item.name || item.taskName || item.id || '未命名任务')}</div>
        <div class="aq-task-meta">
          ${item.reason || item.blockedReason ? `<span class="aq-reason">${escapeHtml(item.reason || item.blockedReason)}</span>` : ''}
          ${item.duration || item.blockedDuration ? `<span class="aq-duration muted">⏱ ${escapeHtml(String(item.duration || item.blockedDuration))}</span>` : ''}
        </div>
      </button>`).join('');
  }

  if (warnings.length) {
    html += `<div class="aq-section-label" style="margin-top:${blocked.length ? 'var(--space-sm)' : '0'}">⚠️ Agent 警告（${warnings.length}）</div>`;
    html += warnings.map((item) => {
      const level = (item.level || 'warning').toLowerCase();
      const cls   = level === 'error' ? 'aq-warn-error' : 'aq-warn-warning';
      return `
        <div class="aq-warn-card ${cls}">
          <div class="aq-warn-header">
            <span class="aq-warn-role">${escapeHtml(item.agentId || item.role || '未知角色')}</span>
            <span class="aq-level-badge aq-level-${level}">${level === 'error' ? '❌ error' : '⚠️ warning'}</span>
          </div>
          <div class="aq-warn-message">${escapeHtml(item.message || item.content || '无详情')}</div>
        </div>`;
    }).join('');
  }

  contentEl.innerHTML = html;

  // Bind click: navigate to tasks section
  contentEl.querySelectorAll('[data-nav="tasks"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setRoute('tasks');
      loadRouteData('tasks');
    });
  });
}

// ─── Cron Health (Settings) ───────────────────────────────────────────────────

const cronState = { data: null, pending: false };

async function loadCron() {
  cronState.pending = true;
  const contentEl = document.querySelector('#cron-content');
  if (contentEl) contentEl.innerHTML = '<div class="muted">加载中…</div>';
  try {
    const { payload } = await apiFetch('/api/v1/cron');
    cronState.data = payload;
  } catch (err) {
    cronState.data = normalizeErrorPayload({ message: err.message || 'network error' });
  } finally {
    cronState.pending = false;
  }
  renderCron();
}

function renderCron() {
  const contentEl = document.querySelector('#cron-content');
  if (!contentEl) return;

  const payload = cronState.data;
  if (!payload) {
    contentEl.innerHTML = '<div class="muted">加载中…</div>';
    return;
  }
  if (!payload.success) {
    contentEl.innerHTML = renderErrorCard(payload, '请检查 /api/v1/cron 接口返回。');
    return;
  }

  const items = Array.isArray(payload.data) ? payload.data : (payload.data?.items || []);
  const note  = payload.data?.note || payload.note || '';

  if (!items.length) {
    contentEl.innerHTML = `
      <div class="cron-empty">
        <span>📭 暂无 Cron 定时任务配置</span>
        ${note ? `<div class="muted" style="margin-top:var(--space-xs);font-size:var(--text-sm);">${escapeHtml(note)}</div>` : ''}
        <div class="muted">如需配置定时任务，请在 OpenClaw 配置文件中添加 cron 条目。</div>
      </div>`;
    return;
  }

  function cronStatusPill(status) {
    const s = (status || '').toLowerCase();
    if (s === 'ok' || s === 'success' || s === 'running')
      return `<span class="pill success">✅ ${escapeHtml(status)}</span>`;
    if (s === 'error' || s === 'failed')
      return `<span class="pill danger">❌ ${escapeHtml(status)}</span>`;
    if (s === 'warning' || s === 'skipped')
      return `<span class="pill warning">⚠️ ${escapeHtml(status)}</span>`;
    return `<span class="pill neutral">${escapeHtml(status || '未知')}</span>`;
  }

  contentEl.innerHTML = `
    <div style="overflow-x:auto">
      <table class="cron-table">
        <thead>
          <tr>
            <th>名称</th>
            <th>调度表达式</th>
            <th>上次执行</th>
            <th>状态</th>
            <th>下次执行</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item) => `
            <tr>
              <td class="cron-name">${escapeHtml(item.name || item.id || '—')}</td>
              <td><code class="cron-schedule">${escapeHtml(item.schedule || item.cron || '—')}</code></td>
              <td class="muted cron-time">${item.lastRunAt ? formatDateCN(item.lastRunAt) : '—'}</td>
              <td>${cronStatusPill(item.status || item.lastStatus)}</td>
              <td class="muted cron-time">${item.nextRunAt ? formatDateCN(item.nextRunAt) : '—'}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  updateFeishuEmptyState();
}


// ─── Wiring Status (Settings) ─────────────────────────────────────────────────

const wiringState = { data: null, pending: false };

// ─── Event Log View ───────────────────────────────────────────────────────────
const EVENT_TYPE_COLORS = {
  system:   'badge--blue',
  role:     'badge--violet',
  object:   'badge--yellow',
  security: 'badge--red',
};

async function loadEventLogView() {
  const listEl = document.getElementById('eventlog-list');
  if (!listEl) return;
  const filter = document.getElementById('eventlog-type-filter')?.value || '';
  const url = `/api/v1/events/log?limit=20${filter ? `&type=${encodeURIComponent(filter)}` : ''}`;
  listEl.innerHTML = '<div class="state-box loading">加载中…</div>';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('load failed');
    const payload = await res.json();
    const data = payload?.data ?? payload;
    const events = Array.isArray(data?.items)   ? data.items
                 : Array.isArray(data?.events)  ? data.events
                 : Array.isArray(data)           ? data
                 : [];
    if (!events.length) {
      listEl.innerHTML = '<div class="empty-state muted" style="padding:18px 0;text-align:center">暂无事件日志</div>';
      return;
    }
    listEl.innerHTML = events.map((ev) => {
      const ts = ev.ts || ev.timestamp || ev.created_at || ev.createdAt;
      const timeStr = ts ? new Date(ts).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '—';
      const rawType = (ev.type || ev.event_type || 'system').toLowerCase();
      // Extract top-level category: e.g. "system.start" -> "system"
      const evTypeCategory = rawType.split('.')[0];
      const badgeCls = EVENT_TYPE_COLORS[evTypeCategory] || EVENT_TYPE_COLORS[rawType] || 'badge--gray';
      const sourceRole = ev.source_role || ev.role || ev.agent || ev.source || '—';
      const evType = rawType;
      const description = ev.description || ev.message || ev.summary || ev.content || '无描述';
      return `<div class="eventlog-row">
        <span class="eventlog-time">${escapeHtml(timeStr)}</span>
        <span class="badge ${escapeHtml(badgeCls)}">${escapeHtml(evType)}</span>
        <span class="eventlog-role">${escapeHtml(String(sourceRole))}</span>
        <span class="eventlog-desc">${escapeHtml(String(description))}</span>
      </div>`;
    }).join('');
  } catch {
    listEl.innerHTML = '<div class="state-box error">事件日志加载失败</div>';
  }
}
window.loadEventLogView = loadEventLogView;

// ─── Registry View ────────────────────────────────────────────────────────────
const REGISTRY_TYPE_ICONS = {
  brief:    '📄',
  handoff:  '🤝',
  review:   '🔍',
  artifact: '📦',
};

async function loadRegistryView() {
  const listEl = document.getElementById('registry-list');
  if (!listEl) return;
  listEl.innerHTML = '<div class="state-box loading">加载中…</div>';
  try {
    const res = await fetch('/api/v1/registry?status=active&limit=20');
    if (!res.ok) throw new Error('load failed');
    const payload = await res.json();
    const data = payload?.data ?? payload;
    const items = Array.isArray(data?.objects) ? data.objects
                : Array.isArray(data?.items)   ? data.items
                : Array.isArray(data)           ? data
                : [];
    if (!items.length) {
      listEl.innerHTML = '<div class="empty-state muted" style="padding:18px 0;text-align:center">暂无活跃对象</div>';
      return;
    }
    listEl.innerHTML = items.map((obj) => {
      const objId = obj.object_id || obj.id || '—';
      const objType = (obj.type || obj.object_type || '—').toLowerCase();
      const icon = REGISTRY_TYPE_ICONS[objType] || '📁';
      const owner = obj.owner || obj.created_by || '—';
      const status = obj.status || 'active';
      const createdAt = obj.created_at || obj.createdAt || obj.ts;
      const timeStr = createdAt ? new Date(createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '—';
      return `<div class="registry-row">
        <span class="registry-icon">${icon}</span>
        <span class="registry-id mono">${escapeHtml(String(objId))}</span>
        <span class="badge badge--gray">${escapeHtml(objType)}</span>
        <span class="registry-owner">${escapeHtml(String(owner))}</span>
        <span class="badge ok">${escapeHtml(status)}</span>
        <span class="registry-time">${escapeHtml(timeStr)}</span>
      </div>`;
    }).join('');
  } catch {
    listEl.innerHTML = '<div class="state-box error">对象注册表加载失败</div>';
  }
}
window.loadRegistryView = loadRegistryView;

const timelineState = { data: null, pending: false };

function bindConnectionHealthAction() {
  // onclick is set directly in HTML: onclick="navigateTo('settings')"
  // No additional binding needed - avoid double-trigger race condition
  const actionBtn = document.getElementById('connection-health-action-btn');
  if (actionBtn) {
    actionBtn.style.pointerEvents = 'auto';
    actionBtn.style.cursor = 'pointer';
  }
}

async function updateConnectionHealth() {
  const card = document.getElementById('connection-health-card');
  if (!card) return;
  bindConnectionHealthAction();
  try {
    const res = await fetch('/api/v1/settings/wiring-status');
    if (!res.ok) {
      card.style.display = 'none';
      return;
    }
    const payload = await res.json();
    const data = payload?.data ?? payload;
    const checks = Array.isArray(data?.checks)
      ? data.checks
      : [
          data?.gateway ? { label: 'Gateway', status: data.gateway.status === 'ok' || data.gateway.status === 'connected' ? 'ok' : 'error', hint: data.gateway.status === 'ok' || data.gateway.status === 'connected' ? '' : '未连接或状态异常' } : null,
          data?.feishu ? { label: '飞书通知', status: data.feishu.webhookConfigured || data.feishu.configured ? 'ok' : 'warn', hint: data.feishu.webhookConfigured || data.feishu.configured ? '' : '未配置，连接后可接收 Agent 工作通知' } : null,
        ].filter(Boolean);
    const issues = checks.filter((c) => c.status === 'error' || c.status === 'warn');
    if (issues.length > 0) {
      card.style.display = 'flex';
      const titleEl = document.getElementById('health-card-title');
      const descEl = document.getElementById('health-card-desc');
      if (titleEl) titleEl.textContent = issues.length > 1 ? '部分集成未连接' : `${issues[0].label} 未连接`;
      if (descEl) descEl.textContent = issues.map((i) => `${i.label}：${i.hint || '未配置'}`).join('；');
    } else {
      card.style.display = 'none';
    }
  } catch {
    card.style.display = 'none';
  }
}

async function loadTimeline() {
  const filter = document.getElementById('timeline-type-filter')?.value || '';
  const url = `/api/v1/timeline?limit=50${filter ? `&type=${encodeURIComponent(filter)}` : ''}`;
  const listEl = document.getElementById('timeline-list');
  if (!listEl) return;
  timelineState.pending = true;
  listEl.innerHTML = '<div class="state-box loading">加载中…</div>';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('load failed');
    const payload = await res.json();
    const data = payload?.data ?? payload;
    const events = Array.isArray(data?.events) ? data.events : Array.isArray(data) ? data : [];
    timelineState.data = events;
    if (!events.length) {
      listEl.innerHTML = '<div class="empty-state muted">暂无事件记录</div>';
      return;
    }
    listEl.innerHTML = events.map((ev) => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <span class="timeline-time">${new Date(ev.ts || ev.timestamp || ev.createdAt || Date.now()).toLocaleString('zh-CN')}</span>
          <span class="timeline-type badge">${escapeHtml(ev.type || 'event')}</span>
          <span class="timeline-summary">${escapeHtml(ev.summary || ev.message || '无摘要')}</span>
        </div>
      </div>`).join('');
  } catch {
    listEl.innerHTML = '<div class="state-box error">加载失败</div>';
  } finally {
    timelineState.pending = false;
  }
}
window.loadTimeline = loadTimeline;

async function loadWiringStatus() {
  wiringState.pending = true;
  const contentEl = document.querySelector('#wiring-content');
  if (contentEl) contentEl.innerHTML = '<div class="muted">加载中…</div>';
  try {
    const { payload } = await apiFetch('/api/v1/settings/wiring-status');
    wiringState.data = payload;
  } catch (err) {
    wiringState.data = normalizeErrorPayload({ message: err.message || 'network error' });
  } finally {
    wiringState.pending = false;
  }
  renderWiringStatus();
}

function renderWiringStatus() {
  const contentEl = document.querySelector('#wiring-content');
  if (!contentEl) return;

  const payload = wiringState.data;
  if (!payload) {
    contentEl.innerHTML = '<div class="muted">加载中…</div>';
    return;
  }
  if (!payload.success) {
    contentEl.innerHTML = renderErrorCard(payload, '请检查 /api/v1/settings/wiring-status 接口返回。');
    return;
  }

  const d       = payload.data || {};
  const gateway = d.gateway    || {};
  const feishu  = d.feishu     || d.feishuWebhook || {};
  const fs      = d.fileSystem || d.filesystem    || {};
  const overall = { status: d.overallHealth || d.overall?.status || d.health?.status || 'unknown',
                    message: d.overall?.message || d.health?.message || '' };

  // Gateway status → color
  function gatewayColor(status) {
    const s = (status || '').toLowerCase();
    if (s === 'ok' || s === 'connected' || s === 'healthy') return 'wiring-green';
    if (s === 'degraded' || s === 'slow' || s === 'warning' || s === 'timeout') return 'wiring-yellow';
    return 'wiring-red';
  }
  function overallClass(health) {
    const h = (health || '').toLowerCase();
    if (h === 'healthy') return 'success';
    if (h === 'degraded' || h === 'partial') return 'warning';
    return 'error';
  }

  const gwStatus  = gateway.status   || 'unknown';
  const gwLatency = gateway.latencyMs != null ? `${gateway.latencyMs} ms` : (gateway.latency != null ? `${gateway.latency} ms` : '—');
  const gwCls     = gatewayColor(gwStatus);

  const feishuConfigured = feishu.webhookConfigured ?? feishu.configured ?? feishu.webhook ?? false;
  const fsReadable   = fs.accessible ?? fs.readable ?? fs.ok ?? false;
  const fsRoot       = fs.openclawRoot ?? fs.root ?? fs.rootPath ?? fs.path ?? '—';
  const overallHealth = overall.status || overall.health || d.overallHealth || 'unknown';
  const overallCls    = overallClass(overallHealth);

  contentEl.innerHTML = `
    <div class="wiring-grid">
      <!-- Gateway -->
      <div class="wiring-card">
        <div class="wiring-card-header">
          <span class="wiring-label">🌐 Gateway</span>
          <span class="wiring-status-dot ${gwCls}"></span>
        </div>
        ${renderStatusRow('连接状态', formatStatusText(gwStatus, '状态未知'), 'wiring-status-value')}
        ${renderStatusRow('响应延迟', gwLatency, 'wiring-status-value')}
      </div>

      <!-- 飞书 Webhook -->
      <div class="wiring-card">
        <div class="wiring-card-header">
          <span class="wiring-label">✈️ 飞书 Webhook</span>
          <span class="wiring-status-dot ${feishuConfigured ? 'wiring-green' : 'wiring-red'}"></span>
        </div>
        ${renderStatusRow('配置状态', feishuConfigured ? '已配置' : '未配置', 'wiring-status-value')}
        ${feishu.url ? renderStatusRow('Webhook 地址', feishu.url, 'wiring-status-value code-like') : ''}
      </div>

      <!-- 文件系统 -->
      <div class="wiring-card">
        <div class="wiring-card-header">
          <span class="wiring-label">📁 文件系统</span>
          <span class="wiring-status-dot ${fsReadable ? 'wiring-green' : 'wiring-red'}"></span>
        </div>
        ${renderStatusRow('访问状态', fsReadable ? '可读' : '不可读', 'wiring-status-value')}
        ${renderStatusRow('根路径', String(fsRoot), 'wiring-status-value code-like')}
      </div>
    </div>

    <!-- 整体健康度摘要 -->
    <div class="state-box ${overallCls}" style="margin-top:var(--space-sm)">
      整体健康度：<strong>${escapeHtml(formatStatusText(overallHealth, '状态未知'))}</strong>
      ${overall.message ? ` · ${escapeHtml(overall.message)}` : ''}
    </div>`;
  updateFeishuEmptyState();
}


// ─── Page loader dispatcher ───────────────────────────────────────────────────
async function loadRouteData(route) {
  switch (route) {
    case 'overview':
      await Promise.all([loadDashboard(), loadHealth(), loadActionQueue(), loadEventLogView(), loadRegistryView()]);
      break;
    case 'agents':
      await loadAgents();
      break;
    case 'settings':
      await Promise.all([loadConfigOverview(), loadSettings(), loadCron(), loadWiringStatus(), loadFeishuWebhookStatus()]);
      await updateConnectionHealth();
      break;
    case 'tasks':
      await loadTasks();
      break;
    case 'timeline':
      await loadTimeline();
      break;
    case 'docs':
      await loadDocs();
      break;
    case 'collaboration':
      await loadCollaboration();
      break;
    case 'usage':
      await loadUsage(usageState.period);
      await loadBudgetStatus();
      break;
    case 'memory':
      await loadMemory();
      break;
    default:
      break;
  }
}

async function refreshCurrentPage() {
  await loadRouteData(state.route);
}

// ─── Event wiring ─────────────────────────────────────────────────────────────

// nav clicks
document.querySelectorAll('.nav-link').forEach((button) => {
  button.addEventListener('click', async () => {
    const route = button.dataset.route;
    if (route === state.route) return; // already here
    setRoute(route);
    await loadRouteData(route);
  });
});

// template card clicks (delegated)
document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-template-id]');
  if (button) {
    clearApplyFeedback();
    await loadTemplateDetail(button.dataset.templateId);
  }
});

// hash change (back/forward, direct URL entry)
window.addEventListener('hashchange', async () => {
  const route = routeFromHash();
  setRoute(route);
  await loadRouteData(route);
});

// topbar buttons
if (els.refreshPage)   els.refreshPage.addEventListener('click', refreshCurrentPage);
if (els.refreshHealth) els.refreshHealth.addEventListener('click', loadHealth);
if (els.refreshConfig) els.refreshConfig.addEventListener('click', loadConfigOverview);
if (els.refreshAgents) els.refreshAgents.addEventListener('click', loadAgents);

// docs refresh button
const refreshDocsBtn = document.querySelector('#refresh-docs');
if (refreshDocsBtn) refreshDocsBtn.addEventListener('click', () => {
  docsState.list = null;
  docsState.contentCache = {};
  loadDocs();
});

// task detail close
document.addEventListener('click', (event) => {
  const btn = event.target.closest('#close-task-detail');
  if (btn) {
    state.selectedTaskId = null;
    const panel = document.querySelector('#task-detail-panel');
    if (panel) panel.style.display = 'none';
  }
});

// Collaboration refresh
document.addEventListener('click', (event) => {
  const btn = event.target.closest('#refresh-collab');
  if (btn) loadCollaboration();
});

// Usage period tabs (delegated)
document.addEventListener('click', (event) => {
  const tab = event.target.closest('.period-tab');
  if (!tab) return;
  const period = tab.dataset.period;
  if (!period) return;
  document.querySelectorAll('.period-tab').forEach((t) => t.classList.toggle('active', t === tab));
  loadUsage(period);
});

// Memory refresh
document.addEventListener('click', (event) => {
  const btn = event.target.closest('#refresh-memory');
  if (btn) loadMemory();
});

// Action queue refresh
document.addEventListener('click', (event) => {
  const btn = event.target.closest('#refresh-action-queue');
  if (btn) loadActionQueue();
});

// Cron refresh
document.addEventListener('click', (event) => {
  const btn = event.target.closest('#refresh-cron');
  if (btn) loadCron();
});

// Wiring status refresh
document.addEventListener('click', (event) => {
  const btn = event.target.closest('#refresh-wiring');
  if (btn) loadWiringStatus();
});

// ─── Search ───────────────────────────────────────────────────────────────────

const searchState = {
  query: '',
  results: null,
  pending: false,
  visible: false,
  debounceTimer: null,
};

function openSearch() {
  searchState.visible = true;
  const overlay = document.getElementById('search-overlay');
  const input   = document.getElementById('search-input');
  if (overlay) {
    overlay.classList.add('visible');
    overlay.removeAttribute('aria-hidden');
  }
  if (input) {
    input.value = searchState.query;
    input.focus();
    input.select();
  }
}

function closeSearch() {
  searchState.visible = false;
  const overlay = document.getElementById('search-overlay');
  if (overlay) {
    overlay.classList.remove('visible');
    overlay.setAttribute('aria-hidden', 'true');
  }
}

function renderSearchResults(results, query) {
  const container = document.getElementById('search-results');
  if (!container) return;

  if (searchState.pending) {
    container.innerHTML = `<div class="search-loading"><span class="loading-dots"><span></span><span></span><span></span></span> 搜索中…</div>`;
    return;
  }
  if (!query || !query.trim()) {
    container.innerHTML = '<div class="search-empty">输入关键词开始搜索</div>';
    return;
  }
  if (!results || !results.success) {
    container.innerHTML = '<div class="search-empty search-error">搜索请求失败，请稍后重试</div>';
    return;
  }

  const typeLabels = { agent: '🤖 Agent', task: '📋 任务', session: '🔗 会话' };
  const typeRoutes = { agent: 'agents', task: 'tasks', session: 'collaboration' };

  const groups = results.data?.groups || results.data?.items
    ? Object.entries(
        (results.data?.items || []).reduce((acc, item) => {
          const key = item.type || 'agent';
          (acc[key] = acc[key] || []).push(item);
          return acc;
        }, {})
      ).map(([type, items]) => ({ type, items }))
    : (results.data?.groups || []);

  const hasResults = groups.some((g) => g.items && g.items.length > 0);
  if (!hasResults) {
    container.innerHTML = `<div class="search-empty">未找到"${escapeHtml(query)}"的相关结果</div>`;
    showToast({ type: 'info', message: '未找到相关内容' });
    return;
  }

  container.innerHTML = groups
    .filter((g) => g.items && g.items.length > 0)
    .map((group) => `
      <div class="search-group">
        <div class="search-group-label">${typeLabels[group.type] || escapeHtml(group.type || '结果')}</div>
        <div class="search-group-items">
          ${group.items.map((item) => `
            <button class="search-result-item" data-route="${escapeHtml(typeRoutes[group.type] || 'overview')}">
              <span class="search-result-name">${escapeHtml(item.name || item.id || '—')}</span>
              ${item.description ? `<span class="search-result-desc">${escapeHtml(item.description)}</span>` : ''}
              ${item.status ? `<span class="pill neutral search-result-status">${escapeHtml(item.status)}</span>` : ''}
            </button>`).join('')}
        </div>
      </div>`).join('');

  container.querySelectorAll('.search-result-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const route = btn.dataset.route;
      closeSearch();
      if (route) {
        setRoute(route);
        loadRouteData(route);
      }
    });
  });
}

async function performSearch(query) {
  if (!query || !query.trim()) {
    searchState.results = null;
    renderSearchResults(null, '');
    return;
  }
  searchState.pending = true;
  renderSearchResults(null, query);
  try {
    const { payload } = await apiFetch(`/api/v1/search?q=${encodeURIComponent(query)}&type=all`);
    searchState.results = payload;
  } catch {
    searchState.results = { success: false, error: { code: 'NETWORK_ERROR', message: '搜索请求失败' } };
  } finally {
    searchState.pending = false;
    renderSearchResults(searchState.results, query);
  }
}

function onSearchInput(e) {
  const query = e.target.value;
  searchState.query = query;
  if (searchState.debounceTimer) clearTimeout(searchState.debounceTimer);
  if (!query.trim()) {
    searchState.results = null;
    renderSearchResults(null, '');
    return;
  }
  searchState.debounceTimer = setTimeout(() => performSearch(query), 300);
}

function initSearch() {
  const input   = document.getElementById('search-input');
  const overlay = document.getElementById('search-overlay');
  const trigger = document.getElementById('search-trigger');

  if (input)   input.addEventListener('input', onSearchInput);
  if (trigger) trigger.addEventListener('click', openSearch);

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (searchState.visible) closeSearch();
      else openSearch();
    }
    if (e.key === 'Escape' && searchState.visible) {
      e.preventDefault();
      closeSearch();
    }
  });

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeSearch();
    });
  }
}

// ─── Inspector Sidebar ─────────────────────────────────────────────────────────
function initInspectorSidebar() {
  const sidebar = document.getElementById('inspector-sidebar');
  const toggle = document.getElementById('inspector-toggle');
  const STORAGE_KEY = 'openclaw:inspector-collapsed:v1';

  if (!sidebar || !toggle) return;

  // 初始状态
  if (state.inspectorCollapsed) {
    sidebar.classList.add('collapsed');
    toggle.textContent = '‹';
    toggle.classList.add('collapsed-toggle');
  }

  // 窄屏 (<1400px) 默认折叠
  const handleResize = () => {
    if (window.innerWidth < 1400 && !sidebar.classList.contains('collapsed')) {
      sidebar.classList.add('collapsed');
      toggle.textContent = '‹';
      toggle.classList.add('collapsed-toggle');
      state.inspectorCollapsed = true;
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  };

  handleResize();
  window.addEventListener('resize', handleResize);

  // 折叠按钮事件
  toggle.addEventListener('click', () => {
    const collapsed = sidebar.classList.toggle('collapsed');
    toggle.textContent = collapsed ? '‹' : '›';
    toggle.classList.toggle('collapsed-toggle', collapsed);
    state.inspectorCollapsed = collapsed;
    localStorage.setItem(STORAGE_KEY, collapsed ? 'true' : 'false');
  });

  // 初次更新 inspector 数据
  updateInspectorSidebar();
}

// 更新 Inspector 侧边栏数据
function updateInspectorSidebar() {
  const {
    activeAgents = 0, totalAgents = 0,
    blockedTasks = 0, activeTasks = 0,
    todayTokens = 0, todayCost = 0,
    gatewayConnected = false,
    queueCount = 0
  } = state.kpiSummary;

  // 系统状态
  const systemBadge = document.getElementById('inspector-system-badge');
  if (systemBadge) {
    if (queueCount > 0 || blockedTasks > 0) {
      systemBadge.className = 'badge blocked';
      systemBadge.textContent = '需关注';
    } else if (gatewayConnected && activeAgents > 0) {
      systemBadge.className = 'badge running';
      systemBadge.textContent = '正常';
    } else if (!gatewayConnected) {
      systemBadge.className = 'badge error';
      systemBadge.textContent = '未连接';
    } else {
      systemBadge.className = 'badge idle';
      systemBadge.textContent = '待机';
    }
  }

  // 今日用量
  const usageValue = document.getElementById('inspector-usage-value');
  const usageMeta = document.getElementById('inspector-usage-meta');
  if (usageValue) usageValue.textContent = `${fmtTokensKPI(todayTokens)} tokens`;
  if (usageMeta) usageMeta.textContent = todayCost > 0 ? `≈ $${todayCost.toFixed(4)} USD` : '≈ $0 USD';

  // 活跃 Agent
  const workingValue = document.getElementById('inspector-working-value');
  const workingMeta = document.getElementById('inspector-working-meta');
  const idleCount = totalAgents - activeAgents;
  if (workingValue) workingValue.textContent = `${activeAgents} 个运行中`;
  if (workingMeta) workingMeta.textContent = `${idleCount} 空闲 · ${blockedTasks} 阻塞`;

  // 待处理事项
  const queueValue = document.getElementById('inspector-queue-value');
  if (queueValue) {
    if (queueCount > 0) {
      queueValue.textContent = `${queueCount} 项待处理`;
      queueValue.style.color = 'var(--color-error)';
    } else {
      queueValue.textContent = '✅ 无待处理';
      queueValue.style.color = 'var(--color-success)';
    }
  }
}

// ─── P1-5: Overview ReadinessScore & Agent Summary ───────────────────────────

/**
 * 计算系统就绪度评分（0-100）
 * 评估维度：Gateway连通、活跃Agent、无阻塞任务、无待处理、无告警
 */
function computeReadinessScore() {
  const { gatewayConnected, activeAgents, blockedTasks, queueCount } = state.kpiSummary;
  const gatewayOk = gatewayConnected || (state.health?.data?.gateway?.status === 'ok');
  const hasAgents = activeAgents > 0;
  const noBlocked = blockedTasks === 0;
  const noQueue   = queueCount === 0;
  const noAlerts  = !(state.dashboard?.data?.alerts?.length > 0);

  const checks = [
    { name: 'Gateway 连接', ok: gatewayOk, pts: 30 },
    { name: '活跃 Agent',   ok: hasAgents, pts: 25 },
    { name: '无阻塞任务',   ok: noBlocked, pts: 20 },
    { name: '无待处理',     ok: noQueue,   pts: 15 },
    { name: '无告警',       ok: noAlerts,  pts: 10 },
  ];
  const score = checks.reduce((sum, c) => c.ok ? sum + c.pts : sum, 0);
  const label = score >= 90 ? '健康' : score >= 70 ? '良好' : score >= 50 ? '需关注' : '异常';
  const color = score >= 90 ? '#22c55e' : score >= 70 ? '#4f9cf4' : score >= 50 ? '#f97316' : '#ef4444';
  return { score, label, color, checks };
}

/** 渲染 ReadinessScore 宽卡（SVG 环形进度 + 检查项标签） */
function renderOverviewReadiness() {
  const { score, label, color, checks } = computeReadinessScore();
  const r = 32, circ = (2 * Math.PI * r).toFixed(2);
  const arc  = (score / 100 * 2 * Math.PI * r).toFixed(2);
  return `
    <div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius-lg);
                padding:var(--space-md) var(--space-lg);display:flex;align-items:center;
                gap:var(--space-lg);margin-bottom:var(--space-lg);flex-wrap:wrap">
      <div style="position:relative;width:80px;height:80px;flex-shrink:0">
        <svg width="80" height="80" viewBox="0 0 80 80" style="transform:rotate(-90deg)">
          <circle cx="40" cy="40" r="${r}" fill="none" stroke="var(--border)" stroke-width="6"/>
          <circle cx="40" cy="40" r="${r}" fill="none" stroke="${color}" stroke-width="6"
            stroke-dasharray="${arc} ${circ}" stroke-linecap="round"/>
        </svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
          <span style="font-size:20px;font-weight:700;color:${color};line-height:1">${score}</span>
          <span style="font-size:9px;color:var(--muted)">/100</span>
        </div>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;color:var(--text);margin-bottom:6px">
          系统就绪度 <span style="color:${color}">${label}</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:5px">
          ${checks.map(c => `
            <span style="font-size:11px;padding:2px 7px;border-radius:20px;
              background:${c.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'};
              border:1px solid ${c.ok ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'};
              color:${c.ok ? '#22c55e' : '#ef4444'}">
              ${c.ok ? '✓' : '✗'} ${escapeHtml(c.name)}
            </span>`).join('')}
        </div>
      </div>
    </div>`;
  updateFeishuEmptyState();
}


/** 渲染 Agent 状态速览（Mini 卡片网格，CC 风格） */
function renderOverviewAgentSummary() {
  const items = state.agentsData?.data?.items || [];
  if (!items.length) return '';
  const shown = items.slice(0, 8);
  const dotMap = {
    working:'#22c55e', active:'#22c55e',
    idle:'#94a3b8',    normal:'#94a3b8',
    blocked:'#ef4444', error:'#ef4444',
    warning:'#f97316', backlog:'#f97316',
    offline:'#64748b'
  };
  const labelMap = {
    working:'工作中', active:'工作中',
    idle:'空闲',      normal:'空闲',
    blocked:'阻塞',   error:'异常',
    warning:'警告',   offline:'离线',
    backlog:'积压'
  };
  return `
    <div style="margin-bottom:var(--space-lg)">
      <div style="font-size:var(--text-xs);font-weight:700;color:var(--muted);
                  text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">
        Agent 状态速览
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">
        ${shown.map(agent => {
          const agentId = agent.id || agent.name || '';
          const status  = agent.statusDetail?.status || agent.status || 'idle';
          const emoji   = getAgentEmoji(agentId);
          const name    = (AGENT_CHINESE_NAMES[agentId] || agent.name || agentId).replace(/（.*）$/, '');
          const dot     = dotMap[status] || '#94a3b8';
          const lbl     = labelMap[status] || status;
          return `
            <div style="background:var(--panel-alt);border:1px solid var(--border);
                        border-radius:var(--radius-md);padding:8px 10px;
                        display:flex;align-items:center;gap:8px">
              <span style="font-size:16px">${emoji}</span>
              <div style="flex:1;overflow:hidden">
                <div style="font-size:12px;font-weight:600;color:var(--text);
                            white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  ${escapeHtml(name)}
                </div>
                <div style="display:flex;align-items:center;gap:4px;margin-top:2px">
                  <span style="width:6px;height:6px;border-radius:50%;background:${dot};flex-shrink:0"></span>
                  <span style="font-size:10px;color:var(--muted)">${lbl}</span>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>`;
  updateFeishuEmptyState();
}


/** P1-5: 将 ReadinessScore + Agent Summary 注入 Overview 页面 */
function updateOverviewExtras() {
  // 1. ReadinessScore — 插入到 KPI Grid 后面
  let readinessEl = document.getElementById('overview-readiness');
  if (!readinessEl) {
    readinessEl = document.createElement('div');
    readinessEl.id = 'overview-readiness';
    const kpiGrid = document.getElementById('overview-kpi-grid');
    if (kpiGrid) kpiGrid.insertAdjacentElement('afterend', readinessEl);
  }
  if (readinessEl) readinessEl.innerHTML = renderOverviewReadiness();

  // 2. Agent Summary — 插入到 dashboard-state 后面
  let agentSummaryEl = document.getElementById('overview-agent-summary');
  if (!agentSummaryEl) {
    agentSummaryEl = document.createElement('div');
    agentSummaryEl.id = 'overview-agent-summary';
    const dashState = document.getElementById('dashboard-state');
    if (dashState) dashState.insertAdjacentElement('afterend', agentSummaryEl);
  }
  if (agentSummaryEl && (state.agentsData?.data?.items?.length || 0) > 0) {
    agentSummaryEl.innerHTML = renderOverviewAgentSummary();
  }
}


async function loadGlobalStatusStrip() {
  try {
    const { payload } = await apiFetch('/api/v1/status');
    const data = payload?.data || payload;
    if (payload?.success || data) updateStatusStrip(data || {});
  } catch {}
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
const initialRoute = routeFromHash();
setRoute(initialRoute);
initSSE();
initSessionDetailSidebar();  // Initialize session detail sidebar DOM
initSearch();
// legacy inspector sidebar removed
initOnboardingBanner();
initFeishuEmptyState();
initTheme();
loadSecurityStatus();
updateConnectionHealth();
setInterval(updateConnectionHealth, 60000);
setInterval(() => { loadNotifications(); if (state.route === 'usage') loadBudgetStatus(); }, 30000);
await loadRouteData(initialRoute);
loadNotifications();
if (initialRoute === 'usage') loadBudgetStatus();
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('notification-bell-btn');
  const panel = document.getElementById('notification-panel');
  if (btn && panel) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      if (panel.style.display !== 'none') loadNotifications();
    });
    panel.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', () => { panel.style.display = 'none'; });
  }
  initTheme();
  restorePageState();
  document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);
  loadGlobalStatusStrip();
});
applyReadonlyStateToTaskButtons();


async function loadNotifications() {
  try {
    const res = await fetch('/api/v1/notifications?limit=20');
    const data = await res.json();
    const badge = document.getElementById('notification-badge');
    const list = document.getElementById('notification-list');
    if (badge) {
      badge.textContent = data.unread_count || 0;
      badge.style.display = (data.unread_count || 0) > 0 ? 'inline' : 'none';
    }
    if (list && data.items) {
      if (!data.items.length) {
        list.innerHTML = '<div class="muted" style="padding:16px;text-align:center">暂无通知</div>';
      } else {
        list.innerHTML = data.items.map(n => `
          <div class="notification-item ${n.status === 'unread' ? 'unread' : ''}">
            <div class="notification-item-title">${escapeHtml(n.title || '通知')}</div>
            <div class="notification-item-body">${escapeHtml(n.body || '')}</div>
            <div class="notification-item-actions">
              ${n.status === 'unread' ? `<button class="text-btn" onclick="ackNotification('${n.id}')">已读</button>` : ''}
              <button class="text-btn" onclick="snoozeNotification('${n.id}')">稍后</button>
            </div>
          </div>`).join('');
      }
    }
  } catch {}
}
async function ackNotification(id) { await fetch('/api/v1/notifications/'+id+'/ack', {method:'POST'}); loadNotifications(); }
async function snoozeNotification(id) { await fetch('/api/v1/notifications/'+id+'/snooze', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({minutes:60})}); loadNotifications(); }
async function ackAllNotifications() { try { const res = await fetch('/api/v1/notifications?status=unread&limit=100'); const data = await res.json(); await Promise.all((data.items||[]).map(n => fetch('/api/v1/notifications/'+n.id+'/ack',{method:'POST'}))); } catch {} loadNotifications(); }
window.ackNotification = ackNotification; window.snoozeNotification = snoozeNotification; window.ackAllNotifications = ackAllNotifications;

async function loadBudgetStatus() {
  try {
    const res = await fetch('/api/v1/budget/status');
    const data = await res.json();
    const el = document.getElementById('budget-status-card');
    if (!el) return;
    const statusText = { ok:'正常', warn:'接近上限', over:'已超限' };
    const statusClass = { ok:'tone-ok', warn:'tone-warn', over:'tone-error' };
    el.innerHTML = `
      <div class="budget-status-row">
        <span class="muted">今日费用</span>
        <span class="budget-val ${statusClass[data.status]||''}">$${((data.daily_cost_usd||0)).toFixed(4)}</span>
        <span class="badge ${statusClass[data.status]||''}">${statusText[data.status]||data.status||'—'}</span>
      </div>
      <div class="budget-status-row">
        <span class="muted">上下文压力</span>
        <span class="budget-val ${statusClass[data.context_status]||''}">${((data.context_pressure||0)*100).toFixed(0)}%</span>
        <span class="badge ${statusClass[data.context_status]||''}">${statusText[data.context_status]||data.context_status||''}</span>
      </div>`;
  } catch {}
}

function openInspector(title, contentHtml) {
  const panel = document.getElementById('inspector-panel');
  const titleEl = document.getElementById('inspector-title');
  const bodyEl = document.getElementById('inspector-body');
  if (panel) panel.classList.remove('closed');
  if (titleEl) titleEl.textContent = title;
  if (bodyEl) bodyEl.innerHTML = contentHtml;
}
function closeInspector() {
  const panel = document.getElementById('inspector-panel');
  if (panel) panel.classList.add('closed');
}

async function exportSnapshot() {
  try {
    const res = await fetch('/api/v1/snapshot/export');
    if (!res.ok) throw new Error('导出失败');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `office-console-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast({ type: 'success', message: '快照导出成功' });
  } catch (e) {
    showToast({ type: 'error', message: '快照导出失败' });
  }
}

window.openInspector = openInspector;
window.closeInspector = closeInspector;
window.exportSnapshot = exportSnapshot;

window.addEventListener('beforeunload', savePageState);
