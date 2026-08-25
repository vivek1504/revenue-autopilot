import React from 'react';
import { ShoppingCart, AlertCircle, TrendingUp, RefreshCcw, ExternalLink, ShieldCheck, ShieldAlert } from 'lucide-react';
import { ProcessedAction } from '../types';

interface PipelineKanbanViewProps {
  items: ProcessedAction[];
  onSelectVerdict: (item: ProcessedAction) => void;
}

export const PipelineKanbanView: React.FC<PipelineKanbanViewProps> = ({
  items,
  onSelectVerdict,
}) => {
  const columns = [
    {
      id: 'abandoned_checkout',
      title: 'Abandoned Checkout',
      icon: ShoppingCart,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
    },
    {
      id: 'failed_payment',
      title: 'Failed Payment (Retry)',
      icon: AlertCircle,
      color: 'text-rose-400',
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/10',
    },
    {
      id: 'upsell',
      title: 'Upsell & Expansion',
      icon: TrendingUp,
      color: 'text-sky-400',
      border: 'border-sky-500/30',
      bg: 'bg-sky-500/10',
    },
    {
      id: 're_engagement',
      title: 'Re-engagement & Retention',
      icon: RefreshCcw,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
    },
  ];

  const formatRupees = (paise: number = 0) => {
    return (paise / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel-card p-6">
        <h2 className="text-base font-bold text-white tracking-tight">
          Recovery Opportunity Kanban Pipeline
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Categorized recovery stages with autonomous Razorpay payment link triggers
        </p>
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {columns.map((col) => {
          const Icon = col.icon;
          const colItems = items.filter((i) => i.proposal.opportunity_type === col.id);

          return (
            <div
              key={col.id}
              className="panel-card p-4 flex flex-col min-h-[420px] bg-[#101216] border border-[#23252b]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#23252b] mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${col.bg} ${col.color} border ${col.border}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200">{col.title}</h3>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#181a20] text-slate-400 font-tabular">
                  {colItems.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
                {colItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No active opportunities in this stage.
                  </div>
                ) : (
                  colItems.map((item, idx) => {
                    const isApproved = item.verdict.verdict === 'APPROVED';
                    return (
                      <div
                        key={idx}
                        onClick={() => onSelectVerdict(item)}
                        className="p-3.5 rounded-lg bg-[#14161a] hover:bg-[#1b1e25] border border-[#23252b] hover:border-sky-500/40 transition-all cursor-pointer group shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-bold text-xs text-white group-hover:text-sky-300 transition-colors">
                            {item.customerName || item.proposal.customer_id}
                          </span>
                          <span
                            className={`status-chip text-[9px] ${
                              isApproved ? 'status-chip-approved' : 'status-chip-blocked'
                            }`}
                          >
                            {item.verdict.verdict}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                          {item.proposal.reason}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-[#1e2026] text-xs font-tabular">
                          <span className="font-bold text-slate-200">
                            {formatRupees(item.proposal.amount_paise)}
                          </span>
                          {item.proposal.discount_percent > 0 && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                              {item.proposal.discount_percent}% off
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
