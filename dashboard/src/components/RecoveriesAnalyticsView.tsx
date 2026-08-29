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
  Clock,
  ArrowRight,
  Search,
} from 'lucide-react';
import {
  DashboardSummary,
  ProcessedAction,
  TimeSeriesPoint,
  CohortPerformance,
} from '../types';
import { MetricCard } from './ui/MetricCard';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';

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
  const [hoveredPoint, setHoveredPoint] = useState<TimeSeriesPoint | null>(null);

  const formatRupees = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  const formatRupeesExact = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  // Filtered Items
  const filteredItems = items.filter((item) => {
    const matchesFilter =
      selectedFilter === 'all'
        ? true
        : selectedFilter === 'approved'
        ? item.verdict.verdict === 'APPROVED' || item.offerStatus === 'DISPATCHED' || item.offerStatus === 'RECOVERED'
        : item.verdict.verdict === 'BLOCKED' && item.offerStatus !== 'DISPATCHED' && item.offerStatus !== 'RECOVERED';

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

  const approvedItems = items.filter((i) => i.verdict.verdict === 'APPROVED' || i.offerStatus === 'DISPATCHED' || i.offerStatus === 'RECOVERED');
  const blockedItems = items.filter((i) => i.verdict.verdict === 'BLOCKED' && i.offerStatus !== 'DISPATCHED' && i.offerStatus !== 'RECOVERED');
  const totalCount = items.length || summary?.opportunities_count || 0;
  const approvedCount = approvedItems.length;
  const blockedCount = blockedItems.length;

  const totalRecPaise =
    (summary?.approved_value_paise || 0) +
    (summary?.unsafe_value_blocked_paise || 0);
  const approvedPaise = summary?.approved_value_paise || 0;
  const recoveredPaise = summary?.recovered_value_paise || 0;

  const chartPoints: TimeSeriesPoint[] =
    timeseries && timeseries.length > 0 ? timeseries : [];

  const maxVolume = Math.max(
    ...chartPoints.map((p) => p.opportunity_value_paise),
    100000
  );

  return (
    <div className="space-y-8 font-sans animate-fadeIn">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#091e42] tracking-tight">
              Recoveries & Pipeline Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deep breakdown of automated recovery actions, risk categorization, and cohort conversion efficiency.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs font-semibold shadow-2xs">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer text-xs ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setSelectedFilter('approved')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer text-xs ${
              selectedFilter === 'approved'
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setSelectedFilter('blocked')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer text-xs ${
              selectedFilter === 'blocked'
                ? 'bg-rose-700 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Blocked ({blockedCount})
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          label="Total Pipeline Volume"
          value={formatRupees(totalRecPaise)}
          valueColor="text-[#091e42]"
          subLabel="Opportunities"
          subValue={`${totalCount} Identified`}
          subValueColor="text-slate-800"
          icon={TrendingUp}
          iconBgColor="bg-slate-100 border-slate-200"
          iconColor="text-slate-700"
        />

        <MetricCard
          label="Policy Approved Value"
          value={formatRupees(approvedPaise)}
          valueColor="text-emerald-700"
          subLabel="Active recovery links"
          subValue={`${approvedCount} Dispatched`}
          subValueColor="text-emerald-800"
          icon={CheckCircle2}
          iconBgColor="bg-emerald-50 border-emerald-200"
          iconColor="text-emerald-700"
          highlight={true}
        />

        <MetricCard
          label="Unsafe Value Blocked"
          value={formatRupees(summary?.unsafe_value_blocked_paise || 0)}
          valueColor="text-rose-700"
          subLabel="Risky actions halted"
          subValue={`${blockedCount} Intercepted`}
          subValueColor="text-rose-800"
          icon={XCircle}
          iconBgColor="bg-rose-50 border-rose-200"
          iconColor="text-rose-700"
        />

        <MetricCard
          label="Webhook Settled"
          value={formatRupees(recoveredPaise)}
          valueColor="text-emerald-700"
          subLabel="Verified redemptions"
          subValue={`${summary?.recovered_count || 0} Settled`}
          subValueColor="text-emerald-800"
          icon={ShieldCheck}
          iconBgColor="bg-emerald-50 border-emerald-200"
          iconColor="text-emerald-700"
        />
      </div>

      {/* 3. Analytics Chart & Cohort Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Trajectory Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Recovery Performance Over Time
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total recoverable value vs. settled revenue by date.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Postgres Active</span>
              </div>
            </div>

            <div className="h-64 w-full relative pt-6">
              {chartPoints.length === 0 ? (
                <EmptyState
                  title="No time-series points available"
                  description="Run Autopilot to accumulate recovery time-series data."
                />
              ) : (
                <div className="h-full flex flex-col justify-end">
                  <div className="w-full h-full flex items-end justify-between gap-4 sm:gap-6 px-4 pb-6 border-b border-slate-200 relative">
                    <div className="absolute left-0 right-0 top-1/4 border-b border-dashed border-slate-100 pointer-events-none" />
                    <div className="absolute left-0 right-0 top-2/4 border-b border-dashed border-slate-100 pointer-events-none" />
                    <div className="absolute left-0 right-0 top-3/4 border-b border-dashed border-slate-100 pointer-events-none" />

                    {chartPoints.map((pt, idx) => {
                      const hPercentRec = Math.min(
                        100,
                        Math.max(14, Math.round((pt.opportunity_value_paise / maxVolume) * 100))
                      );
                      const hPercentApp = Math.min(
                        100,
                        Math.max(10, Math.round((pt.recovered_paise / maxVolume) * 100))
                      );

                      return (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer z-10"
                        >
                          <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2 h-full">
                            <div
                              style={{ height: `${hPercentRec}%` }}
                              className="w-1/2 max-w-[28px] bg-blue-500/80 hover:bg-blue-600 rounded-t transition-all duration-200 relative"
                            >
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold whitespace-nowrap pointer-events-none transition-opacity z-20 shadow-md">
                                Opp: {formatCompact(pt.opportunity_value_paise)}
                              </div>
                            </div>
                            <div
                              style={{ height: `${hPercentApp}%` }}
                              className="w-1/2 max-w-[28px] bg-emerald-500/90 hover:bg-emerald-600 rounded-t transition-all duration-200 relative"
                            >
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold whitespace-nowrap pointer-events-none transition-opacity z-20 shadow-md">
                                Rec: {formatCompact(pt.recovered_paise)}
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
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 mt-4 pt-3.5 border-t border-slate-100 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-500" />
                Opportunity Value
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                Settled Revenue
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-400 font-bold">
              Deterministic Verification
            </span>
          </div>
        </div>

        {/* Right: Cohort Distribution */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Opportunity Cohort Yield
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recovery performance broken down across source cohorts.
                </p>
              </div>
              <PieChart className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3 mt-4">
              {cohorts.map((cohort, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>{cohort.label}</span>
                    <span className="font-tabular font-bold text-[#091e42]">
                      {formatRupees(cohort.volume_paise)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${cohort.percentage_of_total}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-tabular font-mono">
                    <span>{cohort.count} opportunities</span>
                    <span className="font-semibold text-slate-700">{cohort.conversion_rate_pct}% conversion rate</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Complete Action Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-white">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Evaluated Proposals & Audit Records ({filteredItems.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete inventory of agent proposals and deterministic policy evaluations.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
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
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <EmptyState
                      title="No matching records"
                      description="No opportunities match your current filter and search query."
                    />
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
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        <div className="group-hover:text-blue-600 transition-colors">{item.customerName || item.proposal.customer_id}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {item.proposal.customer_id}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-700 capitalize font-medium">
                        {item.proposal.opportunity_type.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-6 font-bold font-tabular text-slate-900">
                        {formatRupees(item.proposal.amount_paise)}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-700 font-semibold">
                        {item.proposal.discount_percent}%
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-700">
                        {conf !== null ? `${conf}%` : '—'}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded border ${
                            item.offerStatus === 'DISPATCHED' || item.offerStatus === 'RECOVERED' || isApproved
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : item.verdict.verdict === 'ESCALATED' && (!item.offerStatus || item.offerStatus === 'ESCALATED')
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {item.offerStatus === 'DISPATCHED' || item.offerStatus === 'RECOVERED' || isApproved ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : item.verdict.verdict === 'ESCALATED' && (!item.offerStatus || item.offerStatus === 'ESCALATED') ? (
                            <Clock className="w-3 h-3 text-amber-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          )}
                          {item.offerStatus === 'DISPATCHED'
                            ? 'APPROVED'
                            : item.offerStatus || item.verdict.verdict}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span className="text-slate-400 group-hover:text-blue-600 text-xs font-semibold inline-flex items-center gap-1 transition-colors">
                          View Verdict
                          <ArrowRight className="w-3 h-3" />
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
