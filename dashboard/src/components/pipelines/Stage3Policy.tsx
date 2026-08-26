import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ProcessedAction } from '../../types';
import { cn } from '@/lib/utils';

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

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unsafe Value Blocked</span>
            <div className="text-2xl font-bold font-tabular text-rose-600 mt-1">
              {formatRupees(blockedVolumePaise)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Total bounded value intercepted</div>
          </div>
        </div>
      </div>

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
  );
};
