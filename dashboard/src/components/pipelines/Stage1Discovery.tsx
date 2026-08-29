import React from 'react';
import { Database, CheckCircle2, Search } from 'lucide-react';
import { ProcessedAction } from '../../types';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';

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
  const abandonedCount = items.filter(i => i.proposal.opportunity_type === 'abandoned_checkout').length;
  const failedCount = items.filter(i => i.proposal.opportunity_type === 'failed_payment').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Card with Discovery Metrics */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shadow-2xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Stage 1: PostgreSQL Database Discovery & Signal Ingestion
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Continuously scans customer checkouts, failed payment transactions, and historical order frequency from PostgreSQL.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold font-mono text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            p99 Discovery Scan: ~1.8ms
          </span>
        </div>

        {/* 3 Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Abandoned Carts
            </span>
            <div className="text-2xl font-extrabold font-tabular text-[#091e42] mt-1">
              {abandonedCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Idle &gt; 1 hour checkout drop-offs</div>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Failed Payment Orders
            </span>
            <div className="text-2xl font-extrabold font-tabular text-[#091e42] mt-1">
              {failedCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">UPI / Card checkout declines</div>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Total Pipeline Ingestion Value
            </span>
            <div className="text-2xl font-extrabold font-tabular text-[#091e42] mt-1">
              {formatRupees(totalVolumePaise)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Raw recoverable candidate volume</div>
          </div>
        </div>
      </div>

      {/* 2. Signals & Candidates Ledger Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]">
        <div className="p-5 border-b border-slate-200/80 bg-white flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Raw Ingested Signals & Candidate Records
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Database trigger evidence passed directly to the AI reasoning engine.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono">
            {items.length} Ingested Opportunities
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-6">Customer & ID</th>
                <th className="py-3 px-6">Signal Trigger Evidence</th>
                <th className="py-3 px-6">Opportunity Cohort</th>
                <th className="py-3 px-6">Candidate Value (₹)</th>
                <th className="py-3 px-6 text-right">Discovery State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <EmptyState
                      title="No signals discovered"
                      description="Run an autopilot scan to ingest opportunities from PostgreSQL."
                    />
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-slate-900">{item.customerName || item.proposal.customer_id}</div>
                      <div className="text-slate-400 font-mono text-[10px]">{item.proposal.customer_id}</div>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-700 text-[11px]">
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
                      <Badge variant="approved" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                        Discovered
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
