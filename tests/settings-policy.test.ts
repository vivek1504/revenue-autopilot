import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/api/dependencies";
import { SettingsService } from "../src/services/settings.service";
import { PolicyEngine } from "../src/policy/engine";
import { AgentProposal } from "../src/shared/types";

describe("Settings -> Policy Dynamic Binding", () => {
  const settingsService = new SettingsService(prisma);
  const custId = "cust_set_01";

  beforeAll(async () => {
    await prisma.customer.deleteMany({ where: { id: custId } });
    await prisma.customer.create({
      data: {
        id: custId,
        name: "Settings Test Customer",
        email: "settings@example.com",
        tier: "standard",
        lifetime_spend_paise: 2000000,
        total_orders: 2,
        created_at: new Date(),
      },
    });
  });

  it("should block discounts higher than the updated max_discount_percent in settings", async () => {
    // 1. Update settings to restrict max discount to 8%
    await settingsService.updateSettings({
      max_discount_percent: 8,
    });

    const activePolicy = await settingsService.loadMerchantPolicy();
    expect(activePolicy.maxDiscountPercent).toBe(8);

    const policyEngine = new PolicyEngine(activePolicy, prisma);

    const proposalWith10Percent: AgentProposal = {
      customer_id: custId,
      action: "discounted_payment_link",
      amount_paise: 400000,
      discount_percent: 10, // 10% exceeds 8% limit!
      expiry_hours: 24,
      confidence_score: 0.9,
      reason: "Standard recovery proposal",
      opportunity_type: "abandoned_checkout",
      evidence: {},
    };

    const result = await policyEngine.evaluate(proposalWith10Percent);
    expect(result.verdict).toBe("BLOCKED");
    expect(result.violations.some((v) => v.rule === "discount_limit")).toBe(true);

    // Reset settings to default 15%
    await settingsService.updateSettings({
      max_discount_percent: 15,
    });
  });
});
