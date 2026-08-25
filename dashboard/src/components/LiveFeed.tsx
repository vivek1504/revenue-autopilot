import React from 'react';
import { Activity, CheckCircle, ShieldAlert, Sparkles, Send } from 'lucide-react';
import { ProcessedAction } from '../types';

interface LiveFeedProps {
  items: ProcessedAction[];
  status: 'idle' | 'running' | 'complete';
  onSelectVerdict: (item: ProcessedAction) => void;
}

export const LiveFeed: React.FC<LiveFeedProps> = ({ items, status, onSelectVerdict }) => {
  if (items.length === 0 && status !== 'running') {
    return null;
  }

  const formatRupees = (paise: number = 0) => {
    return (paise / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="glass-card p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          Real-Time Execution Stream
        </h3>
        <span className="text-xs text-[var(--text-muted)]">
          Showing latest {items.length} events
        </span>
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {items.map((item, idx) => {
          const isApproved = item.verdict.verdict === 'APPROVED';
          return (
            <div
              key={idx}
              onClick={() => onSelectVerdict(item)}
              className={`p-4 rounded-xl border transition-all cursor-pointer animate-slide-in flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                isApproved
                  ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60'
                  : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 p-2 rounded-lg ${
                    isApproved
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {isApproved ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <ShieldAlert className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">
                      {item.customerName || item.proposal.customer_id}
                    </span>
                    <span className="badge badge-simulated text-[10px]">
                      {item.proposal.opportunity_type.replace('_', ' ')}
                    </span>
                    <span
                      className={`badge ${
                        isApproved ? 'badge-approved' : 'badge-blocked'
                      }`}
                    >
                      {item.verdict.verdict}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-1">
                    {item.proposal.reason}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end md:self-center">
                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-white">
                    {formatRupees(item.proposal.amount_paise)}
                  </div>
                  {item.proposal.discount_percent > 0 && (
                    <div className="text-[11px] text-emerald-400">
                      {item.proposal.discount_percent}% off
                    </div>
                  )}
                </div>

                <button className="text-xs px-3 py-1.5 rounded-lg bg-surface border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-active)]">
                  Details →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
