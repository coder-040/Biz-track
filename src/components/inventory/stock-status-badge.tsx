import type { ReactNode } from "react"
import {
  AlertTriangleIcon,
  ArchiveIcon,
  XCircleIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { getStockStatus, type StockStatus } from "@/lib/inventory"
import { cn } from "@/lib/utils"

interface StockStatusBadgeProps {
  currentStock: number
  minStock: number
  isActive?: boolean
  short?: boolean
  className?: string
}

const statusConfig: Record<
  StockStatus,
  {
    label: string
    shortLabel: string
    variant: "success" | "warning" | "destructive" | "outline"
    icon: ReactNode
  }
> = {
  in: {
    label: "In stock",
    shortLabel: "In stock",
    variant: "success",
    icon: <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />,
  },
  low: {
    label: "Low stock",
    shortLabel: "Low",
    variant: "warning",
    icon: <AlertTriangleIcon aria-hidden="true" />,
  },
  out: {
    label: "Out of stock",
    shortLabel: "Empty",
    variant: "destructive",
    icon: <XCircleIcon aria-hidden="true" />,
  },
  archived: {
    label: "Archived",
    shortLabel: "Archived",
    variant: "outline",
    icon: <ArchiveIcon aria-hidden="true" />,
  },
}

export function StockStatusBadge({
  currentStock,
  minStock,
  isActive = true,
  short = false,
  className,
}: StockStatusBadgeProps) {
  const status = getStockStatus(currentStock, minStock, isActive)
  const config = statusConfig[status]

  return (
    <Badge
      variant={config.variant}
      className={cn("h-6 gap-1.5 px-2.5", className)}
    >
      {config.icon}
      {short ? config.shortLabel : config.label}
    </Badge>
  )
}
