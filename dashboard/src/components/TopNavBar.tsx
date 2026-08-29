import React from 'react';
import { Search, Bell, HelpCircle, Menu, ShieldCheck, Database } from 'lucide-react';
import { NavTab } from './Sidebar';

interface TopNavBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentTab?: NavTab;
  onOpenMobileMenu?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  searchQuery,
  onSearchChange,
  currentTab = 'dashboard',
  onOpenMobileMenu,
}) => {
  const tabTitles: Record<NavTab, string> = {
    dashboard: 'Executive Dashboard',
    pipelines: 'Autonomous Pipeline',
    audit: 'Audit Log & Ledger',
    recoveries: 'Recoveries & Analytics',
    telemetry: 'Observability & Safety',
    settings: 'Settings & Policy',
  };

  return (
    <header className="bg-white border-b border-slate-200/90 flex justify-between items-center h-16 px-4 sm:px-6 md:px-8 w-full z-20 flex-shrink-0 font-sans shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
      {/* Left: Mobile hamburger + Route Breadcrumb */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold">RevenueGuard</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold tracking-tight">
            {tabTitles[currentTab]}
          </span>
        </div>
      </div>

      {/* Middle/Right: Search bar */}
      <div className="flex-1 max-w-xs sm:max-w-md mx-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search customer, ID, or amount..."
            className="w-full bg-slate-50/80 border border-slate-200 rounded-lg pl-8 pr-12 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white transition-all placeholder:text-slate-400 font-sans shadow-2xs"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-3xs">
              /
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Telemetry pill, Icons & User Avatar */}
      <div className="flex items-center gap-3 sm:gap-4">

        {/* Action Icons */}
        <div className="flex items-center gap-1 sm:gap-2 text-slate-500">
          <button
            className="hover:text-slate-900 hover:bg-slate-100 transition-colors p-1.5 rounded-lg cursor-pointer relative"
            title="Notifications & Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>
          <button
            className="hover:text-slate-900 hover:bg-slate-100 transition-colors p-1.5 rounded-lg cursor-pointer hidden sm:block"
            title="Help & API Reference"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* Profile Avatar JD */}
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-[#0c1524] text-white font-bold flex items-center justify-center text-xs shadow-xs select-none font-sans ring-2 ring-slate-100 group-hover:ring-slate-300 transition-all">
            JD
          </div>
          <div className="hidden xl:block text-left text-xs">
            <div className="font-bold text-slate-900 leading-tight">Razorpay Merchant</div>
            <div className="text-[10px] text-slate-400 font-mono">Live Sandbox</div>
          </div>
        </div>
      </div>
    </header>
  );
};
