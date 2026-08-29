import React from 'react';
import { Database, Brain, ShieldCheck, Send, CheckCheck, LucideIcon, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PipelineStage {
  id: number;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  count: string;
  volume: string;
  latency: string;
  badge: string;
  badgeColor: string;
}

interface PipelinesStepperProps {
  stages: PipelineStage[];
  selectedStage: number;
  onSelectStage: (stageId: number) => void;
}

export const PipelinesStepper: React.FC<PipelinesStepperProps> = ({
  stages,
  selectedStage,
  onSelectStage,
}) => {
  return (
    <div className="relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {stages.map((st, idx) => {
          const Icon = st.icon;
          const isSelected = selectedStage === st.id;

          return (
            <button
              key={st.id}
              type="button"
              onClick={() => onSelectStage(st.id)}
              className={cn(
                'p-4 rounded-xl border text-left flex flex-col justify-between h-44 cursor-pointer relative overflow-hidden transition-all duration-200 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] group',
                isSelected
                  ? 'ring-2 ring-slate-900 border-slate-900 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.08)] scale-[1.01]'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50'
              )}
            >
              {st.badge && (
                <div
                  className={cn(
                    'absolute top-0 right-0 text-[9px] font-bold px-2 py-0.5 rounded-bl uppercase tracking-wider font-mono select-none',
                    st.badgeColor
                  )}
                >
                  {st.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105',
                        isSelected
                          ? 'bg-slate-950 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Step 0{st.id}
                    </span>
                  </div>
                  <span className="text-[10px] font-tabular font-mono text-slate-400">
                    {st.latency}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm mt-1 tracking-tight">
                  {st.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-1">{st.subtitle}</p>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-end justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                    {st.count}
                  </div>
                  <div className="text-sm font-extrabold font-tabular text-[#091e42]">
                    {st.volume}
                  </div>
                </div>

                {isSelected ? (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-700 transition-colors font-semibold">
                    Inspect &rarr;
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
