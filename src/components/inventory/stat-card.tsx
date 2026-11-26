import type { ReactNode } from "react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StatTone = "default" | "dark" | "danger"

interface StatCardProps {
  title: string
  value: string
  unit?: string
  description?: string
  icon: ReactNode
  tone?: StatTone
  badge?: ReactNode
  footer?: ReactNode
}

const toneClasses: Record<StatTone, string> = {
  default: "bg-card text-card-foreground ring-border/70",
  dark: "bg-primary text-primary-foreground ring-primary/20",
  danger: "bg-danger-soft text-foreground ring-danger-foreground/10",
}

const labelClasses: Record<StatTone, string> = {
  default: "text-muted-foreground",
  dark: "text-primary-foreground/70",
  danger: "text-danger-foreground",
}

const descriptionClasses: Record<StatTone, string> = {
  default: "text-muted-foreground",
  dark: "text-primary-foreground/70",
  danger: "text-muted-foreground",
}

const iconClasses: Record<StatTone, string> = {
  default: "bg-secondary text-muted-foreground",
  dark: "bg-white/10 text-primary-foreground",
  danger: "bg-card/70 text-danger-foreground",
}

export function StatCard({
  title,
  value,
  unit,
  description,
  icon,
  tone = "default",
  badge,
  footer,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "gap-3 rounded-2xl p-5 ring-1 [--card-spacing:--spacing(5)]",
        toneClasses[tone]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "text-[0.65rem] font-semibold uppercase tracking-[0.14em]",
            labelClasses[tone]
          )}
        >
          {title}
        </p>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            iconClasses[tone]
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      <div className="flex flex-wrap items-baseline gap-2">
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {unit ? (
          <span className={cn("text-sm font-medium", labelClasses[tone])}>
            {unit}
          </span>
        ) : null}
        {badge}
      </div>

      {footer ?? (
        <p
          className={cn(
            "text-xs leading-relaxed",
            descriptionClasses[tone]
          )}
        >
          {description}
        </p>
      )}
    </Card>
  )
}
