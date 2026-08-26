import React from 'react';
import { Database, CheckCircle2 } from 'lucide-react';
import { ProcessedAction } from '../../types';

interface Stage1DiscoveryProps {
  items: ProcessedAction[];
  totalVolumePaise: number;
  formatRupees: (paise: number) => string;
  formatRupeesExact: (paise: number) => string;
}

export const Stage1Discovery: React.FC<Stage1DiscoveryProps> = ({
  items,
  totalVolumePaise,
  formatRupees,
  formatRupeesExact,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Stage 1: SQLite3 Database Discovery & Signal Ingestion
              </h3>
              <p className="text-xs text-slate-500">
                Scans customer carts, failed payment logs, and VIP order frequency in <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">data/merchant.db</code>.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold font-mono text-slate-700 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
            p99 Discovery Scan: ~1.8ms
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Abandoned Carts</span>
            <div className="text-2xl font-bold font-tabular text-slate-900 mt-1">
              {items.filter(i => i.proposal.opportunity_type === 'abandoned_checkout').length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Idle &gt; 1 hour drop-offs</div>
          </div>

          <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Failed Payment Orders</span>
            <div className="text-2xl font-bold font-tabular text-slate-900 mt-1">
              {items.filter(i => i.proposal.opportunity_type === 'failed_payment').length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">UPI/Card checkout declines</div>
          </div>

          <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pipeline Value</span>
            <div className="text-2xl font-bold font-tabular text-slate-900 mt-1">
              {formatRupees(totalVolumePaise)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Raw recoverable candidate sum</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-slate-200 bg-[#f8f9fa] flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Raw Ingested Signals & Candidate Records
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Database trigger evidence passed to the AI reasoning engine
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 font-mono">
            {items.length} Ingested Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#e4edff] border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-6">Customer & Account ID</th>
                <th className="py-3 px-6">Signal Trigger</th>
                <th className="py-3 px-6">Opportunity Cohort</th>
                <th className="py-3 px-6">Target Amount (Paise)</th>
                <th className="py-3 px-6 text-right">Discovery State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="font-bold text-slate-900">{item.customerName || item.proposal.customer_id}</div>
                    <div className="text-slate-400 font-mono text-[11px]">{item.proposal.customer_id}</div>
                  </td>
                  <td className="py-3.5 px-6 font-mono text-slate-700">
                    {item.proposal.opportunity_type === 'abandoned_checkout'
                      ? `Cart idle for ${item.proposal.evidence?.cart_abandoned_hours_ago || 6}h`
                      : item.proposal.opportunity_type === 'failed_payment'
                      ? `Declined order (${item.proposal.evidence?.failed_payment_count || 1} attempts)`
                      : `High LTV customer (LTV: ${formatRupees(item.proposal.evidence?.lifetime_spend_paise || 500000)})`}
                  </td>
                  <td className="py-3.5 px-6 capitalize font-semibold text-slate-800">
                    {item.proposal.opportunity_type.replace('_', ' ')}
                  </td>
                  <td className="py-3.5 px-6 font-bold font-tabular text-slate-900">
                    {formatRupeesExact(item.proposal.amount_paise)}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Discovered
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
