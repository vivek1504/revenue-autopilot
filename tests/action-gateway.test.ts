import { describe, expect, it, beforeEach } from 'vitest';
import { ActionGateway } from '../src/gateway/action-gateway';
import { ActionSimulator } from '../src/gateway/simulator';
import { RazorpayClient } from '../src/gateway/razorpay-client';
import { PolicyResult } from '../src/shared/types';

describe('ActionGateway Execution & Idempotency', () => {
  let rzpClient: RazorpayClient;
  let simulator: ActionSimulator;
  let gateway: ActionGateway;

  const validPolicyResult: PolicyResult = {
    verdict: 'APPROVED',
    proposal: {
      customer_id: 'cust_001',
      action: 'discounted_payment_link',
      amount_paise: 500000,
      discount_percent: 10,
      expiry_hours: 24,
      reason: 'Valid recovery offer for testing gateway',
      opportunity_type: 'abandoned_checkout',
      evidence: { cart_value_paise: 500000 },
    },
    violations: [],
    checked_at: new Date().toISOString(),
  };

  const blockedPolicyResult: PolicyResult = {
    verdict: 'BLOCKED',
    proposal: {
      customer_id: 'cust_001',
      action: 'discounted_payment_link',
      amount_paise: 5000000,
      discount_percent: 50,
      expiry_hours: 24,
      reason: 'Adversarial offer',
      opportunity_type: 'abandoned_checkout',
      evidence: {},
    },
    violations: [{ rule: 'amount_limit', message: 'Exceeds limit', expected: 1000000, actual: 5000000 }],
    checked_at: new Date().toISOString(),
  };

  beforeEach(() => {
    rzpClient = new RazorpayClient('dummy_key', 'dummy_secret', 'dummy_webhook_secret');
    simulator = new ActionSimulator();
    gateway = new ActionGateway(rzpClient, simulator, 2, 'simulated');
  });

  it('should execute approved proposals in simulated mode', async () => {
    const result = await gateway.execute(validPolicyResult, 'simulated');
    expect(result.mode).toBe('simulated');
    expect(result.razorpay_payment_link_id).toBeDefined();
    expect(result.razorpay_payment_link_id).toContain('sim_plink_');
    expect(result.idempotency_key).toContain('autopilot_cust_001_');
  });

  it('should THROW an error when attempting to execute a BLOCKED proposal', async () => {
    await expect(gateway.execute(blockedPolicyResult)).rejects.toThrow('Cannot execute BLOCKED proposal');
  });

  it('should prevent duplicate execution using idempotency keys', async () => {
    const firstResult = await gateway.execute(validPolicyResult, 'simulated');
    expect(firstResult.error).toBeUndefined();

    // Second execution with same proposal & date should trigger duplicate protection
    const secondResult = await gateway.execute(validPolicyResult, 'simulated');
    expect(secondResult.error).toBe('duplicate_prevented');
  });

  it('should fall back to simulated mode when maxLiveLinks cap is reached', async () => {
    const capGateway = new ActionGateway(rzpClient, simulator, 0, 'live'); // 0 max live links

    const result = await capGateway.execute(validPolicyResult, 'live');
    expect(result.mode).toBe('simulated');
    expect(result.razorpay_payment_link_id).toContain('sim_plink_');
  });
});
