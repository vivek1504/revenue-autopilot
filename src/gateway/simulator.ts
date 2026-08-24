import crypto from 'crypto';
import { AgentProposal, ExecutionResult } from '../shared/types';

export class ActionSimulator {
  simulate(proposal: AgentProposal, idempotencyKey: string): ExecutionResult {
    const uuidSeed = crypto.randomUUID().slice(0, 8);
    return {
      mode: 'simulated',
      razorpay_order_id: `sim_order_${uuidSeed}`,
      razorpay_payment_link_id: `sim_plink_${uuidSeed}`,
      razorpay_short_url: `https://rzp.io/sim/${uuidSeed.slice(0, 6)}`,
      idempotency_key: idempotencyKey,
    };
  }
}
