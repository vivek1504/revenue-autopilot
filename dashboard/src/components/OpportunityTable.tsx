import React, { useState } from 'react';
import { Search, ExternalLink, ShieldCheck, ShieldAlert, Filter } from 'lucide-react';
import { ProcessedAction } from '../types';

interface OpportunityTableProps {
  items: ProcessedAction[];
  onSelectVerdict: (item: ProcessedAction) => void;
}

export const OpportunityTable: React.FC<OpportunityTableProps> = ({
  items,
  onSelectVerdict,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'BLOCKED'>('ALL');

  const filteredItems = items.filter((item) => {
    const matchesFilter =
      filter === 'ALL' || item.verdict.verdict === filter;
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      (item.customerName && item.customerName.toLowerCase().includes(searchLower)) ||
      item.proposal.customer_id.toLowerCase().includes(searchLower) ||
      item.proposal.action.toLowerCase().includes(searchLower) ||
      item.proposal.reason.toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  const formatRupees = (paise: number = 0) => {
    return (paise / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="glass-card p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            📊 Decision & Execution Ledger
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Full record of AI agent proposals evaluated by the deterministic policy engine.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search customer, action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-surface border border-[var(--border-subtle)] text-xs text-white placeholder-[var(--text-muted)] pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 w-48 md:w-64"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-surface p-1 rounded-lg border border-[var(--border-subtle)] text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                filter === 'ALL'
                  ? 'bg-slate-700 text-white'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilter('APPROVED')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                filter === 'APPROVED'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-400/80 hover:text-emerald-300'
              }`}
            >
              Approved ({items.filter((i) => i.verdict.verdict === 'APPROVED').length})
            </button>
            <button
              onClick={() => setFilter('BLOCKED')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                filter === 'BLOCKED'
                  ? 'bg-rose-600 text-white'
                  : 'text-rose-400/80 hover:text-rose-300'
              }`}
            >
              Blocked ({items.filter((i) => i.verdict.verdict === 'BLOCKED').length})
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[var(--text-secondary)]">
          <thead className="bg-surface/80 text-[var(--text-muted)] uppercase tracking-wider font-semibold border-b border-[var(--border-subtle)]">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Opportunity</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target Amount</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Verdict</th>
              <th className="px-4 py-3">Link / Execution</th>
              <th className="px-4 py-3 text-right">Policy Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  No records match the current search filter. Run Autopilot to populate data.
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => {
                const isApproved = item.verdict.verdict === 'APPROVED';
                return (
                  <tr key={idx} className="hover:bg-surface/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">
                      <div>{item.customerName || item.proposal.customer_id}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">
                        {item.proposal.customer_id}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="badge badge-simulated text-[10px]">
                        {item.proposal.opportunity_type.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-medium text-white">
                      {item.proposal.action.replace('_', ' ')}
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-white">
                      {formatRupees(item.proposal.amount_paise)}
                    </td>

                    <td className="px-4 py-3 font-mono">
                      {item.proposal.discount_percent > 0 ? (
                        <span className="text-emerald-400 font-semibold">
                          {item.proposal.discount_percent}%
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">0%</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          isApproved ? 'badge-approved' : 'badge-blocked'
                        }`}
                      >
                        {isApproved ? (
                          <>
                            <ShieldCheck className="w-3 h-3" /> APPROVED
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3 h-3" /> BLOCKED
                          </>
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono">
                      {item.execution?.razorpay_short_url ? (
                        <a
                          href={item.execution.razorpay_short_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline font-semibold"
                        >
                          Payment Link <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : isApproved ? (
                        <span className="text-[11px] text-blue-400 font-medium">
                          Simulated Execution
                        </span>
                      ) : (
                        <span className="text-[11px] text-rose-400/80 italic">
                          Blocked by policy
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onSelectVerdict(item)}
                        className="px-3 py-1 rounded bg-surface border border-[var(--border-subtle)] hover:border-emerald-500 text-xs text-white transition-all"
                      >
                        Inspect Policy →
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
