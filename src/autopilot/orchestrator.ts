import { prisma as globalPrisma } from '../api/dependencies';
import { detectOpportunities } from '../agent/detector';
import { RevenueAgent } from '../agent/revenue-agent';
import { PolicyEngine } from '../policy/engine';
import { DEFAULT_MERCHANT_POLICY } from '../policy/config';
import { ActionGateway } from '../gateway/action-gateway';
import { RazorpayClient } from '../gateway/razorpay-client';
import { ActionSimulator } from '../gateway/simulator';
import { AuditLogger } from '../audit/logger';
import { config } from '../shared/config';
import {
  AutopilotEvent,
  AutopilotResult,
  ExecutionResult,
  ProcessedAction,
} from '../shared/types';
import { liveTelemetryStats } from './telemetry';

export interface RunAutopilotOptions {
  mode?: 'live' | 'simulated';
  onProgress?: (event: AutopilotEvent) => void;
  customAuditPath?: string;
  limit?: number;
}

export async function runAutopilot(
  options: RunAutopilotOptions = {}
): Promise<AutopilotResult> {
  const startTime = Date.now();
  const mode = options.mode || config.execution.defaultMode;
  const prismaClient = globalPrisma;
  const agent = new RevenueAgent(config.gemini.apiKey);
  const policyEngine = new PolicyEngine(DEFAULT_MERCHANT_POLICY, prismaClient);
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

  // 1. Detect opportunities (Measure discovery latency)
  const t0 = performance.now();
  let opportunities = await detectOpportunities(prismaClient);
  const discoveryMs = Math.round((performance.now() - t0) * 10) / 10;
  liveTelemetryStats.avg_discovery_ms = discoveryMs;
  liveTelemetryStats.p99_discovery_ms = discoveryMs;

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

  const llmLatencies: number[] = [];
  const policyLatencies: number[] = [];
  const ledgerLatencies: number[] = [];

  for (const opp of opportunities) {
    try {
      // Step 2: Agent proposes action (Measure LLM / reasoning time)
      const tLlm0 = performance.now();
      const proposalResult = await agent.proposeAction(opp, mode);
      const proposal = proposalResult.proposal;
      const reasoning = proposalResult.reasoning;
      const llmDuration = performance.now() - tLlm0;
      llmLatencies.push(reasoning.latency_ms || llmDuration);
      options.onProgress?.({ type: 'proposal', proposal });

      // Step 3: Policy Engine evaluates proposal (Measure policy latency)
      const tPol0 = performance.now();
      const verdict = await policyEngine.evaluate(proposal);
      const polDuration = performance.now() - tPol0;
      policyLatencies.push(polDuration);
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

        // Save recovery offer record to DB via Prisma
        const now = new Date();
        const expiresAt = new Date(now.getTime() + proposal.expiry_hours * 60 * 60 * 1000);
        
        if (mode === 'simulated') {
          await prismaClient.recoveryOffer.deleteMany({
            where: { customer_id: proposal.customer_id, status: 'simulated' },
          });
        }

        await prismaClient.recoveryOffer.create({
          data: {
            id: `off_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            customer_id: proposal.customer_id,
            action_type: proposal.action,
            amount_paise: proposal.amount_paise,
            discount_percent: proposal.discount_percent,
            status: mode === 'live' ? 'sent' : 'simulated',
            created_at: now,
            expires_at: expiresAt,
            razorpay_payment_link_id: execution.razorpay_payment_link_id || null,
            razorpay_order_id: execution.razorpay_order_id || null,
          },
        });
      } else {
        blockedCount++;
        unsafeValueBlockedPaise += proposal.amount_paise;
      }

      // Step 5: Append to Audit Log (Measure SHA-256 ledger append latency)
      const tLedg0 = performance.now();
      const auditRecord = auditLogger.append(proposal, verdict, execution, reasoning);
      const ledgDuration = performance.now() - tLedg0;
      ledgerLatencies.push(ledgDuration);

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

  // Compute live measured statistics
  if (llmLatencies.length > 0) {
    const avgLlm = Math.round((llmLatencies.reduce((a, b) => a + b, 0) / llmLatencies.length) * 10) / 10;
    liveTelemetryStats.avg_llm_ms = avgLlm;
    liveTelemetryStats.p99_llm_ms = avgLlm;
  }
  if (policyLatencies.length > 0) {
    const avgPol = Math.round((policyLatencies.reduce((a, b) => a + b, 0) / policyLatencies.length) * 100) / 100;
    liveTelemetryStats.avg_policy_ms = avgPol;
    liveTelemetryStats.p99_policy_ms = avgPol;
  }
  if (ledgerLatencies.length > 0) {
    const avgLedg = Math.round((ledgerLatencies.reduce((a, b) => a + b, 0) / ledgerLatencies.length) * 100) / 100;
    liveTelemetryStats.avg_ledger_ms = avgLedg;
    liveTelemetryStats.p99_ledger_ms = avgLedg;
  }
  if (durationMs > 0 && opportunities.length > 0) {
    liveTelemetryStats.throughput_ops_sec = Math.round((opportunities.length / (durationMs / 1000)));
  }
  liveTelemetryStats.last_run_timestamp = new Date().toISOString();

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
