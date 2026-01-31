import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50",
        variant === 'default' && "bg-amber-600/80 text-white",
        variant === 'secondary' && "bg-white/10 text-white/80",
        variant === 'outline' && "border border-white/20 text-white/80",
        className
      )}
      {...props}
    />
  )
}

export { Badge }
