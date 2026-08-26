import { ExecutionResult, PolicyResult } from '../shared/types';
import { IExecutionGateway } from '../interfaces/gateway';
import { generateIdempotencyKey } from './idempotency';
import { RazorpayClient } from './razorpay-client';
import { SimulatedGateway } from './simulated-gateway';

export class RazorpayGateway implements IExecutionGateway {
  private liveLinksCreated = 0;
  private usedKeys = new Set<string>();
  private simulatedFallback: IExecutionGateway;

  constructor(
    private client: RazorpayClient,
    private maxLiveLinks: number = 10,
    simulatedFallback?: IExecutionGateway
  ) {
    this.simulatedFallback = simulatedFallback || new SimulatedGateway();
  }

  async execute(policyResult: PolicyResult): Promise<ExecutionResult> {
    if (policyResult.verdict !== 'APPROVED') {
      throw new Error('Cannot execute BLOCKED proposal');
    }

    const proposal = policyResult.proposal;
    const key = generateIdempotencyKey(proposal);

    // GUARD: Duplicate check
    if (this.usedKeys.has(key)) {
      return {
        mode: 'live',
        idempotency_key: key,
        error: 'duplicate_prevented',
      };
    }
    this.usedKeys.add(key);

    // GUARD: Live link budget cap check (auto fallback to simulation)
    if (this.liveLinksCreated >= this.maxLiveLinks) {
      console.warn(
        `[RazorpayGateway] Live link cap reached (${this.maxLiveLinks}), safely delegating to simulated fallback.`
      );
      return this.simulatedFallback.execute(policyResult);
    }

    // LIVE EXECUTION via Razorpay APIs
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
      const expireBy =
        Math.floor(Date.now() / 1000) + proposal.expiry_hours * 3600;
      const callbackBaseUrl =
        process.env.CALLBACK_BASE_URL || 'http://localhost:3001';

      const refId = `ap_${key.replace('autopilot_', '')}_${Date.now().toString(
        36
      )}`.slice(0, 40);

      const link = await this.client.createPaymentLink({
        amountPaise: discountedAmountPaise,
        description: `Recovery offer for ${proposal.customer_id}`,
        referenceId: refId,
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
      const errMsg =
        err?.error?.description ||
        err?.message ||
        (typeof err === 'string' ? err : 'Unknown execution error');
      console.error('[RazorpayGateway Error]', errMsg);
      return {
        mode: 'live',
        idempotency_key: key,
        error: errMsg,
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
    this.simulatedFallback.resetUsedKeys?.();
  }
}
