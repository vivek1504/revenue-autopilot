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

    const offer = await prisma.recoveryOffer.findUnique({
      where: { id: offer_id },
    });
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const settled_amount_paise = Math.round(
      offer.amount_paise * (1 - (offer.discount_percent || 0) / 100)
    );

    // 1. Atomic conditional update — only transitions active offers to RECOVERED
    const updateResult = await prisma.recoveryOffer.updateMany({
      where: {
        id: offer_id,
        status: 'DISPATCHED',
      },
      data: {
        status: 'RECOVERED',
        recovered_at: new Date(),
        settled_amount_paise,
      },
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

    const updatedOffer = await prisma.recoveryOffer.findUnique({
      where: { id: offer_id },
      include: { customer: true },
    });

    if (!updatedOffer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const discountedAmount = updatedOffer.settled_amount_paise || Math.round(
      updatedOffer.amount_paise * (1 - updatedOffer.discount_percent / 100)
    );

    // 2. Update parent opportunity if exists
    if (updatedOffer.opportunity_id) {
      await prisma.recoveryOpportunity.update({
        where: { id: updatedOffer.opportunity_id },
        data: { status: 'RECOVERED', resolved_at: new Date() },
      });
    }

    // 3. Append settlement to audit log
    auditLogger.appendSettlement({
      offer_id: updatedOffer.id,
      opportunity_id: updatedOffer.opportunity_id || undefined,
      payment_link_id: updatedOffer.razorpay_payment_link_id || undefined,
      settled_amount_paise: discountedAmount,
      customer_id: updatedOffer.customer_id,
      action_type: updatedOffer.action_type,
      opportunity_type: updatedOffer.opportunity_type || "abandoned_checkout",
      discount_percent: updatedOffer.discount_percent,
      mode: updatedOffer.execution_mode === "LIVE" ? "live" : "simulated",
    });

    return res.json({
      status: "settled",
      offer_id: updatedOffer.id,
      recovered_value_paise: discountedAmount,
      simulation: true,
    });
  });

  return router;
}
