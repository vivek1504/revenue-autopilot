import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string | number;
  subLabel?: string;
  subValueColor?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  trend?: {
    value: string | number;
    positive?: boolean;
    label?: string;
  };
  highlight?: boolean;
  valueColor?: string;
  className?: string;
  badge?: string;
  badgeVariant?: 'approved' | 'blocked' | 'escalated' | 'info' | 'neutral';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  subLabel,
  subValueColor = 'text-slate-700',
  icon: Icon,
  iconBgColor = 'bg-slate-100 border-slate-200',
  iconColor = 'text-slate-700',
  trend,
  highlight = false,
  valueColor = 'text-[#091e42]',
  className,
  badge,
}) => {
  return (
    <div
      className={cn(
        'bg-white p-5 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] flex flex-col justify-between transition-all duration-200 hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(15,23,42,0.05)]',
        highlight && 'ring-1 ring-emerald-500/30 border-emerald-300 bg-gradient-to-b from-emerald-50/20 to-white',
        className
      )}
    >
      <div>
        {/* Top row: Label & Icon Badge */}
        <div className="flex items-center justify-between text-slate-500 mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </span>
          <div
            className={cn(
              'w-7 h-7 rounded-lg border flex items-center justify-center transition-transform duration-200 hover:scale-105',
              iconBgColor,
              iconColor
            )}
          >
            <Icon className="w-4 h-4 stroke-[2]" />
          </div>
        </div>

        {/* Primary Value: Dominate viewport */}
        <div className={cn('text-2xl sm:text-[28px] leading-none font-extrabold font-tabular tracking-tight my-1', valueColor)}>
          {value}
        </div>
      </div>

      {/* Footer Sub-Metric / Trend */}
      {(subLabel || subValue || trend || badge) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subLabel && (
            <span className="text-slate-500 truncate max-w-[140px] text-[11px]">
              {subLabel}
            </span>
          )}
          {subValue !== undefined && (
            <span className={cn('font-bold font-tabular font-mono text-[11px] shrink-0', subValueColor)}>
              {subValue}
            </span>
          )}
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-[11px] font-bold font-tabular font-mono px-1.5 py-0.5 rounded',
                trend.positive ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'
              )}
            >
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
