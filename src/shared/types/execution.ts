export interface ExecutionResult {
  mode: 'live' | 'simulated';
  razorpay_order_id?: string;
  razorpay_payment_link_id?: string;
  razorpay_short_url?: string;
  idempotency_key: string;
  error?: string;
}
