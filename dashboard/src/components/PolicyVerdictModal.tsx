import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { ProcessedAction } from '../types';

interface PolicyVerdictModalProps {
  item: ProcessedAction | null;
  onClose: () => void;
  onApprove?: (id: string) => Promise<any> | void;
  onReject?: (id: string) => Promise<any> | void;
}

export const PolicyVerdictModal: React.FC<PolicyVerdictModalProps> = ({
  item,
  onClose,
  onApprove,
  onReject,
}) => {
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const isApproved = item.verdict.verdict === 'APPROVED';
  const isEscalated = item.verdict.verdict === 'ESCALATED';
  const isBlocked = item.verdict.verdict === 'BLOCKED';
  const isDispatched = item.offerStatus === 'DISPATCHED' || (isApproved && (!item.offerStatus || item.offerStatus === 'DISPATCHED'));
  const isRecovered = item.offerStatus === 'RECOVERED';
  const isEscalatedAndUnresolved =
    isEscalated &&
    (item.offerStatus === 'ESCALATED' || !item.offerStatus || item.offerStatus === 'PENDING');
  const targetId = item.offerId || item.proposal.customer_id;

  const handleApprove = async () => {
    if (!targetId || !onApprove || isResolving) return;
    setIsResolving(true);
    try {
      await onApprove(targetId);
      onClose();
    } catch (err) {
      console.error('Failed to approve offer:', err);
    } finally {
      setIsResolving(false);
    }
  };

  const handleReject = async () => {
    if (!targetId || !onReject || isResolving) return;
    setIsResolving(true);
    try {
      await onReject(targetId);
      onClose();
    } catch (err) {
      console.error('Failed to reject offer:', err);
    } finally {
      setIsResolving(false);
    }
  };

  const formatRupees = (paise: number = 0) => {
    return (paise / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    });
  };

  const discountedPaise = Math.round(
    item.proposal.amount_paise * (1 - (item.proposal.discount_percent || 0) / 100)
  );

  const violations = item.verdict.violations || [];

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/20 backdrop-blur-[2px] flex items-center justify-center p-4 transition-all"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 font-sans"
      >
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                Policy Verdict
              </h3>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                  isRecovered
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : isDispatched || isApproved
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : isEscalated
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {isRecovered
                  ? 'Recovered'
                  : isDispatched
                  ? 'Approved & Dispatched'
                  : item.verdict.verdict}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Customer: <strong className="text-slate-800">{item.customerName || item.proposal.customer_id}</strong>{' '}
              <span className="font-mono text-slate-400">({item.proposal.customer_id})</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Key Values Grid */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Opportunity</span>
            <div className="text-slate-900 font-bold capitalize mt-0.5">
              {item.proposal.opportunity_type.replace('_', ' ')}
            </div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Target Amount</span>
            <div className="text-slate-900 font-bold font-mono text-sm mt-0.5">
              {formatRupees(item.proposal.amount_paise)}
            </div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Discount Offered</span>
            <div className="text-slate-900 font-semibold font-mono mt-0.5">
              {item.proposal.discount_percent}% off ({formatRupees(discountedPaise)} net)
            </div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Link Validity</span>
            <div className="text-slate-900 font-semibold font-mono mt-0.5">
              {item.proposal.expiry_hours} Hours
            </div>
          </div>
        </div>

        {/* AI Reasoning */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            AI Generative Rationale
          </span>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed">
            &ldquo;{item.proposal.reason}&rdquo;
          </div>
        </div>

        {/* Policy Enforcement Status */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Policy Check Status
          </span>

          {isApproved || isDispatched || isRecovered ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                All policy rules passed successfully (discount ceiling &le;15%, amount threshold, contact frequency, link expiry &le;72h).
              </span>
            </div>
          ) : isEscalated ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Manager Approval Required</span>
              </div>
              <p className="text-[11px] text-amber-800 pl-5.5">
                Amount exceeds the standard autonomous execution threshold of ₹25,000.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Policy Violations Intercepted</span>
              </div>
              <ul className="list-disc pl-5 text-[11px] space-y-0.5 text-rose-800">
                {violations.map((v, i) => (
                  <li key={i}>{v.message || v.rule}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Audit & Execution Footer Line */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Seq #{item.auditRecord?.sequence || '104'}</span>
          <span>{item.auditRecord?.timestamp || item.verdict.checked_at}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-1">
          {isEscalatedAndUnresolved && onApprove && onReject && (
            <>
              <button
                type="button"
                disabled={isResolving}
                onClick={handleReject}
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={isResolving}
                onClick={handleApprove}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isResolving && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Approve & Execute</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
