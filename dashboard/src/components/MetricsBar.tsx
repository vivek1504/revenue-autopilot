import React from 'react';
import { Target, CheckCircle2, ShieldAlert, Lock } from 'lucide-react';
import { DashboardSummary } from '../types';

interface MetricsBarProps {
  summary: DashboardSummary | null;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ summary }) => {
  const formatRupees = (paise: number = 0) => {
    return (paise / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* 1. Opportunities Identified */}
      <div className="glass-card p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Opportunities Identified
          </span>
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Target className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white">
            {summary?.opportunities_count || 0}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            from {summary?.total_customers || 120} merchants/custs
          </span>
        </div>
      </div>

      {/* 2. Policy Approved */}
      <div className="glass-card p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Policy Approved
          </span>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-extrabold text-emerald-400">
              {summary?.approved_count || 0}
            </span>
            <span className="text-xs text-[var(--text-muted)] ml-2">actions</span>
          </div>
          <span className="text-xs font-mono font-medium text-emerald-400">
            {formatRupees(summary?.approved_value_paise)}
          </span>
        </div>
      </div>

      {/* 3. Policy Blocked */}
      <div className="glass-card p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Policy Blocked
          </span>
          <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-extrabold text-rose-400">
              {summary?.blocked_count || 0}
            </span>
            <span className="text-xs text-[var(--text-muted)] ml-2">violations</span>
          </div>
          <span className="text-xs text-rose-400/80 font-medium">Safety Catch</span>
        </div>
      </div>

      {/* 4. Unsafe ₹ Value Prevented */}
      <div className="glass-card p-5 relative overflow-hidden border-rose-500/20 bg-rose-950/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-300/90 uppercase tracking-wider">
            Unsafe ₹ Prevented
          </span>
          <div className="p-2.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
            <Lock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-extrabold text-rose-300 font-mono">
            {formatRupees(summary?.unsafe_value_blocked_paise)}
          </span>
          <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
            100% Protected
          </span>
        </div>
      </div>
    </div>
  );
};
