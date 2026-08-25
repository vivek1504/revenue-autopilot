import React, { useState } from 'react';
import { Download, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';

export const RecoveryTrendChart: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'30D' | '90D' | 'ALL'>('30D');

  const chartData = [
    { label: 'Jan', value: 35, recovered: '₹1.1M' },
    { label: 'Feb', value: 45, recovered: '₹1.5M' },
    { label: 'Mar', value: 60, recovered: '₹2.1M' },
    { label: 'Apr', value: 52, recovered: '₹1.8M' },
    { label: 'May', value: 78, recovered: '₹2.5M' },
    { label: 'Jun', value: 92, recovered: '₹2.8M' },
  ];

  return (
    <div className="panel-card p-6 flex flex-col justify-between min-h-[380px] h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Autonomous Recovery Velocity
            </h3>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Accelerating
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Cumulative recovered transaction value and policy approval delta over time
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center bg-[#14161a] p-1 rounded-md border border-[#23252b] text-[11px]">
            {(['30D', '90D', 'ALL'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-0.5 rounded font-medium transition-all ${
                  timeRange === range
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <button
            onClick={() => alert('Exporting recovery trend report (CSV)...')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#23252b] hover:border-sky-500/50 bg-[#14161a] hover:bg-[#1b1e24] text-[11px] font-semibold text-slate-300 transition-all"
          >
            <Download className="w-3 h-3 text-sky-400" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="flex-1 relative flex flex-col justify-end pt-4 pb-2">
        {/* Y-Axis Labels & Gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-tabular text-slate-500 pl-1">
          <div className="w-full border-b border-[#1c1f26] border-dashed flex justify-between pr-2 pb-1">
            <span>₹3.0M</span>
          </div>
          <div className="w-full border-b border-[#1c1f26] border-dashed flex justify-between pr-2 pb-1">
            <span>₹2.0M</span>
          </div>
          <div className="w-full border-b border-[#1c1f26] border-dashed flex justify-between pr-2 pb-1">
            <span>₹1.0M</span>
          </div>
          <div className="w-full border-b border-[#23252b] flex justify-between pr-2 pb-1">
            <span>₹0.0</span>
          </div>
        </div>

        {/* SVG Graphic */}
        <div className="relative h-48 w-full mt-6">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160" preserveAspectRatio="none">
            <defs>
              <linearGradient id="recoveryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="70%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>

            {/* Area Fill */}
            <path
              d="M 0 130 Q 80 115 160 85 T 320 50 T 500 15 L 500 160 L 0 160 Z"
              fill="url(#recoveryGradient)"
            />

            {/* Stroke Line */}
            <path
              d="M 0 130 Q 80 115 160 85 T 320 50 T 500 15"
              fill="none"
              stroke="url(#lineGlow)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Active Data Points */}
            <circle cx="160" cy="85" r="4" fill="#38bdf8" stroke="#09090b" strokeWidth="2" />
            <circle cx="320" cy="50" r="4" fill="#10b981" stroke="#09090b" strokeWidth="2" />
            <circle cx="500" cy="15" r="5" fill="#34d399" stroke="#09090b" strokeWidth="2" className="animate-pulse" />
          </svg>
        </div>

        {/* X-Axis Labels */}
        <div className="flex justify-between items-center text-[11px] font-tabular text-slate-400 pt-3 border-t border-[#23252b] px-2">
          {chartData.map((d, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="font-semibold text-slate-300">{d.label}</span>
              <span className="text-[10px] text-slate-500">{d.recovered}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
