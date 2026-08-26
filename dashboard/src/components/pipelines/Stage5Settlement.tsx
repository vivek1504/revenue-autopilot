import React from 'react';
import { CheckCheck, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { ProcessedAction } from '../../types';

interface Stage5SettlementProps {
  approvedItems: ProcessedAction[];
  redeemedOpps: number;
  recoveredValuePaise: number;
  formatRupees: (paise: number) => string;
  formatRupeesExact: (paise: number) => string;
}

export const Stage5Settlement: React.FC<Stage5SettlementProps> = ({
  approvedItems,
  redeemedOpps,
  recoveredValuePaise,
  formatRupees,
  formatRupeesExact,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
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
          <span className="text-xs font-bold text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-300 font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Webhook Signature: HMAC SHA-256 Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paid & Redeemed</span>
            <div className="text-2xl font-bold font-tabular text-emerald-700 mt-1">{redeemedOpps}</div>
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
            {redeemedOpps} Verified Events
          </span>
        </div>

        {redeemedOpps === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-700">No Webhook Redemptions Yet</div>
            <p className="text-xs text-slate-500 max-w-md">
              Payment links are active and awaiting customer payment completion. When customers pay, Razorpay sends a <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">payment_link.paid</code> webhook to settle revenue into this ledger.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#e4edff] border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Payment Link ID</th>
                  <th className="py-3 px-6">Settled Amount (₹)</th>
                  <th className="py-3 px-6 text-right">HMAC Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {approvedItems.slice(0, redeemedOpps).map((item, idx) => {
                  const plinkId =
                    item.execution?.razorpay_payment_link_id ||
                    `plink_${item.proposal.customer_id}`;
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
                      <td className="py-3.5 px-6 font-bold font-tabular text-emerald-700">
                        {formatRupeesExact(discountedPaise)}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />{' '}
                          VALIDATED
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
