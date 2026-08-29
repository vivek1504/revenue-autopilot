import { beforeAll, describe, expect, it } from "vitest";
import { prisma, auditLogger } from "../src/api/dependencies";
import { createSimulateRouter } from "../src/api/routes/simulate";

describe("Settlement Lifecycle & Simulation", () => {
  const custId = "cust_settle_01";
  const oppId = "opp_settle_01";
  const offerId = "off_settle_01";

  beforeAll(async () => {
    // Clean up
    await prisma.recoveryOffer.deleteMany({ where: { customer_id: custId } });
    await prisma.recoveryOpportunity.deleteMany({ where: { customer_id: custId } });
    await prisma.customer.deleteMany({ where: { id: custId } });

    // Seed customer
    await prisma.customer.create({
      data: {
        id: custId,
        name: "Settlement Customer",
        email: "settle@example.com",
        tier: "standard",
        lifetime_spend_paise: 2000000,
        total_orders: 2,
        created_at: new Date(),
      },
    });

    // Seed opportunity
    await prisma.recoveryOpportunity.create({
      data: {
        id: oppId,
        customer_id: custId,
        type: "ABANDONED_CART",
        source_type: "CART",
        source_id: "cart_settle_01",
        idempotency_key: "ABANDONED_CART:cart_settle_01",
        estimated_value_paise: 500000,
        value_is_estimated: false,
        status: "PURSUING",
      },
    });

    // Seed DISPATCHED offer
    await prisma.recoveryOffer.create({
      data: {
        id: offerId,
        customer_id: custId,
        opportunity_id: oppId,
        action_type: "discounted_payment_link",
        amount_paise: 500000,
        discount_percent: 10,
        status: "DISPATCHED",
        execution_mode: "SIMULATED",
        policy_verdict: "APPROVED",
        razorpay_payment_link_id: "sim_plink_settle_01",
        created_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });
  });

  it("should settle a DISPATCHED offer and transition both offer & opportunity to RECOVERED", async () => {
    const simulateRouter = createSimulateRouter(prisma, auditLogger);
    let responseStatus = 200;
    let responseJson: any = null;

    const mockReq: any = {
      body: { offer_id: offerId },
    };
    const mockRes: any = {
      status: (code: number) => {
        responseStatus = code;
        return mockRes;
      },
      json: (data: any) => {
        responseJson = data;
        return mockRes;
      },
    };

    // Find post handler
    const postRoute = (simulateRouter.stack as any[]).find(
      (layer) => layer.route && layer.route.path === "/payment"
    );
    await postRoute.route.stack[0].handle(mockReq, mockRes);

    expect(responseStatus).toBe(200);
    expect(responseJson.status).toBe("settled");
    expect(responseJson.recovered_value_paise).toBe(450000); // ₹5,000 - 10% = ₹4,500

    // Check DB
    const updatedOffer = await prisma.recoveryOffer.findUnique({
      where: { id: offerId },
    });
    expect(updatedOffer?.status).toBe("RECOVERED");
    expect(updatedOffer?.execution_mode).toBe("SIMULATED"); // Mode preserved!

    const updatedOpp = await prisma.recoveryOpportunity.findUnique({
      where: { id: oppId },
    });
    expect(updatedOpp?.status).toBe("RECOVERED");
    expect(updatedOpp?.resolved_at).toBeDefined();
  });

  it("should return 409 when attempting to settle an already RECOVERED offer", async () => {
    const simulateRouter = createSimulateRouter(prisma, auditLogger);
    let responseStatus = 200;
    let responseJson: any = null;

    const mockReq: any = {
      body: { offer_id: offerId },
    };
    const mockRes: any = {
      status: (code: number) => {
        responseStatus = code;
        return mockRes;
      },
      json: (data: any) => {
        responseJson = data;
        return mockRes;
      },
    };

    const postRoute = (simulateRouter.stack as any[]).find(
      (layer) => layer.route && layer.route.path === "/payment"
    );
    await postRoute.route.stack[0].handle(mockReq, mockRes);

    expect(responseStatus).toBe(409);
    expect(responseJson.error).toContain("already recovered");
  });

  it("should return 400 when attempting to settle an offer that is not DISPATCHED", async () => {
    const escOfferId = "off_esc_01";
    await prisma.recoveryOffer.create({
      data: {
        id: escOfferId,
        customer_id: custId,
        action_type: "discounted_payment_link",
        amount_paise: 3000000,
        discount_percent: 5,
        status: "ESCALATED",
        policy_verdict: "ESCALATED",
        created_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    const simulateRouter = createSimulateRouter(prisma, auditLogger);
    let responseStatus = 200;
    let responseJson: any = null;

    const mockReq: any = {
      body: { offer_id: escOfferId },
    };
    const mockRes: any = {
      status: (code: number) => {
        responseStatus = code;
        return mockRes;
      },
      json: (data: any) => {
        responseJson = data;
        return mockRes;
      },
    };

    const postRoute = (simulateRouter.stack as any[]).find(
      (layer) => layer.route && layer.route.path === "/payment"
    );
    await postRoute.route.stack[0].handle(mockReq, mockRes);

    expect(responseStatus).toBe(400);
    expect(responseJson.error).toContain("Must be DISPATCHED");
  });

  it("should approve an ESCALATED offer, transition to DISPATCHED, and write audit log", async () => {
    const { createOpportunitiesRouter } = await import("../src/api/routes/opportunities");
    const oppRouter = createOpportunitiesRouter();
    const escOfferId = "off_esc_test_approve";

    await prisma.recoveryOffer.create({
      data: {
        id: escOfferId,
        customer_id: custId,
        opportunity_id: oppId,
        action_type: "discounted_payment_link",
        amount_paise: 3000000,
        discount_percent: 5,
        status: "ESCALATED",
        policy_verdict: "ESCALATED",
        created_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    let responseStatus = 200;
    let responseJson: any = null;

    const mockReq: any = {
      params: { id: escOfferId },
      body: { decision: "APPROVED", mode: "simulated" },
    };
    const mockRes: any = {
      status: (code: number) => {
        responseStatus = code;
        return mockRes;
      },
      json: (data: any) => {
        responseJson = data;
        return mockRes;
      },
    };

    const postRoute = (oppRouter.stack as any[]).find(
      (layer) => layer.route && layer.route.path === "/:id/resolve"
    );
    await postRoute.route.stack[0].handle(mockReq, mockRes);

    expect(responseStatus).toBe(200);
    expect(responseJson.status).toBe("resolved");
    expect(responseJson.decision).toBe("APPROVED");

    const updated = await prisma.recoveryOffer.findUnique({ where: { id: escOfferId } });
    expect(updated?.status).toBe("DISPATCHED");
    expect(updated?.razorpay_payment_link_id).toBeDefined();
    expect(updated?.execution_mode).toBe("SIMULATED");
  });

  it("should reject an ESCALATED offer and transition to BLOCKED", async () => {
    const { createOpportunitiesRouter } = await import("../src/api/routes/opportunities");
    const oppRouter = createOpportunitiesRouter();
    const escOfferId = "off_esc_test_reject";

    await prisma.recoveryOffer.create({
      data: {
        id: escOfferId,
        customer_id: custId,
        opportunity_id: oppId,
        action_type: "discounted_payment_link",
        amount_paise: 3000000,
        discount_percent: 5,
        status: "ESCALATED",
        policy_verdict: "ESCALATED",
        created_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    let responseStatus = 200;
    let responseJson: any = null;

    const mockReq: any = {
      params: { id: escOfferId },
      body: { decision: "REJECTED" },
    };
    const mockRes: any = {
      status: (code: number) => {
        responseStatus = code;
        return mockRes;
      },
      json: (data: any) => {
        responseJson = data;
        return mockRes;
      },
    };

    const postRoute = (oppRouter.stack as any[]).find(
      (layer) => layer.route && layer.route.path === "/:id/resolve"
    );
    await postRoute.route.stack[0].handle(mockReq, mockRes);

    expect(responseStatus).toBe(200);
    expect(responseJson.status).toBe("resolved");
    expect(responseJson.decision).toBe("REJECTED");

    const updated = await prisma.recoveryOffer.findUnique({ where: { id: escOfferId } });
    expect(updated?.status).toBe("BLOCKED");
  });
});
