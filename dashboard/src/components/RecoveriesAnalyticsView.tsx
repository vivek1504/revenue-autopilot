import React, { useState } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  DollarSign,
  PieChart,
} from 'lucide-react';
import {
  DashboardSummary,
  ProcessedAction,
  TimeSeriesPoint,
  CohortPerformance,
} from '../types';

interface RecoveriesAnalyticsViewProps {
  summary: DashboardSummary | null;
  timeseries?: TimeSeriesPoint[];
  cohorts?: CohortPerformance[];
  items: ProcessedAction[];
  onSelectVerdict: (item: ProcessedAction) => void;
  searchQuery?: string;
}

export const RecoveriesAnalyticsView: React.FC<
  RecoveriesAnalyticsViewProps
> = ({
  summary,
  timeseries = [],
  cohorts = [],
  items,
  onSelectVerdict,
  searchQuery = '',
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'approved' | 'blocked'>('all');

  const formatRupees = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  const formatCompact = (paise: number) => {
    const rupees = paise / 100;
    if (rupees >= 100000) {
      return `₹${(rupees / 100000).toFixed(1)}L`;
    }
    if (rupees >= 1000) {
      return `₹${(rupees / 1000).toFixed(0)}K`;
    }
    return `₹${rupees.toLocaleString('en-IN')}`;
  };

  // 1. Filtered Items
  const filteredItems = items.filter((item) => {
    const matchesFilter =
      selectedFilter === 'all'
        ? true
        : selectedFilter === 'approved'
        ? item.verdict.verdict === 'APPROVED'
        : item.verdict.verdict === 'BLOCKED';

    const matchesSearch = searchQuery
      ? (item.customerName || item.proposal.customer_id)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        item.proposal.opportunity_type
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        item.proposal.reason.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchesFilter && matchesSearch;
  });

  const approvedItems = items.filter((i) => i.verdict.verdict === 'APPROVED');
  const blockedItems = items.filter((i) => i.verdict.verdict === 'BLOCKED');
  const totalCount = items.length || summary?.opportunities_count || 0;
  const approvedCount = approvedItems.length;
  const blockedCount = blockedItems.length;

  const totalRecPaise =
    (summary?.approved_value_paise || 0) +
    (summary?.unsafe_value_blocked_paise || 0);
  const approvedPaise = summary?.approved_value_paise || 0;
  const recoveredPaise = summary?.recovered_value_paise || 0;

  const chartPoints: TimeSeriesPoint[] =
    timeseries && timeseries.length > 0
      ? timeseries
      : totalRecPaise > 0 || approvedPaise > 0
      ? [
          {
            period: 'Current Run',
            label: 'Current Run',
            recoverable_paise: totalRecPaise,
            recovered_paise: recoveredPaise,
          },
        ]
      : [];

  const maxVolume = Math.max(
    ...chartPoints.map((p) => p.recoverable_paise),
    100000
  );

  const cohortColors: Record<string, string> = {
    abandoned_checkout: 'bg-blue-600',
    failed_payment: 'bg-emerald-500',
    upsell: 'bg-indigo-600',
    re_engagement: 'bg-amber-500',
  };

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0b1c30] tracking-tight">
            Recoveries & Pipeline Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Deep breakdown of automated recovery actions, risk categorization, and cohort conversion efficiency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setSelectedFilter('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
              selectedFilter === 'approved'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setSelectedFilter('blocked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
              selectedFilter === 'blocked'
                ? 'bg-rose-700 text-white border-rose-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Blocked ({blockedCount})
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Total Pipeline Volume
          </div>
          <div className="text-2xl font-black font-tabular text-[#0b1c30]">
            {formatRupees(totalRecPaise)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Identified across {totalCount} opportunities
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Policy Approved Value
          </div>
          <div className="text-2xl font-black font-tabular text-emerald-700">
            {formatRupees(approvedPaise)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {approvedCount} active recovery links
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Revenue Protected
          </div>
          <div className="text-2xl font-black font-tabular text-rose-700">
            {formatRupees(summary?.unsafe_value_blocked_paise || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {blockedCount} risky actions halted
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Webhook Settled
          </div>
          <div className="text-2xl font-black font-tabular text-indigo-700">
            {formatRupees(recoveredPaise)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {summary?.redeemed_count || 0} verified redemptions
          </div>
        </div>
      </div>

      {/* 3. Analytics Chart & Cohort Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Trajectory Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Recovery Volume by Run Period
                </h3>
                <p className="text-xs text-slate-500">
                  Total recoverable value vs. settled revenue.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded text-slate-700 font-mono">
                Postgres Active
              </span>
            </div>

            <div className="h-64 w-full relative pt-4">
              {chartPoints.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                  No timeseries points recorded yet.
                </div>
              ) : (
                <div className="h-full flex items-end justify-between gap-6 px-4 pb-6 border-b border-slate-200">
                  {chartPoints.map((pt, idx) => {
                    const hPercentRec = Math.min(
                      100,
                      Math.max(12, Math.round((pt.recoverable_paise / maxVolume) * 100))
                    );
                    const hPercentApp = Math.min(
                      100,
                      Math.max(8, Math.round((pt.recovered_paise / maxVolume) * 100))
                    );

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                      >
                        <div className="w-full flex items-end justify-center gap-2 h-full">
                          <div
                            style={{ height: `${hPercentRec}%` }}
                            className="w-1/2 max-w-[32px] bg-blue-500/80 hover:bg-blue-600 rounded-t transition-all duration-300 relative"
                          >
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold whitespace-nowrap pointer-events-none transition-opacity z-10">
                              {formatCompact(pt.recoverable_paise)}
                            </div>
                          </div>
                          <div
                            style={{ height: `${hPercentApp}%` }}
                            className="w-1/2 max-w-[32px] bg-emerald-500/90 hover:bg-emerald-600 rounded-t transition-all duration-300 relative"
                          >
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold whitespace-nowrap pointer-events-none transition-opacity z-10">
                              {formatCompact(pt.recovered_paise)}
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 mt-1 truncate">
                          {pt.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-500"></span>
                Total Identified
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span>
                Webhook Settled
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-400">
              Deterministic Verification
            </span>
          </div>
        </div>

        {/* Right: Cohort Distribution */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Opportunity Cohort Yield
                </h3>
                <p className="text-xs text-slate-500">
                  Performance across recovery channels.
                </p>
              </div>
              <PieChart className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3.5 mt-4">
              {cohorts.map((cohort, idx) => {
                const colorClass = cohortColors[cohort.cohort_key] || 'bg-blue-600';
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#f8f9fa] border border-slate-100 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{cohort.label}</span>
                      <span className="font-tabular font-bold text-slate-950">
                        {formatRupees(cohort.volume_paise)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                        style={{ width: `${cohort.percentage_of_total}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-tabular">
                      <span>{cohort.count} opportunities</span>
                      <span>{cohort.conversion_rate_pct}% approval yield</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Complete Action Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Evaluated Proposals & Audit Records ({filteredItems.length})
            </h3>
            <p className="text-xs text-slate-500">
              Complete inventory of agent proposals and deterministic policy evaluations.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8f9fa] border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Opportunity Type</th>
                <th className="py-3 px-6">Amount (₹)</th>
                <th className="py-3 px-6">Discount</th>
                <th className="py-3 px-6">AI Confidence</th>
                <th className="py-3 px-6">Policy Verdict</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No items match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isApproved = item.verdict.verdict === 'APPROVED';
                  const conf = item.proposal.confidence_score
                    ? Math.round(item.proposal.confidence_score * 100)
                    : null;

                  return (
                    <tr
                      key={idx}
                      onClick={() => onSelectVerdict(item)}
                      className="hover:bg-[#f8f9fa] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        <div>{item.customerName || item.proposal.customer_id}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {item.proposal.customer_id}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-700 capitalize">
                        {item.proposal.opportunity_type.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-6 font-bold font-tabular text-slate-900">
                        {formatRupees(item.proposal.amount_paise)}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-700">
                        {item.proposal.discount_percent}%
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-700">
                        {conf !== null ? `${conf}%` : '—'}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded border ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isApproved ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          )}
                          {item.verdict.verdict}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span className="text-slate-400 hover:text-slate-700 text-xs font-semibold">
                          View Verdict &rarr;
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
