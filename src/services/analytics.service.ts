import { PrismaClient } from '@prisma/client';
import { TimeSeriesPoint, CohortPerformance, OpportunityType } from '../shared/types';
import { prisma as globalPrisma } from '../api/dependencies';

export class AnalyticsService {
  constructor(private prisma: PrismaClient = globalPrisma) {}

  public async getTimeseries(): Promise<TimeSeriesPoint[]> {
    const opportunities = await this.prisma.recoveryOpportunity.findMany({
      select: {
        detected_at: true,
        estimated_value_paise: true,
      },
      orderBy: { detected_at: 'asc' },
    });

    const recoveredOffers = await this.prisma.recoveryOffer.findMany({
      where: { status: 'RECOVERED' },
      select: {
        created_at: true,
        amount_paise: true,
        discount_percent: true,
      },
      orderBy: { created_at: 'asc' },
    });

    if (opportunities.length === 0 && recoveredOffers.length === 0) {
      return [];
    }

    const pointsMap = new Map<
      string,
      { label: string; recoverable_paise: number; recovered_paise: number }
    >();

    for (const opp of opportunities) {
      const dateKey = opp.detected_at.toISOString().split('T')[0]!;
      const label = opp.detected_at.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      const current = pointsMap.get(dateKey) || {
        label,
        recoverable_paise: 0,
        recovered_paise: 0,
      };

      current.recoverable_paise += opp.estimated_value_paise;
      pointsMap.set(dateKey, current);
    }

    for (const offer of recoveredOffers) {
      const dateKey = offer.created_at.toISOString().split('T')[0]!;
      const label = offer.created_at.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      const current = pointsMap.get(dateKey) || {
        label,
        recoverable_paise: 0,
        recovered_paise: 0,
      };

      const discounted = Math.round(
        offer.amount_paise * (1 - (offer.discount_percent || 0) / 100)
      );
      current.recovered_paise += discounted;
      pointsMap.set(dateKey, current);
    }

    const entries = Array.from(pointsMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([period, data]) => ({
      period,
      label: data.label,
      recoverable_paise: data.recoverable_paise,
      recovered_paise: data.recovered_paise,
    }));
  }

  public async getCohorts(): Promise<CohortPerformance[]> {
    const opps = await this.prisma.recoveryOpportunity.findMany({
      select: {
        type: true,
        estimated_value_paise: true,
        recovery_offers: {
          select: {
            policy_verdict: true,
            status: true,
          },
        },
      },
    });

    const cohortGroups: Record<
      OpportunityType,
      { count: number; volume_paise: number; approved_count: number; dispatched_count: number; recovered_count: number }
    > = {
      abandoned_checkout: { count: 0, volume_paise: 0, approved_count: 0, dispatched_count: 0, recovered_count: 0 },
      failed_payment: { count: 0, volume_paise: 0, approved_count: 0, dispatched_count: 0, recovered_count: 0 },
      upsell: { count: 0, volume_paise: 0, approved_count: 0, dispatched_count: 0, recovered_count: 0 },
      re_engagement: { count: 0, volume_paise: 0, approved_count: 0, dispatched_count: 0, recovered_count: 0 },
    };

    const normalizeType = (t: string): OpportunityType => {
      if (t === 'ABANDONED_CART' || t === 'abandoned_checkout') return 'abandoned_checkout';
      if (t === 'FAILED_PAYMENT' || t === 'failed_payment') return 'failed_payment';
      if (t === 'UPSELL' || t === 'upsell') return 'upsell';
      if (t === 'REENGAGEMENT' || t === 're_engagement') return 're_engagement';
      return 'abandoned_checkout';
    };

    for (const opp of opps) {
      const type = normalizeType(opp.type);
      cohortGroups[type].count++;
      cohortGroups[type].volume_paise += opp.estimated_value_paise;

      const hasApproved = opp.recovery_offers.some((o) => o.policy_verdict === 'APPROVED');
      const hasDispatched = opp.recovery_offers.some((o) =>
        o.status === 'DISPATCHED' || o.status === 'RECOVERED' || o.status === 'EXPIRED'
      );
      const hasRecovered = opp.recovery_offers.some((o) => o.status === 'RECOVERED');

      if (hasApproved) cohortGroups[type].approved_count++;
      if (hasDispatched) cohortGroups[type].dispatched_count++;
      if (hasRecovered) cohortGroups[type].recovered_count++;
    }

    const totalVolume =
      Object.values(cohortGroups).reduce((sum, g) => sum + g.volume_paise, 0) || 1;

    const computeRate = (numerator: number, denominator: number) =>
      denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;

    return [
      {
        cohort_key: 'abandoned_checkout',
        label: 'Abandoned Checkouts (1h - 24h)',
        count: cohortGroups.abandoned_checkout.count,
        volume_paise: cohortGroups.abandoned_checkout.volume_paise,
        approval_rate_pct: computeRate(
          cohortGroups.abandoned_checkout.approved_count,
          cohortGroups.abandoned_checkout.count
        ),
        conversion_rate_pct: computeRate(
          cohortGroups.abandoned_checkout.recovered_count,
          cohortGroups.abandoned_checkout.dispatched_count
        ),
        percentage_of_total: Math.round(
          (cohortGroups.abandoned_checkout.volume_paise / totalVolume) * 100
        ),
      },
      {
        cohort_key: 'failed_payment',
        label: 'Failed Card/UPI Payments (<48h)',
        count: cohortGroups.failed_payment.count,
        volume_paise: cohortGroups.failed_payment.volume_paise,
        approval_rate_pct: computeRate(
          cohortGroups.failed_payment.approved_count,
          cohortGroups.failed_payment.count
        ),
        conversion_rate_pct: computeRate(
          cohortGroups.failed_payment.recovered_count,
          cohortGroups.failed_payment.dispatched_count
        ),
        percentage_of_total: Math.round(
          (cohortGroups.failed_payment.volume_paise / totalVolume) * 100
        ),
      },
      {
        cohort_key: 'upsell',
        label: 'High LTV VIP Upsell Candidates',
        count: cohortGroups.upsell.count,
        volume_paise: cohortGroups.upsell.volume_paise,
        approval_rate_pct: computeRate(
          cohortGroups.upsell.approved_count,
          cohortGroups.upsell.count
        ),
        conversion_rate_pct: computeRate(
          cohortGroups.upsell.recovered_count,
          cohortGroups.upsell.dispatched_count
        ),
        percentage_of_total: Math.round(
          (cohortGroups.upsell.volume_paise / totalVolume) * 100
        ),
      },
      {
        cohort_key: 're_engagement',
        label: 'Lapsed Customer Winback (>30d)',
        count: cohortGroups.re_engagement.count,
        volume_paise: cohortGroups.re_engagement.volume_paise,
        approval_rate_pct: computeRate(
          cohortGroups.re_engagement.approved_count,
          cohortGroups.re_engagement.count
        ),
        conversion_rate_pct: computeRate(
          cohortGroups.re_engagement.recovered_count,
          cohortGroups.re_engagement.dispatched_count
        ),
        percentage_of_total: Math.round(
          (cohortGroups.re_engagement.volume_paise / totalVolume) * 100
        ),
      },
    ];
  }
}
