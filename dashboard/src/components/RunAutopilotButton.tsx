import React, { useState } from 'react';
import { Play, Loader2, RefreshCw } from 'lucide-react';

interface RunAutopilotButtonProps {
  status: 'idle' | 'running' | 'complete';
  onRun: (mode: 'simulated' | 'live') => void;
  processedCount: number;
  totalCount: number;
}

export const RunAutopilotButton: React.FC<RunAutopilotButtonProps> = ({
  status,
  onRun,
  processedCount,
  totalCount,
}) => {
  const [mode, setMode] = useState<'simulated' | 'live'>('simulated');

  return (
    <div className="glass-card p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border-emerald-500/20">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          ⚡ Execute Autopilot Intelligence Cycle
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Scans database for customer opportunities, invokes Gemini 2.0 Flash for bounded decision proposal, runs deterministic safety policies, and logs tamper-evident audit records.
        </p>
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto">
        {/* Mode Selector */}
        <div className="flex items-center bg-surface p-1 rounded-lg border border-[var(--border-subtle)] text-xs">
          <button
            onClick={() => setMode('simulated')}
            disabled={status === 'running'}
            className={`px-3 py-1.5 rounded-md transition-all font-medium ${
              mode === 'simulated'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            Simulated Mode
          </button>
          <button
            onClick={() => setMode('live')}
            disabled={status === 'running'}
            className={`px-3 py-1.5 rounded-md transition-all font-medium ${
              mode === 'live'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            Live Razorpay API
          </button>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onRun(mode)}
          disabled={status === 'running'}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg ${
            status === 'running'
              ? 'bg-emerald-700/50 text-emerald-200 cursor-not-allowed border border-emerald-500/30'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {status === 'running' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
              <span>Processing {processedCount}/{totalCount || '...'}</span>
            </>
          ) : status === 'complete' ? (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Re-Run Autopilot Cycle</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run Autopilot Now</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
