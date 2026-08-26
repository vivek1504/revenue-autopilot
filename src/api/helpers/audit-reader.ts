import fs from 'fs';
import { db } from '../dependencies';
import { detectOpportunities } from '../../agent/detector';
import { RevenueAgent } from '../../agent/revenue-agent';
import { PolicyEngine } from '../../policy/engine';
import { DEFAULT_MERCHANT_POLICY } from '../../policy/config';
import { config } from '../../shared/config';
import { AuditRecord, ProcessedAction } from '../../shared/types';

export function getAuditRecords(): AuditRecord[] {
  if (!fs.existsSync(config.auditPath)) {
    return [];
  }
  try {
    const lines = fs
      .readFileSync(config.auditPath, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean);
    return lines.map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}

export function getAllCurrentActions(): ProcessedAction[] {
  const auditRecords = getAuditRecords();
  const getCustomerName = db.prepare('SELECT name FROM customers WHERE id = ?');

  if (auditRecords.length > 0) {
    return auditRecords.map((r) => {
      const cust = getCustomerName.get(r.proposal.customer_id) as any;
      return {
        proposal: r.proposal,
        verdict: r.policy_result,
        execution: r.execution_result,
        auditRecord: r,
        customerName: cust?.name || r.proposal.customer_id,
      };
    });
  }

  // Detect live from SQLite
  const rawOpps = detectOpportunities(db);
  const agent = new RevenueAgent();
  const policyEngine = new PolicyEngine(DEFAULT_MERCHANT_POLICY, db);

  return rawOpps.map((opp, idx) => {
    const proposal = agent.fallbackProposal(opp);
    const verdict = policyEngine.evaluate(proposal);

    const auditRecord: AuditRecord = {
      sequence: idx + 1,
      timestamp: new Date().toISOString(),
      proposal,
      policy_result: verdict,
      previous_hash: '0'.repeat(64),
      record_hash: 'INITIAL_PENDING_CHAIN',
    };

    return {
      proposal,
      verdict,
      auditRecord,
      customerName: opp.customer.name,
    };
  });
}
