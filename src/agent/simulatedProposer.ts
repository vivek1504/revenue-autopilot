import { AgentProposal } from '../shared/types';
import { CustomerOpportunity } from './detector';
import { IProposer, ProposalWithReasoning } from '../interfaces/proposer';

export class HeuristicProposer implements IProposer {
  async propose(opportunity: CustomerOpportunity): Promise<ProposalWithReasoning> {
    const t0 = performance.now();
    const proposal = this.generateProposal(opportunity);
    const latency_ms = Math.round((performance.now() - t0) * 100) / 100;

    return {
      proposal,
      reasoning: {
        model: 'deterministic_heuristic_fallback',
        latency_ms,
        used_fallback: true,
        fallback_reason: 'simulated_mode_active',
      },
    };
  }

  async proposeBatch(
    opportunities: CustomerOpportunity[],
    onProposal?: (item: ProposalWithReasoning, index: number) => void
  ): Promise<ProposalWithReasoning[]> {
    const proposals: ProposalWithReasoning[] = [];
    for (let i = 0; i < opportunities.length; i++) {
      const opp = opportunities[i]!;
      const result = await this.propose(opp);
      proposals.push(result);
      if (onProposal) {
        onProposal(result, i);
      }
    }
    return proposals;
  }

  public generateProposal(opportunity: CustomerOpportunity): AgentProposal {
    const { customer, opportunityType, cart, failedOrders, completedOrders } = opportunity;
    const customerId = customer.id;

    if (opportunityType === 'abandoned_checkout' && cart) {
      const discountPercent = cart.total_paise > 500000 ? 5 : 10;
      const conf = customer.tier === 'vip' ? 0.96 : 0.93;
      return {
        customer_id: customerId,
        action: 'discounted_payment_link',
        amount_paise: cart.total_paise,
        discount_percent: discountPercent,
        expiry_hours: 24,
        confidence_score: conf,
        reason: `Abandoned cart with value ₹${cart.total_paise / 100}. Proposing ${discountPercent}% discount incentive.`,
        opportunity_type: 'abandoned_checkout',
        evidence: {
          cart_value_paise: cart.total_paise,
          lifetime_spend_paise: customer.lifetime_spend_paise,
          cart_abandoned_hours_ago: 6,
        },
      };
    }

    if (opportunityType === 'failed_payment' && failedOrders.length > 0) {
      const failedOrder = failedOrders[0]!;
      return {
        customer_id: customerId,
        action: 'retry_payment_link',
        amount_paise: failedOrder.total_paise,
        discount_percent: 0,
        expiry_hours: 48,
        confidence_score: 0.94,
        reason: `Payment failed for order ${failedOrder.id} due to ${
          failedOrder.failure_reason || 'bank error'
        }. Proposing retry link.`,
        opportunity_type: 'failed_payment',
        evidence: {
          failed_payment_count: failedOrders.length,
          lifetime_spend_paise: customer.lifetime_spend_paise,
        },
      };
    }

    if (opportunityType === 'upsell') {
      const baseAmount =
        completedOrders.length > 0 ? completedOrders[0]!.total_paise * 1.3 : 499900;
      return {
        customer_id: customerId,
        action: 'upsell_payment_link',
        amount_paise: Math.round(baseAmount),
        discount_percent: 5,
        expiry_hours: 72,
        confidence_score: 0.88,
        reason: `High value tier ${customer.tier} customer with ${customer.total_orders} past orders. Proposing targeted upsell.`,
        opportunity_type: 'upsell',
        evidence: {
          lifetime_spend_paise: customer.lifetime_spend_paise,
          last_purchase_days_ago: 10,
        },
      };
    }

    // Default re-engagement offer
    return {
      customer_id: customerId,
      action: 'discounted_payment_link',
      amount_paise: 249900,
      discount_percent: 10,
      expiry_hours: 72,
      confidence_score: 0.82,
      reason: `Customer inactive for over 30 days. Proposing re-engagement offer with 10% discount.`,
      opportunity_type: 're_engagement',
      evidence: {
        lifetime_spend_paise: customer.lifetime_spend_paise,
        last_purchase_days_ago: 45,
      },
    };
  }
}
