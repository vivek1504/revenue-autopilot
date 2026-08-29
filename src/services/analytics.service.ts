import { PrismaClient } from '@prisma/client';
import { TimeSeriesPoint, CohortPerformance, OpportunityType } from '../shared/types';
import { prisma as globalPrisma } from '../api/dependencies';

export class AnalyticsService {
  constructor(private prisma: PrismaClient = globalPrisma) {}

  public async getTimeseries(): Promise<TimeSeriesPoint[]> {
    const offers = await this.prisma.recoveryOffer.findMany({
      select: {
        created_at: true,
        amount_paise: true,
        discount_percent: true,
        status: true,
        policy_verdict: true,
      },
      orderBy: { created_at: 'asc' },
    });

    if (offers.length === 0) {
      return [];
    }

    const pointsMap = new Map<
      string,
      { label: string; recoverable_paise: number; recovered_paise: number }
    >();

    for (const offer of offers) {
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

      if (
        offer.policy_verdict === 'APPROVED' ||
        offer.status === 'DISPATCHED' ||
        offer.status === 'RECOVERED' ||
        offer.status === 'sent' ||
        offer.status === 'simulated'
      ) {
        current.recoverable_paise += discounted;
      }

      if (offer.status === 'RECOVERED' || offer.status === 'redeemed') {
        current.recovered_paise += discounted;
      }

      pointsMap.set(dateKey, current);
    }

    const entries = Array.from(pointsMap.entries());
    return entries.map(([period, data]) => ({
      period,
      label: data.label,
      recoverable_paise: data.recoverable_paise,
      recovered_paise: data.recovered_paise,
    }));
  }

  public async getCohorts(): Promise<CohortPerformance[]> {
    const offers = await this.prisma.recoveryOffer.findMany({
      select: {
        opportunity_type: true,
        amount_paise: true,
        discount_percent: true,
        policy_verdict: true,
        status: true,
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

    for (const offer of offers) {
      const type = (offer.opportunity_type as OpportunityType) || 'abandoned_checkout';
      if (!cohortGroups[type]) {
        cohortGroups[type] = { count: 0, volume_paise: 0, approved_count: 0, dispatched_count: 0, recovered_count: 0 };
      }
      cohortGroups[type].count++;
      cohortGroups[type].volume_paise += offer.amount_paise;

      const isApproved =
        offer.policy_verdict === 'APPROVED' ||
        offer.status === 'DISPATCHED' ||
        offer.status === 'RECOVERED' ||
        offer.status === 'sent' ||
        offer.status === 'simulated';

      if (isApproved) {
        cohortGroups[type].approved_count++;
      }

      if (
        offer.status === 'DISPATCHED' ||
        offer.status === 'RECOVERED' ||
        offer.status === 'sent' ||
        offer.status === 'simulated'
      ) {
        cohortGroups[type].dispatched_count++;
      }

      if (offer.status === 'RECOVERED' || offer.status === 'redeemed') {
        cohortGroups[type].recovered_count++;
      }
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
          cohortGroups.abandoned_checkout.dispatched_count || cohortGroups.abandoned_checkout.approved_count
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
          cohortGroups.failed_payment.dispatched_count || cohortGroups.failed_payment.approved_count
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
          cohortGroups.upsell.dispatched_count || cohortGroups.upsell.approved_count
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
          cohortGroups.re_engagement.dispatched_count || cohortGroups.re_engagement.approved_count
        ),
        percentage_of_total: Math.round(
          (cohortGroups.re_engagement.volume_paise / totalVolume) * 100
        ),
      },
    ];
  }
}
