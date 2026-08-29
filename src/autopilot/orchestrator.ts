import { prisma as globalPrisma } from '../api/dependencies';
import { detectOpportunities } from '../agent/detector';
import { IProposer } from '../interfaces/proposer';
import { GeminiProposer } from '../agent/geminiProposer';
import { HeuristicProposer } from '../agent/simulatedProposer';
import { PolicyEngine } from '../policy/engine';
import { DEFAULT_MERCHANT_POLICY } from '../policy/config';
import { SettingsService } from '../services/settings.service';
import { IExecutionGateway } from '../interfaces/gateway';
import { RazorpayGateway } from '../gateway/razorpay-gateway';
import { SimulatedGateway } from '../gateway/simulated-gateway';
import { RazorpayClient } from '../gateway/razorpay-client';
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
  proposer?: IProposer;
  gateway?: IExecutionGateway;
  policyEngine?: PolicyEngine;
  auditLogger?: AuditLogger;
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

  // Composition root / dependency resolution
  const proposer =
    options.proposer ||
    (mode === 'live'
      ? new GeminiProposer(config.gemini.apiKey, config.gemini.model)
      : new HeuristicProposer());

  const rzpClient = new RazorpayClient(
    config.razorpay.keyId,
    config.razorpay.keySecret,
    config.razorpay.webhookSecret
  );

  const gateway =
    options.gateway ||
    (mode === 'live'
      ? new RazorpayGateway(rzpClient, config.execution.maxLiveLinks)
      : new SimulatedGateway());

  const settingsService = new SettingsService(prismaClient);
  const activePolicy = await settingsService.loadMerchantPolicy().catch(() => DEFAULT_MERCHANT_POLICY);
  const policyEngine =
    options.policyEngine || new PolicyEngine(activePolicy, prismaClient);
  const auditLogger =
    options.auditLogger || new AuditLogger(options.customAuditPath);

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
  let escalatedCount = 0;
  let dispatchedCount = 0;
  let executionFailedCount = 0;
  let unsafeValueBlockedPaise = 0;
  let approvedValuePaise = 0;

  const llmLatencies: number[] = [];
  const policyLatencies: number[] = [];
  const ledgerLatencies: number[] = [];

  for (const opp of opportunities) {
    try {
      // Step 2: Proposer generates action (Strategy call)
      const tLlm0 = performance.now();
      const proposalResult = await proposer.propose(opp);
      const proposal = proposalResult.proposal;
      const reasoning = proposalResult.reasoning;
      const llmDuration = performance.now() - tLlm0;
      llmLatencies.push(reasoning.latency_ms || llmDuration);
      options.onProgress?.({ type: 'proposal', proposal });

      // Step 3: Policy Engine evaluates proposal
      const tPol0 = performance.now();
      const verdict = await policyEngine.evaluate(proposal);
      const polDuration = performance.now() - tPol0;
      policyLatencies.push(polDuration);
      options.onProgress?.({ type: 'verdict', verdict });

      // Step 4: Execute if approved (Strategy call)
      let execution: ExecutionResult | undefined;
      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + proposal.expiry_hours * 60 * 60 * 1000
      );

      let createdOffer: any = null;

      if (verdict.verdict === 'APPROVED') {
        approvedCount++;
        const discountedPaise = Math.round(
          proposal.amount_paise * (1 - proposal.discount_percent / 100)
        );
        approvedValuePaise += discountedPaise;

        execution = await gateway.execute(verdict);
        options.onProgress?.({ type: 'execution', execution });

        if (execution.error && execution.error !== 'duplicate_prevented') {
          executionFailedCount++;
          createdOffer = await prismaClient.recoveryOffer.create({
            data: {
              id: `off_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              customer_id: proposal.customer_id,
              opportunity_id: opp.opportunityId || null,
              action_type: proposal.action,
              amount_paise: proposal.amount_paise,
              discount_percent: proposal.discount_percent,
              status: 'EXECUTION_FAILED',
              execution_mode: execution.mode === 'live' ? 'LIVE' : 'SIMULATED',
              created_at: now,
              expires_at: expiresAt,
              opportunity_type: proposal.opportunity_type,
              policy_verdict: verdict.verdict,
              ai_reason: proposal.reason,
              ai_confidence_score: proposal.confidence_score,
            },
          });
        } else if (!execution.error) {
          dispatchedCount++;
          createdOffer = await prismaClient.recoveryOffer.create({
            data: {
              id: `off_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              customer_id: proposal.customer_id,
              opportunity_id: opp.opportunityId || null,
              action_type: proposal.action,
              amount_paise: proposal.amount_paise,
              discount_percent: proposal.discount_percent,
              status: 'DISPATCHED',
              execution_mode: execution.mode === 'live' ? 'LIVE' : 'SIMULATED',
              created_at: now,
              expires_at: expiresAt,
              razorpay_payment_link_id: execution.razorpay_payment_link_id || null,
              razorpay_order_id: execution.razorpay_order_id || null,
              opportunity_type: proposal.opportunity_type,
              policy_verdict: verdict.verdict,
              ai_reason: proposal.reason,
              ai_confidence_score: proposal.confidence_score,
            },
          });

          if (opp.opportunityId) {
            await prismaClient.recoveryOpportunity.update({
              where: { id: opp.opportunityId },
              data: { status: 'PURSUING' },
            });
          }
        }
      } else if (verdict.verdict === 'ESCALATED') {
        escalatedCount++;
        createdOffer = await prismaClient.recoveryOffer.create({
          data: {
            id: `off_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            customer_id: proposal.customer_id,
            opportunity_id: opp.opportunityId || null,
            action_type: proposal.action,
            amount_paise: proposal.amount_paise,
            discount_percent: proposal.discount_percent,
            status: 'ESCALATED',
            execution_mode: null,
            created_at: now,
            expires_at: expiresAt,
            opportunity_type: proposal.opportunity_type,
            policy_verdict: verdict.verdict,
            ai_reason: proposal.reason,
            ai_confidence_score: proposal.confidence_score,
          },
        });

        if (opp.opportunityId) {
          await prismaClient.recoveryOpportunity.update({
            where: { id: opp.opportunityId },
            data: { status: 'PURSUING' },
          });
        }
      } else {
        blockedCount++;
        unsafeValueBlockedPaise += proposal.amount_paise;

        createdOffer = await prismaClient.recoveryOffer.create({
          data: {
            id: `off_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            customer_id: proposal.customer_id,
            opportunity_id: opp.opportunityId || null,
            action_type: proposal.action,
            amount_paise: proposal.amount_paise,
            discount_percent: proposal.discount_percent,
            status: 'BLOCKED',
            execution_mode: null,
            created_at: now,
            expires_at: expiresAt,
            opportunity_type: proposal.opportunity_type,
            policy_verdict: 'BLOCKED',
            ai_reason: proposal.reason,
            ai_confidence_score: proposal.confidence_score,
          },
        });

        if (opp.opportunityId) {
          await prismaClient.recoveryOpportunity.update({
            where: { id: opp.opportunityId },
            data: { status: 'BLOCKED' },
          });
        }
      }

      // Step 5: Append to Audit Log (Cryptographic SHA-256 Ledger)
      const tLedg0 = performance.now();
      const auditRecord = auditLogger.append(
        proposal,
        verdict,
        execution,
        reasoning
      );
      const ledgDuration = performance.now() - tLedg0;
      ledgerLatencies.push(ledgDuration);

      const processedItem: ProcessedAction = {
        proposal,
        verdict,
        execution,
        auditRecord,
        customerName: opp.customer.name,
        offerId: createdOffer?.id,
        offerStatus: createdOffer?.status,
      };

      results.push(processedItem);
      options.onProgress?.({ type: 'processed', item: processedItem });

      // Micro delay (25ms) to give smooth SSE streaming visual feed on UI
      await new Promise((resolve) => setTimeout(resolve, 25));
    } catch (err) {
      console.error(
        `[Autopilot] Error processing customer ${opp.customer.id}:`,
        err
      );
    }
  }

  const durationMs = Date.now() - startTime;

  function computePercentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return Math.round(sorted[Math.max(0, index)]! * 100) / 100;
  }

  // Compute live measured statistics
  if (llmLatencies.length > 0) {
    const avgLlm =
      Math.round(
        (llmLatencies.reduce((a, b) => a + b, 0) / llmLatencies.length) * 10
      ) / 10;
    liveTelemetryStats.avg_llm_ms = avgLlm;
    liveTelemetryStats.p99_llm_ms = computePercentile(llmLatencies, 99);
  }
  if (policyLatencies.length > 0) {
    const avgPol =
      Math.round(
        (policyLatencies.reduce((a, b) => a + b, 0) / policyLatencies.length) *
          100
      ) / 100;
    liveTelemetryStats.avg_policy_ms = avgPol;
    liveTelemetryStats.p99_policy_ms = computePercentile(policyLatencies, 99);
  }
  if (ledgerLatencies.length > 0) {
    const avgLedg =
      Math.round(
        (ledgerLatencies.reduce((a, b) => a + b, 0) / ledgerLatencies.length) *
          100
      ) / 100;
    liveTelemetryStats.avg_ledger_ms = avgLedg;
    liveTelemetryStats.p99_ledger_ms = computePercentile(ledgerLatencies, 99);
  }
  if (durationMs > 0 && opportunities.length > 0) {
    liveTelemetryStats.throughput_ops_sec = Math.round(
      opportunities.length / (durationMs / 1000)
    );
  }
  liveTelemetryStats.last_run_timestamp = new Date().toISOString();

  const summary: AutopilotResult = {
    total_opportunities: opportunities.length,
    approved_count: approvedCount,
    blocked_count: blockedCount,
    escalated_count: escalatedCount,
    dispatched_count: dispatchedCount,
    execution_failed_count: executionFailedCount,
    unsafe_value_blocked_paise: unsafeValueBlockedPaise,
    approved_value_paise: approvedValuePaise,
    duration_ms: durationMs,
    results,
  };

  options.onProgress?.({ type: 'complete', summary });
  return summary;
}
