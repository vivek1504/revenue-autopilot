import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  Percent,
  Layers,
  ArrowUpRight,
  PieChart,
  Activity,
  Calendar,
  Filter,
} from 'lucide-react';
import { DashboardSummary } from '../types';

interface AnalyticsViewProps {
  summary: DashboardSummary | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ summary }) => {
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | 'ytd'>('90d');

  const formatCurrency = (paise?: number, fallback: string = '₹42.0L') => {
    if (!paise || paise === 0) return fallback;
    const rupees = paise / 100;
    if (rupees >= 10000000) return `₹${(rupees / 10000000).toFixed(2)} Cr`;
    if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
    if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(0)}K`;
    return `₹${rupees.toLocaleString('en-IN')}`;
  };

  const recoveredRupees = formatCurrency(summary?.approved_value_paise, '₹28.4L');
  const blockedRupees = formatCurrency(summary?.unsafe_value_blocked_paise, '₹13.6L');
  const recoveryRate = summary && summary.opportunities_count > 0
    ? `${((summary.approved_count / summary.opportunities_count) * 100).toFixed(1)}%`
    : '68.2%';

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-slate-900" />
            <h2 className="text-3xl font-extrabold text-[#091e42] tracking-tight font-sans">
              Financial Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Deep-dive metrics across opportunity cohorts, vector performance, and loss prevention ROI in INR (₹).
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center bg-white border border-slate-300 rounded-md p-1 shadow-2xs text-xs font-semibold">
          <button
            onClick={() => setTimeframe('30d')}
            className={`px-3 py-1 rounded transition-all ${
              timeframe === '30d' ? 'bg-slate-950 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30D
          </button>
          <button
            onClick={() => setTimeframe('90d')}
            className={`px-3 py-1 rounded transition-all ${
              timeframe === '90d' ? 'bg-slate-950 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            90D
          </button>
          <button
            onClick={() => setTimeframe('ytd')}
            className={`px-3 py-1 rounded transition-all ${
              timeframe === 'ytd' ? 'bg-slate-950 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            YTD
          </button>
        </div>
      </div>

      {/* 2. Top 4 Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-2xs flex flex-col justify-between h-32">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Revenue Recovered
          </span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold font-tabular text-slate-950">
              {recoveredRupees}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center mb-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12.4%
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-2xs flex flex-col justify-between h-32">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Gross Recovery Yield
          </span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold font-tabular text-slate-950">
              {recoveryRate}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center mb-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +2.1%
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-2xs flex flex-col justify-between h-32">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Avg Recovery Order Value
          </span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold font-tabular text-slate-950">
              ₹14,250
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center mb-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +4.8%
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-2xs flex flex-col justify-between h-32">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Unsafe Revenue Protected
          </span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold font-tabular text-rose-600">
              {blockedRupees}
            </span>
            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 mb-1">
              100% Intercept
            </span>
          </div>
        </div>
      </div>

      {/* 3. Section: Cumulative Revenue Chart & Cohort Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/90 rounded-lg p-6 shadow-2xs flex flex-col justify-between min-h-[440px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Cumulative Revenue: Recovered vs. Recoverable
              </h3>
              <div className="flex items-center gap-3 text-xs font-medium">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-950"></span>
                  <span>Recovered</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <span>Recoverable</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Monthly cumulative recovery trajectory across all merchant customer accounts in INR.
            </p>

            <div className="relative h-64 w-full pt-4">
              <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                <line x1="45" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="45" y1="60" x2="480" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="45" y1="100" x2="480" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="45" y1="140" x2="480" y2="140" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="45" y1="180" x2="480" y2="180" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />

                <text x="35" y="24" textAnchor="end" className="text-[11px] fill-slate-400 font-sans">₹50L</text>
                <text x="35" y="64" textAnchor="end" className="text-[11px] fill-slate-400 font-sans">₹40L</text>
                <text x="35" y="104" textAnchor="end" className="text-[11px] fill-slate-400 font-sans">₹30L</text>
                <text x="35" y="144" textAnchor="end" className="text-[11px] fill-slate-400 font-sans">₹20L</text>
                <text x="35" y="184" textAnchor="end" className="text-[11px] fill-slate-400 font-sans">₹10L</text>

                <path
                  d="M 60 170 C 140 150, 220 120, 300 85 C 360 65, 420 50, 470 20"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2.5"
                  strokeDasharray="4,4"
                />
                <path
                  d="M 60 190 C 140 175, 220 145, 300 110 C 360 80, 420 60, 470 35"
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle cx="300" cy="110" r="3.5" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="380" cy="75" r="3.5" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="470" cy="35" r="4.5" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="flex justify-between pl-8 pr-4 pt-3 text-xs font-semibold text-slate-500 border-t border-slate-100">
            <span>Jan 1</span>
            <span>Feb 1</span>
            <span>Mar 1</span>
            <span>Apr 1</span>
            <span>May 1</span>
            <span>Jun 1</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-6 shadow-2xs flex flex-col justify-between min-h-[440px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recovery Performance by Opportunity Cohort
              </h3>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                Cohort Breakdown
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Comparative yield, conversion velocity, and volume across opportunity cohorts.
            </p>

            <div className="space-y-3.5">
              {[
                { label: 'Abandoned Checkouts (1h - 24h)', pct: 54, val: '₹18.4L', conv: '72%', accounts: '50', color: 'bg-blue-600' },
                { label: 'Failed Card/UPI Payments (<48h)', pct: 28, val: '₹9.5L', conv: '64%', accounts: '20', color: 'bg-emerald-500' },
                { label: 'VIP / Tier Upsell Offers', pct: 12, val: '₹4.2L', conv: '58%', accounts: '10', color: 'bg-indigo-600' },
                { label: 'Inactive Customer Re-engagement', pct: 6, val: '₹2.1L', conv: '45%', accounts: '5', color: 'bg-amber-500' },
              ].map((cohort, i) => (
                <div key={i} className="space-y-1.5 p-2.5 bg-[#f8f9fa] rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{cohort.label}</span>
                      <span className="ml-1.5 text-slate-400 font-tabular text-[11px]">({cohort.accounts} accounts)</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-emerald-700 font-bold font-tabular text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {cohort.conv} conversion
                      </span>
                      <span className="font-tabular font-extrabold text-slate-950">{cohort.val}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cohort.color} rounded-full transition-all duration-500`}
                      style={{ width: `${cohort.pct}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Aggregated Portfolio Yield:</span>
            <strong className="font-tabular text-slate-900">₹34.2L Total Recoverable</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
