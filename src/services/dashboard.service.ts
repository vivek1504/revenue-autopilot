import { PrismaClient } from '@prisma/client';
import { ProcessedAction, DashboardSummary } from '../shared/types';

export class DashboardService {
  constructor(private prisma: PrismaClient) {}

  public async getSummary(items?: ProcessedAction[]): Promise<DashboardSummary> {
    const totalCustomers = await this.prisma.customer.count();

    // 1. Revenue at Risk: event-backed opportunities (actual money at risk) that are OPEN or PURSUING
    const atRiskOpps = await this.prisma.recoveryOpportunity.findMany({
      where: {
        status: { in: ['OPEN', 'PURSUING'] },
        value_is_estimated: false,
      },
      select: { estimated_value_paise: true },
    });
    const revenueAtRiskPaise = atRiskOpps.reduce((sum, o) => sum + o.estimated_value_paise, 0);

    // 2. Expansion Opportunity: eligibility-based opportunities (estimated potential) that are OPEN or PURSUING
    const expansionOpps = await this.prisma.recoveryOpportunity.findMany({
      where: {
        status: { in: ['OPEN', 'PURSUING'] },
        value_is_estimated: true,
      },
      select: { estimated_value_paise: true },
    });
    const expansionOpportunityPaise = expansionOpps.reduce((sum, o) => sum + o.estimated_value_paise, 0);

    const totalOpportunitiesCount = await this.prisma.recoveryOpportunity.count();

    // 3. Offers stats
    const allOffers = await this.prisma.recoveryOffer.findMany({
      select: {
        id: true,
        amount_paise: true,
        discount_percent: true,
        status: true,
        execution_mode: true,
        policy_verdict: true,
      },
    });

    const approvedOffers = allOffers.filter(
      (o) =>
        o.policy_verdict === 'APPROVED' ||
        o.status === 'DISPATCHED' ||
        o.status === 'RECOVERED' ||
        o.status === 'EXECUTION_FAILED' ||
        o.status === 'sent' ||
        o.status === 'redeemed' ||
        o.status === 'simulated'
    );
    const escalatedOffers = allOffers.filter(
      (o) => o.status === 'ESCALATED' || o.policy_verdict === 'ESCALATED'
    );
    const dispatchedOffers = allOffers.filter(
      (o) =>
        o.status === 'DISPATCHED' ||
        o.status === 'RECOVERED' ||
        o.status === 'EXPIRED' ||
        o.status === 'sent' ||
        o.status === 'redeemed' ||
        o.status === 'simulated'
    );
    const recoveredOffers = allOffers.filter(
      (o) => o.status === 'RECOVERED' || o.status === 'redeemed'
    );

    const approvedCount = approvedOffers.length;
    const escalatedCount = escalatedOffers.length;
    const dispatchedCount = dispatchedOffers.length;
    const recoveredCount = recoveredOffers.length;

    // Approved Value
    const approvedValuePaise = approvedOffers.reduce((sum, o) => {
      const discounted = Math.round(o.amount_paise * (1 - (o.discount_percent || 0) / 100));
      return sum + discounted;
    }, 0);

    // Recovered Value
    const recoveredValuePaise = recoveredOffers.reduce((sum, o) => {
      const discounted = Math.round(o.amount_paise * (1 - (o.discount_percent || 0) / 100));
      return sum + discounted;
    }, 0);

    // Live links created
    const liveLinksCreated = allOffers.filter(
      (o) => o.execution_mode === 'LIVE' || (o as any).execution_mode === 'live'
    ).length;

    // Blocked count & unsafe value blocked
    let blockedCount = 0;
    let unsafeValueBlockedPaise = 0;
    if (items && items.length > 0) {
      const blockedItems = items.filter((i) => i.verdict.verdict === 'BLOCKED');
      blockedCount = blockedItems.length;
      unsafeValueBlockedPaise = blockedItems.reduce(
        (sum, i) => sum + (i.proposal.amount_paise || 0),
        0
      );
    }

    // Total evaluated = approved + escalated + blocked
    const totalEvaluated = approvedCount + escalatedCount + blockedCount;
    const approvalRatePct = totalEvaluated > 0
      ? Math.round((approvedCount / totalEvaluated) * 1000) / 10
      : totalOpportunitiesCount > 0
      ? Math.round((approvedCount / totalOpportunitiesCount) * 1000) / 10
      : 0;

    // Recovery Conversion = recovered / dispatched
    const recoveryConversionPct = dispatchedCount > 0
      ? Math.round((recoveredCount / dispatchedCount) * 1000) / 10
      : 0;

    // Recovery Rate by Value = recovered_value / approved_value
    const recoveryRateValuePct = approvedValuePaise > 0
      ? Math.round((recoveredValuePaise / approvedValuePaise) * 1000) / 10
      : 0;

    // Recovery Yield = recovered_value / (revenue_at_risk + expansion_opportunity)
    const totalPipelineValue = revenueAtRiskPaise + expansionOpportunityPaise + recoveredValuePaise;
    const recoveryYieldPct = totalPipelineValue > 0
      ? Math.round((recoveredValuePaise / totalPipelineValue) * 1000) / 10
      : 0;

    const avgRecoveryValuePaise = recoveredCount > 0
      ? Math.round(recoveredValuePaise / recoveredCount)
      : approvedCount > 0
      ? Math.round(approvedValuePaise / approvedCount)
      : 0;

    return {
      total_customers: totalCustomers,
      opportunities_count: totalOpportunitiesCount || (items?.length ?? 0),
      revenue_at_risk_paise: revenueAtRiskPaise,
      expansion_opportunity_paise: expansionOpportunityPaise,
      approved_count: approvedCount,
      blocked_count: blockedCount,
      escalated_count: escalatedCount,
      dispatched_count: dispatchedCount,
      recovered_count: recoveredCount,
      unsafe_value_blocked_paise: unsafeValueBlockedPaise,
      approved_value_paise: approvedValuePaise,
      recovered_value_paise: recoveredValuePaise,
      approval_rate_pct: approvalRatePct,
      recovery_conversion_pct: recoveryConversionPct,
      recovery_rate_value_pct: recoveryRateValuePct,
      recovery_yield_pct: recoveryYieldPct,
      avg_recovery_value_paise: avgRecoveryValuePaise,
      live_links_created: liveLinksCreated,
      recovery_rate_pct: approvalRatePct,
      redeemed_count: recoveredCount,
      deltas: {
        recoverable_delta_pct: null,
        recovered_delta_pct: null,
        rate_delta_pct: null,
        protected_delta_pct: null,
        aov_delta_pct: null,
      },
    };
  }
}
