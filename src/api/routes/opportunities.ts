import { Router, Request, Response } from 'express';
import { prisma, rzpClient, auditLogger } from '../dependencies';
import { ProcessedAction, PolicyResult, AgentProposal } from '../../shared/types';
import { RazorpayGateway } from '../../gateway/razorpay-gateway';
import { SimulatedGateway } from '../../gateway/simulated-gateway';
import { config } from '../../shared/config';

export function createOpportunitiesRouter(): Router {
  const router = Router();

  router.get('/queue', async (req: Request, res: Response) => {
    try {
      const offers = await prisma.recoveryOffer.findMany({
        include: { customer: true },
        orderBy: { created_at: 'desc' },
        take: 100,
      });

      const auditRecords = auditLogger.getRecords();

      const items: ProcessedAction[] = offers.map((offer) => {
        const matchingAudit = auditRecords
          .slice()
          .reverse()
          .find(
            (r) =>
              r.proposal?.customer_id === offer.customer_id &&
              (r.proposal?.opportunity_type === offer.opportunity_type ||
                r.proposal?.action === offer.action_type)
          );

        const violations =
          matchingAudit?.policy_result?.violations &&
          matchingAudit.policy_result.violations.length > 0
            ? matchingAudit.policy_result.violations
            : offer.status === 'BLOCKED'
            ? [
                {
                  rule: 'duplicate_offer',
                  message: `Active recovery offer already exists for customer '${offer.customer_id}' within 24 hours. Halted by safety guardrail to avoid duplicate outreach.`,
                  expected: '0 active offers in last 24h',
                  actual: '1 active offer',
                },
              ]
            : offer.status === 'ESCALATED'
            ? [
                {
                  rule: 'human_escalation',
                  message: `Proposed amount ₹${(
                    offer.amount_paise / 100
                  ).toLocaleString(
                    'en-IN'
                  )} exceeds human escalation threshold of ₹25,000. Requires manual manager approval.`,
                  expected: '<= ₹25,000',
                  actual: offer.amount_paise,
                },
              ]
            : [];

        return {
          proposal: {
            customer_id: offer.customer_id,
            action: offer.action_type as any,
            amount_paise: offer.amount_paise,
            discount_percent: offer.discount_percent,
            expiry_hours: Math.max(
              1,
              Math.round(
                (new Date(offer.expires_at).getTime() -
                  new Date(offer.created_at).getTime()) /
                  (3600 * 1000)
              )
            ),
            confidence_score: offer.ai_confidence_score ?? undefined,
            reason: offer.ai_reason || '',
            opportunity_type:
              (offer.opportunity_type as any) || 'abandoned_checkout',
            evidence: matchingAudit?.proposal?.evidence || {},
          },
          verdict: {
            verdict:
              (offer.policy_verdict as any) ||
              (offer.status === 'BLOCKED'
                ? 'BLOCKED'
                : offer.status === 'ESCALATED'
                ? 'ESCALATED'
                : 'APPROVED'),
            proposal: {
              customer_id: offer.customer_id,
              action: offer.action_type as any,
              amount_paise: offer.amount_paise,
              discount_percent: offer.discount_percent,
              expiry_hours: Math.max(
                1,
                Math.round(
                  (new Date(offer.expires_at).getTime() -
                    new Date(offer.created_at).getTime()) /
                    (3600 * 1000)
                )
              ),
              confidence_score: offer.ai_confidence_score ?? undefined,
              reason: offer.ai_reason || '',
              opportunity_type:
                (offer.opportunity_type as any) || 'abandoned_checkout',
              evidence: matchingAudit?.proposal?.evidence || {},
            },
            violations,
            checked_at:
              matchingAudit?.policy_result?.checked_at ||
              offer.created_at.toISOString(),
          },
          execution: offer.razorpay_payment_link_id
            ? {
                mode: offer.execution_mode === 'LIVE' ? 'live' : 'simulated',
                razorpay_payment_link_id: offer.razorpay_payment_link_id,
                idempotency_key: offer.razorpay_payment_link_id || offer.id,
              }
            : undefined,
          auditRecord: matchingAudit,
          customerName: offer.customer?.name || offer.customer_id,
          offerId: offer.id,
          offerStatus: offer.status,
        };
      });

      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:id/resolve', async (req: Request, res: Response): Promise<any> => {
    const id = req.params.id as string;
    const { decision, mode } = req.body;
    console.log("reached in resolve :", id, decision, mode)

    if (decision !== 'APPROVED' && decision !== 'REJECTED') {
      return res.status(400).json({ error: 'Invalid decision' });
    }

    let offer = await prisma.recoveryOffer.findUnique({ where: { id } });
    console.log("offer :", offer)
    if (!offer) {
      offer = await prisma.recoveryOffer.findFirst({
        where: {
          OR: [
            { customer_id: id, status: 'ESCALATED' },
            { opportunity_id: id, status: 'ESCALATED' },
          ],
        },
        orderBy: { created_at: 'desc' },
      });
    }

    if (!offer || offer.status !== 'ESCALATED') {
      return res.status(404).json({ error: 'Offer not found or not escalated' });
    }

    if (decision === 'REJECTED') {
      await prisma.recoveryOffer.update({
        where: { id: offer.id },
        data: { status: 'BLOCKED' },
      });
      return res.json({ status: 'resolved', decision: 'REJECTED' });
    }
    console.log("decision === 'APPROVED'", decision)
    // decision === 'APPROVED'
    const executionMode = mode || config.execution.defaultMode;
    const gateway = executionMode === 'live'
      ? new RazorpayGateway(rzpClient, config.execution.maxLiveLinks)
      : new SimulatedGateway();

    console.log("executionMode :", executionMode)
    console.log("gateway :", gateway)
    console.log("offer :", offer)

    const proposal: AgentProposal = {
      customer_id: offer.customer_id,
      action: offer.action_type as any,
      amount_paise: offer.amount_paise,
      discount_percent: offer.discount_percent,
      expiry_hours: 24,
      reason: offer.ai_reason || '',
      opportunity_type: (offer.opportunity_type as any) || 'abandoned_checkout',
      evidence: {},
    };
    console.log("proposal :", proposal)

    const policyResult: PolicyResult = {
      verdict: 'APPROVED',
      proposal,
      violations: [],
      checked_at: new Date().toISOString(),
    };
    console.log("policyResult :", policyResult)

    try {
      const execution = await gateway.execute(policyResult);
      console.log("execution :", execution)
      if (execution.error && execution.error !== 'duplicate_prevented') {
        await prisma.recoveryOffer.update({
          where: { id: offer.id },
          data: { status: 'EXECUTION_FAILED', execution_mode: execution.mode === 'live' ? 'LIVE' : 'SIMULATED' }
        });
        return res.status(500).json({ error: 'Gateway execution failed: ' + execution.error });
      }
      console.log("execution.error :", execution.error)
      await prisma.recoveryOffer.update({
        where: { id: offer.id },
        data: {
          status: 'DISPATCHED',
          execution_mode: execution.mode === 'live' ? 'LIVE' : 'SIMULATED',
          razorpay_payment_link_id: execution.razorpay_payment_link_id || null,
        }
      });
      console.log("offer.opportunity_id :", offer.opportunity_id)

      if (offer.opportunity_id) {
        await prisma.recoveryOpportunity.update({
          where: { id: offer.opportunity_id },
          data: { status: 'PURSUING' }
        });
      }
      console.log("auditLogger.append")
      auditLogger.append(
        policyResult.proposal,
        policyResult,
        execution
      );
      console.log("res.json")
      return res.json({ status: 'resolved', decision: 'APPROVED' });

    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  return router;
}
