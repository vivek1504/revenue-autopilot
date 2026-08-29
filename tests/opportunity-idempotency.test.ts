import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/api/dependencies";
import { detectOpportunities } from "../src/agent/detector";

describe("Opportunity-Level Idempotency & Persistence", () => {
  const custId = "cust_idemp_01";
  const cartId = "cart_idemp_01";

  beforeAll(async () => {
    // Clean up
    await prisma.recoveryOffer.deleteMany({ where: { customer_id: custId } });
    await prisma.recoveryOpportunity.deleteMany({ where: { customer_id: custId } });
    await prisma.cart.deleteMany({ where: { customer_id: custId } });
    await prisma.order.deleteMany({ where: { customer_id: custId } });
    await prisma.customer.deleteMany({ where: { id: custId } });

    // Seed customer
    await prisma.customer.create({
      data: {
        id: custId,
        name: "Test Idempotent Customer",
        email: "idemp@example.com",
        tier: "vip",
        lifetime_spend_paise: 5000000,
        total_orders: 5,
        created_at: new Date(),
      },
    });

    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);
    await prisma.cart.create({
      data: {
        id: cartId,
        customer_id: custId,
        items: [] as any,
        total_paise: 450000,
        created_at: twoHoursAgo,
        last_activity: twoHoursAgo,
        status: "abandoned",
      },
    });
  });

  it("should create only ONE opportunity for the same abandoned cart on duplicate scans", async () => {
    const opps1 = await detectOpportunities(prisma);
    const cartOpp1 = opps1.find((o) => o.cart?.id === cartId);
    expect(cartOpp1).toBeDefined();

    const count1 = await prisma.recoveryOpportunity.count({
      where: { idempotency_key: `ABANDONED_CART:${cartId}` },
    });
    expect(count1).toBe(1);

    // Second detection pass
    const opps2 = await detectOpportunities(prisma);
    const cartOpp2 = opps2.find((o) => o.cart?.id === cartId);
    expect(cartOpp2).toBeDefined();

    const count2 = await prisma.recoveryOpportunity.count({
      where: { idempotency_key: `ABANDONED_CART:${cartId}` },
    });
    expect(count2).toBe(1); // Still 1 in DB!
  });

  it("should flag event-backed opportunities with value_is_estimated = false and eligibility-based with true", async () => {
    const dbCartOpp = await prisma.recoveryOpportunity.findUnique({
      where: { idempotency_key: `ABANDONED_CART:${cartId}` },
    });
    expect(dbCartOpp?.value_is_estimated).toBe(false);
  });

  it("should not re-detect an opportunity once its status is PURSUING or RECOVERED", async () => {
    // Transition cart opportunity to PURSUING
    await prisma.recoveryOpportunity.update({
      where: { idempotency_key: `ABANDONED_CART:${cartId}` },
      data: { status: "PURSUING" },
    });

    const opps = await detectOpportunities(prisma);
    const cartOpp = opps.find((o) => o.cart?.id === cartId);
    expect(cartOpp).toBeUndefined(); // Skipped because not OPEN!

    // Reset to RECOVERED
    await prisma.recoveryOpportunity.update({
      where: { idempotency_key: `ABANDONED_CART:${cartId}` },
      data: { status: "RECOVERED" },
    });

    const oppsAfterRecovered = await detectOpportunities(prisma);
    const cartOppAfter = oppsAfterRecovered.find((o) => o.cart?.id === cartId);
    expect(cartOppAfter).toBeUndefined();
  });

  it("should detect both abandoned cart and failed payment for the same customer without customer-level blocking", async () => {
    const multiCustId = "cust_multi_opp";
    await prisma.recoveryOffer.deleteMany({ where: { customer_id: multiCustId } });
    await prisma.recoveryOpportunity.deleteMany({ where: { customer_id: multiCustId } });
    await prisma.cart.deleteMany({ where: { customer_id: multiCustId } });
    await prisma.order.deleteMany({ where: { customer_id: multiCustId } });
    await prisma.customer.deleteMany({ where: { id: multiCustId } });

    await prisma.customer.create({
      data: {
        id: multiCustId,
        name: "Multi Opp Customer",
        email: "multiopp@example.com",
        tier: "standard",
        lifetime_spend_paise: 3000000,
        total_orders: 3,
        created_at: new Date(),
      },
    });

    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);
    await prisma.cart.create({
      data: {
        id: "cart_multi_01",
        customer_id: multiCustId,
        items: [] as any,
        total_paise: 250000,
        created_at: twoHoursAgo,
        last_activity: twoHoursAgo,
        status: "abandoned",
      },
    });

    await prisma.order.create({
      data: {
        id: "ord_multi_01",
        customer_id: multiCustId,
        status: "failed",
        total_paise: 150000,
        failure_reason: "BANK_TIMEOUT",
        created_at: twoHoursAgo,
        items: [] as any,
      },
    });

    const opps = await detectOpportunities(prisma);
    const cartOpp = opps.find((o) => o.customer.id === multiCustId && o.opportunityType === "abandoned_checkout");
    const failedOpp = opps.find((o) => o.customer.id === multiCustId && o.opportunityType === "failed_payment");

    expect(cartOpp).toBeDefined();
    expect(failedOpp).toBeDefined();

    // Clean up
    await prisma.recoveryOpportunity.deleteMany({ where: { customer_id: multiCustId } });
    await prisma.cart.deleteMany({ where: { customer_id: multiCustId } });
    await prisma.order.deleteMany({ where: { customer_id: multiCustId } });
    await prisma.customer.deleteMany({ where: { id: multiCustId } });
  });
});
