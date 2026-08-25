import { initializeDatabase } from './data/schema';
import { detectOpportunities } from './agent/detector';
import { RevenueAgent } from './agent/revenue-agent';
import { PolicyEngine } from './policy/engine';
import { DEFAULT_MERCHANT_POLICY } from './policy/config';
import { ActionGateway } from './gateway/action-gateway';
import { RazorpayClient } from './gateway/razorpay-client';
import { ActionSimulator } from './gateway/simulator';
import { AuditLogger } from './audit/logger';
import { config } from './shared/config';
import {
  AutopilotEvent,
  AutopilotResult,
  ExecutionResult,
  ProcessedAction,
} from './shared/types';

export interface RunAutopilotOptions {
  mode?: 'live' | 'simulated';
  onProgress?: (event: AutopilotEvent) => void;
  customDbPath?: string;
  customAuditPath?: string;
  limit?: number;
}

export async function runAutopilot(
  options: RunAutopilotOptions = {}
): Promise<AutopilotResult> {
  const startTime = Date.now();
  const mode = options.mode || config.execution.defaultMode;

  const db = initializeDatabase(options.customDbPath);
  const agent = new RevenueAgent(config.gemini.apiKey);
  const policyEngine = new PolicyEngine(DEFAULT_MERCHANT_POLICY, db);
  const rzpClient = new RazorpayClient(
    config.razorpay.keyId,
    config.razorpay.keySecret,
    config.razorpay.webhookSecret
  );
  const simulator = new ActionSimulator();
  const gateway = new ActionGateway(
    rzpClient,
    simulator,
    config.execution.maxLiveLinks,
    mode
  );
  const auditLogger = new AuditLogger(options.customAuditPath);

  // 1. Detect opportunities
  let opportunities = detectOpportunities(db);
  if (options.limit && options.limit > 0) {
    opportunities = opportunities.slice(0, options.limit);
  }

  options.onProgress?.({
    type: 'start',
    total_opportunities: opportunities.length,
  });

  options.onProgress?.({
    type: 'detection_complete',
    count: opportunities.length,
  });

  const results: ProcessedAction[] = [];
  let approvedCount = 0;
  let blockedCount = 0;
  let unsafeValueBlockedPaise = 0;
  let approvedValuePaise = 0;

  for (const opp of opportunities) {
    try {
      // Step 2: Agent proposes action (passes mode for fast simulation vs live LLM call)
      const proposal = await agent.proposeAction(opp, mode);
      options.onProgress?.({ type: 'proposal', proposal });

      // Step 3: Policy Engine evaluates proposal
      const verdict = policyEngine.evaluate(proposal);
      options.onProgress?.({ type: 'verdict', verdict });

      // Step 4: Execute if approved
      let execution: ExecutionResult | undefined;
      if (verdict.verdict === 'APPROVED') {
        approvedCount++;
        const discountedPaise = Math.round(
          proposal.amount_paise * (1 - proposal.discount_percent / 100)
        );
        approvedValuePaise += discountedPaise;

        execution = await gateway.execute(verdict, mode);
        options.onProgress?.({ type: 'execution', execution });

        // Save recovery offer record to DB
        const offerStmt = db.prepare(`
          INSERT INTO recovery_offers (id, customer_id, action_type, amount_paise, discount_percent, status, created_at, expires_at, razorpay_payment_link_id, razorpay_order_id)
          VALUES (?, ?, ?, ?, ?, 'sent', datetime('now'), datetime('now', '+' || ? || ' hours'), ?, ?)
        `);
        offerStmt.run(
          `off_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          proposal.customer_id,
          proposal.action,
          proposal.amount_paise,
          proposal.discount_percent,
          proposal.expiry_hours,
          execution.razorpay_payment_link_id || null,
          execution.razorpay_order_id || null
        );
      } else {
        blockedCount++;
        unsafeValueBlockedPaise += proposal.amount_paise;
      }

      // Step 5: Append to Audit Log (always logged)
      const auditRecord = auditLogger.append(proposal, verdict, execution);

      const processedItem: ProcessedAction = {
        proposal,
        verdict,
        execution,
        auditRecord,
        customerName: opp.customer.name,
      };

      results.push(processedItem);
      options.onProgress?.({ type: 'processed', item: processedItem });

      // Micro delay (25ms) to give smooth SSE streaming visual feed on UI
      await new Promise((resolve) => setTimeout(resolve, 25));
    } catch (err) {
      console.error(`[Autopilot] Error processing customer ${opp.customer.id}:`, err);
    }
  }

  const durationMs = Date.now() - startTime;
  const summary: AutopilotResult = {
    total_opportunities: opportunities.length,
    approved_count: approvedCount,
    blocked_count: blockedCount,
    unsafe_value_blocked_paise: unsafeValueBlockedPaise,
    approved_value_paise: approvedValuePaise,
    duration_ms: durationMs,
    results,
  };

  options.onProgress?.({ type: 'complete', summary });
  return summary;
}
