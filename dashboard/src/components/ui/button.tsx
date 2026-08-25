import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "emerald"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variantStyles = {
      default: "bg-slate-950 text-white shadow-xs hover:bg-slate-800",
      destructive: "bg-rose-500 text-white shadow-xs hover:bg-rose-600",
      outline: "border border-slate-200 bg-white shadow-xs hover:bg-slate-100 hover:text-slate-900",
      secondary: "bg-slate-100 text-slate-900 shadow-xs hover:bg-slate-200",
      ghost: "hover:bg-slate-100 hover:text-slate-900",
      link: "text-slate-900 underline-offset-4 hover:underline",
      emerald: "bg-emerald-500 text-slate-950 font-bold shadow-xs hover:bg-emerald-400",
    }

    const sizeStyles = {
      default: "h-9 px-4 py-2 text-xs",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-8 text-sm",
      icon: "h-9 w-9",
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
