import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'approved'
  | 'blocked'
  | 'escalated'
  | 'info'
  | 'neutral'
  | 'live'
  | 'simulated';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  pulse?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  pulse = false,
  icon,
  children,
  className,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    approved: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 font-bold',
    blocked: 'bg-rose-50 text-rose-800 border-rose-200/80 font-bold',
    escalated: 'bg-amber-50 text-amber-800 border-amber-200/80 font-bold',
    info: 'bg-blue-50 text-blue-800 border-blue-200/80 font-bold',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 font-semibold',
    live: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60 font-bold',
    simulated: 'bg-slate-800 text-slate-300 border-slate-700 font-bold',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 rounded gap-1',
    md: 'text-[11px] px-2 py-0.5 rounded-md gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center border uppercase tracking-wider font-mono select-none transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              variant === 'approved' || variant === 'live' ? 'bg-emerald-400' :
              variant === 'blocked' ? 'bg-rose-400' :
              variant === 'escalated' ? 'bg-amber-400' : 'bg-blue-400'
            )}
          />
          <span
            className={cn(
              'relative inline-flex rounded-full h-1.5 w-1.5',
              variant === 'approved' || variant === 'live' ? 'bg-emerald-500' :
              variant === 'blocked' ? 'bg-rose-500' :
              variant === 'escalated' ? 'bg-amber-500' : 'bg-blue-500'
            )}
          />
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
