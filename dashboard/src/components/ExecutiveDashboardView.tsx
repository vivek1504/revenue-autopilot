import React, { useState } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  Zap,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  Clock,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Database,
  ArrowRight,
  Scale,
} from 'lucide-react';
import {
  AutopilotEvent,
  AuditVerificationResult,
  DashboardSummary,
  ProcessedAction,
  TimeSeriesPoint,
} from '../types';
import { MetricCard } from './ui/MetricCard';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';

interface ExecutiveDashboardViewProps {
  summary: DashboardSummary | null;
  timeseries?: TimeSeriesPoint[];
  items: ProcessedAction[];
  events?: AutopilotEvent[];
  status: 'idle' | 'running' | 'complete';
  verificationResult?: AuditVerificationResult | null;
  onSelectVerdict: (item: ProcessedAction) => void;
  onNavigateToTab: (tab: any) => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  summary,
  timeseries = [],
  items,
  events = [],
  status,
  verificationResult,
  onSelectVerdict,
  onNavigateToTab,
}) => {
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

  const executedCount =
    summary?.approved_count ??
    (items.length > 0
      ? items.filter((i) => i.verdict.verdict === 'APPROVED' || i.offerStatus === 'DISPATCHED' || i.offerStatus === 'RECOVERED').length
      : 0);
  const blockedCount =
    summary?.blocked_count ??
    (items.length > 0
      ? items.filter((i) => i.verdict.verdict === 'BLOCKED' && i.offerStatus !== 'DISPATCHED' && i.offerStatus !== 'RECOVERED').length
      : 0);

  const recoveredPaise = summary?.recovered_value_paise || 0;
  const atRiskPaise = summary?.revenue_at_risk_paise || 0;
  const expansionPaise = summary?.expansion_opportunity_paise || 0;
  const blockedPaise = summary?.unsafe_value_blocked_paise || 0;

  const recoveredItems = items.filter((i) => i.offerStatus === 'RECOVERED');
  const discountCostPaise = recoveredItems.reduce((acc, curr) => {
    const original = curr.proposal.amount_paise || 0;
    const net = Math.round(original * (1 - (curr.proposal.discount_percent || 0) / 100));
    return acc + (original - net);
  }, 0);

  const chartPoints: TimeSeriesPoint[] =
    timeseries && timeseries.length > 0 ? timeseries : [];

  const maxVolume = Math.max(
    ...chartPoints.map((p) => p.opportunity_value_paise),
    100000
  );

  return (
    <div className="space-y-8 font-sans animate-fadeIn">
      {/* 1. Page Header with Breadcrumbs & Action Links */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#091e42] tracking-tight">
              Revenue Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Autonomous revenue recovery engine with deterministic policy boundaries and SHA-256 cryptographic audit verification.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateToTab('benchmark')}
            className="px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Scale className="w-3.5 h-3.5 text-emerald-700" />
            <span>Recovery Benchmark</span>
          </button>
          <button
            onClick={() => onNavigateToTab('pipelines')}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <span>Inspect Pipeline</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            onClick={() => onNavigateToTab('audit')}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <span>Audit Ledger</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 2. Top-Level Executive KPI Ribbon (5 Authoritative Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Net Recovered Revenue */}
        <MetricCard
          label="Net Recovered Revenue"
          value={formatRupees(recoveredPaise)}
          valueColor="text-emerald-700"
          subLabel={discountCostPaise > 0 ? `Gross ${formatRupees(recoveredPaise + discountCostPaise)} (-${formatRupees(discountCostPaise)} disc)` : "Verified settlements"}
          subValue={`${summary?.recovered_count || 0} Settled`}
          subValueColor="text-emerald-800"
          icon={CheckCircle2}
          iconBgColor="bg-emerald-50 border-emerald-200"
          iconColor="text-emerald-700"
          highlight={true}
        />

        {/* Card 2: Revenue at Risk */}
        <MetricCard
          label="Revenue at Risk"
          value={formatRupees(atRiskPaise)}
          valueColor="text-[#091e42]"
          subLabel="Failed checkouts"
          subValue={`${summary?.opportunities_count || 0} Identified`}
          subValueColor="text-amber-800"
          icon={TrendingUp}
          iconBgColor="bg-amber-50 border-amber-200"
          iconColor="text-amber-700"
        />

        {/* Card 3: Expansion Opportunity */}
        <MetricCard
          label="Expansion Opportunity"
          value={formatRupees(expansionPaise)}
          valueColor="text-[#091e42]"
          subLabel="Upsell & retention"
          subValue="Estimated"
          subValueColor="text-blue-700"
          icon={Zap}
          iconBgColor="bg-blue-50 border-blue-200"
          iconColor="text-blue-700"
        />

        {/* Card 4: Recovery Conversion */}
        <MetricCard
          label="Recovery Conversion"
          value={summary?.recovery_conversion_pct != null ? `${summary.recovery_conversion_pct}%` : '0%'}
          valueColor="text-[#091e42]"
          subLabel="Recovered / Dispatched"
          subValue={`${summary?.recovered_count || 0}/${summary?.dispatched_count || 0}`}
          subValueColor="text-slate-800"
          icon={TrendingUp}
          iconBgColor="bg-slate-100 border-slate-200"
          iconColor="text-slate-700"
        />

        {/* Card 5: Unsafe Value Blocked */}
        <MetricCard
          label="Unsafe Value Blocked"
          value={formatRupees(blockedPaise)}
          valueColor="text-rose-700"
          subLabel="Policy interceptions"
          subValue={`${blockedCount} Stopped`}
          subValueColor="text-rose-800"
          icon={XCircle}
          iconBgColor="bg-rose-50 border-rose-200"
          iconColor="text-rose-700"
        />
      </div>

      {/* 3. Main Operational Grid: Recovery Volume Chart (7 cols) + Action Decision Stream (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dynamic Recovery Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Recovery Trajectory Over Time
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Opportunity volume detected vs. revenue settled through Razorpay.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Postgres Time-Series</span>
              </div>
            </div>

            {/* SVG Chart Container */}
            <div className="h-64 w-full relative pt-6">
              {chartPoints.length === 0 ? (
                <EmptyState
                  title="No recovery activity recorded yet"
                  description="Run an Autopilot scan from the left navigation to ingest candidate opportunities."
                />
              ) : (
                <div className="h-full flex flex-col justify-end">
                  {/* Subtle Gridlines */}
                  <div className="w-full h-full flex items-end justify-between gap-4 sm:gap-6 px-4 pb-6 border-b border-slate-200 relative">
                    {/* Horizontal Guideline */}
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
                          onMouseEnter={() => setHoveredPoint(pt)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        >
                          <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2 h-full">
                            {/* Identified Opportunity Bar */}
                            <div
                              style={{ height: `${hPercentRec}%` }}
                              className="w-1/2 max-w-[28px] bg-blue-500/80 hover:bg-blue-600 rounded-t transition-all duration-200 relative group-hover:shadow-xs"
                            >
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold whitespace-nowrap pointer-events-none transition-opacity z-20 shadow-md">
                                Opp: {formatCompact(pt.opportunity_value_paise)}
                              </div>
                            </div>
                            {/* Recovered Settlement Bar */}
                            <div
                              style={{ height: `${hPercentApp}%` }}
                              className="w-1/2 max-w-[28px] bg-emerald-500/90 hover:bg-emerald-600 rounded-t transition-all duration-200 relative group-hover:shadow-xs"
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
                Opportunity Value Identified
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                Recovered Settlement
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-400 font-bold">
              100% Policy Bound
            </span>
          </div>
        </div>

        {/* Right: Live Action Decision Stream */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Decision Stream & Policy Log
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Autonomous proposal evaluation in progress.
                </p>
              </div>
              <Badge
                variant={status === 'running' ? 'escalated' : 'neutral'}
                pulse={status === 'running'}
                size="sm"
              >
                {status === 'running' ? 'Scanning...' : 'Ready'}
              </Badge>
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {items.length === 0 ? (
                <EmptyState
                  title="No recovery decisions recorded"
                  description="Run a scan to generate AI proposals and policy bounds."
                />
              ) : (
                items.slice(0, 5).map((item, idx) => {
                  const isApproved = item.verdict.verdict === 'APPROVED';
                  const isEscalated = item.verdict.verdict === 'ESCALATED';

                  return (
                    <div
                      key={idx}
                      onClick={() => onSelectVerdict(item)}
                      className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-200 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isEscalated
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                        >
                          {isApproved ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : isEscalated ? (
                            <Clock className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {item.customerName || item.proposal.customer_id}
                          </div>
                          <div className="text-[10px] text-slate-500 capitalize truncate flex items-center gap-1.5">
                            <span>{item.proposal.opportunity_type.replace('_', ' ')}</span>
                            <span>·</span>
                            <span className="font-mono text-slate-600">{item.proposal.discount_percent}% off</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs font-bold font-tabular text-slate-900">
                          {formatRupees(item.proposal.amount_paise)}
                        </div>
                        <span
                          className={`text-[9px] font-bold uppercase font-mono px-1.5 py-0.2 rounded border ${isApproved
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isEscalated
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                        >
                          {item.verdict.verdict}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Evaluated {items.length} opportunities
            </span>
            <button
              onClick={() => onNavigateToTab('recoveries')}
              className="text-blue-600 font-bold hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Table</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Table: Live Evaluated Actions */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Policy Interventions & Actions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click on any row to open the complete Policy Engine audit breakdown.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('recoveries')}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            All Recoveries ({items.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Opportunity</th>
                <th className="py-3 px-6">Amount (₹)</th>
                <th className="py-3 px-6">Discount</th>
                <th className="py-3 px-6">AI Confidence</th>
                <th className="py-3 px-6">Verdict</th>
                <th className="py-3 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <EmptyState
                      title="No active proposals"
                      description="Run Autopilot to populate revenue recovery opportunities."
                    />
                  </td>
                </tr>
              ) : (
                items.slice(0, 6).map((item, idx) => {
                  const isApproved = item.verdict.verdict === 'APPROVED';
                  const isEscalated = item.verdict.verdict === 'ESCALATED';
                  const conf = item.proposal.confidence_score
                    ? Math.round(item.proposal.confidence_score * 100)
                    : null;
                  const amtRupees = formatRupeesExact(item.proposal.amount_paise);

                  return (
                    <tr
                      key={idx}
                      onClick={() => onSelectVerdict(item)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.customerName || item.proposal.customer_id}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{item.proposal.customer_id}</div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-700 capitalize font-medium">
                        {item.proposal.opportunity_type.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-6 font-bold font-tabular text-slate-900">
                        {amtRupees}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-700 font-semibold">
                        {item.proposal.discount_percent}%
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-700">
                        {conf !== null ? `${conf}%` : '—'}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded border ${item.offerStatus === 'DISPATCHED' || item.offerStatus === 'RECOVERED' || isApproved
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isEscalated && (!item.offerStatus || item.offerStatus === 'ESCALATED')
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                        >
                          {item.offerStatus === 'DISPATCHED' || item.offerStatus === 'RECOVERED' || isApproved ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : isEscalated && (!item.offerStatus || item.offerStatus === 'ESCALATED') ? (
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
                          View
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
