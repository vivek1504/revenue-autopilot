import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-slate-900 text-white",
    secondary: "border-transparent bg-slate-100 text-slate-900",
    destructive: "border-transparent bg-rose-50 text-rose-700 border border-rose-200",
    outline: "border-slate-200 text-slate-950",
    success: "border-transparent bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "border-transparent bg-amber-50 text-amber-700 border border-amber-200",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
