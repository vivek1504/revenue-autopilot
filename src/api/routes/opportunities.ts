import { Router, Request, Response } from 'express';
import { prisma } from '../dependencies';
import { ProcessedAction } from '../../shared/types';

export function createOpportunitiesRouter(): Router {
  const router = Router();

  router.get('/queue', async (req: Request, res: Response) => {
    try {
      const offers = await prisma.recoveryOffer.findMany({
        include: { customer: true },
        orderBy: { created_at: 'desc' },
        take: 100,
      });

      const items: ProcessedAction[] = offers.map((offer) => ({
        proposal: {
          customer_id: offer.customer_id,
          action: offer.action_type as any,
          amount_paise: offer.amount_paise,
          discount_percent: offer.discount_percent,
          expiry_hours: Math.max(1, Math.round((new Date(offer.expires_at).getTime() - new Date(offer.created_at).getTime()) / (3600 * 1000))),
          confidence_score: offer.ai_confidence_score ?? undefined,
          reason: offer.ai_reason || '',
          opportunity_type: (offer.opportunity_type as any) || 'abandoned_checkout',
          evidence: {},
        },
        verdict: {
          verdict: (offer.policy_verdict as any) || (offer.status === 'BLOCKED' ? 'BLOCKED' : offer.status === 'ESCALATED' ? 'ESCALATED' : 'APPROVED'),
          proposal: {
            customer_id: offer.customer_id,
            action: offer.action_type as any,
            amount_paise: offer.amount_paise,
            discount_percent: offer.discount_percent,
            expiry_hours: Math.max(1, Math.round((new Date(offer.expires_at).getTime() - new Date(offer.created_at).getTime()) / (3600 * 1000))),
            confidence_score: offer.ai_confidence_score ?? undefined,
            reason: offer.ai_reason || '',
            opportunity_type: (offer.opportunity_type as any) || 'abandoned_checkout',
            evidence: {},
          },
          violations: [],
          checked_at: offer.created_at.toISOString(),
        },
        execution: offer.razorpay_payment_link_id
          ? {
              mode: offer.execution_mode === 'LIVE' ? 'live' : 'simulated',
              razorpay_payment_link_id: offer.razorpay_payment_link_id,
              idempotency_key: offer.razorpay_payment_link_id || offer.id,
            }
          : undefined,
        customerName: offer.customer?.name || offer.customer_id,
        offerId: offer.id,
        offerStatus: offer.status,
      }));

      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
