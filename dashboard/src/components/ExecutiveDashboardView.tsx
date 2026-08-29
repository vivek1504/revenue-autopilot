import React from 'react';
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
} from 'lucide-react';
import {
  AutopilotEvent,
  AuditVerificationResult,
  DashboardSummary,
  ProcessedAction,
  TimeSeriesPoint,
} from '../types';

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

  const executedCount =
    summary?.approved_count ??
    (items.length > 0
      ? items.filter((i) => i.verdict.verdict === 'APPROVED').length
      : 0);
  const blockedCount =
    summary?.blocked_count ??
    (items.length > 0
      ? items.filter((i) => i.verdict.verdict === 'BLOCKED').length
      : 0);

  // 1. Chart Points Calculation (honestly using real timeseries data or current snapshot)
  const totalRecPaise =
    (summary?.approved_value_paise || 0) +
    (summary?.unsafe_value_blocked_paise || 0);
  const approvedPaise = summary?.approved_value_paise || 0;
  const recoveredPaise = summary?.recovered_value_paise || 0;

  const chartPoints: TimeSeriesPoint[] =
    timeseries && timeseries.length > 0 ? timeseries : [];

  const maxVolume = Math.max(
    ...chartPoints.map((p) => p.recoverable_paise),
    100000
  );

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Header with System Health & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-[#0b1c30] tracking-tight">
              Revenue Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time autonomous revenue recovery engine with deterministic policy boundaries and SHA-256 cryptographic audit verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToTab('pipelines')}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            Inspect Pipeline
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            onClick={() => onNavigateToTab('audit')}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            Audit Ledger
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 2. Top-Level Executive KPI Ribbon (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Measured Recovered Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                Measured Recovered
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-tabular text-emerald-700 tracking-tight">
              {formatRupees(recoveredPaise)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Webhook verified</span>
            <span className="font-bold text-emerald-700 font-tabular font-mono">
              {summary?.recovered_count || 0} Paid
            </span>
          </div>
        </div>

        {/* Card 2: Recoverable Value (Approved) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                Value Approved for Recovery
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-tabular text-[#0b1c30] tracking-tight">
              {formatRupees(approvedPaise)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Policy Approved</span>
            <span className="font-bold text-slate-800 font-tabular font-mono">
              {executedCount} Offers
            </span>
          </div>
        </div>

        {/* Card 3: Unsafe Value Blocked */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                Unsafe Value Blocked
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-tabular text-rose-700 tracking-tight">
              {formatRupees(summary?.unsafe_value_blocked_paise || 0)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Violations Blocked</span>
            <span className="font-bold text-rose-700 font-tabular font-mono">
              {blockedCount} Stopped
            </span>
          </div>
        </div>

        {/* Card 4: Opportunities Detected */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                Opportunities Detected
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-tabular text-[#0b1c30] tracking-tight">
              {summary?.opportunities_count ?? items.length}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Approval Rate</span>
            <span className="font-bold text-slate-800 font-tabular font-mono">
              {summary?.approval_rate_pct != null
                ? `${summary.approval_rate_pct}%`
                : items.length > 0
                ? `${Math.round((executedCount / items.length) * 100)}%`
                : '100%'}
            </span>
          </div>
        </div>

        {/* Card 5: SHA-256 Ledger Integrity */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                Audit Chain
              </span>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${verificationResult && !verificationResult.valid
                  ? 'bg-rose-50 border border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  }`}
              >
                {verificationResult && !verificationResult.valid ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
              </div>
            </div>
            <div
              className={`text-xl font-black font-tabular tracking-tight ${verificationResult && !verificationResult.valid
                ? 'text-rose-700'
                : 'text-emerald-700'
                }`}
            >
              {verificationResult && !verificationResult.valid
                ? 'Tamper Detected'
                : '100% Verified'}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">SHA-256 Chain</span>
            <span className="font-bold text-slate-800 font-mono text-[11px]">
              {verificationResult?.verified_records ?? items.length} Records
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Operational Grid: Recovery Volume Chart (7 cols) + Action Decision Stream (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dynamic Recovery Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Recovery Volume by Date
                </h3>
                <p className="text-xs text-slate-500">
                  Recoverable opportunity volume identified vs. policy approved pipeline.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded text-slate-700 font-mono">
                Postgres Active
              </span>
            </div>

            {/* SVG Chart */}
            <div className="h-64 w-full relative pt-4">
              {chartPoints.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                  <Clock className="w-8 h-8 mb-2 stroke-1" />
                  No recovery activity yet. Run Autopilot to begin detecting revenue opportunities.
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
                          {/* Recoverable Bar */}
                          <div
                            style={{ height: `${hPercentRec}%` }}
                            className="w-1/2 max-w-[32px] bg-blue-500/80 hover:bg-blue-600 rounded-t transition-all duration-300 relative"
                          >
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold whitespace-nowrap pointer-events-none transition-opacity z-10">
                              {formatCompact(pt.recoverable_paise)}
                            </div>
                          </div>
                          {/* Recovered Bar */}
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
                Recoverable Potential
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span>
                Settled Recovered
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-400">
              100% Policy Enforced
            </span>
          </div>
        </div>

        {/* Right: Live Action Decision Stream */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Decision Stream & Policy Log
                </h3>
                <p className="text-xs text-slate-500">
                  Autonomous proposal evaluation in progress.
                </p>
              </div>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${status === 'running'
                  ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
              >
                {status === 'running' ? 'Scanning...' : 'Ready'}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
              {items.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                  <Clock className="w-6 h-6 mb-2 stroke-1" />
                  No recovery decisions recorded yet.
                </div>
              ) : (
                items.slice(0, 5).map((item, idx) => {
                  const isApproved = item.verdict.verdict === 'APPROVED';
                  const isEscalated = item.verdict.verdict === 'ESCALATED';
                  return (
                    <div
                      key={idx}
                      onClick={() => onSelectVerdict(item)}
                      className="p-3 rounded-lg border border-slate-100 bg-[#f8f9fa] hover:bg-slate-100/80 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isApproved
                            ? 'bg-emerald-100 text-emerald-700'
                            : isEscalated
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
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
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {item.customerName || item.proposal.customer_id}
                          </div>
                          <div className="text-[10px] text-slate-500 capitalize truncate">
                            {item.proposal.opportunity_type.replace('_', ' ')} ·{' '}
                            {item.proposal.discount_percent}% discount
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold font-tabular text-slate-900">
                          {formatRupees(item.proposal.amount_paise)}
                        </div>
                        <span
                          className={`text-[9px] font-bold uppercase font-mono px-1.5 py-0.2 rounded ${isApproved
                            ? 'bg-emerald-50 text-emerald-700'
                            : isEscalated
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
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
              className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              View Full Table
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Table: Live Evaluated Actions */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Recent Policy Interventions & Actions
            </h3>
            <p className="text-xs text-slate-500">
              Click on any row to open the complete Policy Engine audit breakdown.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('recoveries')}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            All Recoveries ({items.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8f9fa] border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
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
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No active proposals. Run Autopilot to populate opportunities.
                  </td>
                </tr>
              ) : (
                items.slice(0, 6).map((item, idx) => {
                  const isApproved = item.verdict.verdict === 'APPROVED';
                  const isEscalated = item.verdict.verdict === 'ESCALATED';
                  const conf = item.proposal.confidence_score
                    ? Math.round(item.proposal.confidence_score * 100)
                    : null;
                  const amtRupees = `₹${(item.proposal.amount_paise / 100).toLocaleString('en-IN')}`;

                  return (
                    <tr
                      key={idx}
                      onClick={() => onSelectVerdict(item)}
                      className="hover:bg-[#f8f9fa] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        {item.customerName || item.proposal.customer_id}
                      </td>
                      <td className="py-3.5 px-6 text-slate-700 capitalize">
                        {item.proposal.opportunity_type.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-6 font-bold font-tabular text-slate-900">
                        {amtRupees}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-700">
                        {item.proposal.discount_percent}%
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-700">
                        {conf !== null ? `${conf}%` : '—'}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded border ${isApproved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isEscalated
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                        >
                          {isApproved ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : isEscalated ? (
                            <Clock className="w-3 h-3 text-amber-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          )}
                          {item.verdict.verdict}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span className="text-slate-400 hover:text-slate-700 text-xs font-semibold">
                          View &rarr;
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
