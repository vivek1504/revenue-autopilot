import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/api/dependencies';
import { PolicyEngine } from '../src/policy/engine';
import { DEFAULT_MERCHANT_POLICY } from '../src/policy/config';
import { AgentProposal } from '../src/shared/types';

describe('PolicyEngine Stopping Rules & Escalation Gates', () => {
  let policyEngine: PolicyEngine;

  beforeAll(async () => {
    policyEngine = new PolicyEngine(DEFAULT_MERCHANT_POLICY, prisma);

    // Clean up test data
    await prisma.recoveryOffer.deleteMany({ where: { customer_id: 'cust_stop_01' } });
    await prisma.recoveryOpportunity.deleteMany({ where: { customer_id: 'cust_stop_01' } });
    await prisma.cart.deleteMany({ where: { customer_id: 'cust_stop_01' } });
    await prisma.order.deleteMany({ where: { customer_id: 'cust_stop_01' } });
    await prisma.customer.deleteMany({ where: { id: 'cust_stop_01' } });

    // Seed test customer
    await prisma.customer.create({
      data: {
        id: 'cust_stop_01',
        name: 'Rohan Mehta',
        email: 'rohan@example.com',
        tier: 'premium',
        lifetime_spend_paise: 5000000,
        total_orders: 5,
        created_at: new Date(),
      },
    });
  });

  it('should APPROVE a proposal when compliant with all stopping & escalation rules', async () => {
    // Clear any offers
    await prisma.recoveryOffer.deleteMany({ where: { customer_id: 'cust_stop_01' } });

    const proposal: AgentProposal = {
      customer_id: 'cust_stop_01',
      action: 'discounted_payment_link',
      amount_paise: 500000, // ₹5,000 (well within limits)
      discount_percent: 5,
      expiry_hours: 24,
      confidence_score: 0.92,
      reason: 'Standard cart abandonment with high past LTV',
      opportunity_type: 'abandoned_checkout',
      evidence: {
        lifetime_spend_paise: 5000000,
      },
    };

    const result = await policyEngine.evaluate(proposal);
    expect(result.verdict).toBe('APPROVED');
    expect(result.violations).toHaveLength(0);
  });

  it('should BLOCK proposals when customer reached 7-day contact limit (Stopping Rule)', async () => {
    // Seed 3 existing recovery offers in the past 3 days
    await prisma.recoveryOffer.deleteMany({ where: { customer_id: 'cust_stop_01' } });

    const now = Date.now();
    for (let i = 1; i <= 3; i++) {
      const pastTime = new Date(now - i * 24 * 3600 * 1000);
      await prisma.recoveryOffer.create({
        data: {
          id: `off_past_${i}`,
          customer_id: 'cust_stop_01',
          action_type: 'discounted_payment_link',
          amount_paise: 200000,
          discount_percent: 5,
          status: 'EXPIRED',
          created_at: pastTime,
          expires_at: new Date(pastTime.getTime() + 24 * 3600 * 1000),
        },
      });
    }

    const proposal: AgentProposal = {
      customer_id: 'cust_stop_01',
      action: 'discounted_payment_link',
      amount_paise: 300000,
      discount_percent: 5,
      expiry_hours: 24,
      confidence_score: 0.88,
      reason: 'Another recovery attempt on customer already contacted 3 times',
      opportunity_type: 'abandoned_checkout',
      evidence: {
        lifetime_spend_paise: 5000000,
      },
    };

    const result = await policyEngine.evaluate(proposal);
    expect(result.verdict).toBe('BLOCKED');
    expect(result.violations.some((v) => v.rule === 'contact_frequency')).toBe(true);
  });

  it('should return ESCALATED when proposal exceeds high-value threshold but passes all other rules', async () => {
    // Clear past offers
    await prisma.recoveryOffer.deleteMany({ where: { customer_id: 'cust_stop_01' } });

    // Custom engine where automated cap is ₹50,000 but escalation threshold is ₹25,000
    const customEngine = new PolicyEngine(
      {
        ...DEFAULT_MERCHANT_POLICY,
        maxAutomatedTransactionPaise: 5000000,
        humanEscalationThresholdPaise: 2500000,
      },
      prisma
    );

    const highValueProposal: AgentProposal = {
      customer_id: 'cust_stop_01',
      action: 'discounted_payment_link',
      amount_paise: 3000000, // ₹30,000 (exceeds ₹25,000 threshold, but within ₹50,000 cap)
      discount_percent: 5,
      expiry_hours: 24,
      confidence_score: 0.95,
      reason: 'High-value enterprise tier order recovery',
      opportunity_type: 'abandoned_checkout',
      evidence: {
        lifetime_spend_paise: 5000000,
      },
    };

    const result = await customEngine.evaluate(highValueProposal);
    expect(result.verdict).toBe('ESCALATED');
    expect(result.violations.some((v) => v.rule === 'human_escalation')).toBe(true);
  });

  it('should return BLOCKED when proposal exceeds both automated limit and human review threshold', async () => {
    await prisma.recoveryOffer.deleteMany({ where: { customer_id: 'cust_stop_01' } });

    const overLimitProposal: AgentProposal = {
      customer_id: 'cust_stop_01',
      action: 'discounted_payment_link',
      amount_paise: 15000000, // ₹1,50,000 (exceeds ₹1,00,000 hard ceiling AND ₹25,000 escalation)
      discount_percent: 5,
      expiry_hours: 24,
      confidence_score: 0.95,
      reason: 'High-value enterprise tier order recovery',
      opportunity_type: 'abandoned_checkout',
      evidence: {
        lifetime_spend_paise: 5000000,
      },
    };

    const result = await policyEngine.evaluate(overLimitProposal);
    expect(result.verdict).toBe('BLOCKED');
    expect(result.violations.some((v) => v.rule === 'amount_limit')).toBe(true);
    expect(result.violations.some((v) => v.rule === 'human_escalation')).toBe(true);
  });

  it('should BLOCK proposals with low AI confidence score (<70%)', async () => {
    // Clear past offers
    await prisma.recoveryOffer.deleteMany({ where: { customer_id: 'cust_stop_01' } });

    const lowConfidenceProposal: AgentProposal = {
      customer_id: 'cust_stop_01',
      action: 'discounted_payment_link',
      amount_paise: 400000,
      discount_percent: 5,
      expiry_hours: 24,
      confidence_score: 0.55, // 55% (< 70% threshold!)
      reason: 'Ambiguous user activity signal',
      opportunity_type: 'abandoned_checkout',
      evidence: {
        lifetime_spend_paise: 5000000,
      },
    };

    const result = await policyEngine.evaluate(lowConfidenceProposal);
    expect(result.verdict).toBe('BLOCKED');
    expect(result.violations.some((v) => v.rule === 'confidence_threshold')).toBe(true);
  });
});
