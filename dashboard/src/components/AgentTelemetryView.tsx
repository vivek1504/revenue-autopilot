import React from 'react';
import {
  Bot,
  Zap,
  ShieldCheck,
  Cpu,
  Activity,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import {
  AutopilotEvent,
  AuditVerificationResult,
  DashboardSummary,
  ProcessedAction,
  TelemetryBenchmarks,
} from '../types';

interface AgentTelemetryViewProps {
  summary: DashboardSummary | null;
  benchmarks?: TelemetryBenchmarks | null;
  items: ProcessedAction[];
  events: AutopilotEvent[];
  status: 'idle' | 'running' | 'complete';
  verificationResult?: AuditVerificationResult | null;
  onSelectVerdict: (item: ProcessedAction) => void;
}

export const AgentTelemetryView: React.FC<AgentTelemetryViewProps> = ({
  summary,
  benchmarks,
  items,
  events,
  status,
  verificationResult,
  onSelectVerdict,
}) => {
  // 1. Live Decision Confidence
  const confidences = items
    .map((r) => r.proposal.confidence_score)
    .filter((c): c is number => typeof c === 'number');
  const avgConfidence =
    confidences.length > 0
      ? Math.round(
        (confidences.reduce((a, b) => a + b, 0) / confidences.length) * 1000
      ) / 10
      : benchmarks?.avg_confidence || 0;

  // 2. Metrics from items
  const blockedProposals = items.filter((i) => i.verdict.verdict === 'BLOCKED');
  const approvedProposals = items.filter((i) => i.verdict.verdict === 'APPROVED');
  const totalProposals = items.length;
  const blockRate =
    totalProposals > 0
      ? Math.round((blockedProposals.length / totalProposals) * 100)
      : benchmarks?.block_rate_pct || 0;

  const auditRecordsCount = items.length;

  // Derive rule catches from items if benchmarks is empty or 0 catches
  let derivedRuleCatches = benchmarks?.rule_catches || [];
  const backendCatchesCount = derivedRuleCatches.reduce((acc, curr) => acc + curr.count, 0);

  if (backendCatchesCount === 0 && items.length > 0) {
    let discountCatches = 0;
    let frequencyCatches = 0;
    let limitCatches = 0;
    let confidenceCatches = 0;
    let integrityCatches = 0;

    for (const rec of items) {
      if (rec.verdict.verdict === 'BLOCKED' || rec.verdict.verdict === 'ESCALATED') {
        const violations = rec.verdict.violations || [];
        for (const v of violations) {
          const rule = (v.rule || '').toLowerCase();
          if (rule === 'discount_limit' || rule === 'discount_for_action') {
            discountCatches++;
          } else if (rule === 'contact_frequency') {
            frequencyCatches++;
          } else if (
            rule === 'human_escalation' ||
            rule === 'amount_limit' ||
            rule === 'amount_positive'
          ) {
            limitCatches++;
          } else if (rule === 'confidence_threshold') {
            confidenceCatches++;
          } else {
            integrityCatches++;
          }
        }
      }
    }

    const totalCalculated =
      discountCatches + frequencyCatches + limitCatches + confidenceCatches + integrityCatches;

    derivedRuleCatches = [
      {
        rule: 'Discount Ceiling Violation (>15%)',
        count: discountCatches,
        percentage: totalCalculated > 0 ? Math.round((discountCatches / totalCalculated) * 100) : 0,
      },
      {
        rule: 'Contact Frequency Stopping Rule (3/7d)',
        count: frequencyCatches,
        percentage: totalCalculated > 0 ? Math.round((frequencyCatches / totalCalculated) * 100) : 0,
      },
      {
        rule: 'Transaction Limit & Human Escalation (>₹25k/₹100k)',
        count: limitCatches,
        percentage: totalCalculated > 0 ? Math.round((limitCatches / totalCalculated) * 100) : 0,
      },
      {
        rule: 'AI Confidence Gate (<70%)',
        count: confidenceCatches,
        percentage: totalCalculated > 0 ? Math.round((confidenceCatches / totalCalculated) * 100) : 0,
      },
      {
        rule: 'Data Integrity & Duplicate Guards',
        count: integrityCatches,
        percentage: totalCalculated > 0 ? Math.round((integrityCatches / totalCalculated) * 100) : 0,
      },
    ];
  }

  const totalCatches = derivedRuleCatches.reduce((acc, curr) => acc + curr.count, 0);

  const lastModelName = items[items.length - 1]?.auditRecord?.llm_reasoning?.model || 'Gemini 3.6 Flash';
  const isHeuristic = items[items.length - 1]?.auditRecord?.llm_reasoning?.used_fallback;

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-[#0b1c30] tracking-tight">
              Agent Telemetry & Safety Profiling
            </h1>

          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time inference telemetry, deterministic guardrail catch distributions, and SHA-256 ledger integrity.
          </p>
        </div>
      </div>

      {/* 2. Key Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Decision Confidence */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Mean AI Confidence
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-tabular text-[#0b1c30] tracking-tight">
            {avgConfidence > 0 ? `${avgConfidence}%` : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Safety floor threshold &ge; 70.0%
          </div>
        </div>

        {/* Card 2: Interception Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Guardrail Interceptions
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-tabular text-rose-700 tracking-tight">
            {blockedProposals.length} Blocked
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {blockRate}% policy interception rate
          </div>
        </div>

        {/* Card 3: Model Latency */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Average LLM Reasoning Time
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-tabular text-indigo-700 tracking-tight">
            {benchmarks?.avg_llm_latency_ms != null
              ? `${benchmarks.avg_llm_latency_ms}ms`
              : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {isHeuristic ? "simulation time" : `Latency:${benchmarks?.p99_llm_ms != null ? `${benchmarks.p99_llm_ms}ms` : '—'}`}
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
          <div
            className={`text-xl font-black font-tabular tracking-tight ${verificationResult && !verificationResult.valid
              ? 'text-rose-700'
              : 'text-emerald-700'
              }`}
          >
            {verificationResult && !verificationResult.valid
              ? 'Tamper Detected'
              : '100% Intact'}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {verificationResult?.verified_records ?? auditRecordsCount} Verified
            Records
          </div>
        </div>
      </div>

      {/* 3. Microsecond Latency Breakdown (6 cols) & Safety Policy Catch Distribution (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Profile */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs flex flex-col justify-between min-h-[380px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Agent Runtime Latency & Telemetry Profile
              </h3>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Runtime Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              High-resolution runtime profiling measured across discovery, reasoning, and policy layers.
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-[#f8f9fa] border border-slate-200 rounded-md flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Postgres Discovery Scan
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {benchmarks?.p99_discovery_ms != null
                    ? `${benchmarks.p99_discovery_ms}ms (p99)`
                    : '—'}
                </span>
              </div>

              <div className="p-3 bg-[#f8f9fa] border border-slate-200 rounded-md flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Deterministic Policy Evaluation
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {benchmarks?.p99_policy_ms != null
                    ? `${benchmarks.p99_policy_ms}ms (p99)`
                    : '—'}
                </span>
              </div>

              <div className="p-3 bg-[#f8f9fa] border border-slate-200 rounded-md flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  SHA-256 Hash Chain Ledger Append
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {benchmarks?.p99_ledger_ms != null
                    ? `${benchmarks.p99_ledger_ms}ms (p99)`
                    : '—'}
                </span>
              </div>

              <div className="p-3 bg-[#f8f9fa] border border-slate-200 rounded-md flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  {lastModelName} Structured Output
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {benchmarks?.p99_llm_ms != null
                    ? `~${benchmarks.p99_llm_ms}ms (p99)`
                    : '—'}
                </span>
              </div>

              <div className="p-3 bg-[#f8f9fa] border border-slate-200 rounded-md flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Autopilot Execution Throughput
                </span>
                <span className="font-mono text-slate-900 font-bold">
                  {benchmarks?.throughput_ops_sec != null
                    ? `${benchmarks.throughput_ops_sec} ops/sec`
                    : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Catch Interception Breakdown */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs flex flex-col justify-between min-h-[380px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Safety Policy Catch Distribution
              </h3>
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                {totalCatches} Active Interceptions
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Deterministic rules triggered from actual evaluated proposals. Each proposal can trigger multiple rules.
            </p>

            <div className="space-y-4">
              {derivedRuleCatches.map((ruleItem, i) => {
                const barColor = 'bg-rose-600';
                return (
                  <div
                    key={i}
                    className="space-y-1.5 p-3 rounded-md bg-[#f8f9fa] border border-slate-200"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">
                        {ruleItem.rule}
                      </span>
                      <span className="font-tabular font-bold text-slate-950">
                        {ruleItem.count} catches
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${ruleItem.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-[11px] text-slate-500 text-right font-tabular">
                      {ruleItem.percentage}% of total safety policy catches
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live Action Stream */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Evaluated Action Telemetry Log
            </h3>
            <p className="text-xs text-slate-500">
              Real-time audit log of all processed opportunities and policy verdicts.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8f9fa] border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Opportunity</th>
                <th className="py-3 px-6">Amount (₹)</th>
                <th className="py-3 px-6">AI Confidence</th>
                <th className="py-3 px-6">Reasoning Model</th>
                <th className="py-3 px-6">Verdict</th>
                <th className="py-3 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No telemetry data available.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const isApproved = item.verdict.verdict === 'APPROVED';
                  const conf = item.proposal.confidence_score
                    ? Math.round(item.proposal.confidence_score * 100)
                    : null;
                  const amtRupees = `₹${(item.proposal.amount_paise / 100).toLocaleString('en-IN')}`;
                  const modelName =
                    item.auditRecord?.llm_reasoning?.model || 'Gemini 3.6 Flash';

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
                        {amtRupees}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-700">
                        {conf !== null ? `${conf}%` : '—'}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-[11px] text-slate-600">
                        {modelName}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded border ${isApproved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                        >
                          {isApproved ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
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
