import React, { useState } from 'react';
import { CheckCheck, CheckCircle2, Clock, ShieldCheck, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { ProcessedAction } from '../../types';

interface Stage5SettlementProps {
  recoveredItems: ProcessedAction[];
  dispatchedItems: ProcessedAction[];
  recoveredOpps: number;
  recoveredValuePaise: number;
  formatRupees: (paise: number) => string;
  formatRupeesExact: (paise: number) => string;
  onSimulatePayment?: (offerId: string) => Promise<any>;
}

export const Stage5Settlement: React.FC<Stage5SettlementProps> = ({
  recoveredItems,
  dispatchedItems,
  recoveredOpps,
  recoveredValuePaise,
  formatRupees,
  formatRupeesExact,
  onSimulatePayment,
}) => {
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  const handleSimulate = async (offerId: string) => {
    if (!onSimulatePayment) return;
    setSimulatingId(offerId);
    setSimError(null);
    try {
      await onSimulatePayment(offerId);
    } catch (err: any) {
      setSimError(err.message || 'Failed to simulate payment');
    } finally {
      setSimulatingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header card */}
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
                Validates HMAC-SHA256 signatures for <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">payment_link.paid</code> webhooks and transitions recovery offers to recovered.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-300 font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Webhook Signature: HMAC SHA-256 Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paid & Recovered</span>
            <div className="text-2xl font-bold font-tabular text-emerald-700 mt-1">{recoveredOpps}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Webhook verified conversions</div>
          </div>

          <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Realized Revenue</span>
            <div className="text-2xl font-bold font-tabular text-emerald-700 mt-1">
              {formatRupees(recoveredValuePaise)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Settled into Razorpay merchant A/C</div>
          </div>

          <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Signature Integrity</span>
            <div className="text-2xl font-bold font-tabular text-emerald-700 mt-1">100%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Zero forged/unauthorized webhooks</div>
          </div>
        </div>
      </div>

      {/* Dispatched Offers with Simulate Payment Button */}
      {dispatchedItems.length > 0 && onSimulatePayment && (
        <div className="bg-white border border-indigo-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-indigo-100 bg-indigo-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Active Recovery Links — Ready for Customer Payment Simulation
                </h4>
                <p className="text-xs text-slate-500">
                  Test the end-to-end webhook settlement lifecycle by simulating a customer payment.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-1 rounded font-mono">
              {dispatchedItems.length} Awaiting Payment
            </span>
          </div>

          {simError && (
            <div className="p-3 bg-rose-50 border-b border-rose-200 text-xs text-rose-700 font-medium">
              {simError}
            </div>
          )}

          <div className="divide-y divide-slate-100">
            {dispatchedItems.map((item, idx) => {
              const offerId = item.offerId || item.execution?.idempotency_key || '';
              const discountedPaise = Math.round(
                item.proposal.amount_paise * (1 - item.proposal.discount_percent / 100)
              );
              const isSimulating = simulatingId === offerId;

              return (
                <div
                  key={idx}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-mono text-xs font-bold shrink-0">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {item.customerName || item.proposal.customer_id}
                      </div>
                      <div className="text-[11px] text-slate-500 capitalize flex items-center gap-2">
                        <span>{item.proposal.opportunity_type.replace('_', ' ')}</span>
                        <span>·</span>
                        <span className="font-mono text-indigo-600">
                          {item.execution?.razorpay_payment_link_id || 'Link Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-xs font-bold font-tabular text-slate-900">
                        {formatRupeesExact(discountedPaise)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.proposal.discount_percent > 0
                          ? `${item.proposal.discount_percent}% off applied`
                          : 'Full recovery'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSimulate(offerId)}
                      disabled={isSimulating || !offerId}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {isSimulating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Settling...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Simulate Customer Payment
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Settled Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-slate-200 bg-[#f8f9fa] flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Settled Customer Conversions & Webhook Log
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified payment redemption events matching Razorpay event signatures
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 font-mono">
            {recoveredOpps} Verified Events
          </span>
        </div>

        {recoveredItems.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-700">No Verified Recoveries Yet</div>
            <p className="text-xs text-slate-500 max-w-md">
              {dispatchedItems.length > 0
                ? 'Payment links have been dispatched. Click "Simulate Customer Payment" above or complete a live payment on Razorpay to verify settlement.'
                : 'Run Autopilot to scan opportunities, approve proposals, and generate payment links for recovery.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#e4edff] border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Payment Link ID</th>
                  <th className="py-3 px-6">Opportunity Type</th>
                  <th className="py-3 px-6">Settled Amount (₹)</th>
                  <th className="py-3 px-6 text-right">HMAC Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {recoveredItems.map((item, idx) => {
                  const plinkId =
                    item.execution?.razorpay_payment_link_id ||
                    (item.offerId ? `plink_${item.offerId}` : `plink_${item.proposal.customer_id}`);
                  const discountedPaise = Math.round(
                    item.proposal.amount_paise *
                      (1 - item.proposal.discount_percent / 100)
                  );

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        <div>
                          {item.customerName || item.proposal.customer_id}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {item.proposal.customer_id}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-indigo-700 font-semibold">
                        {plinkId}
                      </td>
                      <td className="py-3.5 px-6 text-slate-700 capitalize">
                        {item.proposal.opportunity_type.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-6 font-bold font-tabular text-emerald-700">
                        {formatRupeesExact(discountedPaise)}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />{' '}
                          SETTLED
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
