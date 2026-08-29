import React from 'react';
import { LucideIcon, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Clock,
  title,
  description,
  actionText,
  onAction,
  isLoading = false,
  isError = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-10 text-center flex flex-col items-center justify-center space-y-3',
        className
      )}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center border transition-all',
          isError
            ? 'bg-rose-50 border-rose-200 text-rose-600'
            : isLoading
            ? 'bg-blue-50 border-blue-200 text-blue-600 animate-spin'
            : 'bg-slate-50 border-slate-200 text-slate-400'
        )}
      >
        {isError ? (
          <AlertCircle className="w-6 h-6" />
        ) : isLoading ? (
          <RefreshCw className="w-6 h-6" />
        ) : (
          <Icon className="w-6 h-6 stroke-[1.75]" />
        )}
      </div>

      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">
          {title}
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
