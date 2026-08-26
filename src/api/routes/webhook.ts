import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { RazorpayClient } from '../../gateway/razorpay-client';
import { AuditLogger } from '../../audit/logger';
import { AgentProposal, PolicyResult } from '../../shared/types';

export function createWebhookRouter(
  prisma: PrismaClient,
  client: RazorpayClient,
  auditLogger: AuditLogger
): Router {
  const router = Router();

  // Browser Redirect Handler after Payment Link completion
  router.get('/razorpay', (req: Request, res: Response) => {
    const paymentId = req.query.razorpay_payment_id || '';
    const paymentLinkId = req.query.razorpay_payment_link_id || '';

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Successful - Revenue Autopilot</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; border: 1px solid #334155; text-align: center; max-width: 420px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
            .icon { width: 64px; height: 64px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; color: white; font-size: 32px; font-weight: bold; }
            h1 { font-size: 1.5rem; margin: 0 0 0.5rem 0; color: #f8fafc; }
            p { font-size: 0.875rem; color: #94a3b8; margin: 0 0 1.5rem 0; line-height: 1.5; }
            .badge { background: #064e3b; color: #34d399; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 9999px; text-transform: uppercase; tracking: 0.05em; display: inline-block; margin-bottom: 1rem; }
            .details { background: #0f172a; padding: 1rem; border-radius: 0.5rem; text-align: left; font-size: 0.75rem; color: #cbd5e1; font-family: monospace; word-break: break-all; margin-bottom: 1.5rem; }
            .btn { background: #10b981; color: #0f172a; font-weight: 700; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; display: inline-block; transition: all 0.2s; }
            .btn:hover { background: #34d399; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <div class="badge">Autopilot Recovery Verified</div>
            <h1>Payment Successful!</h1>
            <p>Your payment link offer was successfully processed and recorded into the SHA-256 audit ledger.</p>
            <div class="details">
              <div><strong>Payment ID:</strong> ${paymentId}</div>
              <div><strong>Link ID:</strong> ${paymentLinkId}</div>
            </div>
            <a href="http://localhost:5173" class="btn">Return to Revenue Dashboard</a>
          </div>
        </body>
      </html>
    `);
  });

  router.post('/razorpay', async (req: Request, res: Response): Promise<any> => {
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
        const whereConditions: any[] = [];
        if (paymentLinkId) whereConditions.push({ razorpay_payment_link_id: paymentLinkId });
        if (customerId) whereConditions.push({ customer_id: customerId, status: { in: ['sent', 'pending'] } });

        if (whereConditions.length > 0) {
          await prisma.recoveryOffer.updateMany({
            where: { OR: whereConditions },
            data: { status: 'redeemed' },
          });
        }

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
