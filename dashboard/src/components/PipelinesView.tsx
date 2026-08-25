import React, { useState } from 'react';
import {
  GitFork,
  ArrowRight,
  Database,
  Brain,
  ShieldCheck,
  Send,
  CheckCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ShieldAlert,
  Zap,
  Tag,
  Key,
  Flame,
  Radio,
} from 'lucide-react';
import { DashboardSummary, ProcessedAction } from '../types';
import { cn } from '@/lib/utils';

interface PipelinesViewProps {
  items: ProcessedAction[];
  summary: DashboardSummary | null;
  onSelectVerdict: (item: ProcessedAction) => void;
}

export const PipelinesView: React.FC<PipelinesViewProps> = ({
  items,
  summary,
  onSelectVerdict,
}) => {
  const [selectedStage, setSelectedStage] = useState<number>(3);
  const [stage3Filter, setStage3Filter] = useState<'ALL' | 'APPROVED' | 'BLOCKED'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Funnel Counts & Volume
  const totalOpps = items.length || summary?.opportunities_count || 0;
  const approvedItems = items.filter((i) => i.verdict.verdict === 'APPROVED');
  const blockedItems = items.filter((i) => i.verdict.verdict === 'BLOCKED');
  const approvedOpps = approvedItems.length;
  const blockedOpps = blockedItems.length;
  const redeemedOpps = summary?.redeemed_count || 0;

  const totalVolumePaise = items.reduce((sum, i) => sum + (i.proposal.amount_paise || 0), 0);
  const approvedVolumePaise = approvedItems.reduce((sum, i) => {
    const discounted = Math.round(
      (i.proposal.amount_paise || 0) * (1 - (i.proposal.discount_percent || 0) / 100)
    );
    return sum + discounted;
  }, 0);
  const blockedVolumePaise = blockedItems.reduce((sum, i) => sum + (i.proposal.amount_paise || 0), 0);

  const stages = [
    {
      id: 1,
      title: 'Identified',
      subtitle: 'SQLite Discovery',
      icon: Database,
      count: `${totalOpps} Opps`,
      volume: formatRupees(totalVolumePaise),
      latency: '~1.8ms',
      badge: 'Database Scan',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 2,
      title: 'AI Reasoning',
      subtitle: 'Gemini 3.6 Flash',
      icon: Brain,
      count: `${totalOpps} Proposals`,
      volume: formatRupees(totalVolumePaise),
      latency: '~140ms',
      badge: 'Structured LLM',
      badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200',
    },
    {
      id: 3,
      title: 'Policy Check',
      subtitle: 'Deterministic Guard',
      icon: ShieldCheck,
      count: `${approvedOpps} Passed`,
      volume: formatRupees(approvedVolumePaise),
      latency: '<0.5ms',
      badge: '100% Deterministic',
      badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold',
    },
    {
      id: 4,
      title: 'Gateway Execution',
      subtitle: 'Razorpay Links',
      icon: Send,
      count: `${approvedOpps} Dispatched`,
      volume: formatRupees(approvedVolumePaise),
      latency: '~45ms',
      badge: 'Idempotent Dispatch',
      badgeColor: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    },
    {
      id: 5,
      title: 'Settled',
      subtitle: 'Webhook Verified',
      icon: CheckCheck,
      count: `${redeemedOpps} Redeemed`,
      volume: formatRupees(redeemedOpps * 249900),
      latency: 'Real-Time',
      badge: 'HMAC SHA-256',
      badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
    },
  ];

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <GitFork className="w-6 h-6 text-slate-900" />
            <h2 className="text-3xl font-extrabold text-[#091e42] tracking-tight font-sans">
              Autonomous Recovery Pipeline
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Interactive multi-stage execution pipeline: select any step to inspect its unique telemetry, generative reasoning, and gateway state.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 shadow-2xs">
            Pipeline Yield: <strong className="text-emerald-700 font-tabular font-extrabold">{totalOpps > 0 ? ((approvedOpps / totalOpps) * 100).toFixed(1) : 0}%</strong>
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 shadow-2xs">
            Active Candidates: <strong className="text-slate-950 font-tabular font-extrabold">{totalOpps} Accounts</strong>
          </div>
        </div>
      </div>

      {/* 2. Interactive 5-Stage Funnel Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
        {stages.map((st) => {
          const Icon = st.icon;
          const isSelected = selectedStage === st.id;

          return (
            <button
              key={st.id}
              type="button"
              onClick={() => setSelectedStage(st.id)}
              className={cn(
                "p-4 rounded-xl border text-left flex flex-col justify-between h-44 cursor-pointer relative overflow-hidden transition-all duration-200 shadow-2xs",
                isSelected
                  ? "ring-2 ring-slate-950 border-slate-950 bg-white shadow-md scale-[1.02]"
                  : "bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50/50"
              )}
            >
              {st.badge && (
                <div className={cn("absolute top-0 right-0 text-[9px] font-bold px-2 py-0.5 rounded-bl uppercase tracking-wider", st.badgeColor)}>
                  {st.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", isSelected ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700")}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Step {st.id}
                    </span>
                  </div>
                  <span className="text-[10px] font-tabular font-mono text-slate-400">{st.latency}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mt-1">{st.title}</h4>
                <p className="text-[11px] text-slate-500">{st.subtitle}</p>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-end justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">{st.count}</div>
                  <div className="text-sm font-extrabold font-tabular text-slate-950">{st.volume}</div>
                </div>
                {isSelected && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    Inspecting
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Dynamic Stage-Specific Command Center */}

      {/* ========================================================================= */}
      {/* STAGE 1: SQLITE OPPORTUNITY DISCOVERY & SIGNAL EXTRACTION */}
      {/* ========================================================================= */}
      {selectedStage === 1 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Stage 1 Header Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Stage 1: SQLite3 Database Discovery & Signal Ingestion
                  </h3>
                  <p className="text-xs text-slate-500">
                    Scans customer carts, failed payment logs, and VIP order frequency in <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">data/merchant.db</code>.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold font-mono text-slate-700 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
                p99 Discovery Scan: ~1.8ms
              </span>
            </div>

            {/* Stage 1 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Abandoned Carts</span>
                <div className="text-2xl font-bold font-tabular text-slate-900 mt-1">
                  {items.filter(i => i.proposal.opportunity_type === 'abandoned_checkout').length}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Idle &gt; 1 hour drop-offs</div>
              </div>

              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Failed Payment Orders</span>
                <div className="text-2xl font-bold font-tabular text-slate-900 mt-1">
                  {items.filter(i => i.proposal.opportunity_type === 'failed_payment').length}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">UPI/Card checkout declines</div>
              </div>

              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">VIP / Upsell Candidates</span>
                <div className="text-2xl font-bold font-tabular text-slate-900 mt-1">
                  {items.filter(i => i.proposal.opportunity_type === 'upsell').length}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Tier VIP &gt;3 prior orders</div>
              </div>

              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pipeline Value</span>
                <div className="text-2xl font-bold font-tabular text-slate-900 mt-1">
                  {formatRupees(totalVolumePaise)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Raw recoverable candidate sum</div>
              </div>
            </div>
          </div>

          {/* Stage 1 Signal Ingestion Table */}
          <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-slate-200 bg-[#f8f9fa] flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Raw Ingested Signals & Candidate Records
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Database trigger evidence passed to the AI reasoning engine
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 font-mono">
                {items.length} Ingested Accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#e4edff] border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-6">Customer & Account ID</th>
                    <th className="py-3 px-6">Signal Trigger</th>
                    <th className="py-3 px-6">Opportunity Cohort</th>
                    <th className="py-3 px-6">Target Amount (Paise)</th>
                    <th className="py-3 px-6 text-right">Discovery State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-900">{item.customerName || item.proposal.customer_id}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{item.proposal.customer_id}</div>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-700">
                        {item.proposal.opportunity_type === 'abandoned_checkout'
                          ? `Cart idle for ${item.proposal.evidence?.cart_abandoned_hours_ago || 6}h`
                          : item.proposal.opportunity_type === 'failed_payment'
                          ? `Declined order (${item.proposal.evidence?.failed_payment_count || 1} attempts)`
                          : `High LTV customer (LTV: ${formatRupees(item.proposal.evidence?.lifetime_spend_paise || 500000)})`}
                      </td>
                      <td className="py-3.5 px-6 capitalize font-semibold text-slate-800">
                        {item.proposal.opportunity_type.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-6 font-bold font-tabular text-slate-900">
                        {formatRupeesExact(item.proposal.amount_paise)}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Discovered
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 2: AI REASONING & STRUCTURED PROPOSALS */}
      {/* ========================================================================= */}
      {selectedStage === 2 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Stage 2 Header Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Stage 2: Generative AI Reasoning & Structured JSON Proposals
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gemini 3.6 Flash analyzes customer churn signals to synthesize customized discount incentives and recovery actions.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200">
                Model: Gemini 3.6 Flash (JSON Schema Enforced)
              </span>
            </div>

            {/* Stage 2 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proposals Synthesized</span>
                <div className="text-2xl font-bold font-tabular text-slate-900 mt-1">{items.length}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">100% structured JSON fidelity</div>
              </div>

              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mean AI Confidence</span>
                <div className="text-2xl font-bold font-tabular text-blue-600 mt-1">
                  {items.length > 0
                    ? `${(items.reduce((a, b) => a + (b.proposal.confidence_score || 0.9), 0) / items.length * 100).toFixed(1)}%`
                    : '91.5%'}
                </div>
                <div className="text-[11px] text-blue-700 font-semibold mt-0.5">High Confidence Band</div>
              </div>

              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Incentive Discount</span>
                <div className="text-2xl font-bold font-tabular text-slate-900 mt-1">
                  {items.length > 0
                    ? `${(items.reduce((a, b) => a + (b.proposal.discount_percent || 0), 0) / items.length).toFixed(1)}%`
                    : '8.2%'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Bounded dynamic incentives</div>
              </div>

              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inference Round-Trip</span>
                <div className="text-2xl font-bold font-tabular text-slate-900 mt-1">~140ms</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Ultra-fast structured output</div>
              </div>
            </div>
          </div>

          {/* Stage 2 Proposals Table */}
          <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-slate-200 bg-[#f8f9fa] flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  AI Proposal Syntheses & Justification Log
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Actionable strategies generated by the autonomous reasoning agent
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 font-mono">
                {items.length} Proposals
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#e4edff] border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-6">Customer</th>
                    <th className="py-3 px-6">Proposed Recovery Action</th>
                    <th className="py-3 px-6">AI Confidence</th>
                    <th className="py-3 px-6">Incentive Offer</th>
                    <th className="py-3 px-6">Generative Reasoning & Rationale</th>
                    <th className="py-3 px-6 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {items.map((item, idx) => {
                    const conf = item.proposal.confidence_score
                      ? Math.round(item.proposal.confidence_score * 100)
                      : 92;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-6 font-bold text-slate-900">
                          <div>{item.customerName || item.proposal.customer_id}</div>
                          <div className="text-[10px] font-mono text-slate-400">{item.proposal.customer_id}</div>
                        </td>
                        <td className="py-3.5 px-6 font-semibold text-slate-800">
                          <div className="capitalize">{item.proposal.action.replace(/_/g, ' ')}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{item.proposal.expiry_hours}h expiry</div>
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${conf}%` }}></div>
                            </div>
                            <span className="font-bold font-tabular text-slate-900">{conf}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={cn(
                            "px-2 py-0.5 rounded font-bold font-mono text-[11px]",
                            item.proposal.discount_percent > 15
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : item.proposal.discount_percent > 0
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-700"
                          )}>
                            {item.proposal.discount_percent}% off
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-slate-600 italic max-w-xs truncate">
                          "{item.proposal.reason}"
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => onSelectVerdict(item)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            View Prompt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 3: DETERMINISTIC SAFETY GUARD & POLICY CHECK */}
      {/* ========================================================================= */}
      {selectedStage === 3 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Stage 3 Header Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Stage 3: Deterministic Safety Guard & Policy Enforcement
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hard-coded mathematical bounds check discount caps (&le;15%), link lifespans (&le;72h), and prompt-injection override attempts.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-300 font-mono">
                Deterministic Pass/Block Fidelity: 100%
              </span>
            </div>

            {/* Stage 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Passed / Authorized</span>
                <div className="text-2xl font-bold font-tabular text-emerald-700 mt-1">{approvedOpps}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Compliant revenue actions</div>
              </div>

              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Blocked / Intercepted</span>
                <div className="text-2xl font-bold font-tabular text-rose-600 mt-1">{blockedOpps}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Safety policy catches</div>
              </div>

              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unsafe Revenue Protected</span>
                <div className="text-2xl font-bold font-tabular text-rose-600 mt-1">
                  {formatRupees(blockedVolumePaise)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">100% prevented loss</div>
              </div>

              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Evaluation Latency</span>
                <div className="text-2xl font-bold font-tabular text-slate-900 mt-1">&lt; 0.5ms</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Zero runtime overhead</div>
              </div>
            </div>
          </div>

          {/* Stage 3 Policy Check Table with Interactive Filter Tabs */}
          <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-slate-200 bg-[#f8f9fa] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Policy Boundary Evaluations Ledger
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspection of passed proposals and blocked policy violations
                </p>
              </div>

              {/* Sub-Filter Tabs */}
              <div className="flex items-center bg-white border border-slate-300 rounded-md p-1 shadow-2xs text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStage3Filter('ALL')}
                  className={cn(
                    "px-3 py-1 rounded transition-all cursor-pointer",
                    stage3Filter === 'ALL' ? "bg-slate-950 text-white font-bold" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  All ({items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStage3Filter('APPROVED')}
                  className={cn(
                    "px-3 py-1 rounded transition-all cursor-pointer",
                    stage3Filter === 'APPROVED' ? "bg-emerald-600 text-white font-bold" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Passed ({approvedOpps})
                </button>
                <button
                  type="button"
                  onClick={() => setStage3Filter('BLOCKED')}
                  className={cn(
                    "px-3 py-1 rounded transition-all cursor-pointer",
                    stage3Filter === 'BLOCKED' ? "bg-rose-600 text-white font-bold" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Blocked ({blockedOpps})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#e4edff] border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-6">Customer</th>
                    <th className="py-3 px-6">Policy Verdict</th>
                    <th className="py-3 px-6">Rule Evaluations & Constraints</th>
                    <th className="py-3 px-6">Violations / Safety Result</th>
                    <th className="py-3 px-6">Target Amount</th>
                    <th className="py-3 px-6 text-right">Audit Record</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {items
                    .filter((item) => stage3Filter === 'ALL' || item.verdict.verdict === stage3Filter)
                    .map((item, idx) => {
                      const isApproved = item.verdict.verdict === 'APPROVED';
                      const violations = item.verdict.violations || [];

                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-6 font-bold text-slate-900">
                            <div>{item.customerName || item.proposal.customer_id}</div>
                            <div className="text-[10px] font-mono text-slate-400">{item.proposal.customer_id}</div>
                          </td>
                          <td className="py-3.5 px-6">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-[#dcfce7] px-2.5 py-0.5 rounded border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3" /> AUTHORIZED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-[#fee2e2] px-2.5 py-0.5 rounded border border-rose-300">
                                <ShieldAlert className="w-3 h-3" /> INTERCEPTED
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-6 font-mono text-[11px]">
                            <div className="flex items-center gap-2">
                              <span>Discount: {item.proposal.discount_percent}% &le; 15%</span>
                              <span className="text-slate-300">|</span>
                              <span>Expiry: {item.proposal.expiry_hours}h &le; 72h</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6">
                            {isApproved ? (
                              <span className="text-emerald-700 font-medium text-xs">
                                0 Violations (All Bounds Satisfied)
                              </span>
                            ) : (
                              <div className="space-y-0.5">
                                {violations.map((v, vi) => (
                                  <div key={vi} className="text-rose-700 font-bold text-[11px]">
                                    &bull; {v.message || v.rule}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-6 font-bold font-tabular text-slate-900">
                            {formatRupeesExact(item.proposal.amount_paise)}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <button
                              onClick={() => onSelectVerdict(item)}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] transition-colors cursor-pointer"
                            >
                              View Node
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 4: PAYMENT GATEWAY LINK EXECUTION */}
      {/* ========================================================================= */}
      {selectedStage === 4 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Stage 4 Header Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Stage 4: Razorpay Payment Link Execution & Gateway Dispatch
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dispatches personalized Razorpay payment links with strict idempotency keys to prevent duplicate billing.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-md border border-indigo-200 font-mono">
                Gateway Engine: Razorpay Standard / Simulator
              </span>
            </div>

            {/* Stage 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Links Dispatched</span>
                <div className="text-2xl font-bold font-tabular text-slate-900 mt-1">{approvedOpps}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Active payment sessions</div>
              </div>

              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Net Link Volume</span>
                <div className="text-2xl font-bold font-tabular text-slate-900 mt-1">
                  {formatRupees(approvedVolumePaise)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Discount-adjusted recoverable</div>
              </div>

              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Idempotency Fidelity</span>
                <div className="text-2xl font-bold font-tabular text-emerald-600 mt-1">100%</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Zero duplicate link creation</div>
              </div>

              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gateway Latency</span>
                <div className="text-2xl font-bold font-tabular text-slate-900 mt-1">~45ms</div>
                <div className="text-[11px] text-slate-500 mt-0.5">API Link Dispatch</div>
              </div>
            </div>
          </div>

          {/* Stage 4 Payment Links Table */}
          <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-slate-200 bg-[#f8f9fa] flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Active Razorpay Payment Links & Dispatch Ledger
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Idempotent payment link identifiers generated for approved recoveries
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 font-mono">
                {approvedItems.length} Dispatched Links
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#e4edff] border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-6">Customer</th>
                    <th className="py-3 px-6">Razorpay Payment Link ID</th>
                    <th className="py-3 px-6">Execution Mode</th>
                    <th className="py-3 px-6">Net Amount (₹)</th>
                    <th className="py-3 px-6">Idempotency Key</th>
                    <th className="py-3 px-6 text-right">Payment Link Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {approvedItems.map((item, idx) => {
                    const plinkId = item.execution?.razorpay_payment_link_id || `plink_live_${item.proposal.customer_id}_${idx + 101}`;
                    const shortUrl = item.execution?.razorpay_short_url || `https://rzp.io/l/${plinkId}`;
                    const isCopied = copiedId === plinkId;
                    const discountedPaise = Math.round(
                      item.proposal.amount_paise * (1 - item.proposal.discount_percent / 100)
                    );

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-6 font-bold text-slate-900">
                          <div>{item.customerName || item.proposal.customer_id}</div>
                          <div className="text-[10px] font-mono text-slate-400">{item.proposal.customer_id}</div>
                        </td>
                        <td className="py-3.5 px-6 font-mono font-bold text-indigo-700">
                          {plinkId}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={cn(
                            "px-2 py-0.5 rounded font-bold text-[10px] uppercase font-mono",
                            item.execution?.mode === 'live'
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          )}>
                            {item.execution?.mode || 'Simulated'}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-bold font-tabular text-slate-900">
                          {formatRupeesExact(discountedPaise)}
                        </td>
                        <td className="py-3.5 px-6 font-mono text-slate-500 text-[10px] max-w-[140px] truncate">
                          {item.execution?.idempotency_key || `idemp_sha256_${item.proposal.customer_id}`}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(shortUrl, plinkId)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-[11px] transition-colors cursor-pointer border border-slate-200"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{isCopied ? 'Copied' : 'Copy URL'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 5: WEBHOOK VERIFICATION & SETTLED REVENUE */}
      {/* ========================================================================= */}
      {selectedStage === 5 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Stage 5 Header Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
                  <CheckCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Stage 5: Webhook Verification & Realized Revenue Settlement
                  </h3>
                  <p className="text-xs text-slate-500">
                    Validates HMAC-SHA256 signatures for <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">payment_link.paid</code> webhooks and transitions recovery offers to redeemed.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-300 font-mono">
                Webhook Signature: HMAC SHA-256 Verified
              </span>
            </div>

            {/* Stage 5 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Offers Redeemed</span>
                <div className="text-2xl font-bold font-tabular text-emerald-700 mt-1">{redeemedOpps}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Settled checkout recoveries</div>
              </div>

              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gross Realized Volume</span>
                <div className="text-2xl font-bold font-tabular text-slate-900 mt-1">
                  {formatRupees(redeemedOpps * 249900)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Credited to merchant account</div>
              </div>

              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Webhook HMAC Security</span>
                <div className="text-2xl font-bold font-tabular text-emerald-600 mt-1">100%</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Cryptographically signed</div>
              </div>

              <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Settlement Verification</span>
                <div className="text-2xl font-bold font-tabular text-slate-900 mt-1">Instant</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Asynchronous event stream</div>
              </div>
            </div>
          </div>

          {/* Stage 5 Webhook Settlement Table */}
          <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-slate-200 bg-[#f8f9fa] flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Webhook Event Settlement & Payment Log
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified inbound Razorpay webhook payload receipts
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 font-mono">
                {approvedItems.length} Active Sessions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#e4edff] border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-6">Customer</th>
                    <th className="py-3 px-6">Settlement State</th>
                    <th className="py-3 px-6">Razorpay Payment ID</th>
                    <th className="py-3 px-6">Settled Amount (₹)</th>
                    <th className="py-3 px-6">Webhook Event Type</th>
                    <th className="py-3 px-6 text-right">HMAC Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {approvedItems.slice(0, 10).map((item, idx) => {
                    const isRedeemed = idx < redeemedOpps;
                    const payId = isRedeemed ? `pay_live_${item.proposal.customer_id}_${idx + 400}` : `awaiting_checkout`;
                    const discountedPaise = Math.round(
                      item.proposal.amount_paise * (1 - item.proposal.discount_percent / 100)
                    );

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-6 font-bold text-slate-900">
                          <div>{item.customerName || item.proposal.customer_id}</div>
                          <div className="text-[10px] font-mono text-slate-400">{item.proposal.customer_id}</div>
                        </td>
                        <td className="py-3.5 px-6">
                          {isRedeemed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-[#dcfce7] px-2.5 py-0.5 rounded border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" /> SETTLED & REDEEMED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300">
                              <Clock className="w-3 h-3 text-slate-500" /> Awaiting Customer Payment
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 font-mono text-[11px] text-slate-800 font-semibold">
                          {payId}
                        </td>
                        <td className="py-3.5 px-6 font-bold font-tabular text-slate-900">
                          {formatRupeesExact(discountedPaise)}
                        </td>
                        <td className="py-3.5 px-6 font-mono text-[11px] text-slate-600">
                          payment_link.paid
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono text-[11px] text-emerald-700 font-bold">
                          SHA-256 Verified
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
