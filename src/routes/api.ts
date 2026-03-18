import { Router } from 'express';
import { getAgents } from '../controllers/agent-controller.js';
import { getDashboard } from '../controllers/dashboard-controller.js';
import { getHealth } from '../controllers/health-controller.js';
import { getHealthz } from '../controllers/healthz-controller.js';
import { applyTemplate, getTemplate, getTemplates } from '../controllers/template-controller.js';
import { getEvents, getEventsStatus } from '../controllers/events-controller.js';
import { securityMiddleware } from '../middleware/security.js';
import { getTasks, updateTaskStatus, createTask } from '../controllers/tasks-controller.js';
import { getDocs } from '../controllers/docs-controller.js';
import { getCollaboration, getSessions, getSessionById, getMessages } from '../controllers/collaboration-controller.js';
import { getUsage, byAgent, contextPressure } from '../controllers/usage-controller.js';
import { searchAll } from '../controllers/search-controller.js';
import { getMemory } from '../controllers/memory-controller.js';
import { getSettings, wiringStatus } from '../controllers/settings-controller.js';
import { getActionQueueHandler, ackItem } from '../controllers/action-queue-controller.js';
import { getCronHandler } from '../controllers/cron-controller.js';

export const apiRouter = Router();

// 新的健康端点（永远返回200，无需鉴权）
apiRouter.get('/healthz', getHealthz);

// 所有其他路由应用 token 鉴权（如果配置了 token）
apiRouter.use(...securityMiddleware);

// 只读端点（GET）
apiRouter.get('/dashboard', getDashboard);
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

// Iter-5 新增：Collaboration / Usage / Memory（只读）
apiRouter.get('/collaboration', getCollaboration);
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

// P0 新增：全站搜索
apiRouter.get('/search', searchAll);

// P0 新增：成本感知
apiRouter.get('/usage/by-agent', byAgent);
apiRouter.get('/usage/context-pressure', contextPressure);

// Iter-3 新增：Session Gateway 深度集成
apiRouter.get('/sessions', getSessions);
apiRouter.get('/sessions/:id/messages', getMessages);
apiRouter.get('/sessions/:id', getSessionById);
