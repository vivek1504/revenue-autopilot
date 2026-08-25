import React from 'react';
import { ShieldCheck, Zap, Activity } from 'lucide-react';

interface HeaderProps {
  status: 'idle' | 'running' | 'complete';
}

export const Header: React.FC<HeaderProps> = ({ status }) => {
  return (
    <header className="glass-card mb-8 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.25)]">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Razorpay Revenue Autopilot
            </h1>
            <span className="badge badge-simulated text-[10px] px-2 py-0.5">
              v1.0 • Gemini 2.0 Flash
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Autonomous Recovery Agent with Hash-Chained Audit Trail & Deterministic Safety Policy Engine
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-[var(--border-subtle)] text-xs">
          <span className="relative flex h-2.5 w-2.5">
            {status === 'running' ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            )}
          </span>
          <span className="text-[var(--text-secondary)] font-medium">
            System Status: <strong className="text-white capitalize">{status === 'running' ? 'Active Execution' : 'Ready'}</strong>
          </span>
        </div>
      </div>
    </header>
  );
};
