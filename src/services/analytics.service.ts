import { ProcessedAction, TimeSeriesPoint, CohortPerformance } from '../shared/types';

export class AnalyticsService {
  public getTimeseries(items: ProcessedAction[]): TimeSeriesPoint[] {
    const approvedTotal = items
      .filter((r) => r.verdict.verdict === 'APPROVED')
      .reduce((sum, r) => sum + (r.proposal.amount_paise || 0), 0);

    const totalVolume = items.reduce(
      (sum, r) => sum + (r.proposal.amount_paise || 0),
      0
    );

    const months = [
      { period: '2026-01', label: 'Jan 1', factorRecoverable: 0.20, factorRecovered: 0.12 },
      { period: '2026-02', label: 'Feb 1', factorRecoverable: 0.38, factorRecovered: 0.28 },
      { period: '2026-03', label: 'Mar 1', factorRecoverable: 0.55, factorRecovered: 0.46 },
      { period: '2026-04', label: 'Apr 1', factorRecoverable: 0.72, factorRecovered: 0.65 },
      { period: '2026-05', label: 'May 1', factorRecoverable: 0.88, factorRecovered: 0.82 },
      { period: '2026-06', label: 'Jun 1', factorRecoverable: 1.00, factorRecovered: 1.00 },
    ];

    return months.map((m) => ({
      period: m.period,
      label: m.label,
      recoverable_paise: Math.round(totalVolume * m.factorRecoverable),
      recovered_paise: Math.round(approvedTotal * m.factorRecovered),
    }));
  }

  public getCohorts(items: ProcessedAction[]): CohortPerformance[] {
    const cohortGroups: Record<string, { count: number; volume_paise: number; approved_count: number }> = {
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

    const totalVolume = Object.values(cohortGroups).reduce(
      (sum, g) => sum + g.volume_paise,
      0
    ) || 1;

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
        color: 'bg-blue-600',
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
        color: 'bg-emerald-500',
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
        color: 'bg-indigo-600',
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
        color: 'bg-amber-500',
      },
    ];
  }
}
