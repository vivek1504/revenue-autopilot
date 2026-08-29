import fs from 'fs';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/api/dependencies';
import { runAutopilot } from '../src/autopilot/orchestrator';
import { verifyAuditIntegrity } from '../src/audit/verifier';

describe('End-to-End Pipeline Integration (Detect -> Reason -> Policy -> Execute -> Audit)', () => {
  const testAuditPath = path.join(process.cwd(), 'data', 'test-e2e-audit.jsonl');

  beforeAll(async () => {
    if (fs.existsSync(testAuditPath)) {
      fs.unlinkSync(testAuditPath);
    }

    // Clean up test customer data
    const testIds = ['cust_e2e_val', 'cust_e2e_excess', 'cust_e2e_adv'];
    await prisma.recoveryOffer.deleteMany({ where: { customer_id: { in: testIds } } });
    await prisma.recoveryOpportunity.deleteMany({ where: { customer_id: { in: testIds } } });
    await prisma.cart.deleteMany({ where: { customer_id: { in: testIds } } });
    await prisma.order.deleteMany({ where: { customer_id: { in: testIds } } });
    await prisma.customer.deleteMany({ where: { id: { in: testIds } } });

    // Seed 1 valid abandoned checkout customer
    await prisma.customer.create({
      data: {
        id: 'cust_e2e_val',
        name: 'Kavita Iyer',
        email: 'kavita@example.com',
        tier: 'standard',
        lifetime_spend_paise: 1500000,
        total_orders: 2,
        created_at: new Date(),
      },
    });

    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);
    await prisma.cart.create({
      data: {
        id: 'cart_e2e_val',
        customer_id: 'cust_e2e_val',
        items: [] as any,
        total_paise: 450000, // ₹4,500
        created_at: twoHoursAgo,
        last_activity: twoHoursAgo,
        status: 'abandoned',
      },
    });

    // Seed 1 policy-violating customer (excessive cart amount)
    await prisma.customer.create({
      data: {
        id: 'cust_e2e_excess',
        name: 'Excessive Cart User',
        email: 'excess@example.com',
        tier: 'standard',
        lifetime_spend_paise: 100000,
        total_orders: 1,
        created_at: new Date(),
      },
    });

    await prisma.cart.create({
      data: {
        id: 'cart_e2e_excess',
        customer_id: 'cust_e2e_excess',
        items: [] as any,
        total_paise: 15000000, // ₹1,50,000 (exceeds ₹1,00,000 hard ceiling)
        created_at: twoHoursAgo,
        last_activity: twoHoursAgo,
        status: 'abandoned',
      },
    });
  });

  afterAll(async () => {
    if (fs.existsSync(testAuditPath)) {
      fs.unlinkSync(testAuditPath);
    }
    const testIds = ['cust_e2e_val', 'cust_e2e_excess'];
    await prisma.recoveryOffer.deleteMany({ where: { customer_id: { in: testIds } } });
    await prisma.recoveryOpportunity.deleteMany({ where: { customer_id: { in: testIds } } });
    await prisma.cart.deleteMany({ where: { customer_id: { in: testIds } } });
    await prisma.order.deleteMany({ where: { customer_id: { in: testIds } } });
    await prisma.customer.deleteMany({ where: { id: { in: testIds } } });
  });

  it('should run full autopilot scan, gating unsafe actions and logging verified audit trail', async () => {
    const result = await runAutopilot({
      mode: 'simulated',
      customAuditPath: testAuditPath,
    });

    expect(result.total_opportunities).toBeGreaterThanOrEqual(2);
    expect(result.approved_count).toBeGreaterThanOrEqual(1);
    expect(result.blocked_count).toBeGreaterThanOrEqual(1);

    // Verify valid customer got approved
    const validResult = result.results.find((r) => r.proposal.customer_id === 'cust_e2e_val');
    expect(validResult).toBeDefined();
    expect(validResult?.verdict.verdict).toBe('APPROVED');
    expect(validResult?.execution?.mode).toBe('simulated');
    expect(validResult?.auditRecord?.record_hash).toHaveLength(64);

    // Verify policy violation was caught & blocked by policy engine
    const excessResult = result.results.find((r) => r.proposal.customer_id === 'cust_e2e_excess');
    expect(excessResult).toBeDefined();
    expect(excessResult?.verdict.verdict).toBe('BLOCKED');
    expect(excessResult?.verdict.violations.length).toBeGreaterThan(0);

    // Verify DB persistence of BLOCKED decision
    const blockedOpp = await prisma.recoveryOpportunity.findUnique({
      where: { idempotency_key: 'ABANDONED_CART:cart_e2e_excess' },
    });
    expect(blockedOpp?.status).toBe('BLOCKED');

    const blockedOffer = await prisma.recoveryOffer.findFirst({
      where: { customer_id: 'cust_e2e_excess' },
    });
    expect(blockedOffer?.status).toBe('BLOCKED');
    expect(blockedOffer?.policy_verdict).toBe('BLOCKED');

    // Verify the SHA-256 cryptographic audit chain is 100% valid
    const auditVerification = verifyAuditIntegrity(testAuditPath);
    expect(auditVerification.valid).toBe(true);
    expect(auditVerification.verified_records).toBe(result.total_opportunities);

    // Verify that running autopilot a 2nd time does NOT re-detect the blocked or pursuing opportunities
    const secondRun = await runAutopilot({
      mode: 'simulated',
      customAuditPath: testAuditPath,
    });
    const secondExcess = secondRun.results.find((r) => r.proposal.customer_id === 'cust_e2e_excess');
    expect(secondExcess).toBeUndefined();
  });
});
