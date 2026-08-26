import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';

interface TopNavBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 flex justify-between items-center h-16 px-8 w-full z-20 flex-shrink-0 font-sans">
      {/* Left: Search input */}
      <div className="w-80 md:w-96">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search customer, ID, or amount..."
            className="w-full bg-[#f8f9fa] border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white transition-all placeholder:text-slate-400 font-sans"
          />
        </div>
      </div>

      {/* Right: Environment Badge, Icons & User Avatar */}
      <div className="flex items-center gap-4">
        {/* Environment Pill Badge */}


        {/* Icons */}
        <div className="flex items-center gap-2.5 text-slate-600">
          <button className="hover:text-slate-900 transition-colors p-1 rounded-full cursor-pointer" title="Notifications">
            <Bell className="w-4 h-4" />
          </button>
          <button className="hover:text-slate-900 transition-colors p-1 rounded-full cursor-pointer" title="Help">
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Avatar JD */}
        <div className="w-8 h-8 rounded-full bg-slate-950 text-white font-bold flex items-center justify-center text-xs shadow-2xs cursor-pointer select-none font-sans">
          JD
        </div>
      </div>
    </header>
  );
};
