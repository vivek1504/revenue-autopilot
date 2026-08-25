import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { ProcessedAction } from '../types';

interface ActiveRecoveriesTableProps {
  items: ProcessedAction[];
  onSelectVerdict: (item: ProcessedAction) => void;
  searchQuery?: string;
}

export const ActiveRecoveriesTable: React.FC<ActiveRecoveriesTableProps> = ({
  items,
  onSelectVerdict,
  searchQuery = '',
}) => {
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'BLOCKED' | 'ABANDONED' | 'FAILED'>('ALL');
  const [localSearch, setLocalSearch] = useState('');

  const activeSearch = searchQuery || localSearch;

  // Fallback demo data if items is empty before running Autopilot
  const displayItems: ProcessedAction[] =
    items.length > 0
      ? items
      : [
          {
            customerName: 'Acme Corp',
            proposal: {
              customer_id: 'cust_acme_8921',
              action: 'discounted_payment_link',
              amount_paise: 4520000,
              discount_percent: 10,
              expiry_hours: 24,
              reason: 'Customer abandoned checkout at payment gateway step. Issued targeted 10% discount recovery link.',
              opportunity_type: 'abandoned_checkout',
              evidence: { cart_value: 45200, abandonment_time: '2h ago' },
            },
            verdict: {
              verdict: 'APPROVED',
              proposal: {} as any,
              violations: [],
              checked_at: new Date().toISOString(),
            },
            execution: {
              mode: 'simulated',
              idempotency_key: 'idemp_acme_001',
              razorpay_short_url: 'https://rzp.io/i/acme8921',
            },
            auditRecord: {
              sequence: 1,
              timestamp: new Date().toISOString(),
              proposal: {} as any,
              policy_result: {} as any,
              previous_hash: '0000000000000000000000000000000000000000000000000000000000000000',
              record_hash: 'a4b8c9d0e1f23456789abcdef0123456789abcdef0123456789abcdef0123456',
            },
          },
          {
            customerName: 'Stark Industries',
            proposal: {
              customer_id: 'cust_stark_3310',
              action: 'retry_payment_link',
              amount_paise: 1285050,
              discount_percent: 0,
              expiry_hours: 48,
              reason: 'Payment gateway bank timeout (error code: GATEWAY_ERROR). Scheduled smart retry with alternate rails.',
              opportunity_type: 'failed_payment',
              evidence: { failure_reason: 'bank_timeout', attempts: 1 },
            },
            verdict: {
              verdict: 'APPROVED',
              proposal: {} as any,
              violations: [],
              checked_at: new Date().toISOString(),
            },
            execution: {
              mode: 'simulated',
              idempotency_key: 'idemp_stark_002',
              razorpay_short_url: 'https://rzp.io/i/stark3310',
            },
            auditRecord: {
              sequence: 2,
              timestamp: new Date().toISOString(),
              proposal: {} as any,
              policy_result: {} as any,
              previous_hash: 'a4b8c9d0e1f23456789abcdef0123456789abcdef0123456789abcdef0123456',
              record_hash: 'b5c9d0e1f2a3456789abcdef0123456789abcdef0123456789abcdef01234567',
            },
          },
          {
            customerName: 'Wayne Enterprises',
            proposal: {
              customer_id: 'cust_wayne_9940',
              action: 'discounted_payment_link',
              amount_paise: 14500000,
              discount_percent: 30,
              expiry_hours: 12,
              reason: 'Agent attempted 30% discount to win enterprise renewal.',
              opportunity_type: 'abandoned_checkout',
              evidence: { requested_discount: 30 },
            },
            verdict: {
              verdict: 'BLOCKED',
              proposal: {} as any,
              violations: [
                {
                  rule: 'MAX_DISCOUNT_CAP',
                  message: 'Discount 30% exceeds maximum allowed cap of 20%',
                  expected: '≤ 20%',
                  actual: '30%',
                },
              ],
              checked_at: new Date().toISOString(),
            },
            auditRecord: {
              sequence: 3,
              timestamp: new Date().toISOString(),
              proposal: {} as any,
              policy_result: {} as any,
              previous_hash: 'b5c9d0e1f2a3456789abcdef0123456789abcdef0123456789abcdef01234567',
              record_hash: 'c6d0e1f2a3b4456789abcdef0123456789abcdef0123456789abcdef01234568',
            },
          },
          {
            customerName: 'Globex Corp',
            proposal: {
              customer_id: 'cust_globex_1102',
              action: 'payment_reminder',
              amount_paise: 842000,
              discount_percent: 5,
              expiry_hours: 24,
              reason: 'High LTV customer with invoice nearing expiration. Sent personalized reminder with 5% early settlement discount.',
              opportunity_type: 're_engagement',
              evidence: { ltv_score: 98 },
            },
            verdict: {
              verdict: 'APPROVED',
              proposal: {} as any,
              violations: [],
              checked_at: new Date().toISOString(),
            },
            execution: {
              mode: 'simulated',
              idempotency_key: 'idemp_globex_004',
              razorpay_short_url: 'https://rzp.io/i/globex1102',
            },
            auditRecord: {
              sequence: 4,
              timestamp: new Date().toISOString(),
              proposal: {} as any,
              policy_result: {} as any,
              previous_hash: 'c6d0e1f2a3b4456789abcdef0123456789abcdef0123456789abcdef01234568',
              record_hash: 'd7e1f2a3b4c5456789abcdef0123456789abcdef0123456789abcdef01234569',
            },
          },
        ];

  const filteredItems = displayItems.filter((item) => {
    if (filter === 'APPROVED' && item.verdict.verdict !== 'APPROVED') return false;
    if (filter === 'BLOCKED' && item.verdict.verdict !== 'BLOCKED') return false;
    if (filter === 'ABANDONED' && item.proposal.opportunity_type !== 'abandoned_checkout') return false;
    if (filter === 'FAILED' && item.proposal.opportunity_type !== 'failed_payment') return false;

    if (activeSearch) {
      const q = activeSearch.toLowerCase();
      return (
        (item.customerName && item.customerName.toLowerCase().includes(q)) ||
        item.proposal.customer_id.toLowerCase().includes(q) ||
        item.proposal.action.toLowerCase().includes(q) ||
        item.proposal.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatRupees = (paise: number = 0) => {
    return (paise / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="panel-card overflow-hidden flex flex-col mb-6">
      {/* Header with Filter Pills */}
      <div className="p-5 border-b border-[#23252b] bg-[#111215] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Active Recoveries & Decision Ledger
            </h3>
            <span className="text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded">
              {filteredItems.length} records
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Evaluated agent proposals with deterministic policy checks and Razorpay action links
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center flex-wrap gap-1 bg-[#14161a] p-1 rounded-lg border border-[#23252b] text-[11px]">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              filter === 'ALL'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('APPROVED')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              filter === 'APPROVED'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('BLOCKED')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              filter === 'BLOCKED'
                ? 'bg-rose-600 text-white font-bold'
                : 'text-rose-400/80 hover:text-rose-300'
            }`}
          >
            Blocked
          </button>
          <button
            onClick={() => setFilter('ABANDONED')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              filter === 'ABANDONED'
                ? 'bg-sky-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Checkout
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#14161a] border-b border-[#23252b] text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <th className="py-3 px-5">Customer Account</th>
              <th className="py-3 px-4">Opportunity</th>
              <th className="py-3 px-4 text-right">Target Amount</th>
              <th className="py-3 px-4">Action & Discount</th>
              <th className="py-3 px-4">Policy Status</th>
              <th className="py-3 px-4 text-center">Compliance</th>
              <th className="py-3 px-4 text-right">Action Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2026]">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                  No recoveries match the active filter.
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => {
                const isApproved = item.verdict.verdict === 'APPROVED';
                return (
                  <tr
                    key={idx}
                    className="hover:bg-[#16181d] transition-colors group cursor-pointer"
                    onClick={() => onSelectVerdict(item)}
                  >
                    {/* Customer */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-md bg-[#1e222b] border border-[#282d3a] flex items-center justify-center font-bold text-slate-300 text-[11px]">
                          {(item.customerName || item.proposal.customer_id).slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 group-hover:text-sky-400 transition-colors">
                            {item.customerName || item.proposal.customer_id}
                          </div>
                          <div className="text-[10px] font-tabular text-slate-500">
                            {item.proposal.customer_id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Opportunity */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#181b22] text-slate-300 border border-[#282d3a] uppercase">
                        {item.proposal.opportunity_type.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Target Amount */}
                    <td className="py-3.5 px-4 text-right font-tabular font-bold text-slate-100">
                      {formatRupees(item.proposal.amount_paise)}
                    </td>

                    {/* Action & Discount */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200">
                          {item.proposal.action.replace('_', ' ')}
                        </span>
                        {item.proposal.discount_percent > 0 && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-tabular">
                            {item.proposal.discount_percent}% OFF
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {isApproved ? (
                        <span className="status-chip status-chip-approved">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          AI Active
                        </span>
                      ) : (
                        <span className="status-chip status-chip-blocked">
                          <AlertTriangle className="w-3 h-3" />
                          Blocked
                        </span>
                      )}
                    </td>

                    {/* Compliance */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </td>

                    {/* Detail Trigger */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectVerdict(item);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#181a20] hover:bg-sky-500/10 hover:text-sky-300 text-slate-300 border border-[#23252b] hover:border-sky-500/30 text-[11px] font-medium transition-all"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3 h-3 text-slate-500" />
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
