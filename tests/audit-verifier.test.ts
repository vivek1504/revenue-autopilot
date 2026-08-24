import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { AuditLogger } from '../src/audit/logger';
import { verifyAuditIntegrity } from '../src/audit/verifier';
import { AgentProposal, PolicyResult } from '../src/shared/types';

describe('AuditLogger & Verifier Hash-Chain Integrity', () => {
  const testAuditPath = path.join(process.cwd(), 'data', 'test_audit.jsonl');

  const createDummyProposal = (id: number): AgentProposal => ({
    customer_id: `cust_00${id}`,
    action: 'discounted_payment_link',
    amount_paise: 500000 + id * 1000,
    discount_percent: 5,
    expiry_hours: 24,
    reason: `Test proposal audit entry #${id}`,
    opportunity_type: 'abandoned_checkout',
    evidence: { cart_value_paise: 500000 },
  });

  const createDummyPolicyResult = (proposal: AgentProposal): PolicyResult => ({
    verdict: 'APPROVED',
    proposal,
    violations: [],
    checked_at: new Date().toISOString(),
  });

  beforeEach(() => {
    if (fs.existsSync(testAuditPath)) {
      fs.unlinkSync(testAuditPath);
    }
  });

  afterEach(() => {
    if (fs.existsSync(testAuditPath)) {
      fs.unlinkSync(testAuditPath);
    }
  });

  it('should report valid for an empty audit log file', () => {
    const result = verifyAuditIntegrity(testAuditPath);
    expect(result.valid).toBe(true);
    expect(result.total_records).toBe(0);
  });

  it('should append 10 records and pass integrity verification', () => {
    const logger = new AuditLogger(testAuditPath);

    for (let i = 1; i <= 10; i++) {
      const prop = createDummyProposal(i);
      logger.append(prop, createDummyPolicyResult(prop), {
        mode: 'simulated',
        idempotency_key: `key_${i}`,
      });
    }

    const result = verifyAuditIntegrity(testAuditPath);
    expect(result.valid).toBe(true);
    expect(result.total_records).toBe(10);
    expect(result.verified_records).toBe(10);
  });

  it('should DETECT tampering at record #5 when payload is altered', () => {
    const logger = new AuditLogger(testAuditPath);

    for (let i = 1; i <= 10; i++) {
      const prop = createDummyProposal(i);
      logger.append(prop, createDummyPolicyResult(prop));
    }

    // Tamper line #5 (index 4)
    const lines = fs.readFileSync(testAuditPath, 'utf-8').trim().split('\n');
    const record5 = JSON.parse(lines[4]!);
    record5.proposal.amount_paise = 99999999; // Alter amount!
    lines[4] = JSON.stringify(record5);
    fs.writeFileSync(testAuditPath, lines.join('\n') + '\n');

    const result = verifyAuditIntegrity(testAuditPath);
    expect(result.valid).toBe(false);
    expect(result.verified_records).toBe(4);
    expect(result.tampered_at?.sequence).toBe(5);
  });

  it('should DETECT tampering when a record is deleted', () => {
    const logger = new AuditLogger(testAuditPath);

    for (let i = 1; i <= 5; i++) {
      const prop = createDummyProposal(i);
      logger.append(prop, createDummyPolicyResult(prop));
    }

    // Delete record #3 (index 2)
    const lines = fs.readFileSync(testAuditPath, 'utf-8').trim().split('\n');
    lines.splice(2, 1);
    fs.writeFileSync(testAuditPath, lines.join('\n') + '\n');

    const result = verifyAuditIntegrity(testAuditPath);
    expect(result.valid).toBe(false);
    expect(result.verified_records).toBe(2);
  });
});
