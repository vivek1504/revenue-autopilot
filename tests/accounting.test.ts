import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/api/dependencies";
import { DashboardService } from "../src/services/dashboard.service";

describe("Accounting Formulas & DB-Backed Metrics", () => {
  const dashboardService = new DashboardService(prisma);

  it("should calculate correct approval_rate_pct and recovery_conversion_pct directly from DB", async () => {
    const summary = await dashboardService.getSummary();

    expect(typeof summary.revenue_at_risk_paise).toBe("number");
    expect(typeof summary.expansion_opportunity_paise).toBe("number");
    expect(typeof summary.approved_count).toBe("number");
    expect(typeof summary.blocked_count).toBe("number");
    expect(typeof summary.unsafe_value_blocked_paise).toBe("number");
    expect(typeof summary.recovered_count).toBe("number");
    expect(typeof summary.approval_rate_pct).toBe("number");
    expect(typeof summary.recovery_conversion_pct).toBe("number");
    expect(typeof summary.recovery_rate_value_pct).toBe("number");
    expect((summary as any).recovery_rate_pct).toBeUndefined();
  });
});
