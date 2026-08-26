import { ProcessedAction, AuditRecord, TelemetryBenchmarks } from '../shared/types';
import { verifyAuditIntegrity } from '../audit/verifier';
import { liveTelemetryStats } from '../index';
import { config } from '../shared/config';

export class TelemetryService {
  public getBenchmarks(items: ProcessedAction[], auditRecords: AuditRecord[]): TelemetryBenchmarks {
    const auditVerification = verifyAuditIntegrity(config.auditPath);

    let discountCatches = 0;
    let expiryCatches = 0;
    let adversarialCatches = 0;
    let frequencyCatches = 0;
    let escalationCatches = 0;
    let blockedCount = 0;

    for (const rec of items) {
      if (rec.verdict.verdict === 'BLOCKED') {
        blockedCount++;
        const violations = rec.verdict.violations || [];
        for (const v of violations) {
          const ruleLower = (v.rule || '').toLowerCase();
          const msgLower = (v.message || '').toLowerCase();
          if (ruleLower.includes('discount') || msgLower.includes('discount')) {
            discountCatches++;
          } else if (ruleLower.includes('expiry') || msgLower.includes('expiry') || ruleLower.includes('duration')) {
            expiryCatches++;
          } else if (ruleLower.includes('frequency') || msgLower.includes('contact')) {
            frequencyCatches++;
          } else if (ruleLower.includes('escalation') || msgLower.includes('human')) {
            escalationCatches++;
          } else {
            adversarialCatches++;
          }
        }
      }
    }

    const totalCatches = discountCatches + expiryCatches + adversarialCatches + frequencyCatches + escalationCatches;
    const totalProposals = items.length;
    const blockRatePct = totalProposals > 0 ? Math.round((blockedCount / totalProposals) * 100) : 0;

    const confidences = items
      .map((r) => r.proposal.confidence_score)
      .filter((c): c is number => typeof c === 'number');
    const avgConfidence =
      confidences.length > 0
        ? Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 1000) / 10
        : 0;

    return {
      avg_confidence: avgConfidence,
      block_rate_pct: blockRatePct,
      blocked_proposals_count: blockedCount,
      total_proposals_count: totalProposals,
      avg_llm_latency_ms: liveTelemetryStats.p99_llm_ms || 0,
      llm_call_count: totalProposals,
      verified_audit_records_count: auditRecords.length,
      hash_chain_intact: auditVerification.valid,
      p99_discovery_ms: liveTelemetryStats.p99_discovery_ms || 0,
      p99_policy_ms: liveTelemetryStats.p99_policy_ms || 0,
      p99_ledger_ms: liveTelemetryStats.p99_ledger_ms || 0,
      p99_llm_ms: liveTelemetryStats.p99_llm_ms || 0,
      throughput_ops_sec: liveTelemetryStats.throughput_ops_sec || 0,
      rule_catches: [
        {
          rule: 'Discount Cap Violation (>15%)',
          count: discountCatches,
          percentage: totalCatches > 0 ? Math.round((discountCatches / totalCatches) * 100) : 0,
          color: 'bg-rose-500',
        },
        {
          rule: 'Contact Frequency Stopping Rule (3/7d)',
          count: frequencyCatches,
          percentage: totalCatches > 0 ? Math.round((frequencyCatches / totalCatches) * 100) : 0,
          color: 'bg-indigo-600',
        },
        {
          rule: 'Link Expiry Over Limit (>72h)',
          count: expiryCatches,
          percentage: totalCatches > 0 ? Math.round((expiryCatches / totalCatches) * 100) : 0,
          color: 'bg-amber-500',
        },
        {
          rule: 'Human Escalation Threshold (>₹25k)',
          count: escalationCatches,
          percentage: totalCatches > 0 ? Math.round((escalationCatches / totalCatches) * 100) : 0,
          color: 'bg-blue-600',
        },
        {
          rule: 'Adversarial Prompt Injection Note',
          count: adversarialCatches,
          percentage: totalCatches > 0 ? Math.round((adversarialCatches / totalCatches) * 100) : 0,
          color: 'bg-purple-600',
        },
      ],
    };
  }
}
