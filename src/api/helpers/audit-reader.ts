import fs from 'fs';
import { prisma } from '../dependencies';
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

export async function getAllCurrentActions(): Promise<ProcessedAction[]> {
  const auditRecords = getAuditRecords();

  if (auditRecords.length > 0) {
    const evaluatedRecords = auditRecords.filter(
      (r) => r.event_type === 'PROPOSAL_EVALUATED' || (!r.event_type && r.proposal)
    );

    const customerIds = evaluatedRecords.map((r) => r.proposal.customer_id);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true },
    });
    const customerMap = new Map(customers.map((c) => [c.id, c.name]));

    return evaluatedRecords.map((r) => {
      const custName = customerMap.get(r.proposal.customer_id) || r.proposal.customer_id;
      return {
        proposal: r.proposal,
        verdict: r.policy_result,
        execution: r.execution_result,
        auditRecord: r,
        customerName: custName,
      };
    });
  }

  // Detect live from Postgres via Prisma
  const rawOpps = await detectOpportunities(prisma);
  const agent = new RevenueAgent();
  const policyEngine = new PolicyEngine(DEFAULT_MERCHANT_POLICY, prisma);

  const actions: ProcessedAction[] = [];
  for (let idx = 0; idx < rawOpps.length; idx++) {
    const opp = rawOpps[idx];
    const proposal = agent.fallbackProposal(opp);
    const verdict = await policyEngine.evaluate(proposal);

    const auditRecord: AuditRecord = {
      sequence: idx + 1,
      timestamp: new Date().toISOString(),
      proposal,
      policy_result: verdict,
      previous_hash: '0'.repeat(64),
      record_hash: 'INITIAL_PENDING_CHAIN',
    };

    actions.push({
      proposal,
      verdict,
      auditRecord,
      customerName: opp.customer.name,
    });
  }

  return actions;
}
