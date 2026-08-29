import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, ShieldAlert, Lock, AlertTriangle, ArrowRight } from 'lucide-react';
import { ProcessedAction } from '../../types';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';

interface Stage3PolicyProps {
  items: ProcessedAction[];
  approvedOpps: number;
  blockedOpps: number;
  blockedVolumePaise: number;
  formatRupees: (paise: number) => string;
  formatRupeesExact: (paise: number) => string;
  onSelectVerdict: (item: ProcessedAction) => void;
}

export const Stage3Policy: React.FC<Stage3PolicyProps> = ({
  items,
  approvedOpps,
  blockedOpps,
  blockedVolumePaise,
  formatRupees,
  formatRupeesExact,
  onSelectVerdict,
}) => {
  const [stage3Filter, setStage3Filter] = useState<'ALL' | 'APPROVED' | 'BLOCKED'>('ALL');

  const filteredItems = items.filter(
    (item) => stage3Filter === 'ALL' || item.verdict.verdict === stage3Filter
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Trust & Boundary Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Stage 3: Deterministic Safety Guard & Policy Enforcement
                </h3>

              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-sans">
                <strong className="text-slate-700">AI proposes, deterministic policy decides.</strong> Hard-coded mathematical bounds check discount caps (&le;15%), link lifespans (&le;72h), and transaction ceilings.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Metric Summary Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 bg-emerald-50/40 border border-emerald-200/60 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 font-mono">
              Passed / Authorized
            </span>
            <div className="text-2xl font-extrabold font-tabular text-emerald-800 mt-1">
              {approvedOpps}
            </div>
            <div className="text-[11px] text-emerald-700/80 mt-0.5">Compliant revenue actions</div>
          </div>

          <div className="p-4 bg-rose-50/40 border border-rose-200/60 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 font-mono">
              Blocked / Intercepted
            </span>
            <div className="text-2xl font-extrabold font-tabular text-rose-800 mt-1">
              {blockedOpps}
            </div>
            <div className="text-[11px] text-rose-700/80 mt-0.5">Safety policy catches & guardrails</div>
          </div>

          <div className="p-4 bg-rose-50/40 border border-rose-200/60 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 font-mono">
              Unsafe Value Blocked
            </span>
            <div className="text-2xl font-extrabold font-tabular text-rose-800 mt-1">
              {formatRupees(blockedVolumePaise)}
            </div>
            <div className="text-[11px] text-rose-700/80 mt-0.5">Total bounded value intercepted</div>
          </div>
        </div>
      </div>

      {/* 2. Policy Boundary Evaluations Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]">
        <div className="p-5 border-b border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Policy Boundary Evaluations Ledger
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditable comparison of passed proposals vs. policy violation interceptions.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs font-semibold shadow-2xs">
            <button
              type="button"
              onClick={() => setStage3Filter('ALL')}
              className={cn(
                'px-3 py-1 rounded-md transition-all cursor-pointer text-xs',
                stage3Filter === 'ALL'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setStage3Filter('APPROVED')}
              className={cn(
                'px-3 py-1 rounded-md transition-all cursor-pointer text-xs',
                stage3Filter === 'APPROVED'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Passed ({approvedOpps})
            </button>
            <button
              type="button"
              onClick={() => setStage3Filter('BLOCKED')}
              className={cn(
                'px-3 py-1 rounded-md transition-all cursor-pointer text-xs',
                stage3Filter === 'BLOCKED'
                  ? 'bg-rose-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Blocked ({blockedOpps})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Policy Verdict</th>
                <th className="py-3 px-6">Rule Evaluations & Bounds</th>
                <th className="py-3 px-6">Violations / Safety Result</th>
                <th className="py-3 px-6">Target Amount</th>
                <th className="py-3 px-6 text-right">Audit Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <EmptyState
                      title="No policy evaluations match filter"
                      description="Select another filter or run a new scan to view policy bounds."
                    />
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isApproved = item.verdict.verdict === 'APPROVED';
                  const isEscalated = item.verdict.verdict === 'ESCALATED';
                  const violations = item.verdict.violations || [];

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        <div className="group-hover:text-blue-600 transition-colors">
                          {item.customerName || item.proposal.customer_id}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{item.proposal.customer_id}</div>
                      </td>
                      <td className="py-3.5 px-6">
                        {isApproved ? (
                          <Badge variant="approved" icon={<CheckCircle2 className="w-3 h-3" />}>
                            Authorized
                          </Badge>
                        ) : isEscalated ? (
                          <Badge variant="escalated" icon={<AlertTriangle className="w-3 h-3" />}>
                            Escalated
                          </Badge>
                        ) : (
                          <Badge variant="blocked" icon={<ShieldAlert className="w-3 h-3" />}>
                            Intercepted
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-[11px] text-slate-700">
                        <div className="flex items-center gap-2">
                          <span>Discount: {item.proposal.discount_percent}% &le; 15%</span>
                          <span className="text-slate-300">|</span>
                          <span>Expiry: {item.proposal.expiry_hours}h &le; 72h</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        {isApproved ? (
                          <span className="text-emerald-700 font-medium text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            0 Violations (All Bounds Satisfied)
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {violations.map((v, vi) => (
                              <div key={vi} className="text-rose-700 font-semibold text-[11px] flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                <span>{v.message || v.rule}</span>
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
                          className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>View Node</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </button>
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
