import React from 'react';
import { Database, Brain, ShieldCheck, Send, CheckCheck, LucideIcon } from 'lucide-react';
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
      {stages.map((st) => {
        const Icon = st.icon;
        const isSelected = selectedStage === st.id;

        return (
          <button
            key={st.id}
            type="button"
            onClick={() => onSelectStage(st.id)}
            className={cn(
              "p-4 rounded-xl border text-left flex flex-col justify-between h-44 cursor-pointer relative overflow-hidden transition-all duration-200 shadow-2xs",
              isSelected
                ? "ring-2 ring-slate-950 border-slate-950 bg-white shadow-md scale-[1.02]"
                : "bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50/50"
            )}
          >
            {st.badge && (
              <div className={cn("absolute top-0 right-0 text-[9px] font-bold px-2 py-0.5 rounded-bl uppercase tracking-wider", st.badgeColor)}>
                {st.badge}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", isSelected ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700")}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Step {st.id}
                  </span>
                </div>
                <span className="text-[10px] font-tabular font-mono text-slate-400">{st.latency}</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm mt-1">{st.title}</h4>
              <p className="text-[11px] text-slate-500">{st.subtitle}</p>
            </div>

            <div className="pt-2.5 border-t border-slate-100 flex items-end justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">{st.count}</div>
                <div className="text-sm font-extrabold font-tabular text-slate-950">{st.volume}</div>
              </div>
              {isSelected && (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  Inspecting
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
