import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { RazorpayClient } from '../../gateway/razorpay-client';
import { AuditLogger } from '../../audit/logger';
import { AgentProposal, PolicyResult } from '../../shared/types';

export function createWebhookRouter(
  db: Database.Database,
  client: RazorpayClient,
  auditLogger: AuditLogger
): Router {
  const router = Router();

  router.post('/razorpay', (req: Request, res: Response): any => {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    if (!signature || !client.verifyWebhookSignature(rawBody, signature)) {
      console.warn('⚠️ [Webhook] Invalid or missing Razorpay HMAC signature');
      return res.status(400).json({ status: 'error', message: 'Invalid signature' });
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const event = payload.event;
    console.log(`✅ [Webhook] Received verified Razorpay event: ${event}`);

    if (event === 'payment_link.paid' || event === 'payment.captured') {
      const paymentEntity = payload.payload?.payment_link?.entity || payload.payload?.payment?.entity;
      const paymentLinkId = paymentEntity?.id || paymentEntity?.payment_link_id;
      const notes = paymentEntity?.notes || {};
      const customerId = notes.customer_id;

      if (paymentLinkId || customerId) {
        // Update database offer status to 'redeemed'
        const stmt = db.prepare(`
          UPDATE recovery_offers 
          SET status = 'redeemed' 
          WHERE razorpay_payment_link_id = ? OR (customer_id = ? AND status IN ('sent', 'pending'))
        `);
        stmt.run(paymentLinkId, customerId);

        // Audit record for redeemed offer
        if (customerId) {
          const mockProposal: AgentProposal = {
            customer_id: customerId,
            action: 'discounted_payment_link',
            amount_paise: paymentEntity.amount || 0,
            discount_percent: 0,
            expiry_hours: 24,
            reason: `Webhook verified payment link redemption event: ${event}`,
            opportunity_type: 'abandoned_checkout',
            evidence: {},
          };

          const policyResult: PolicyResult = {
            verdict: 'APPROVED',
            proposal: mockProposal,
            violations: [],
            checked_at: new Date().toISOString(),
          };

          auditLogger.append(mockProposal, policyResult, {
            mode: 'live',
            razorpay_payment_link_id: paymentLinkId,
            idempotency_key: `webhook_redeemed_${paymentLinkId || Date.now()}`,
          });
        }
      }
    }

    return res.status(200).json({ status: 'ok', event });
  });

  return router;
}
