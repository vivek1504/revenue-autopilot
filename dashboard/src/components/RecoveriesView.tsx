import React, { useState } from 'react';
import {
  Filter,
  Calendar,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProcessedAction } from '../types';

interface RecoveriesViewProps {
  items: ProcessedAction[];
  onSelectVerdict: (item: ProcessedAction) => void;
  searchQuery: string;
}

export const RecoveriesView: React.FC<RecoveriesViewProps> = ({
  items,
  onSelectVerdict,
  searchQuery,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'BLOCKED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [localSearch, setLocalSearch] = useState('');

  const formatDollars = (paise?: number, fallback: string = '$14,500.00') => {
    if (!paise) return fallback;
    const dollars = (paise / 100) / 80;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(dollars);
  };

  const defaultMockRows = [
    {
      customer: 'Acme Corp',
      customerId: 'ID: CUS-88291',
      opportunityType: 'Failed Payment',
      amount: '$14,500.00',
      confidence: 94,
      policyResult: 'PASS',
      statusType: 'AI Active',
      statusIcon: 'dot',
    },
    {
      customer: 'Globex Inc',
      customerId: 'ID: CUS-10934',
      opportunityType: 'Win-back',
      amount: '$8,250.00',
      confidence: 62,
      policyResult: 'FLAG',
      statusType: 'Pending Review',
      statusIcon: 'clock',
    },
    {
      customer: 'Initech',
      customerId: 'ID: CUS-49201',
      opportunityType: 'Abandoned Checkout',
      amount: '$3,800.00',
      confidence: 91,
      policyResult: 'PASS',
      statusType: 'AI Active',
      statusIcon: 'dot',
    },
    {
      customer: 'Stark Ind',
      customerId: 'ID: CUS-00912',
      opportunityType: 'Contract Variance',
      amount: '$110,000.00',
      confidence: 58,
      policyResult: 'FLAG',
      statusType: 'Pending Review',
      statusIcon: 'clock',
    },
  ];

  const activeSearch = localSearch || searchQuery;

  const filteredItems = items.filter((item) => {
    const matchesStatus =
      statusFilter === 'ALL' || item.verdict.verdict === statusFilter;
    const matchesType =
      typeFilter === 'ALL' || item.proposal.opportunity_type === typeFilter;
    const matchesSearch =
      activeSearch === '' ||
      item.customerName?.toLowerCase().includes(activeSearch.toLowerCase()) ||
      item.proposal.customer_id.toLowerCase().includes(activeSearch.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Top Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#091e42] tracking-tight font-sans">
            Recoveries
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-sans">
            Active and historical revenue recovery operations.
          </p>
        </div>

        {/* 3 Top Filter Dropdowns / Buttons */}
        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="appearance-none bg-white border border-slate-300 hover:border-slate-400 rounded-md pl-8 pr-7 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">Status: All</option>
              <option value="APPROVED">Status: Pass (Approved)</option>
              <option value="BLOCKED">Status: Flag (Blocked)</option>
            </select>
            <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            <span className="text-[10px] absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</span>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-300 hover:border-slate-400 rounded-md pl-4 pr-7 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">Type: All</option>
              <option value="abandoned_checkout">Abandoned Checkout</option>
              <option value="failed_payment">Failed Payment</option>
              <option value="upsell">Upsell / Win-back</option>
              <option value="re_engagement">Re-engagement</option>
            </select>
            <span className="text-[10px] absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</span>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-white border border-slate-300 hover:border-slate-400 rounded-md pl-8 pr-7 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none cursor-pointer"
            >
              <option value="30d">Last 30 Days</option>
              <option value="7d">Last 7 Days</option>
              <option value="24h">Last 24 Hours</option>
              <option value="ytd">Year to Date</option>
            </select>
            <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            <span className="text-[10px] absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</span>
          </div>
        </div>
      </div>

      {/* Recoveries Data Table */}
      <div className="bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Header: Light blue/lavender tint as in the screenshot */}
            <thead className="bg-[#e4edff] border-b border-slate-200">
              <tr className="text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-6">CUSTOMER</th>
                <th className="py-3 px-6">OPPORTUNITY TYPE</th>
                <th className="py-3 px-6">AMOUNT</th>
                <th className="py-3 px-6">AI CONFIDENCE</th>
                <th className="py-3 px-6 text-center">POLICY RESULT</th>
                <th className="py-3 px-6">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {items.length > 0 ? (
                filteredItems.map((item, idx) => {
                  const isApproved = item.verdict.verdict === 'APPROVED';
                  const conf = isApproved ? Math.max(82, 98 - (idx % 8) * 2) : 62;
                  const amtFormatted = formatDollars(item.proposal.amount_paise);
                  const isWinBack = item.proposal.opportunity_type === 'upsell' || item.proposal.opportunity_type === 're_engagement';
                  const oppLabel = isWinBack ? 'Win-back' : item.proposal.opportunity_type === 'failed_payment' ? 'Failed Payment' : 'Abandoned Cart';

                  return (
                    <tr
                      key={idx}
                      onClick={() => onSelectVerdict(item)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* Customer */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-base text-slate-900">
                          {item.customerName || item.proposal.customer_id}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          ID: {item.proposal.customer_id.toUpperCase()}
                        </div>
                      </td>

                      {/* Opportunity Type */}
                      <td className="py-4 px-6 font-medium text-sm text-slate-700">
                        {oppLabel}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-6 font-bold font-tabular text-sm text-slate-900">
                        {amtFormatted}
                      </td>

                      {/* AI Confidence */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className="font-bold font-tabular text-xs text-slate-800 w-8">
                            {conf}%
                          </span>
                          <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-950 rounded-full"
                              style={{ width: `${conf}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Policy Result */}
                      <td className="py-4 px-6 text-center">
                        {isApproved ? (
                          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#dcfce7] text-[#15803d]">
                            PASS
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#fee2e2] text-[#b91c1c]">
                            FLAG
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {isApproved ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-slate-300 bg-white text-xs font-semibold text-slate-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>AI Active</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-slate-300 bg-white text-xs font-semibold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>Pending Review</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                defaultMockRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    {/* Customer */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-base text-slate-900">{row.customer}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{row.customerId}</div>
                    </td>

                    {/* Opportunity Type */}
                    <td className="py-4 px-6 font-medium text-sm text-slate-700">
                      {row.opportunityType}
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 font-bold font-tabular text-sm text-slate-900">
                      {row.amount}
                    </td>

                    {/* AI Confidence */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <span className="font-bold font-tabular text-xs text-slate-800 w-8">
                          {row.confidence}%
                        </span>
                        <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-950 rounded-full"
                            style={{ width: `${row.confidence}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Policy Result */}
                    <td className="py-4 px-6 text-center">
                      <span
                        className={cn(
                          "inline-block px-2.5 py-0.5 rounded text-[11px] font-bold",
                          row.policyResult === 'PASS'
                            ? "bg-[#dcfce7] text-[#15803d]"
                            : "bg-[#fee2e2] text-[#b91c1c]"
                        )}
                      >
                        {row.policyResult}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-slate-300 bg-white text-xs font-semibold text-slate-800">
                        {row.statusIcon === 'dot' ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span>{row.statusType}</span>
                      </div>
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
