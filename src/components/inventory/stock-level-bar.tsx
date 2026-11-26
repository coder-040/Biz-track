import type { StockStatus } from "@/lib/inventory"
import { cn } from "@/lib/utils"

interface StockLevelBarProps {
  value: number
  status: StockStatus
  className?: string
}

const toneClasses: Record<StockStatus, string> = {
  in: "bg-primary",
  low: "bg-gold",
  out: "bg-destructive",
  archived: "bg-muted-foreground",
}

export function StockLevelBar({
  value,
  status,
  className,
}: StockLevelBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label="Stock level"
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300",
          toneClasses[status]
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}
