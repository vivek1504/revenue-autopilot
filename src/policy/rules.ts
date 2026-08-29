import { PrismaClient } from '@prisma/client';
import { AgentProposal, PolicyViolation } from '../shared/types';
import { MerchantPolicy } from './config';

export interface RuleContext {
  proposal: AgentProposal;
  policy: MerchantPolicy;
  prisma: PrismaClient;
}

export type RuleCheck = (ctx: RuleContext) => Promise<PolicyViolation | null> | PolicyViolation | null;

const formatPaise = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

export const RULES: Record<string, RuleCheck> = {
  amount_limit: ({ proposal, policy }) => {
    if (proposal.amount_paise > policy.maxAutomatedTransactionPaise) {
      return {
        rule: 'amount_limit',
        message: `Proposed amount ${formatPaise(proposal.amount_paise)} exceeds maximum allowed transaction limit of ${formatPaise(policy.maxAutomatedTransactionPaise)}`,
        expected: policy.maxAutomatedTransactionPaise,
        actual: proposal.amount_paise,
      };
    }
    return null;
  },

  discount_limit: ({ proposal, policy }) => {
    if (proposal.discount_percent > policy.maxDiscountPercent) {
      return {
        rule: 'discount_limit',
        message: `Proposed discount ${proposal.discount_percent}% exceeds merchant limit of ${policy.maxDiscountPercent}%`,
        expected: policy.maxDiscountPercent,
        actual: proposal.discount_percent,
      };
    }
    return null;
  },

  customer_exists: async ({ proposal, prisma }) => {
    const customer = await prisma.customer.findUnique({
      where: { id: proposal.customer_id },
      select: { id: true },
    });
    if (!customer) {
      return {
        rule: 'customer_exists',
        message: `Customer '${proposal.customer_id}' does not exist in merchant database`,
        expected: 'existing customer_id',
        actual: proposal.customer_id,
      };
    }
    return null;
  },

  duplicate_offer: async ({ proposal, prisma }) => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.recoveryOffer.findFirst({
      where: {
        customer_id: proposal.customer_id,
        status: { in: ['PENDING', 'DISPATCHED'] },
        created_at: { gte: twentyFourHoursAgo },
      },
      select: { id: true, created_at: true },
    });

    if (existing) {
      return {
        rule: 'duplicate_offer',
        message: `Active recovery offer '${existing.id}' already exists for customer '${proposal.customer_id}' within 24 hours`,
        expected: '0 active offers in last 24h',
        actual: existing.id,
      };
    }
    return null;
  },

  expiry_range: ({ proposal, policy }) => {
    if (proposal.expiry_hours < policy.minExpiryHours || proposal.expiry_hours > policy.maxExpiryHours) {
      return {
        rule: 'expiry_range',
        message: `Proposed expiry ${proposal.expiry_hours}h is out of allowed range (${policy.minExpiryHours}h - ${policy.maxExpiryHours}h)`,
        expected: `${policy.minExpiryHours}-${policy.maxExpiryHours} hours`,
        actual: proposal.expiry_hours,
      };
    }
    return null;
  },

  action_allowed: ({ proposal, policy }) => {
    if (!policy.allowedActions.includes(proposal.action as any)) {
      return {
        rule: 'action_allowed',
        message: `Action '${proposal.action}' is not in allowed policy action types`,
        expected: policy.allowedActions.join(', '),
        actual: proposal.action,
      };
    }
    return null;
  },

  evidence_present: ({ proposal, policy }) => {
    if (!policy.requireEvidenceField) return null;

    const ev = proposal.evidence;
    const hasValues =
      ev &&
      (ev.cart_value_paise !== undefined ||
        ev.lifetime_spend_paise !== undefined ||
        ev.last_purchase_days_ago !== undefined ||
        ev.failed_payment_count !== undefined ||
        ev.cart_abandoned_hours_ago !== undefined);

    if (!hasValues) {
      return {
        rule: 'evidence_present',
        message: 'Agent proposal is missing required factual evidence metrics',
        expected: 'evidence metrics provided',
        actual: 'empty evidence',
      };
    }
    return null;
  },

  evidence_consistent: async ({ proposal, prisma }) => {
    const ev = proposal.evidence;
    if (!ev) return null;

    // Verify lifetime spend if provided
    if (ev.lifetime_spend_paise !== undefined) {
      const cust = await prisma.customer.findUnique({
        where: { id: proposal.customer_id },
        select: { lifetime_spend_paise: true },
      });

      if (cust && cust.lifetime_spend_paise !== ev.lifetime_spend_paise) {
        return {
          rule: 'evidence_consistent',
          message: `Evidence lifetime spend ${formatPaise(ev.lifetime_spend_paise)} does not match database record ${formatPaise(cust.lifetime_spend_paise)}`,
          expected: cust.lifetime_spend_paise,
          actual: ev.lifetime_spend_paise,
        };
      }
    }

    // Verify cart value if provided
    if (ev.cart_value_paise !== undefined && proposal.opportunity_type === 'abandoned_checkout') {
      const cart = await prisma.cart.findFirst({
        where: {
          customer_id: proposal.customer_id,
          status: 'abandoned',
        },
        select: { total_paise: true },
      });

      if (cart && cart.total_paise !== ev.cart_value_paise) {
        return {
          rule: 'evidence_consistent',
          message: `Evidence cart value ${formatPaise(ev.cart_value_paise)} does not match actual cart total ${formatPaise(cart.total_paise)}`,
          expected: cart.total_paise,
          actual: ev.cart_value_paise,
        };
      }
    }

    return null;
  },

  amount_positive: ({ proposal }) => {
    if (proposal.action !== 'payment_reminder' && proposal.amount_paise <= 0) {
      return {
        rule: 'amount_positive',
        message: `Action '${proposal.action}' requires a positive amount_paise`,
        expected: '> 0 paise',
        actual: proposal.amount_paise,
      };
    }
    return null;
  },

  discount_for_action: ({ proposal }) => {
    if (proposal.action === 'payment_reminder' || proposal.action === 'retry_payment_link') {
      if (proposal.discount_percent > 0) {
        return {
          rule: 'discount_for_action',
          message: `Action '${proposal.action}' cannot include a discount`,
          expected: 0,
          actual: proposal.discount_percent,
        };
      }
    }
    return null;
  },

  contact_frequency: async ({ proposal, prisma, policy }) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentOffersCount = await prisma.recoveryOffer.count({
      where: {
        customer_id: proposal.customer_id,
        created_at: { gte: sevenDaysAgo },
        status: { notIn: ['BLOCKED'] },
      },
    });

    if (recentOffersCount >= policy.maxContactsPerCustomer7Days) {
      return {
        rule: 'contact_frequency',
        message: `Customer reached max contact limit (${recentOffersCount}/${policy.maxContactsPerCustomer7Days} in 7 days). Escalation stopping rule triggered.`,
        expected: `< ${policy.maxContactsPerCustomer7Days} offers in 7d`,
        actual: `${recentOffersCount} offers`,
      };
    }
    return null;
  },

  human_escalation: ({ proposal, policy }) => {
    if (proposal.amount_paise > policy.humanEscalationThresholdPaise) {
      return {
        rule: 'human_escalation',
        message: `Proposed amount ${formatPaise(proposal.amount_paise)} exceeds human escalation threshold of ${formatPaise(policy.humanEscalationThresholdPaise)}. Requires manual manager approval.`,
        expected: `<= ${formatPaise(policy.humanEscalationThresholdPaise)}`,
        actual: proposal.amount_paise,
      };
    }
    return null;
  },

  confidence_threshold: ({ proposal, policy }) => {
    if (proposal.confidence_score !== undefined && proposal.confidence_score < policy.minConfidenceScore) {
      return {
        rule: 'confidence_threshold',
        message: `Agent confidence score ${(proposal.confidence_score * 100).toFixed(1)}% is below minimum safety threshold of ${(policy.minConfidenceScore * 100).toFixed(1)}%`,
        expected: `>= ${(policy.minConfidenceScore * 100).toFixed(1)}%`,
        actual: `${(proposal.confidence_score * 100).toFixed(1)}%`,
      };
    }
    return null;
  },
};
