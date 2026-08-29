import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuditLogger } from "../../audit/logger";
import { AgentProposal, PolicyResult } from "../../shared/types";

export function createSimulateRouter(
  prisma: PrismaClient,
  auditLogger: AuditLogger
): Router {
  const router = Router();

  router.post("/payment", async (req: Request, res: Response): Promise<any> => {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Simulation disabled in production" });
    }

    const { offer_id } = req.body;
    if (!offer_id) {
      return res.status(400).json({ error: "offer_id is required" });
    }

    // 1. Atomic conditional update — only transitions active offers to RECOVERED
    const updateResult = await prisma.recoveryOffer.updateMany({
      where: {
        id: offer_id,
        status: { in: ['DISPATCHED', 'sent', 'simulated'] },
      },
      data: { status: 'RECOVERED' },
    });

    if (updateResult.count === 0) {
      const existing = await prisma.recoveryOffer.findUnique({
        where: { id: offer_id },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Offer not found' });
      }
      if (existing.status === 'RECOVERED') {
        return res.status(409).json({ error: 'Offer is already recovered' });
      }
      return res.status(400).json({
        error: `Cannot settle offer with status ${existing.status}. Must be DISPATCHED.`,
      });
    }

    const offer = await prisma.recoveryOffer.findUnique({
      where: { id: offer_id },
      include: { customer: true },
    });

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const discountedAmount = Math.round(
      offer.amount_paise * (1 - offer.discount_percent / 100)
    );

    // 2. Update parent opportunity if exists
    if (offer.opportunity_id) {
      await prisma.recoveryOpportunity.update({
        where: { id: offer.opportunity_id },
        data: { status: 'RECOVERED', resolved_at: new Date() },
      });
    }

    // 3. Append settlement to audit log
    const settlementProposal: AgentProposal = {
      customer_id: offer.customer_id,
      action: offer.action_type as any,
      amount_paise: discountedAmount,
      discount_percent: offer.discount_percent,
      expiry_hours: 24,
      reason: "Simulated payment settlement verified for offer " + offer.id,
      opportunity_type: (offer.opportunity_type as any) || "abandoned_checkout",
      evidence: {},
    };

    const settlementVerdict: PolicyResult = {
      verdict: "APPROVED",
      proposal: settlementProposal,
      violations: [],
      checked_at: new Date().toISOString(),
    };

    auditLogger.append(settlementProposal, settlementVerdict, {
      mode: offer.execution_mode === "LIVE" ? "live" : "simulated",
      razorpay_payment_link_id: offer.razorpay_payment_link_id || undefined,
      idempotency_key: "sim_settle_" + offer.id + "_" + Date.now(),
    });

    return res.json({
      status: "settled",
      offer_id: offer.id,
      recovered_value_paise: discountedAmount,
      simulation: true,
    });
  });

  return router;
}
