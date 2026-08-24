import { ExecutionResult, PolicyResult } from '../shared/types';
import { generateIdempotencyKey } from './idempotency';
import { RazorpayClient } from './razorpay-client';
import { ActionSimulator } from './simulator';

export class ActionGateway {
  private liveLinksCreated = 0;
  private usedKeys = new Set<string>();

  constructor(
    private client: RazorpayClient,
    private simulator: ActionSimulator,
    private maxLiveLinks: number = 10,
    private defaultMode: 'live' | 'simulated' = 'simulated'
  ) {}

  async execute(
    policyResult: PolicyResult,
    mode?: 'live' | 'simulated'
  ): Promise<ExecutionResult> {
    // GUARD: Only approved actions
    if (policyResult.verdict !== 'APPROVED') {
      throw new Error('Cannot execute BLOCKED proposal');
    }

    const proposal = policyResult.proposal;
    const key = generateIdempotencyKey(proposal);

    // GUARD: Duplicate check
    if (this.usedKeys.has(key)) {
      return {
        mode: 'simulated',
        idempotency_key: key,
        error: 'duplicate_prevented',
      };
    }
    this.usedKeys.add(key);

    const effectiveMode = mode || this.defaultMode;

    // GUARD: Live link cap check
    if (effectiveMode === 'live' && this.liveLinksCreated >= this.maxLiveLinks) {
      console.warn(
        `[ActionGateway] Live link cap reached (${this.maxLiveLinks}), falling back to simulated mode.`
      );
      return this.simulator.simulate(proposal, key);
    }

    if (effectiveMode === 'simulated') {
      return this.simulator.simulate(proposal, key);
    }

    // LIVE EXECUTION
    try {
      const discountedAmountPaise = this.applyDiscount(
        proposal.amount_paise,
        proposal.discount_percent
      );

      // 1. Create Order (represents intent)
      const order = await this.client.createOrder({
        amountPaise: discountedAmountPaise,
        receipt: `autopilot_${proposal.customer_id}_${Date.now()}`,
        notes: {
          customer_id: proposal.customer_id,
          action: proposal.action,
          original_amount: String(proposal.amount_paise),
          discount_percent: String(proposal.discount_percent),
          agent_reason: proposal.reason,
        },
      });

      // 2. Create Payment Link
      const expireBy = Math.floor(Date.now() / 1000) + proposal.expiry_hours * 3600;
      const callbackBaseUrl = process.env.CALLBACK_BASE_URL || 'http://localhost:3001';

      const link = await this.client.createPaymentLink({
        amountPaise: discountedAmountPaise,
        description: `Recovery offer for ${proposal.customer_id}`,
        referenceId: key,
        expireBy,
        notes: {
          order_id: order.id,
          customer_id: proposal.customer_id,
          autopilot: 'true',
        },
        callbackUrl: `${callbackBaseUrl}/api/webhook/razorpay`,
      });

      this.liveLinksCreated++;
      return {
        mode: 'live',
        razorpay_order_id: order.id,
        razorpay_payment_link_id: link.id,
        razorpay_short_url: link.short_url,
        idempotency_key: key,
      };
    } catch (err: any) {
      return {
        mode: 'live',
        idempotency_key: key,
        error: err instanceof Error ? err.message : 'Unknown execution error',
      };
    }
  }

  private applyDiscount(amountPaise: number, discountPercent: number): number {
    if (discountPercent <= 0) return amountPaise;
    return Math.round(amountPaise * (1 - discountPercent / 100));
  }

  public getLiveLinksCount(): number {
    return this.liveLinksCreated;
  }

  public resetUsedKeys(): void {
    this.usedKeys.clear();
    this.liveLinksCreated = 0;
  }
}
