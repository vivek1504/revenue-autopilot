import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/api/dependencies';
import { PolicyEngine } from '../src/policy/engine';
import { DEFAULT_MERCHANT_POLICY } from '../src/policy/config';
import { AgentProposal } from '../src/shared/types';

describe('PolicyEngine Deterministic Rules', () => {
  let policyEngine: PolicyEngine;

  beforeAll(async () => {
    policyEngine = new PolicyEngine(DEFAULT_MERCHANT_POLICY, prisma);

    // Clean up test data
    await prisma.recoveryOffer.deleteMany({ where: { customer_id: { in: ['cust_001', 'cust_999'] } } });
    await prisma.recoveryOpportunity.deleteMany({ where: { customer_id: { in: ['cust_001', 'cust_999'] } } });
    await prisma.cart.deleteMany({ where: { customer_id: { in: ['cust_001', 'cust_999'] } } });
    await prisma.order.deleteMany({ where: { customer_id: { in: ['cust_001', 'cust_999'] } } });
    await prisma.customer.deleteMany({ where: { id: { in: ['cust_001', 'cust_999'] } } });

    // Seed test customer
    await prisma.customer.create({
      data: {
        id: 'cust_001',
        name: 'Ananya Sharma',
        email: 'ananya@example.com',
        tier: 'standard',
        lifetime_spend_paise: 2200000,
        total_orders: 3,
        created_at: new Date(),
      },
    });

    // Seed test cart for cust_001
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);
    await prisma.cart.create({
      data: {
        id: 'cart_001',
        customer_id: 'cust_001',
        items: [] as any,
        total_paise: 850000,
        created_at: twoHoursAgo,
        last_activity: twoHoursAgo,
        status: 'abandoned',
      },
    });
  });

  it('should APPROVE a valid proposal within merchant policy limits', async () => {
    const validProposal: AgentProposal = {
      customer_id: 'cust_001',
      action: 'discounted_payment_link',
      amount_paise: 850000, // ₹8,500 (under ₹10,000 limit)
      discount_percent: 5,   // 5% (under 15% limit)
      expiry_hours: 24,
      reason: 'Abandoned cart 2h ago, lifetime spend ₹22,000.',
      opportunity_type: 'abandoned_checkout',
      evidence: {
        cart_value_paise: 850000,
        lifetime_spend_paise: 2200000,
        cart_abandoned_hours_ago: 2,
      },
    };

    const result = await policyEngine.evaluate(validProposal);
    expect(result.verdict).toBe('APPROVED');
    expect(result.violations).toHaveLength(0);
  });

  it('should BLOCK proposals exceeding the max automated transaction limit', async () => {
    const overLimitProposal: AgentProposal = {
      customer_id: 'cust_001',
      action: 'discounted_payment_link',
      amount_paise: 15000000, // ₹1,50,000 (exceeds ₹1,00,000 hard ceiling)
      discount_percent: 10,
      expiry_hours: 24,
      reason: 'Extrapolated high purchase intent proposal.',
      opportunity_type: 'abandoned_checkout',
      evidence: {
        cart_value_paise: 15000000,
        lifetime_spend_paise: 2200000,
      },
    };

    const result = await policyEngine.evaluate(overLimitProposal);
    expect(result.verdict).toBe('BLOCKED');
    expect(result.violations.some((v) => v.rule === 'amount_limit')).toBe(true);
  });

  it('should BLOCK proposals exceeding max discount percentage limit', async () => {
    const excessiveDiscountProposal: AgentProposal = {
      customer_id: 'cust_001',
      action: 'discounted_payment_link',
      amount_paise: 850000,
      discount_percent: 40, // 40% (exceeds 15% max!)
      expiry_hours: 24,
      reason: 'Aggressive recovery offer.',
      opportunity_type: 'abandoned_checkout',
      evidence: {
        cart_value_paise: 850000,
        lifetime_spend_paise: 2200000,
      },
    };

    const result = await policyEngine.evaluate(excessiveDiscountProposal);
    expect(result.verdict).toBe('BLOCKED');
    expect(result.violations.some((v) => v.rule === 'discount_limit')).toBe(true);
  });

  it('should BLOCK proposals referencing non-existent customer_id', async () => {
    const ghostCustomerProposal: AgentProposal = {
      customer_id: 'cust_999', // Ghost customer!
      action: 'discounted_payment_link',
      amount_paise: 500000,
      discount_percent: 5,
      expiry_hours: 24,
      reason: 'Hallucinated customer profile.',
      opportunity_type: 'abandoned_checkout',
      evidence: {
        cart_value_paise: 500000,
      },
    };

    const result = await policyEngine.evaluate(ghostCustomerProposal);
    expect(result.verdict).toBe('BLOCKED');
    expect(result.violations.some((v) => v.rule === 'customer_exists')).toBe(true);
  });

  it('should BLOCK duplicate active recovery offers for same customer', async () => {
    // Insert an active recovery offer for cust_001
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 3600 * 1000);
    await prisma.recoveryOffer.create({
      data: {
        id: 'offer_001',
        customer_id: 'cust_001',
        action_type: 'discounted_payment_link',
        amount_paise: 850000,
        discount_percent: 5,
        status: 'PENDING',
        created_at: now,
        expires_at: expiresAt,
      },
    });

    const duplicateProposal: AgentProposal = {
      customer_id: 'cust_001',
      action: 'discounted_payment_link',
      amount_paise: 850000,
      discount_percent: 5,
      expiry_hours: 24,
      reason: 'Duplicate checkout recovery prompt.',
      opportunity_type: 'abandoned_checkout',
      evidence: {
        cart_value_paise: 850000,
        lifetime_spend_paise: 2200000,
      },
    };

    const result = await policyEngine.evaluate(duplicateProposal);
    expect(result.verdict).toBe('BLOCKED');
    expect(result.violations.some((v) => v.rule === 'duplicate_offer')).toBe(true);
  });

  it('should BLOCK proposals with hallucinated evidence numbers', async () => {
    const hallucinatedEvidenceProposal: AgentProposal = {
      customer_id: 'cust_001',
      action: 'discounted_payment_link',
      amount_paise: 850000,
      discount_percent: 5,
      expiry_hours: 24,
      reason: 'Inconsistent evidence metrics.',
      opportunity_type: 'abandoned_checkout',
      evidence: {
        lifetime_spend_paise: 9999999, // Hallucinated lifetime spend! Actual is 2200000
      },
    };

    // Remove active offer so duplicate_offer doesn't trigger
    await prisma.recoveryOffer.deleteMany({ where: { customer_id: 'cust_001' } });

    const result = await policyEngine.evaluate(hallucinatedEvidenceProposal);
    expect(result.verdict).toBe('BLOCKED');
    expect(result.violations.some((v) => v.rule === 'evidence_consistent')).toBe(true);
  });

  it('should BLOCK proposals with multiple policy violations', async () => {
    const multiViolationProposal: AgentProposal = {
      customer_id: 'cust_001',
      action: 'discounted_payment_link',
      amount_paise: 5000000, // ₹50,000 (exceeds cap)
      discount_percent: 50,   // 50% (exceeds 15% limit)
      expiry_hours: 200,      // 200h (exceeds 72h limit)
      reason: 'Excessive recovery offer with invalid terms.',
      opportunity_type: 'abandoned_checkout',
      evidence: {
        cart_value_paise: 850000,
      },
    };

    const result = await policyEngine.evaluate(multiViolationProposal);
    expect(result.verdict).toBe('BLOCKED');
    expect(result.violations.length).toBeGreaterThanOrEqual(3);
  });
});
