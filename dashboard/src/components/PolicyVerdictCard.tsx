import React from 'react';
import { X, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { ProcessedAction } from '../types';

interface PolicyVerdictCardProps {
  item: ProcessedAction | null;
  onClose: () => void;
}

export const PolicyVerdictCard: React.FC<PolicyVerdictCardProps> = ({
  item,
  onClose,
}) => {
  if (!item) return null;

  const isApproved = item.verdict.verdict === 'APPROVED';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card max-w-2xl w-full p-6 border border-emerald-500/30 max-h-[90vh] overflow-y-auto relative animate-slide-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg bg-surface hover:bg-slate-800 text-[var(--text-muted)] hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`p-3 rounded-xl ${
              isApproved
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isApproved ? (
              <ShieldCheck className="w-8 h-8" />
            ) : (
              <ShieldAlert className="w-8 h-8" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">
                Policy Verdict Breakdown
              </h2>
              <span
                className={`badge ${
                  isApproved ? 'badge-approved' : 'badge-blocked'
                }`}
              >
                {item.verdict.verdict}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Customer: <strong className="text-white">{item.customerName || item.proposal.customer_id}</strong> ({item.proposal.customer_id})
            </p>
          </div>
        </div>

        {/* Proposal Details */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-4 rounded-xl bg-surface/60 border border-[var(--border-subtle)] text-xs">
          <div>
            <span className="text-[var(--text-muted)] block mb-0.5">Action Proposed:</span>
            <span className="font-semibold text-white font-mono">{item.proposal.action}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block mb-0.5">Opportunity Type:</span>
            <span className="font-semibold text-white font-mono">{item.proposal.opportunity_type}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block mb-0.5">Proposed Amount:</span>
            <span className="font-semibold text-white font-mono">₹{item.proposal.amount_paise / 100}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block mb-0.5">Proposed Discount:</span>
            <span className="font-semibold text-emerald-400 font-mono">{item.proposal.discount_percent}%</span>
          </div>
        </div>

        {/* Reason / Agent Citation */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            Agent Reasoning & Evidence Citation
          </h4>
          <p className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono">
            {item.proposal.reason}
          </p>
        </div>

        {/* Violations or Clean Policy Output */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            Deterministic Safety Rules Evaluation
          </h4>

          {item.verdict.violations.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>
                All 10 deterministic safety policies passed! Proposal adheres to maximum discount caps, amount limits, frequency constraints, and adversarial checks.
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {item.verdict.violations.map((v, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between font-bold text-rose-300">
                      <span>Rule Violation: {v.rule}</span>
                    </div>
                    <p className="mt-1 text-rose-200">{v.message}</p>
                    <div className="mt-2 flex gap-4 text-[11px] font-mono bg-rose-900/40 p-2 rounded border border-rose-700/30">
                      <span>Expected: <strong className="text-emerald-300">{String(v.expected)}</strong></span>
                      <span>Actual: <strong className="text-rose-300">{String(v.actual)}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cryptographic Audit Token */}
        <div className="p-3.5 rounded-xl bg-surface border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)] flex items-center justify-between">
          <span>Audit Chain Sequence #{item.auditRecord.sequence}</span>
          <span className="text-slate-400">Record Hash: {item.auditRecord.record_hash.slice(0, 16)}...</span>
        </div>
      </div>
    </div>
  );
};
