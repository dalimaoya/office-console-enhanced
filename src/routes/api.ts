import { Router } from 'express';
import { getAgents } from '../controllers/agent-controller.js';
import { getDashboard } from '../controllers/dashboard-controller.js';
import { getHealth } from '../controllers/health-controller.js';
import { getHealthz } from '../controllers/healthz-controller.js';
import { getStatus } from '../controllers/status-controller.js';
import { applyTemplate, getTemplate, getTemplates } from '../controllers/template-controller.js';
import { getEvents, getEventsStatus } from '../controllers/events-controller.js';
import { securityMiddleware } from '../middleware/security.js';
import { getTasks, updateTaskStatus, createTask } from '../controllers/tasks-controller.js';
import { getDocs, patchDoc } from '../controllers/docs-controller.js';
import { getCollaboration, getSessions, getSessionById, getMessages, getCollaborationGraphHandler } from '../controllers/collaboration-controller.js';
import { getUsage, byAgent, byModel, contextPressure } from '../controllers/usage-controller.js';
import { searchAll } from '../controllers/search-controller.js';
import { getMemory, getMemoryHealthHandler } from '../controllers/memory-controller.js';
import { getSettings, wiringStatus, connectionHealth, securitySummary, updateStatus } from '../controllers/settings-controller.js';
import { getActionQueueHandler, ackItem } from '../controllers/action-queue-controller.js';
import { getCronHandler } from '../controllers/cron-controller.js';
import { getTimeline } from '../controllers/timeline-controller.js';
import {
  ackNotification,
  createNotificationHandler,
  getNotifications,
  snoozeNotificationHandler,
} from '../controllers/notifications-controller.js';
import {
  getBudgetPolicyHandler,
  getBudgetStatusHandler,
  putBudgetPolicyHandler,
} from '../controllers/budget-controller.js';
import { exportSnapshot, importSnapshot } from '../controllers/snapshot-controller.js';

export const apiRouter = Router();

// 新的健康端点（永远返回200，无需鉴权）
apiRouter.get('/healthz', getHealthz);
apiRouter.get('/status', getStatus);

// 所有其他路由应用 token 鉴权（如果配置了 token）
apiRouter.use(...securityMiddleware);

// 只读端点（GET）
apiRouter.get('/dashboard', getDashboard);
apiRouter.get('/overview', getDashboard); // 别名，与 /dashboard 返回相同数据
apiRouter.get('/agents', getAgents);
apiRouter.get('/config/templates', getTemplates);
apiRouter.get('/config/templates/:id', getTemplate);
apiRouter.get('/health', getHealth);

// 写操作端点（POST/PUT/DELETE）
// 模板应用 - 写操作，受 readonlyGuard 和 writeGate 保护
apiRouter.post('/config/templates/:id/apply', applyTemplate);

// Future 写操作端点（预留）
// apiRouter.post('/tasks/:id', createTask); // 未来会实现
// apiRouter.put('/tasks/:id', updateTask); // 未来会实现
// apiRouter.delete('/tasks/:id', deleteTask); // 未来会实现
// apiRouter.put('/memory/:agentId/:file', updateMemoryFile); // 未来会实现

// Iter-1 新增：SSE 实时推送端点（只读）
apiRouter.get('/events', getEvents);
apiRouter.get('/events/status', getEventsStatus);

// Iter-4 新增：Tasks 和 Docs 文件列表（只读）
apiRouter.get('/tasks', getTasks);
apiRouter.patch('/tasks/:filename/status', updateTaskStatus);
apiRouter.post('/tasks', createTask);
apiRouter.get('/docs', getDocs);
apiRouter.patch('/docs', patchDoc);

// Iter-5 新增：Collaboration / Usage / Memory（只读）
apiRouter.get('/collaboration', getCollaboration);
apiRouter.get('/timeline', getTimeline);
apiRouter.get('/notifications', getNotifications);
apiRouter.post('/notifications', createNotificationHandler);
apiRouter.post('/notifications/:id/ack', ackNotification);
apiRouter.post('/notifications/:id/snooze', snoozeNotificationHandler);
apiRouter.get('/budget/policy', getBudgetPolicyHandler);
apiRouter.put('/budget/policy', putBudgetPolicyHandler);
apiRouter.get('/budget/status', getBudgetStatusHandler);
apiRouter.get('/snapshot/export', exportSnapshot);
apiRouter.post('/snapshot/import', importSnapshot);

// P1 CC借鉴：协作流向图
apiRouter.get('/collaboration/graph', getCollaborationGraphHandler);
apiRouter.get('/usage', getUsage);
apiRouter.get('/memory', getMemory);

// Iter-6 新增：Settings 安全配置（只读）
apiRouter.get('/settings', getSettings);

// Iter-2 新增：待办/异常聚合
apiRouter.get('/action-queue', getActionQueueHandler);

// CC 借鉴补齐：Action Queue 确认接口
apiRouter.post('/action-queue/:itemId/ack', ackItem);

// Iter-2 新增：Cron 定时任务健康监控
apiRouter.get('/cron', getCronHandler);

// Iter-2 新增：接线状态诊断
apiRouter.get('/settings/wiring-status', wiringStatus);

// P1 CC借鉴：Settings 运维卡片
apiRouter.get('/settings/connection-health', connectionHealth);
apiRouter.get('/settings/security-summary', securitySummary);
apiRouter.get('/settings/update-status', updateStatus);

// P0 新增：全站搜索
apiRouter.get('/search', searchAll);

// P0 新增：成本感知
apiRouter.get('/usage/by-agent', byAgent);
apiRouter.get('/usage/context-pressure', contextPressure);

// CC 借鉴 P0-4：Memory 健康状态评估
apiRouter.get('/memory/health', getMemoryHealthHandler);

// CC 借鉴 P0-5：按 Model 维度用量汇总
apiRouter.get('/usage/by-model', byModel);

// Iter-3 新增：Session Gateway 深度集成
apiRouter.get('/sessions', getSessions);
apiRouter.get('/sessions/:id/messages', getMessages);
apiRouter.get('/sessions/:id', getSessionById);
