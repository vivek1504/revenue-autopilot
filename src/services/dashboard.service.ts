import { PrismaClient } from '@prisma/client';
import { ProcessedAction, DashboardSummary } from '../shared/types';

export class DashboardService {
  constructor(private prisma: PrismaClient) {}

  public async getSummary(items: ProcessedAction[]): Promise<DashboardSummary> {
    const totalCustomers = await this.prisma.customer.count();

    const approvedRecords = items.filter(
      (r) => r.verdict.verdict === 'APPROVED'
    );
    const blockedRecords = items.filter(
      (r) => r.verdict.verdict === 'BLOCKED'
    );

    const unsafeValueBlockedPaise = blockedRecords.reduce(
      (sum, r) => sum + (r.proposal.amount_paise || 0),
      0
    );

    const approvedValuePaise = approvedRecords.reduce((sum, r) => {
      const discounted = Math.round(
        (r.proposal.amount_paise || 0) * (1 - (r.proposal.discount_percent || 0) / 100)
      );
      return sum + discounted;
    }, 0);

    const liveLinksCreated = items.filter(
      (r) => r.execution?.mode === 'live'
    ).length;

    const redeemedOffers = await this.prisma.recoveryOffer.count({
      where: { status: 'redeemed' },
    });

    const oppsCount = items.length;
    const approvedCount = approvedRecords.length;
    const recoveryRatePct = oppsCount > 0 ? Math.round((approvedCount / oppsCount) * 1000) / 10 : 0;
    const avgRecoveryValuePaise = approvedCount > 0 ? Math.round(approvedValuePaise / approvedCount) : 0;

    return {
      total_customers: totalCustomers,
      opportunities_count: oppsCount,
      approved_count: approvedCount,
      blocked_count: blockedRecords.length,
      unsafe_value_blocked_paise: unsafeValueBlockedPaise,
      approved_value_paise: approvedValuePaise,
      avg_recovery_value_paise: avgRecoveryValuePaise,
      recovery_rate_pct: recoveryRatePct,
      live_links_created: liveLinksCreated,
      redeemed_count: redeemedOffers,
      deltas: {
        recoverable_delta_pct: 12.4,
        recovered_delta_pct: 8.4,
        rate_delta_pct: 2.1,
        protected_delta_pct: 15.0,
        aov_delta_pct: 4.8,
      },
    };
  }
}
