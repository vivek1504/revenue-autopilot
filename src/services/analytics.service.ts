import { ProcessedAction, TimeSeriesPoint, CohortPerformance } from '../shared/types';
import { prisma as globalPrisma } from '../api/dependencies';

export class AnalyticsService {
  public async getTimeseries(items: ProcessedAction[]): Promise<TimeSeriesPoint[]> {
    if (items.length === 0) {
      return [];
    }

    const pointsMap = new Map<
      string,
      { label: string; recoverable_paise: number; recovered_paise: number }
    >();

    // Fetch redeemed offers to get real recovered amounts
    let redeemedOffers: { created_at: Date; amount_paise: number; discount_percent: number }[] = [];
    try {
      redeemedOffers = await globalPrisma.recoveryOffer.findMany({
        where: { status: 'redeemed' },
        select: { created_at: true, amount_paise: true, discount_percent: true },
      });
    } catch {
      redeemedOffers = [];
    }

    const sorted = [...items].sort((a, b) => {
      const tA = new Date(a.auditRecord?.timestamp || 0).getTime();
      const tB = new Date(b.auditRecord?.timestamp || 0).getTime();
      return tA - tB;
    });

    for (const item of sorted) {
      const ts = item.auditRecord?.timestamp
        ? new Date(item.auditRecord.timestamp)
        : new Date();
      const dateKey = ts.toISOString().split('T')[0]!;
      const label = ts.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      const current = pointsMap.get(dateKey) || {
        label,
        recoverable_paise: 0,
        recovered_paise: 0,
      };

      if (item.verdict.verdict === 'APPROVED') {
        const discounted = Math.round(
          (item.proposal.amount_paise || 0) *
            (1 - (item.proposal.discount_percent || 0) / 100)
        );
        current.recoverable_paise += discounted;
      }
      pointsMap.set(dateKey, current);
    }

    // Add real recovered amounts to the corresponding date buckets
    for (const offer of redeemedOffers) {
      const dateKey = offer.created_at.toISOString().split('T')[0]!;
      const discounted = Math.round(
        offer.amount_paise * (1 - (offer.discount_percent || 0) / 100)
      );
      const existing = pointsMap.get(dateKey);
      if (existing) {
        existing.recovered_paise += discounted;
      } else {
        const label = offer.created_at.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        pointsMap.set(dateKey, {
          label,
          recoverable_paise: 0,
          recovered_paise: discounted,
        });
      }
    }

    const entries = Array.from(pointsMap.entries());
    return entries.map(([period, data]) => ({
      period,
      label: data.label,
      recoverable_paise: data.recoverable_paise,
      recovered_paise: data.recovered_paise,
    }));
  }

  public getCohorts(items: ProcessedAction[]): CohortPerformance[] {
    const cohortGroups: Record<
      string,
      { count: number; volume_paise: number; approved_count: number }
    > = {
      abandoned_checkout: { count: 0, volume_paise: 0, approved_count: 0 },
      failed_payment: { count: 0, volume_paise: 0, approved_count: 0 },
      upsell: { count: 0, volume_paise: 0, approved_count: 0 },
      re_engagement: { count: 0, volume_paise: 0, approved_count: 0 },
    };

    for (const item of items) {
      const type = item.proposal.opportunity_type;
      if (!cohortGroups[type]) {
        cohortGroups[type] = { count: 0, volume_paise: 0, approved_count: 0 };
      }
      cohortGroups[type].count++;
      cohortGroups[type].volume_paise += item.proposal.amount_paise || 0;
      if (item.verdict.verdict === 'APPROVED') {
        cohortGroups[type].approved_count++;
      }
    }

    const totalVolume =
      Object.values(cohortGroups).reduce((sum, g) => sum + g.volume_paise, 0) ||
      1;

    return [
      {
        cohort_key: 'abandoned_checkout',
        label: 'Abandoned Checkouts (1h - 24h)',
        count: cohortGroups.abandoned_checkout.count,
        volume_paise: cohortGroups.abandoned_checkout.volume_paise,
        conversion_rate_pct:
          cohortGroups.abandoned_checkout.count > 0
            ? Math.round(
                (cohortGroups.abandoned_checkout.approved_count /
                  cohortGroups.abandoned_checkout.count) *
                  1000
              ) / 10
            : 0,
        percentage_of_total: Math.round(
          (cohortGroups.abandoned_checkout.volume_paise / totalVolume) * 100
        ),
      },
      {
        cohort_key: 'failed_payment',
        label: 'Failed Card/UPI Payments (<48h)',
        count: cohortGroups.failed_payment.count,
        volume_paise: cohortGroups.failed_payment.volume_paise,
        conversion_rate_pct:
          cohortGroups.failed_payment.count > 0
            ? Math.round(
                (cohortGroups.failed_payment.approved_count /
                  cohortGroups.failed_payment.count) *
                  1000
              ) / 10
            : 0,
        percentage_of_total: Math.round(
          (cohortGroups.failed_payment.volume_paise / totalVolume) * 100
        ),
      },
      {
        cohort_key: 'upsell',
        label: 'VIP / Tier Upsell Offers',
        count: cohortGroups.upsell.count,
        volume_paise: cohortGroups.upsell.volume_paise,
        conversion_rate_pct:
          cohortGroups.upsell.count > 0
            ? Math.round(
                (cohortGroups.upsell.approved_count /
                  cohortGroups.upsell.count) *
                  1000
              ) / 10
            : 0,
        percentage_of_total: Math.round(
          (cohortGroups.upsell.volume_paise / totalVolume) * 100
        ),
      },
      {
        cohort_key: 're_engagement',
        label: 'Inactive Customer Re-engagement',
        count: cohortGroups.re_engagement.count,
        volume_paise: cohortGroups.re_engagement.volume_paise,
        conversion_rate_pct:
          cohortGroups.re_engagement.count > 0
            ? Math.round(
                (cohortGroups.re_engagement.approved_count /
                  cohortGroups.re_engagement.count) *
                  1000
              ) / 10
            : 0,
        percentage_of_total: Math.round(
          (cohortGroups.re_engagement.volume_paise / totalVolume) * 100
        ),
      },
    ];
  }
}
