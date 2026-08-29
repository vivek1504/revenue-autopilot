import { ProcessedAction, AuditRecord, TelemetryBenchmarks } from '../shared/types';
import { verifyAuditIntegrity } from '../audit/verifier';
import { liveTelemetryStats } from '../index';
import { config } from '../shared/config';

export class TelemetryService {
  public getBenchmarks(
    items: ProcessedAction[],
    auditRecords: AuditRecord[]
  ): TelemetryBenchmarks {
    const auditVerification = verifyAuditIntegrity(config.auditPath);

    let discountCatches = 0;
    let frequencyCatches = 0;
    let expiryCatches = 0;
    let escalationCatches = 0;
    let limitCatches = 0;
    let confidenceCatches = 0;
    let integrityCatches = 0;
    let blockedCount = 0;

    for (const rec of items) {
      if (rec.verdict.verdict === 'BLOCKED' || rec.verdict.verdict === 'ESCALATED') {
        if (rec.verdict.verdict === 'BLOCKED') {
          blockedCount++;
        }
        const violations = rec.verdict.violations || [];
        for (const v of violations) {
          const rule = (v.rule || '').toLowerCase();
          if (rule === 'discount_limit' || rule === 'discount_for_action') {
            discountCatches++;
          } else if (rule === 'contact_frequency') {
            frequencyCatches++;
          } else if (rule === 'expiry_range') {
            expiryCatches++;
          } else if (rule === 'human_escalation') {
            escalationCatches++;
          } else if (rule === 'amount_limit' || rule === 'amount_positive') {
            limitCatches++;
          } else if (rule === 'confidence_threshold') {
            confidenceCatches++;
          } else if (rule === 'duplicate_offer') {
            integrityCatches++;
          } else {
            integrityCatches++;
          }
        }
      }
    }

    const totalCatches =
      discountCatches +
      frequencyCatches +
      expiryCatches +
      escalationCatches +
      limitCatches +
      confidenceCatches +
      integrityCatches;

    const totalProposals = items.length;
    const blockRatePct =
      totalProposals > 0
        ? Math.round((blockedCount / totalProposals) * 100)
        : 0;

    const confidences = items
      .map((r) => r.proposal.confidence_score)
      .filter((c): c is number => typeof c === 'number');
    const avgConfidence =
      confidences.length > 0
        ? Math.round(
            (confidences.reduce((a, b) => a + b, 0) / confidences.length) * 1000
          ) / 10
        : 0;

    return {
      avg_confidence: avgConfidence,
      block_rate_pct: blockRatePct,
      blocked_proposals_count: blockedCount,
      total_proposals_count: totalProposals,
      avg_llm_latency_ms: liveTelemetryStats.avg_llm_ms || 0,
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
          rule: 'Discount Ceiling Violation (>15%)',
          count: discountCatches,
          percentage:
            totalCatches > 0
              ? Math.round((discountCatches / totalCatches) * 100)
              : 0,
        },
        {
          rule: 'Contact Frequency Stopping Rule (3/7d)',
          count: frequencyCatches,
          percentage:
            totalCatches > 0
              ? Math.round((frequencyCatches / totalCatches) * 100)
              : 0,
        },
        {
          rule: 'Transaction Limit & Human Escalation (>₹10k/₹25k)',
          count: limitCatches + escalationCatches,
          percentage:
            totalCatches > 0
              ? Math.round(
                  ((limitCatches + escalationCatches) / totalCatches) * 100
                )
              : 0,
        },
        {
          rule: 'AI Confidence Gate (<70%)',
          count: confidenceCatches,
          percentage:
            totalCatches > 0
              ? Math.round((confidenceCatches / totalCatches) * 100)
              : 0,
        },
        {
          rule: 'Data Integrity & Duplicate Guards',
          count: expiryCatches + integrityCatches,
          percentage:
            totalCatches > 0
              ? Math.round(
                  ((expiryCatches + integrityCatches) / totalCatches) * 100
                )
              : 0,
        },
      ],
    };
  }
}
