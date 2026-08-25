import React from 'react';
import { Bot, Sparkles, Sliders, Receipt, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ProcessedAction } from '../types';

interface AIActionLogProps {
  items: ProcessedAction[];
  onSelectVerdict: (item: ProcessedAction) => void;
  status: 'idle' | 'running' | 'complete';
}

export const AIActionLog: React.FC<AIActionLogProps> = ({
  items,
  onSelectVerdict,
  status,
}) => {
  // Default mock feed events if items is empty
  const defaultEvents = [
    {
      icon: Sparkles,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      title: 'AI resolved payment friction for Acme Corp.',
      detail: 'Generated 10% bounded discount link for abandoned checkout.',
      time: '2 mins ago',
      item: items[0] || null,
    },
    {
      icon: Sliders,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      title: 'AI adjusted recovery strategy for Stark Ind based on policy P-22.',
      detail: 'Scheduled smart retry with alternate banking rails.',
      time: '15 mins ago',
      item: items[1] || null,
    },
    {
      icon: Receipt,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      title: 'Automated dispute resolution initiated for Invoice #8992.',
      detail: 'Re-engagement offer generated within policy caps.',
      time: '1 hr ago',
      item: items[3] || null,
    },
  ];

  return (
    <div className="panel-card p-5 flex flex-col justify-between flex-1">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#23252b] mb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            AI Action Stream
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-tabular">
          {items.length > 0 ? `${items.length} events` : 'Live Feed'}
        </span>
      </div>

      {/* Feed List */}
      <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1">
        {items.length > 0
          ? items.slice(0, 5).map((item, idx) => {
              const isApproved = item.verdict.verdict === 'APPROVED';
              return (
                <div
                  key={idx}
                  onClick={() => onSelectVerdict(item)}
                  className="flex items-start gap-3 p-2.5 rounded-lg bg-[#14161a] hover:bg-[#1b1e25] border border-[#23252b] transition-all cursor-pointer group"
                >
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isApproved
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {isApproved ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 leading-snug group-hover:text-sky-300 transition-colors">
                      <span className="font-bold text-white">
                        {item.customerName || item.proposal.customer_id}
                      </span>
                      : {item.proposal.action.replace('_', ' ')}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.proposal.reason}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-tabular">
                      <span>₹{item.proposal.amount_paise / 100}</span>
                      <span>•</span>
                      <span className={isApproved ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {item.verdict.verdict}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          : defaultEvents.map((evt, idx) => {
              const Icon = evt.icon;
              return (
                <div
                  key={idx}
                  onClick={() => evt.item && onSelectVerdict(evt.item)}
                  className="flex items-start gap-3 p-2.5 rounded-lg bg-[#14161a] hover:bg-[#1b1e25] border border-[#23252b] transition-all cursor-pointer group"
                >
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${evt.bg} ${evt.color} border border-white/5`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-200 leading-snug group-hover:text-sky-300 transition-colors">
                      {evt.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {evt.detail}
                    </p>
                    <span className="text-[10px] text-slate-500 font-tabular mt-1 block">
                      {evt.time}
                    </span>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
};
