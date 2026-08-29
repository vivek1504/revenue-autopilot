import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  AgentProposal,
  AuditRecord,
  ExecutionResult,
  LLMReasoningMetadata,
  PolicyResult,
} from '../shared/types';

export const GENESIS_HASH = '0'.repeat(64);

export function canonicalJsonStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(canonicalJsonStringify).join(',')}]`;
  }
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  const pairs = keys.map(
    (k) => `${JSON.stringify(k)}:${canonicalJsonStringify(obj[k])}`
  );
  return `{${pairs.join(',')}}`;
}

export class AuditLogger {
  private auditPath: string;
  private lastHash: string = GENESIS_HASH;
  private sequence: number = 0;

  constructor(auditPath?: string) {
    this.auditPath =
      auditPath || path.join(process.cwd(), 'data', 'audit.jsonl');
    this.ensureDirectory();
    this.loadState();
  }

  private ensureDirectory(): void {
    const dir = path.dirname(this.auditPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  public append(
    proposal: AgentProposal,
    policyResult: PolicyResult,
    executionResult?: ExecutionResult,
    llmReasoning?: LLMReasoningMetadata
  ): AuditRecord {
    this.loadState();
    const recordWithoutHash: Omit<AuditRecord, 'record_hash'> = {
      sequence: this.sequence + 1,
      timestamp: new Date().toISOString(),
      event_type: 'PROPOSAL_EVALUATED',
      proposal,
      policy_result: policyResult,
      execution_result: executionResult,
      llm_reasoning: llmReasoning,
      previous_hash: this.lastHash,
    };

    // Hash = SHA-256(previous_hash + deterministic canonical JSON of record)
    const payload =
      this.lastHash + canonicalJsonStringify(recordWithoutHash);
    const recordHash = crypto
      .createHash('sha256')
      .update(payload)
      .digest('hex');

    const fullRecord: AuditRecord = {
      ...recordWithoutHash,
      record_hash: recordHash,
    };

    // Append to JSONL file
    fs.appendFileSync(this.auditPath, JSON.stringify(fullRecord) + '\n');

    this.lastHash = recordHash;
    this.sequence++;
    return fullRecord;
  }

  public appendAction(action: {
    proposal: AgentProposal;
    verdict: PolicyResult;
    execution?: ExecutionResult;
    llmReasoning?: LLMReasoningMetadata;
  }): AuditRecord {
    return this.append(
      action.proposal,
      action.verdict,
      action.execution,
      action.llmReasoning
    );
  }

  public appendSettlement(settlement: {
    offer_id: string;
    opportunity_id?: string;
    payment_link_id?: string;
    settled_amount_paise: number;
    customer_id: string;
    action_type: string;
    opportunity_type: string;
    discount_percent: number;
    mode?: 'live' | 'simulated';
  }): AuditRecord {
    this.loadState();
    const settlementProposal: AgentProposal = {
      customer_id: settlement.customer_id,
      action: settlement.action_type as any,
      amount_paise: settlement.settled_amount_paise,
      discount_percent: settlement.discount_percent,
      expiry_hours: 0,
      reason: `Settlement verified for offer ${settlement.offer_id}`,
      opportunity_type: settlement.opportunity_type as any,
      evidence: {},
    };

    const settlementVerdict: PolicyResult = {
      verdict: 'APPROVED',
      proposal: settlementProposal,
      violations: [],
      checked_at: new Date().toISOString(),
    };

    const recordWithoutHash: Omit<AuditRecord, 'record_hash'> = {
      sequence: this.sequence + 1,
      timestamp: new Date().toISOString(),
      event_type: 'SETTLEMENT_VERIFIED',
      proposal: settlementProposal,
      policy_result: settlementVerdict,
      execution_result: {
        mode: settlement.mode || 'live',
        razorpay_payment_link_id: settlement.payment_link_id,
        idempotency_key: `settle_${settlement.offer_id}_${Date.now()}`,
      },
      settlement: {
        offer_id: settlement.offer_id,
        opportunity_id: settlement.opportunity_id,
        payment_link_id: settlement.payment_link_id,
        settled_amount_paise: settlement.settled_amount_paise,
        customer_id: settlement.customer_id,
      },
      previous_hash: this.lastHash,
    };

    const payload =
      this.lastHash + canonicalJsonStringify(recordWithoutHash);
    const recordHash = crypto
      .createHash('sha256')
      .update(payload)
      .digest('hex');

    const fullRecord: AuditRecord = {
      ...recordWithoutHash,
      record_hash: recordHash,
    };

    fs.appendFileSync(this.auditPath, JSON.stringify(fullRecord) + '\n');

    this.lastHash = recordHash;
    this.sequence++;
    return fullRecord;
  }

  private loadState(): void {
    if (!fs.existsSync(this.auditPath)) {
      this.lastHash = GENESIS_HASH;
      this.sequence = 0;
      return;
    }

    const lines = fs
      .readFileSync(this.auditPath, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean);

    if (lines.length === 0) {
      this.lastHash = GENESIS_HASH;
      this.sequence = 0;
      return;
    }

    try {
      const lastRecord: AuditRecord = JSON.parse(lines[lines.length - 1]!);
      this.lastHash = lastRecord.record_hash;
      this.sequence = lastRecord.sequence;
    } catch {
      this.lastHash = GENESIS_HASH;
      this.sequence = 0;
    }
  }

  public getLastHash(): string {
    return this.lastHash;
  }

  public getSequence(): number {
    return this.sequence;
  }

  public getRecords(): AuditRecord[] {
    if (!fs.existsSync(this.auditPath)) return [];
    try {
      const content = fs.readFileSync(this.auditPath, 'utf-8');
      return content
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line));
    } catch {
      return [];
    }
  }
}
