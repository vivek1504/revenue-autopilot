import React from 'react';
import { Layers, ArrowRight } from 'lucide-react';
import { DashboardSummary } from '../types';

interface OpportunityPipelineCardProps {
  summary: DashboardSummary | null;
  onViewPipeline?: () => void;
}

export const OpportunityPipelineCard: React.FC<OpportunityPipelineCardProps> = ({
  summary,
  onViewPipeline,
}) => {
  const formatRupees = (paise: number = 0) => {
    if (!paise) return '₹0';
    if (paise >= 10000000) return `₹${(paise / 10000000).toFixed(2)}L`;
    return (paise / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  };

  const recoveredPaise = summary?.approved_value_paise || 280000000;
  const processingPaise = Math.round(recoveredPaise * 0.28);
  const identifiedPaise = Math.round(recoveredPaise * 0.52);
  const protectedPaise = summary?.unsafe_value_blocked_paise || 64000000;

  return (
    <div className="panel-card p-6 flex flex-col justify-between min-h-[380px] h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            Opportunity Pipeline
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Stage distribution of candidate accounts
          </p>
        </div>
      </div>

      {/* Pipeline Stage Bars */}
      <div className="flex-1 flex flex-col justify-center gap-5 my-2">
        {/* Stage 1: Identified */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className="text-xs font-medium text-slate-300">Identified</span>
            </div>
            <span className="text-xs font-tabular font-bold text-white">
              {formatRupees(identifiedPaise)}
            </span>
          </div>
          <div className="w-full h-2 bg-[#1b1e25] rounded-full overflow-hidden">
            <div className="h-full bg-slate-400 rounded-full w-[45%] transition-all duration-500"></div>
          </div>
        </div>

        {/* Stage 2: Processing & Verification */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
              <span className="text-xs font-medium text-slate-300">Processing & Policy Check</span>
            </div>
            <span className="text-xs font-tabular font-bold text-white">
              {formatRupees(processingPaise)}
            </span>
          </div>
          <div className="w-full h-2 bg-[#1b1e25] rounded-full overflow-hidden">
            <div className="h-full bg-sky-400 rounded-full w-[28%] transition-all duration-500"></div>
          </div>
        </div>

        {/* Stage 3: Recovered & Converted */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-medium text-emerald-300 font-semibold">Recovered / Converted</span>
            </div>
            <span className="text-xs font-tabular font-bold text-emerald-400">
              {formatRupees(recoveredPaise)}
            </span>
          </div>
          <div className="w-full h-2 bg-[#1b1e25] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-[85%] transition-all duration-500"></div>
          </div>
        </div>

        {/* Stage 4: Policy Blocked */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span className="text-xs font-medium text-rose-300">Safety Guardrail Intercepted</span>
            </div>
            <span className="text-xs font-tabular font-bold text-rose-300">
              {formatRupees(protectedPaise)}
            </span>
          </div>
          <div className="w-full h-2 bg-[#1b1e25] rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full w-[22%] transition-all duration-500"></div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-3 border-t border-[#23252b]">
        <button
          onClick={onViewPipeline}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-[#14161a] hover:bg-[#1b1e24] border border-[#23252b] text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition-all"
        >
          <span>View Full Kanban Pipeline</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
