import express from 'express';
import cors from 'cors';
import { config } from '../shared/config';
import { prisma, rzpClient, auditLogger, autopilotEmitter } from './dependencies';
import { createDashboardRouter } from './routes/dashboard';
import { createOpportunitiesRouter } from './routes/opportunities';
import { createAnalyticsRouter } from './routes/analytics';
import { createTelemetryRouter } from './routes/telemetry';
import { createSettingsRouter } from './routes/settings';
import { createExportRouter } from './routes/export';
import { createAutopilotRouter } from './routes/autopilot';
import { createAuditRouter } from './routes/audit';
import { createWebhookRouter } from './routes/webhook';

export { autopilotEmitter };

const app = express();

app.use(cors());
app.use(express.json());

// Mount route modules
app.use('/api/dashboard', createDashboardRouter());
app.use('/api/opportunities', createOpportunitiesRouter());
app.use('/api/analytics', createAnalyticsRouter());
app.use('/api/telemetry', createTelemetryRouter());
app.use('/api/settings', createSettingsRouter());
app.use('/api/export', createExportRouter());
app.use('/api/autopilot', createAutopilotRouter());
app.use('/api/audit', createAuditRouter());
app.use('/api/webhook', createWebhookRouter(prisma, rzpClient, auditLogger));

export function startServer(port: number = config.server.port) {
  return app.listen(port, () => {
    console.log(`🚀 Revenue Autopilot API Server running at http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer();
}
