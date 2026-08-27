import React from 'react';
import { X, ShieldCheck, ShieldAlert, CheckCircle2, User, ExternalLink, Hash, Clock } from 'lucide-react';
import { ProcessedAction } from '../types';

interface PolicyVerdictModalProps {
  item: ProcessedAction | null;
  onClose: () => void;
}

export const PolicyVerdictModal: React.FC<PolicyVerdictModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const isApproved = item.verdict.verdict === 'APPROVED';
  const isEscalated = item.verdict.verdict === 'ESCALATED';

  const formatRupees = (paise: number = 0) => {
    return (paise / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    });
  };

  const getVerdictBadgeClass = () => {
    if (isApproved) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (isEscalated) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-rose-100 text-rose-800 border-rose-300';
  };

  const getVerdictIconBg = () => {
    if (isApproved) return 'bg-emerald-600';
    if (isEscalated) return 'bg-amber-600';
    return 'bg-rose-600';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto relative shadow-2xl space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all border border-slate-200"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${getVerdictIconBg()}`}
          >
            {isApproved ? (
              <ShieldCheck className="w-6 h-6" />
            ) : isEscalated ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-950 font-sans">
                Policy Verdict
              </h3>
              <span
                className={`text-[14px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded border ${getVerdictBadgeClass()}`}
              >
                {item.verdict.verdict}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer: <strong className="text-slate-800">{item.customerName || item.proposal.customer_id}</strong> ({item.proposal.customer_id})
            </p>
          </div>
        </div>

        {/* Core Proposal Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f8f9ff] p-4 rounded-lg border border-[#e2e8f0]">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Opportunity</span>
            <div className="text-xs font-bold text-slate-900 capitalize mt-0.5">
              {item.proposal.opportunity_type.replace('_', ' ')}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Target Value</span>
            <div className="text-xs font-bold font-tabular text-slate-900 mt-0.5">
              {formatRupees(item.proposal.amount_paise)}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Discount Offered</span>
            <div className="text-xs font-bold font-tabular text-blue-600 mt-0.5">
              {item.proposal.discount_percent}% off
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Link Expiry</span>
            <div className="text-xs font-bold font-tabular text-slate-900 mt-0.5">
              {item.proposal.expiry_hours} Hours
            </div>
          </div>
        </div>

        {/* AI Agent Reasoning */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            AI Agent Generation & Evidence
          </label>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed font-sans">
            &quot;{item.proposal.reason}&quot;
          </div>
        </div>

        {/* Violations or Passed Rules */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            {isApproved ? 'Policy Rule Check Status' : isEscalated ? 'Human Escalation Threshold' : 'Policy Violations Caught'}
          </label>

          {isApproved ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All deterministic policy rules passed successfully (discount, transaction limit, contact frequency, link expiry).</span>
            </div>
          ) : isEscalated ? (
            <div className="space-y-2">
              {item.verdict.violations.map((v, i) => (
                <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                  <div>
                    <span className="font-bold font-mono text-[11px] block">{v.rule}</span>
                    <p className="mt-0.5">{v.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {item.verdict.violations.map((v, i) => (
                <div key={i} className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                  <div>
                    <span className="font-bold font-mono text-[11px] block">{v.rule}</span>
                    <p className="mt-0.5">{v.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Execution & Audit Info */}
        {item.auditRecord && (
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5 font-mono">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>Audit Seq #{item.auditRecord.sequence}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{item.auditRecord.timestamp}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-950 text-white rounded-md text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
