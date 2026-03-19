import path from 'node:path';
import express from 'express';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { requestId } from './middleware/request-id.js';
import { auditLogger } from './middleware/audit-logger.js';
import { apiRouter } from './routes/api.js';

const publicDir = path.resolve(process.cwd(), 'src', 'public');

export function createApp() {
  const app = express();
  app.use(requestId());
  app.use(express.json());
  app.use(requestLogger);
  app.use(auditLogger);
  app.get('/health', (_req, res) => res.json({ ok: true, service: 'office-dashboard-adapter' }));
  app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
  app.use('/assets', express.static(publicDir));
  app.use('/api/v1', apiRouter);
  app.get(['/','/dashboard','/config'], (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
  app.get('/office/dashboard', (_req, res) => res.redirect(307, '/api/v1/dashboard'));
  app.get('/v1/office/dashboard', (_req, res) => res.redirect(307, '/api/v1/dashboard'));
  app.use(errorHandler);
  return app;
}
