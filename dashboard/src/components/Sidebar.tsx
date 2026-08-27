import React from 'react';
import {
  LayoutDashboard,
  CreditCard,
  Bot,
  GitFork,
  History,
  Settings,
  Search,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type NavTab =
  | 'dashboard'
  | 'recoveries'
  | 'telemetry'
  | 'pipelines'
  | 'audit'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  status: 'idle' | 'running' | 'complete';
  onRun: () => void;
  executionMode: 'live' | 'simulated';
  onModeChange: (mode: 'live' | 'simulated') => void;
  processedCount?: number;
  totalCount?: number;
  onExport?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  status,
  onRun,
  executionMode,
  onModeChange,
  onExport,
}) => {
  const mainNavItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pipelines' as NavTab, label: 'Pipelines', icon: GitFork },
    { id: 'audit' as NavTab, label: 'Audit Log & Ledger', icon: History },
    { id: 'recoveries' as NavTab, label: 'Recoveries & Analytics', icon: CreditCard },
    { id: 'telemetry' as NavTab, label: 'Observability', icon: Bot },
    { id: 'settings' as NavTab, label: 'Settings & Policy', icon: Settings },
  ];

  const isRunning = status === 'running';

  return (
    <aside className="w-64 bg-[#131b2e] text-white flex flex-col h-screen border-r border-slate-800/80 flex-shrink-0 select-none z-30 justify-between">
      <div>
        {/* Brand Header */}
        <div className="pt-6 px-6 pb-4">
          <h1 className="font-bold text-xl tracking-tight text-white font-sans">
            RevenueGuard
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 font-sans">
            AUTONOMOUS RECOVERY
          </p>
        </div>

        {/* Mode Selector Toggle */}
        <div className="px-5 pb-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Execution Mode</span>
            {executionMode === 'live' ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Razorpay API
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-bold bg-slate-800 px-1.5 py-0.5 rounded">
                Mock
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-lg border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => onModeChange('live')}
              className={cn(
                "py-1.5 rounded-md transition-all text-center cursor-pointer flex items-center justify-center gap-1",
                executionMode === 'live'
                  ? "bg-emerald-600 text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-white"></span>
              Live Mode
            </button>
            <button
              onClick={() => onModeChange('simulated')}
              className={cn(
                "py-1.5 rounded-md transition-all text-center cursor-pointer",
                executionMode === 'simulated'
                  ? "bg-slate-700 text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              Simulated
            </button>
          </div>
        </div>

        {/* PRIMARY CTA: Run Recovery Scan Button */}
        <div className="px-5 pb-5">
          <button
            onClick={() => onRun()}
            disabled={isRunning}
            className={cn(
              "w-full font-extrabold text-sm py-3 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed font-sans",
              executionMode === 'live'
                ? "bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950"
                : "bg-[#dbeafe] hover:bg-[#bfdbfe] active:bg-[#93c5fd] text-[#0b1c30]",
              isRunning && "opacity-80 animate-pulse"
            )}
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{isRunning ? 'Scanning Database...' : `Run ${executionMode === 'live' ? 'Live' : 'Simulated'} Scan`}</span>
          </button>
        </div>

        {/* Main Navigation Links */}
        <nav className="px-0 space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3.5 px-6 py-3 text-xs font-semibold tracking-wide transition-colors text-left border-l-4 cursor-pointer",
                  isActive
                    ? "bg-[#06241a] text-[#34d399] border-[#10b981] font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-transparent"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-[#34d399]" : "text-slate-400")} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls: Export Report CTA */}
      <div className="p-5 border-t border-slate-800/80">
        <button
          onClick={onExport || (() => alert('Exporting report...'))}
          className="w-full bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs py-2.5 px-3 rounded transition-colors text-center cursor-pointer border border-white/10"
        >
          Export Report (CSV)
        </button>
      </div>
    </aside>
  );
};
