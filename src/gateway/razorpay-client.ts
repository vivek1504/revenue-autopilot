import Razorpay from 'razorpay';
import crypto from 'crypto';

export interface CreateOrderParams {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}

export interface CreatePaymentLinkParams {
  amountPaise: number;
  description: string;
  referenceId: string;
  expireBy: number; // Unix timestamp in seconds
  notes?: Record<string, string>;
  callbackUrl?: string;
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export class RazorpayClient {
  private rzp: Razorpay;
  private webhookSecret: string;

  constructor(keyId: string, keySecret: string, webhookSecret: string) {
    this.rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    this.webhookSecret = webhookSecret;
  }

  async createOrder(params: CreateOrderParams): Promise<any> {
    return this.rzp.orders.create({
      amount: params.amountPaise,
      currency: 'INR',
      receipt: params.receipt,
      notes: params.notes,
    });
  }

  async createPaymentLink(params: CreatePaymentLinkParams): Promise<any> {
    const payload: any = {
      amount: params.amountPaise,
      currency: 'INR',
      description: params.description,
      reference_id: params.referenceId,
      expire_by: params.expireBy,
      notify: { sms: false, email: false },
      callback_url: params.callbackUrl,
      callback_method: 'get',
      notes: params.notes,
      customer: params.customer || {
        name: 'Customer',
        email: 'customer@example.com',
      },
    };

    return (this.rzp.paymentLink.create as any)(payload);
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    if (!this.webhookSecret || !signature) return false;
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(body)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}
