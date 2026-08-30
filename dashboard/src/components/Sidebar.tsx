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
  Shield,
  Download,
  X,
  Radio,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type NavTab =
  | 'dashboard'
  | 'recoveries'
  | 'benchmark'
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
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  status,
  onRun,
  executionMode,
  onModeChange,
  onExport,
  isOpen = false,
  onClose,
}) => {
  const mainNavItems = [
    { id: 'dashboard' as NavTab, label: 'Revenue Dashboard', icon: LayoutDashboard },
    { id: 'pipelines' as NavTab, label: 'Autonomous Pipeline', icon: GitFork },
    { id: 'audit' as NavTab, label: 'Audit Log & Ledger', icon: History },
    { id: 'recoveries' as NavTab, label: 'Recoveries & Analytics', icon: CreditCard },
    { id: 'benchmark' as NavTab, label: 'Recovery Benchmark', icon: Scale },
    { id: 'telemetry' as NavTab, label: 'Observability & Safety', icon: Bot },
    { id: 'settings' as NavTab, label: 'Settings & Policy', icon: Settings },
  ];

  const isRunning = status === 'running';

  const sidebarContent = (
    <aside className="w-64 bg-white text-slate-800 flex flex-col h-full border-r border-slate-200/90 flex-shrink-0 select-none z-30 justify-between font-sans">
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
        {/* 1. Brand Header */}
        <div className="pt-6 px-5 pb-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base tracking-tight text-slate-900 font-sans">
                  RevenueGuard
                </h1>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                  v1.4
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                Autonomous Recovery
              </p>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2. Mode Selector Toggle */}
        <div className="px-5 pt-4 pb-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between font-mono">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-slate-400" />
              Gateway Env
            </span>
            {executionMode === 'live' ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 font-bold font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live API
              </span>
            ) : (
              <span className="text-[10px] text-slate-600 font-bold font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Sandbox
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg border border-slate-200/80 text-xs font-semibold">
            <button
              onClick={() => onModeChange('live')}
              className={cn(
                'py-1.5 rounded-md transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 text-xs',
                executionMode === 'live'
                  ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Live Mode
            </button>
            <button
              onClick={() => onModeChange('simulated')}
              className={cn(
                'py-1.5 rounded-md transition-all text-center cursor-pointer text-xs',
                executionMode === 'simulated'
                  ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Simulated
            </button>
          </div>
        </div>

        {/* 3. Primary CTA: Run Recovery Scan Button */}
        <div className="px-5 pb-4">
          <button
            onClick={() => onRun()}
            disabled={isRunning}
            className={cn(
              'w-full font-bold text-xs py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed font-sans shadow-xs',
              isRunning
                ? 'bg-slate-800 text-white'
                : 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white'
            )}
          >
            {isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>
              {isRunning
                ? 'Scanning Database...'
                : `Run ${executionMode === 'live' ? 'Live' : 'Simulated'} Scan`}
            </span>
          </button>
        </div>

        {/* 4. Navigation Links */}
        <div className="px-3 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5 font-mono">
            Navigation
          </div>
          <nav className="space-y-0.5">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onClose) onClose();
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-normal transition-all text-left cursor-pointer relative group',
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-bold border-l-2 border-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors shrink-0',
                      isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 5. Footer Status & Export CTA */}
      <div className="p-4 border-t border-slate-100 space-y-2.5 bg-slate-50/60">
        {/* System telemetry chip */}
        <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-mono shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700">Postgres DB</span>
          </div>
          <span className="text-slate-500 font-medium">~1.8ms p99</span>
        </div>

        <button
          onClick={onExport || (() => alert('Exporting report...'))}
          className="w-full bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs py-2 px-3 rounded-lg transition-colors text-center cursor-pointer border border-slate-200 flex items-center justify-center gap-2 shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Audit (CSV)</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar (static) */}
      <div className="hidden md:block h-full flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer (modal backdrop) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/25 backdrop-blur-[2px] transition-opacity"
            onClick={onClose}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-10 animate-fadeIn">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
