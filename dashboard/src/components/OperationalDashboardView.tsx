import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Loader2,
  Search,
  ExternalLink,
  Shield,
  Zap,
} from 'lucide-react';
import { AutopilotEvent, DashboardSummary, ProcessedAction } from '../types';

interface OperationalDashboardViewProps {
  status: 'idle' | 'running' | 'complete';
  events: AutopilotEvent[];
  items: ProcessedAction[];
  summary: DashboardSummary | null;
  processedCount: number;
  totalCount: number;
  onSelectVerdict: (item: ProcessedAction) => void;
  onRun: (mode: 'simulated' | 'live') => void;
}

export const OperationalDashboardView: React.FC<OperationalDashboardViewProps> = ({
  status,
  events,
  items,
  summary,
  processedCount,
  totalCount,
  onSelectVerdict,
  onRun,
}) => {
  const [filterVerdict, setFilterVerdict] = useState<'ALL' | 'APPROVED' | 'BLOCKED'>('ALL');
  const [search, setSearch] = useState('');

  const formatRupees = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  const filteredItems = items.filter((item) => {
    const matchesVerdict =
      filterVerdict === 'ALL' || item.verdict.verdict === filterVerdict;
    const matchesSearch =
      search === '' ||
      item.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      item.proposal.customer_id.toLowerCase().includes(search.toLowerCase()) ||
      item.proposal.action.toLowerCase().includes(search.toLowerCase());
    return matchesVerdict && matchesSearch;
  });

  const progressPct =
    totalCount > 0 ? Math.min(100, Math.round((processedCount / totalCount) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2 border-b border-[#e2e8f0]">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 tracking-tight font-sans flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Operational Feed & Active Execution
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time SSE event stream, queue processing throughput, and decision evaluation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRun('simulated')}
            disabled={status === 'running'}
            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
              status === 'running'
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
            }`}
          >
            {status === 'running' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Cycle...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Execute Batch Cycle</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress & Live Processing Banner */}
      <div className="institutional-card p-5 bg-gradient-to-r from-white to-[#f8f9ff]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                status === 'running'
                  ? 'bg-emerald-500 animate-ping'
                  : status === 'complete'
                  ? 'bg-emerald-500'
                  : 'bg-slate-400'
              }`}
            ></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {status === 'running'
                ? 'Live Processing Active'
                : status === 'complete'
                ? 'Batch Intelligence Cycle Finished'
                : 'Engine Ready / Idle'}
            </span>
          </div>
          <div className="text-xs font-tabular font-bold text-slate-700">
            {processedCount} of {totalCount || '...'} Opportunities Handled ({progressPct}%)
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${status === 'complete' ? 100 : progressPct}%` }}
          ></div>
        </div>
      </div>

      {/* Grid: Live Event Stream (5 cols) + Ledger (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Real-time Event Feed */}
        <div className="lg:col-span-5 institutional-card p-5 flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Real-Time Execution Stream
            </h3>
            <span className="text-[11px] font-tabular text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {events.length} events
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-sans text-xs">
            {events.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
                <Activity className="w-8 h-8 text-slate-300 mb-2 animate-pulse" />
                <p>Waiting for intelligence cycle invocation...</p>
              </div>
            ) : (
              [...events].reverse().map((ev, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#f8f9ff] rounded-lg border border-[#e2e8f0] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-tabular text-[10px] text-slate-500">
                    <span className="font-bold uppercase text-slate-700">{ev.type}</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>

                  {ev.type === 'start' && (
                    <p className="text-slate-800">
                      Started scan with <strong>{ev.total_opportunities}</strong> opportunities identified.
                    </p>
                  )}
                  {ev.type === 'proposal' && (
                    <p className="text-slate-800">
                      AI proposed <strong>{ev.proposal.action}</strong> for{' '}
                      <span className="font-mono text-slate-700">{ev.proposal.customer_id}</span> (
                      {formatRupees(ev.proposal.amount_paise)} with {ev.proposal.discount_percent}% off).
                    </p>
                  )}
                  {ev.type === 'verdict' && (
                    <p className={ev.verdict.verdict === 'APPROVED' ? 'text-emerald-700' : 'text-rose-700'}>
                      Policy verdict: <strong>{ev.verdict.verdict}</strong>{' '}
                      {ev.verdict.violations?.length ? `(${ev.verdict.violations.join(', ')})` : '✓ All rules satisfied'}
                    </p>
                  )}
                  {ev.type === 'execution' && (
                    <p className="text-blue-700 font-medium">
                      Executed in {ev.execution.mode} mode. Order: {ev.execution.razorpay_order_id || 'simulated_ok'}
                    </p>
                  )}
                  {ev.type === 'complete' && (
                    <p className="text-emerald-800 font-bold">
                      ✓ Autopilot cycle completed successfully in {ev.summary.duration_ms}ms.
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Decision & Execution Ledger */}
        <div className="lg:col-span-7 institutional-card p-5 flex flex-col h-[520px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Decision & Execution Ledger
            </h3>
            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-[11px] font-semibold">
              <button
                onClick={() => setFilterVerdict('ALL')}
                className={`px-2.5 py-1 rounded transition-all ${
                  filterVerdict === 'ALL' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
                }`}
              >
                All ({items.length})
              </button>
              <button
                onClick={() => setFilterVerdict('APPROVED')}
                className={`px-2.5 py-1 rounded transition-all ${
                  filterVerdict === 'APPROVED' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500'
                }`}
              >
                Approved ({summary?.approved_count || items.filter((i) => i.verdict.verdict === 'APPROVED').length})
              </button>
              <button
                onClick={() => setFilterVerdict('BLOCKED')}
                className={`px-2.5 py-1 rounded transition-all ${
                  filterVerdict === 'BLOCKED' ? 'bg-rose-600 text-white shadow' : 'text-slate-500'
                }`}
              >
                Blocked ({summary?.blocked_count || items.filter((i) => i.verdict.verdict === 'BLOCKED').length})
              </button>
            </div>
          </div>

          {/* Search bar inside ledger */}
          <div className="mb-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by customer name, action, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#f8f9ff] border border-[#cbd5e1] rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold sticky top-0 bg-white">
                  <th className="py-2 px-2.5">Customer</th>
                  <th className="py-2 px-2.5">Action</th>
                  <th className="py-2 px-2.5 text-right">Amount</th>
                  <th className="py-2 px-2.5 text-center">Verdict</th>
                  <th className="py-2 px-2.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-2.5">
                      <div className="font-bold text-slate-900">{item.customerName || item.proposal.customer_id}</div>
                      <div className="text-[10px] font-mono text-slate-400">{item.proposal.customer_id}</div>
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span className="capitalize text-slate-700">{item.proposal.action.replace(/_/g, ' ')}</span>
                      {item.proposal.discount_percent > 0 && (
                        <span className="ml-1 text-[10px] text-blue-600 font-semibold font-tabular">
                          ({item.proposal.discount_percent}% off)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-tabular font-bold text-slate-900">
                      {formatRupees(item.proposal.amount_paise)}
                    </td>
                    <td className="py-2.5 px-2.5 text-center">
                      {item.verdict.verdict === 'APPROVED' ? (
                        <span className="status-badge status-badge-approved">Approved</span>
                      ) : (
                        <span className="status-badge status-badge-blocked">Blocked</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2.5 text-right">
                      <button
                        onClick={() => onSelectVerdict(item)}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
