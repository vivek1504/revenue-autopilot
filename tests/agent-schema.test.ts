import { describe, expect, it } from 'vitest';
import { AgentProposalSchema } from '../src/agent/schemas';
import { AgentProposal } from '../src/shared/types';

describe('AgentProposalSchema Zod Enforcement', () => {
  it('should pass for a valid schema-conforming proposal', () => {
    const validProposal: AgentProposal = {
      customer_id: 'cust_042',
      action: 'discounted_payment_link',
      amount_paise: 719900,
      discount_percent: 10,
      expiry_hours: 24,
      reason: 'abandoned checkout 3h ago, no prior recovery attempt',
      opportunity_type: 'abandoned_checkout',
      evidence: {
        cart_value_paise: 799900,
        lifetime_spend_paise: 2200000,
        cart_abandoned_hours_ago: 3,
      },
    };

    const result = AgentProposalSchema.safeParse(validProposal);
    expect(result.success).toBe(true);
  });

  it('should reject malformed customer_id format', () => {
    const invalidProposal = {
      customer_id: 'invalid_customer_format',
      action: 'discounted_payment_link',
      amount_paise: 50000,
      discount_percent: 5,
      expiry_hours: 24,
      reason: 'Valid justification length here',
      opportunity_type: 'abandoned_checkout',
      evidence: {},
    };

    const result = AgentProposalSchema.safeParse(invalidProposal);
    expect(result.success).toBe(false);
  });

  it('should reject out-of-range discount_percent (>100)', () => {
    const invalidProposal = {
      customer_id: 'cust_001',
      action: 'discounted_payment_link',
      amount_paise: 50000,
      discount_percent: 150, // invalid!
      expiry_hours: 24,
      reason: 'Valid justification length text',
      opportunity_type: 'abandoned_checkout',
      evidence: {},
    };

    const result = AgentProposalSchema.safeParse(invalidProposal);
    expect(result.success).toBe(false);
  });

  it('should reject invalid action enum value', () => {
    const invalidProposal = {
      customer_id: 'cust_001',
      action: 'unauthorized_money_transfer', // invalid enum!
      amount_paise: 50000,
      discount_percent: 5,
      expiry_hours: 24,
      reason: 'Valid justification text here',
      opportunity_type: 'abandoned_checkout',
      evidence: {},
    };

    const result = AgentProposalSchema.safeParse(invalidProposal);
    expect(result.success).toBe(false);
  });
});
