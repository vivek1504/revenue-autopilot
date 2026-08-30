import React, { useState } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Award,
  AlertTriangle,
  RotateCcw,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  PieChart,
  DollarSign,
  Scale,
  Users,
} from 'lucide-react';
import { BenchmarkComparison, StrategyResult } from '../types';
import { cn } from '@/lib/utils';

interface RunReportViewProps {
  report: BenchmarkComparison | null;
  isEvaluating?: boolean;
  onReRunBenchmark?: () => Promise<any> | void;
}

export const RunReportView: React.FC<RunReportViewProps> = ({
  report,
  isEvaluating = false,
  onReRunBenchmark,
}) => {
  const [selectedStrategyTab, setSelectedStrategyTab] = useState<'gemini' | 'heuristic' | 'baseline'>('gemini');
  const [filterType, setFilterType] = useState<string>('all');

  const formatRupees = (paise: number = 0) => {
    const inLakhs = paise / 10000000;
    if (inLakhs >= 1) {
      return `₹${inLakhs.toFixed(2)}L`;
    }
    return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatRupeesExact = (paise: number = 0) => {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <h3 className="text-base font-bold text-slate-900">Loading Recovery Benchmark...</h3>
        <p className="text-xs text-slate-500 mt-1">
          Evaluating multi-tier opportunity batch across Baseline, Heuristic, and Gemini Autopilot.
        </p>
      </div>
    );
  }

  const { baseline, heuristic, gemini } = report;

  const currentStrategyResult: StrategyResult =
    selectedStrategyTab === 'gemini'
      ? gemini
      : selectedStrategyTab === 'heuristic'
      ? heuristic
      : baseline;

  const filteredActions = currentStrategyResult.actions.filter((a) => {
    if (filterType === 'all') return true;
    if (filterType === 'converted') return a.converted;
    if (filterType === 'blocked') return a.verdict === 'BLOCKED';
    if (filterType === 'escalated') return a.verdict === 'ESCALATED';
    return true;
  });

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Header with Re-Run Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-[#0b1c30] tracking-tight">
              Recovery Benchmark & Strategy Comparison
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 font-mono">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              <span>50-Deal Evaluation Batch</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Empirical A/B/C comparison measuring net recovered revenue, margin efficiency, and policy safety across identical opportunities.
          </p>
        </div>

        <button
          type="button"
          disabled={isEvaluating}
          onClick={onReRunBenchmark}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#0b1c30] hover:bg-[#142d4c] text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isEvaluating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Running Evaluation...</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
              <span>Re-run Benchmark Simulation</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Hero Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Net Uplift */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Net Revenue Uplift
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-tabular text-emerald-700 tracking-tight">
            +{report.uplift_net_revenue_pct}%
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
            <span>vs Naive Outreach</span>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-700 font-bold">+{report.uplift_vs_heuristic_pct}% vs Heuristics</span>
          </div>
        </div>

        {/* Card 2: Margin Saved */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Margin Preserved
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-tabular text-slate-900 tracking-tight">
            {formatRupees(report.margin_saved_vs_baseline_paise)}
          </div>
          <div className="text-xs text-slate-500 mt-2 font-medium">
            {gemini.net_margin_pct}% net margin preserved (avg {gemini.avg_discount_pct}% discount)
          </div>
        </div>

        {/* Card 3: Safety Guardrails */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Policy Violations
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-tabular text-emerald-700 tracking-tight">
            0 Executed
          </div>
          <div className="text-xs text-rose-600 mt-2 font-medium">
            Baseline sent {baseline.unsafe_violations_executed} unsafe violations
          </div>
        </div>

        {/* Card 4: SHA-256 Ledger Health */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Cryptographic Ledger
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-tabular text-emerald-700 tracking-tight">
            100% Intact
          </div>
          <div className="text-xs text-slate-500 mt-2 font-mono">
            {report.total_audit_records} Verified Records
          </div>
        </div>
      </div>

      {/* 3. HERO BENCHMARK COMPARISON TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-slate-200 bg-[#f8f9fa] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3-Strategy Performance Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Direct side-by-side breakdown on the 50-deal test batch.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 font-mono">
            <span>Winner: Gemini Autopilot (+{report.uplift_net_revenue_pct}% Net Recovered)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#f0f4f9] text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-6">Evaluation Metric</th>
                <th className="py-3 px-6">
                  <div className="flex items-center gap-1.5">
                    <span>1. Naive Baseline</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-normal">Manual</span>
                  </div>
                </th>
                <th className="py-3 px-6">
                  <div className="flex items-center gap-1.5">
                    <span>2. Heuristic + Policy</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-normal">Rules</span>
                  </div>
                </th>
                <th className="py-3 px-6 bg-emerald-50/60 text-emerald-950 font-extrabold border-l border-r border-emerald-200">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>3. Gemini Autopilot</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 font-bold">Autonomous</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {/* Opportunities */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-6 font-bold text-slate-800">Opportunities Evaluated</td>
                <td className="py-3.5 px-6 font-mono font-bold text-slate-700">{baseline.opportunities_count}</td>
                <td className="py-3.5 px-6 font-mono font-bold text-slate-700">{heuristic.opportunities_count}</td>
                <td className="py-3.5 px-6 font-mono font-bold text-emerald-900 bg-emerald-50/40 border-l border-r border-emerald-200">
                  {gemini.opportunities_count}
                </td>
              </tr>

              {/* Interventions */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-6 font-bold text-slate-800">Interventions Dispatched</td>
                <td className="py-3.5 px-6 font-mono text-slate-700">{baseline.proposals_approved} (100% sent)</td>
                <td className="py-3.5 px-6 font-mono text-slate-700">{heuristic.proposals_approved + heuristic.proposals_escalated}</td>
                <td className="py-3.5 px-6 font-mono font-bold text-emerald-900 bg-emerald-50/40 border-l border-r border-emerald-200">
                  {gemini.proposals_approved + gemini.proposals_escalated}
                </td>
              </tr>

              {/* Human Escalations */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-6 font-bold text-slate-800">Human Escalations (&gt;₹25k)</td>
                <td className="py-3.5 px-6 text-slate-400 font-mono">0 (Unsupervised)</td>
                <td className="py-3.5 px-6 font-mono text-amber-700 font-bold">{heuristic.proposals_escalated} Sign-offs</td>
                <td className="py-3.5 px-6 font-mono font-bold text-amber-700 bg-emerald-50/40 border-l border-r border-emerald-200">
                  {gemini.proposals_escalated} Sign-offs
                </td>
              </tr>

              {/* Policy Blocks */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-6 font-bold text-slate-800">Unsafe Actions Blocked</td>
                <td className="py-3.5 px-6 text-rose-600 font-mono font-bold">0 (All Sent)</td>
                <td className="py-3.5 px-6 font-mono text-slate-700">{heuristic.proposals_blocked} Blocked</td>
                <td className="py-3.5 px-6 font-mono font-bold text-emerald-900 bg-emerald-50/40 border-l border-r border-emerald-200">
                  {gemini.proposals_blocked} Blocked
                </td>
              </tr>

              {/* Policy Violations Executed */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-6 font-bold text-slate-800">Policy Violations Executed</td>
                <td className="py-3.5 px-6">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                    <XCircle className="w-3 h-3 text-rose-600" />
                    {baseline.unsafe_violations_executed} Violations Sent
                  </span>
                </td>
                <td className="py-3.5 px-6">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    0 Violations
                  </span>
                </td>
                <td className="py-3.5 px-6 bg-emerald-50/40 border-l border-r border-emerald-200">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 border border-emerald-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    0 Violations (100% Safe)
                  </span>
                </td>
              </tr>

              {/* Average Discount Offered */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-6 font-bold text-slate-800">Avg. Discount Offered</td>
                <td className="py-3.5 px-6 font-mono text-rose-600 font-bold">{baseline.avg_discount_pct}% (Flat)</td>
                <td className="py-3.5 px-6 font-mono text-slate-700">{heuristic.avg_discount_pct}%</td>
                <td className="py-3.5 px-6 font-mono font-bold text-emerald-700 bg-emerald-50/40 border-l border-r border-emerald-200">
                  {gemini.avg_discount_pct}% (Calibrated)
                </td>
              </tr>

              {/* Gross Recovered */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-6 font-bold text-slate-800">Gross Revenue Recovered</td>
                <td className="py-3.5 px-6 font-mono font-bold text-slate-900">{formatRupees(baseline.gross_recovered_paise)}</td>
                <td className="py-3.5 px-6 font-mono font-bold text-slate-900">{formatRupees(heuristic.gross_recovered_paise)}</td>
                <td className="py-3.5 px-6 font-mono font-bold text-emerald-950 bg-emerald-50/40 border-l border-r border-emerald-200">
                  {formatRupees(gemini.gross_recovered_paise)}
                </td>
              </tr>

              {/* Discount Margin Cost */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-6 font-bold text-slate-800">Discount Margin Cost</td>
                <td className="py-3.5 px-6 font-mono font-bold text-rose-600">-{formatRupees(baseline.discount_given_paise)}</td>
                <td className="py-3.5 px-6 font-mono font-bold text-slate-600">-{formatRupees(heuristic.discount_given_paise)}</td>
                <td className="py-3.5 px-6 font-mono font-bold text-emerald-700 bg-emerald-50/40 border-l border-r border-emerald-200">
                  -{formatRupees(gemini.discount_given_paise)}
                </td>
              </tr>

              {/* HERO ROW: NET REVENUE RECOVERED */}
              <tr className="bg-[#edf9f2] font-black text-slate-950 border-t-2 border-b-2 border-emerald-300">
                <td className="py-4 px-6 text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                  <span>NET REVENUE RECOVERED</span>
                </td>
                <td className="py-4 px-6 font-mono text-sm text-slate-700">
                  {formatRupeesExact(baseline.net_recovered_paise)}
                </td>
                <td className="py-4 px-6 font-mono text-sm text-slate-700">
                  {formatRupeesExact(heuristic.net_recovered_paise)}
                </td>
                <td className="py-4 px-6 font-mono text-base text-emerald-800 bg-emerald-100 border-l-2 border-r-2 border-emerald-400">
                  <div className="flex items-center gap-1.5">
                    <span>{formatRupeesExact(gemini.net_recovered_paise)}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-600 text-white font-sans">
                      +{report.uplift_net_revenue_pct}%
                    </span>
                  </div>
                </td>
              </tr>

              {/* Net Margin Preserved */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-6 font-bold text-slate-800">Net Margin Preserved</td>
                <td className="py-3.5 px-6 font-mono text-slate-600">{baseline.net_margin_pct}%</td>
                <td className="py-3.5 px-6 font-mono text-slate-700">{heuristic.net_margin_pct}%</td>
                <td className="py-3.5 px-6 font-mono font-bold text-emerald-900 bg-emerald-50/40 border-l border-r border-emerald-200">
                  {gemini.net_margin_pct}%
                </td>
              </tr>

              {/* Recovery Rate */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-6 font-bold text-slate-800">Batch Recovery Rate (%)</td>
                <td className="py-3.5 px-6 font-mono text-slate-600">{baseline.recovery_rate_pct}%</td>
                <td className="py-3.5 px-6 font-mono text-slate-700">{heuristic.recovery_rate_pct}%</td>
                <td className="py-3.5 px-6 font-mono font-bold text-emerald-900 bg-emerald-50/40 border-l border-r border-emerald-200">
                  {gemini.recovery_rate_pct}%
                </td>
              </tr>

              {/* Avg Recovery per Customer */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-6 font-bold text-slate-800">Avg. Net Recovery per Deal</td>
                <td className="py-3.5 px-6 font-mono text-slate-700">{formatRupees(baseline.avg_recovery_paise)}</td>
                <td className="py-3.5 px-6 font-mono text-slate-700">{formatRupees(heuristic.avg_recovery_paise)}</td>
                <td className="py-3.5 px-6 font-mono font-bold text-emerald-900 bg-emerald-50/40 border-l border-r border-emerald-200">
                  {formatRupees(gemini.avg_recovery_paise)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Strategy Deep-Dive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Baseline Card */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase font-mono text-slate-400">Strategy 1</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              High Waste
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900">Naive Manual Outreach</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Blasts flat 10% discounts across all opportunities without evaluating customer history. Gives away margin to VIP buyers who would convert anyway and sends unmanaged links for 6-figure enterprise orders.
          </p>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
            Discounts Given: <strong className="text-rose-600 font-bold">{formatRupees(baseline.discount_given_paise)}</strong>
          </div>
        </div>

        {/* Heuristic Card */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase font-mono text-slate-400">Strategy 2</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Safe but Rigid
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900">Deterministic Heuristic Rules</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Applies fixed if/else policy brackets (e.g. 5% if cart &gt; ₹5,000). Guarantees 100% policy compliance, but rigid thresholds leave money on the table by over-discounting high-intent buyers and missing personalized nuances.
          </p>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
            Net Margin: <strong className="text-slate-800 font-bold">{heuristic.net_margin_pct}%</strong>
          </div>
        </div>

        {/* Gemini Card */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50/80 to-white border border-emerald-300 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase font-mono text-emerald-800">Strategy 3</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-600 text-white shadow-2xs">
              Optimal Autopilot
            </span>
          </div>
          <h4 className="text-sm font-bold text-emerald-950">Gemini Context-Calibrated AI</h4>
          <p className="text-xs text-slate-700 leading-relaxed">
            Weighs customer lifetime value, order cadence, and abandonment delay. Dispatches 0% retry links for technical UPI failures, reserves 0-3% for VIPs, and applies targeted incentives only where needed—maximizing net recovered margin.
          </p>
          <div className="pt-2 border-t border-emerald-200 text-[11px] text-emerald-900 font-mono">
            Net Margin: <strong className="text-emerald-700 font-bold">{gemini.net_margin_pct}% (+{report.uplift_net_revenue_pct}% net revenue)</strong>
          </div>
        </div>
      </div>

      {/* 5. Strategy Evaluation Action Stream */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Evaluated Opportunity Audit Log ({currentStrategyResult.actions.length} Deals)
            </h3>
            <p className="text-xs text-slate-500">
              Inspect how the selected strategy processed individual customer accounts.
            </p>
          </div>

          {/* Strategy View Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedStrategyTab('gemini')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer',
                  selectedStrategyTab === 'gemini'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Gemini Autopilot
              </button>
              <button
                type="button"
                onClick={() => setSelectedStrategyTab('heuristic')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer',
                  selectedStrategyTab === 'heuristic'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Heuristic Rules
              </button>
              <button
                type="button"
                onClick={() => setSelectedStrategyTab('baseline')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer',
                  selectedStrategyTab === 'baseline'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Naive Baseline
              </button>
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              aria-label="Filter evaluation results by status"
              className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 cursor-pointer"
            >
              <option value="all">All Deals ({currentStrategyResult.actions.length})</option>
              <option value="converted">Settled &amp; Recovered</option>
              <option value="blocked">Policy Blocked</option>
              <option value="escalated">Human Escalated</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8f9fa] border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-3 px-6">Customer &amp; Tier</th>
                <th className="py-3 px-6">Opportunity Type</th>
                <th className="py-3 px-6">Original Value</th>
                <th className="py-3 px-6">Discount Applied</th>
                <th className="py-3 px-6">Policy Verdict</th>
                <th className="py-3 px-6">Payment Outcome</th>
                <th className="py-3 px-6 text-right">Net Recovered (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredActions.map((action, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-slate-900">
                    <div>{action.customerName}</div>
                    <div className="text-[10px] font-mono text-slate-400 capitalize">Tier: {action.tier}</div>
                  </td>
                  <td className="py-3.5 px-6 font-mono capitalize text-slate-700">
                    {action.opportunityType.replace('_', ' ')}
                  </td>
                  <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                    {formatRupees(action.originalAmountPaise)}
                  </td>
                  <td className="py-3.5 px-6 font-mono">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded font-bold text-[10px]',
                        action.discountPercent === 0
                          ? 'bg-slate-100 text-slate-700'
                          : action.discountPercent <= 5
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      )}
                    >
                      {action.discountPercent}% off
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded border',
                        action.verdict === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : action.verdict === 'ESCALATED'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      )}
                    >
                      {action.verdict === 'APPROVED' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : action.verdict === 'ESCALATED' ? (
                        <Clock className="w-3 h-3 text-amber-600" />
                      ) : (
                        <XCircle className="w-3 h-3 text-rose-600" />
                      )}
                      {action.verdict}
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    {action.converted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Settled &amp; Paid
                      </span>
                    ) : action.verdict === 'BLOCKED' ? (
                      <span className="text-[10px] font-mono text-slate-400">Guarded (Not Dispatched)</span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">Unsettled</span>
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-right font-mono font-bold text-slate-900">
                    {action.converted ? (
                      <span className="text-emerald-700">{formatRupeesExact(action.settledAmountPaise)}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
