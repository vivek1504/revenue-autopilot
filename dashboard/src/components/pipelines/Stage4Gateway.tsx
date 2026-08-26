import React, { useState } from 'react';
import { Send, Copy, Check } from 'lucide-react';
import { ProcessedAction } from '../../types';
import { cn } from '@/lib/utils';

interface Stage4GatewayProps {
  approvedItems: ProcessedAction[];
  approvedOpps: number;
  approvedVolumePaise: number;
  formatRupees: (paise: number) => string;
  formatRupeesExact: (paise: number) => string;
}

export const Stage4Gateway: React.FC<Stage4GatewayProps> = ({
  approvedItems,
  approvedOpps,
  approvedVolumePaise,
  formatRupees,
  formatRupeesExact,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Duplicate Attempts Blocked</span>
            <div className="text-2xl font-bold font-tabular text-slate-900 mt-1">0</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Idempotency key enforcement</div>
          </div>
        </div>
      </div>

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
                const plinkId = item.execution?.razorpay_payment_link_id || 'Pending Link';
                const shortUrl = item.execution?.razorpay_short_url;
                const isCopied = shortUrl && copiedId === plinkId;
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
                      {item.execution?.idempotency_key || '—'}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {shortUrl ? (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(shortUrl, plinkId)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-[11px] transition-colors cursor-pointer border border-slate-200"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? 'Copied' : 'Copy URL'}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">—</span>
                      )}
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
