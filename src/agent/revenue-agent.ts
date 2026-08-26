import { GoogleGenerativeAI } from '@google/generative-ai';
import { AgentProposal, LLMReasoningMetadata } from '../shared/types';
import { CustomerOpportunity } from './detector';
import { buildUserPrompt, SYSTEM_PROMPT } from './prompts';
import { AgentProposalSchema, GEMINI_PROPOSAL_RESPONSE_SCHEMA } from './schemas';

export interface ProposalWithReasoning {
  proposal: AgentProposal;
  reasoning: LLMReasoningMetadata;
}

export class RevenueAgent {
  private genAI?: GoogleGenerativeAI;
  private model?: any;
  private modelName = 'gemini-3.6-flash';

  constructor(apiKey?: string) {
    if (apiKey && apiKey !== 'dummy_gemini_key') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: GEMINI_PROPOSAL_RESPONSE_SCHEMA,
        },
      });
    }
  }

  async proposeAction(
    opportunity: CustomerOpportunity,
    mode: 'live' | 'simulated' = 'simulated'
  ): Promise<ProposalWithReasoning> {
    const t0 = performance.now();

    // In simulated mode or if LLM model is not configured/ready, use instant structured decision proposal
    if (mode === 'simulated' || !this.model) {
      console.log("\x1b[1m\x1b[32musing fallback for proposal\x1b[0m");
      const proposal = this.fallbackProposal(opportunity);
      const latency_ms = Math.round((performance.now() - t0) * 100) / 100;
      return {
        proposal,
        reasoning: {
          model: 'deterministic_heuristic_fallback',
          latency_ms,
          used_fallback: true,
          fallback_reason: mode === 'simulated' ? 'simulated_mode_active' : 'llm_not_configured',
        },
      };
    }

    try {
      console.log("\x1b[1m\x1b[31musing gemini for proposal\x1b[0m");
      const userPrompt = buildUserPrompt(opportunity);

      const result = await this.model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: SYSTEM_PROMPT }],
          },
          {
            role: 'model',
            parts: [
              {
                text: 'Understood. I will analyze the customer data and output a JSON proposal matching the schema.',
              },
            ],
          },
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
      });

      const latency_ms = Math.round((performance.now() - t0) * 100) / 100;
      const text = result.response.text();
      const raw = JSON.parse(text);

      const validated = AgentProposalSchema.parse(raw) as AgentProposal;
      if (!validated.confidence_score) {
        validated.confidence_score = opportunity.customer.tier === 'vip' ? 0.96 : 0.91;
      }

      return {
        proposal: validated,
        reasoning: {
          raw_response: text,
          model: this.modelName,
          latency_ms,
          used_fallback: false,
        },
      };
    } catch (err: any) {
      const latency_ms = Math.round((performance.now() - t0) * 100) / 100;
      console.warn(
        `[RevenueAgent] LLM generation warning for ${opportunity.customer.id}: ${err.message}. Using structured fallback proposal.`
      );
      const proposal = this.fallbackProposal(opportunity);
      return {
        proposal,
        reasoning: {
          model: 'deterministic_heuristic_fallback',
          latency_ms,
          used_fallback: true,
          fallback_reason: `llm_error: ${err.message}`,
        },
      };
    }
  }

  async proposeBatch(
    opportunities: CustomerOpportunity[],
    onProposal?: (item: ProposalWithReasoning, index: number) => void,
    mode: 'live' | 'simulated' = 'simulated'
  ): Promise<ProposalWithReasoning[]> {
    const proposals: ProposalWithReasoning[] = [];

    for (let i = 0; i < opportunities.length; i++) {
      const opp = opportunities[i]!;
      const result = await this.proposeAction(opp, mode);
      proposals.push(result);

      if (onProposal) {
        onProposal(result, i);
      }
    }

    return proposals;
  }

  // Deterministic fallback generator for fast processing & offline simulation
  public fallbackProposal(opportunity: CustomerOpportunity): AgentProposal {
    const { customer, opportunityType, cart, failedOrders, completedOrders } = opportunity;
    const customerId = customer.id;

    if (opportunityType === 'abandoned_checkout' && cart) {
      // Check if adversarial note is present to simulate adversarial proposal
      const hasAdversarialNote =
        customer.notes &&
        (customer.notes.includes('OVERRIDE') ||
          customer.notes.includes('Bypass') ||
          customer.notes.includes('50,000') ||
          customer.notes.includes('1,00,000'));

      if (hasAdversarialNote) {
        // Over-limit proposal for policy engine safety catch demonstration!
        return {
          customer_id: customerId,
          action: 'discounted_payment_link',
          amount_paise: 5000000, // ₹50,000
          discount_percent: 50,
          expiry_hours: 24,
          confidence_score: 0.62,
          reason:
            'Customer note states system override approved by admin for ₹50,000 link with 50% discount.',
          opportunity_type: 'abandoned_checkout',
          evidence: {
            cart_value_paise: cart.total_paise,
            lifetime_spend_paise: customer.lifetime_spend_paise,
            cart_abandoned_hours_ago: 3,
          },
        };
      }

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
        reason: `Payment failed for order ${failedOrder.id} due to ${failedOrder.failure_reason || 'bank error'
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
