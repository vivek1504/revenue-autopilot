import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';
import { initializeDatabase } from '../data/schema';
import { runAutopilot } from '../index';
import { createWebhookRouter } from './routes/webhook';
import { RazorpayClient } from '../gateway/razorpay-client';
import { AuditLogger } from '../audit/logger';
import { verifyAuditIntegrity } from '../audit/verifier';
import { config } from '../shared/config';
import { AuditRecord, AutopilotEvent, DashboardSummary } from '../shared/types';

export const autopilotEmitter = new EventEmitter();
const app = express();

app.use(cors());
app.use(express.json());

const db = initializeDatabase(config.dbPath);
const rzpClient = new RazorpayClient(
  config.razorpay.keyId,
  config.razorpay.keySecret,
  config.razorpay.webhookSecret
);
const auditLogger = new AuditLogger(config.auditPath);

// Mount Webhook router
app.use('/api/webhook', createWebhookRouter(db, rzpClient, auditLogger));

// 1. Dashboard Summary
app.get('/api/dashboard/summary', (req: Request, res: Response) => {
  console.log("summary")
  try {
    const totalCustomers = (
      db.prepare('SELECT COUNT(*) as cnt FROM customers').get() as any
    )?.cnt || 0;

    let auditRecords: AuditRecord[] = [];
    if (fs.existsSync(config.auditPath)) {
      const lines = fs
        .readFileSync(config.auditPath, 'utf-8')
        .trim()
        .split('\n')
        .filter(Boolean);
      auditRecords = lines.map((l) => JSON.parse(l));
    }

    const approvedRecords = auditRecords.filter(
      (r) => r.policy_result.verdict === 'APPROVED'
    );
    const blockedRecords = auditRecords.filter(
      (r) => r.policy_result.verdict === 'BLOCKED'
    );

    const unsafeValueBlockedPaise = blockedRecords.reduce(
      (sum, r) => sum + (r.proposal.amount_paise || 0),
      0
    );

    const approvedValuePaise = approvedRecords.reduce((sum, r) => {
      const discounted = Math.round(
        (r.proposal.amount_paise || 0) * (1 - (r.proposal.discount_percent || 0) / 100)
      );
      return sum + discounted;
    }, 0);

    const liveLinksCreated = auditRecords.filter(
      (r) => r.execution_result?.mode === 'live'
    ).length;

    const redeemedOffers = (
      db.prepare("SELECT COUNT(*) as cnt FROM recovery_offers WHERE status = 'redeemed'").get() as any
    )?.cnt || 0;

    const summary: DashboardSummary = {
      total_customers: totalCustomers,
      opportunities_count: auditRecords.length,
      approved_count: approvedRecords.length,
      blocked_count: blockedRecords.length,
      unsafe_value_blocked_paise: unsafeValueBlockedPaise,
      approved_value_paise: approvedValuePaise,
      live_links_created: liveLinksCreated,
      redeemed_count: redeemedOffers,
    };

    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Trigger Autopilot Run
app.post('/api/autopilot/run', async (req: Request, res: Response) => {
  console.log('autopilot triggered')
  const mode = req.body.mode || config.execution.defaultMode;
  const limit = req.body.limit ? parseInt(req.body.limit, 10) : undefined;

  res.json({ status: 'started', mode });

  // Run asynchronously and stream events via SSE
  runAutopilot({
    mode,
    limit,
    onProgress: (event: AutopilotEvent) => {
      autopilotEmitter.emit('event', event);
    },
  }).catch((err) => {
    console.error('Error during API triggered autopilot run:', err);
  });
});

// 3. Server-Sent Events (SSE) stream for live dashboard updates
app.get('/api/autopilot/events', (req: Request, res: Response) => {
  console.log("events requested")
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (res.flushHeaders) res.flushHeaders();

  const listener = (event: AutopilotEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  autopilotEmitter.on('event', listener);

  req.on('close', () => {
    autopilotEmitter.off('event', listener);
  });
});

// 4. Audit Log retrieval
app.get('/api/audit/log', (req: Request, res: Response) => {
  console.log("audit log requested")
  if (!fs.existsSync(config.auditPath)) {
    return res.json([]);
  }

  try {
    const lines = fs
      .readFileSync(config.auditPath, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean);
    const records = lines.map((line) => JSON.parse(line));
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Verify Audit Trail Integrity
app.post('/api/audit/verify', (req: Request, res: Response) => {
  console.log("audit verify requested")
  try {
    const result = verifyAuditIntegrity(config.auditPath);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Tamper Record (Demo Only)
app.post('/api/audit/tamper', (req: Request, res: Response): any => {
  console.log("audit tamper requested")
  const sequence = req.body.sequence || 1;

  if (!fs.existsSync(config.auditPath)) {
    return res.status(404).json({ error: 'Audit file not found' });
  }

  try {
    const lines = fs
      .readFileSync(config.auditPath, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean);

    let tampered = false;
    const modifiedLines = lines.map((line) => {
      const record: AuditRecord = JSON.parse(line);
      if (record.sequence === sequence) {
        tampered = true;
        record.proposal.amount_paise += 1000000;
        record.proposal.reason += ' (TAMPERED VIA DEMO API)';
        return JSON.stringify(record);
      }
      return line;
    });

    if (!tampered) {
      return res.status(404).json({ error: `Sequence ${sequence} not found` });
    }

    fs.writeFileSync(config.auditPath, modifiedLines.join('\n') + '\n');
    res.json({ status: 'tampered', sequence });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export function startServer(port: number = config.server.port) {
  return app.listen(port, () => {
    console.log(`🚀 Revenue Autopilot API Server running at http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer();
}
