import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';
import { DashboardSummary } from '../types';

interface PolicyMonitorBoxProps {
  summary: DashboardSummary | null;
  onOpenPolicyView?: () => void;
}

export const PolicyMonitorBox: React.FC<PolicyMonitorBoxProps> = ({
  summary,
  onOpenPolicyView,
}) => {
  const violationsCaught = summary?.blocked_count || 0;

  return (
    <div className="panel-card bg-gradient-to-br from-[#0f172a] to-[#090d16] border border-sky-500/30 p-5 rounded-lg text-white relative overflow-hidden flex flex-col justify-between shadow-lg shadow-sky-950/20">
      {/* Subtle background tech grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '14px 14px',
        }}
      ></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-200">
                Policy Monitor
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Deterministic Safety Engine
            </p>
          </div>
          <div className="p-2 rounded-lg bg-sky-400/10 text-sky-400 border border-sky-400/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-2.5 my-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs font-semibold text-slate-200">Engine Active & Enforcing</span>
          </div>

          <div className="p-2.5 rounded-md bg-[#131b2e]/80 border border-sky-500/20 text-[11px] font-tabular flex items-center justify-between">
            <span className="text-slate-300">Compliance Audit:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> 100% Pass
            </span>
          </div>

          <div className="p-2.5 rounded-md bg-[#131b2e]/80 border border-sky-500/20 text-[11px] font-tabular flex items-center justify-between">
            <span className="text-slate-300">Active Safety Rules:</span>
            <span className="text-sky-300 font-bold">10 Guardrails</span>
          </div>

          {violationsCaught > 0 && (
            <div className="p-2.5 rounded-md bg-rose-950/40 border border-rose-500/30 text-[11px] font-tabular flex items-center justify-between text-rose-300">
              <span>Violations Intercepted:</span>
              <span className="font-bold">{violationsCaught} Blocked</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 pt-2 border-t border-sky-500/20 mt-2">
        <button
          onClick={onOpenPolicyView}
          className="w-full py-1.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[11px] font-semibold transition-all text-center border border-sky-500/30"
        >
          View Rule Catalog (10) →
        </button>
      </div>
    </div>
  );
};
