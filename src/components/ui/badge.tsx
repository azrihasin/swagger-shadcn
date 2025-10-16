import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = {
  default:
    "inline-flex items-center rounded-full border border-transparent bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  secondary:
    "inline-flex items-center rounded-full border border-transparent bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground",
  outline:
    "inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold",
  neutral:
    "inline-flex items-center rounded-full border border-transparent bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
}

type BadgeVariant = keyof typeof badgeVariants

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants[variant], className)}
      {...props}
    />
  )
}
