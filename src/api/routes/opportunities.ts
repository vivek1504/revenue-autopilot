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

  router.post('/:id/resolve', async (req: Request, res: Response): Promise<any> => {
    const id = req.params.id as string;
    const { decision } = req.body;

    if (decision !== 'APPROVED' && decision !== 'REJECTED') {
      return res.status(400).json({ error: 'Invalid decision' });
    }

    const offer = await prisma.recoveryOffer.findUnique({ where: { id } });
    if (!offer || offer.status !== 'ESCALATED') {
      return res.status(404).json({ error: 'Offer not found or not escalated' });
    }

    if (decision === 'REJECTED') {
      await prisma.recoveryOffer.update({
        where: { id },
        data: { status: 'BLOCKED' },
      });
      return res.json({ status: 'resolved', decision: 'REJECTED' });
    }

    // decision === 'APPROVED'
    const { RazorpayGateway } = require('../../gateway/razorpay-gateway');
    const { SimulatedGateway } = require('../../gateway/simulated-gateway');
    const { rzpClient, auditLogger } = require('../dependencies');
    const { config } = require('../../shared/config');

    const mode = config.execution.defaultMode;
    const gateway = mode === 'live' 
        ? new RazorpayGateway(rzpClient, config.execution.maxLiveLinks) 
        : new SimulatedGateway();
    
    const policyResult = {
        verdict: 'APPROVED',
        proposal: {
            customer_id: offer.customer_id,
            action: offer.action_type,
            amount_paise: offer.amount_paise,
            discount_percent: offer.discount_percent,
            expiry_hours: 24,
            reason: offer.ai_reason || '',
            opportunity_type: offer.opportunity_type || 'abandoned_checkout',
            evidence: {}
        },
        violations: []
    };

    try {
        const execution = await gateway.execute(policyResult);
        if (execution.error && execution.error !== 'duplicate_prevented') {
            await prisma.recoveryOffer.update({
                where: { id },
                data: { status: 'EXECUTION_FAILED', execution_mode: execution.mode === 'live' ? 'LIVE' : 'SIMULATED' }
            });
            return res.status(500).json({ error: 'Gateway execution failed: ' + execution.error });
        }

        await prisma.recoveryOffer.update({
            where: { id },
            data: {
                status: 'DISPATCHED',
                execution_mode: execution.mode === 'live' ? 'LIVE' : 'SIMULATED',
                razorpay_payment_link_id: execution.razorpay_payment_link_id || null,
            }
        });

        if (offer.opportunity_id) {
            await prisma.recoveryOpportunity.update({
                where: { id: offer.opportunity_id },
                data: { status: 'PURSUING' }
            });
        }
        
        auditLogger.appendAction({
            proposal: policyResult.proposal,
            verdict: policyResult,
            execution
        });

        return res.json({ status: 'resolved', decision: 'APPROVED' });

    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
  });

  return router;
}
