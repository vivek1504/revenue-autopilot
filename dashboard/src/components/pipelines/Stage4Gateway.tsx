import React, { useState } from 'react';
import { Send, Copy, Check, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';
import { ProcessedAction } from '../../types';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';

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
      {/* 1. Gateway Status Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-2xs">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Stage 4: Razorpay Payment Link Execution & Gateway Dispatch
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dispatches personalized Razorpay payment links with strict idempotency keys to guarantee once-only execution.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 font-mono">
            Gateway Engine: Razorpay Standard / Simulator
          </span>
        </div>

        {/* 3 Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Links Dispatched
            </span>
            <div className="text-2xl font-extrabold font-tabular text-[#091e42] mt-1">
              {approvedOpps}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Active customer payment sessions</div>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Total Net Link Volume
            </span>
            <div className="text-2xl font-extrabold font-tabular text-[#091e42] mt-1">
              {formatRupees(approvedVolumePaise)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Discount-adjusted recoverable value</div>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Duplicate Attempts Blocked
            </span>
            <div className="text-2xl font-extrabold font-tabular text-emerald-700 mt-1">0</div>
            <div className="text-[11px] text-slate-500 mt-0.5">100% Idempotency key protection</div>
          </div>
        </div>
      </div>

      {/* 2. Dispatched Links Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]">
        <div className="p-5 border-b border-slate-200/80 bg-white flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Active Razorpay Payment Links & Dispatch Ledger
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Idempotent payment link identifiers generated for approved recoveries.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono">
            {approvedItems.length} Dispatched Links
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Razorpay Payment Link ID</th>
                <th className="py-3 px-6">Execution Mode</th>
                <th className="py-3 px-6">Net Amount (₹)</th>
                <th className="py-3 px-6">Idempotency Key</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {approvedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <EmptyState
                      title="No payment links dispatched"
                      description="Run an autopilot scan to evaluate opportunities and dispatch links."
                    />
                  </td>
                </tr>
              ) : (
                approvedItems.map((item, idx) => {
                  const plinkId = item.execution?.razorpay_payment_link_id || 'Pending Link';
                  const shortUrl = item.execution?.razorpay_short_url;
                  const isCopied = shortUrl && copiedId === plinkId;
                  const discountedPaise = Math.round(
                    item.proposal.amount_paise * (1 - item.proposal.discount_percent / 100)
                  );

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        <div className="group-hover:text-blue-600 transition-colors">
                          {item.customerName || item.proposal.customer_id}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{item.proposal.customer_id}</div>
                      </td>
                      <td className="py-3.5 px-6 font-mono font-bold text-indigo-700">
                        {plinkId}
                      </td>
                      <td className="py-3.5 px-6">
                        <Badge
                          variant={item.execution?.mode === 'live' ? 'live' : 'simulated'}
                          size="sm"
                        >
                          {item.execution?.mode || 'Simulated'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6 font-bold font-tabular text-slate-900">
                        {formatRupeesExact(discountedPaise)}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-500 text-[10px] max-w-[140px] truncate">
                        {item.execution?.idempotency_key || '—'}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {shortUrl ? (
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(shortUrl, plinkId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-[11px] transition-colors cursor-pointer border border-slate-200"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                              <span>{isCopied ? 'Copied' : 'Copy'}</span>
                            </button>
                            <a
                              href={shortUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                              title="Open Payment Link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
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
