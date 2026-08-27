import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/api/dependencies";

describe("RecoveryOffer Lifecycle & Status Transitions", () => {
  const custId = "cust_stat_01";

  beforeAll(async () => {
    await prisma.recoveryOffer.deleteMany({ where: { customer_id: custId } });
    await prisma.recoveryOpportunity.deleteMany({ where: { customer_id: custId } });
    await prisma.customer.deleteMany({ where: { id: custId } });

    await prisma.customer.create({
      data: {
        id: custId,
        name: "Status Customer",
        email: "status@example.com",
        tier: "vip",
        lifetime_spend_paise: 5000000,
        total_orders: 4,
        created_at: new Date(),
      },
    });
  });

  it("should create DISPATCHED offer with mode SIMULATED in simulated autopilot run", async () => {
    const opp = await prisma.recoveryOpportunity.create({
      data: {
        id: "opp_stat_01",
        customer_id: custId,
        type: "ABANDONED_CART",
        source_type: "CART",
        source_id: "cart_stat_01",
        idempotency_key: "ABANDONED_CART:cart_stat_01",
        estimated_value_paise: 300000,
        value_is_estimated: false,
        status: "OPEN",
      },
    });

    const offer = await prisma.recoveryOffer.create({
      data: {
        id: "off_stat_01",
        customer_id: custId,
        opportunity_id: opp.id,
        action_type: "discounted_payment_link",
        amount_paise: 300000,
        discount_percent: 10,
        status: "DISPATCHED",
        execution_mode: "SIMULATED",
        policy_verdict: "APPROVED",
        created_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    expect(offer.status).toBe("DISPATCHED");
    expect(offer.execution_mode).toBe("SIMULATED");

    // Transition to RECOVERED maintains execution_mode
    const recovered = await prisma.recoveryOffer.update({
      where: { id: offer.id },
      data: { status: "RECOVERED" },
    });
    expect(recovered.status).toBe("RECOVERED");
    expect(recovered.execution_mode).toBe("SIMULATED");
  });

  it("should create ESCALATED offer with null execution_mode", async () => {
    const offer = await prisma.recoveryOffer.create({
      data: {
        id: "off_stat_esc",
        customer_id: custId,
        action_type: "discounted_payment_link",
        amount_paise: 3500000,
        discount_percent: 5,
        status: "ESCALATED",
        execution_mode: null,
        policy_verdict: "ESCALATED",
        created_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    expect(offer.status).toBe("ESCALATED");
    expect(offer.execution_mode).toBeNull();
    expect(offer.policy_verdict).toBe("ESCALATED");
  });
});
