import { Badge } from "@/components/ui/badge"
import type { StockMovementType } from "@/lib/inventory"

const movementConfig: Record<
  StockMovementType,
  {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
  }
> = {
  purchase: { label: "Purchase", variant: "default" },
  sale: { label: "Sale", variant: "secondary" },
  damaged: { label: "Damaged", variant: "destructive" },
  lost: { label: "Lost", variant: "destructive" },
  adjustment: { label: "Adjustment", variant: "outline" },
}

export function MovementTypeBadge({ type }: { type: StockMovementType }) {
  const config = movementConfig[type]

  return <Badge variant={config.variant}>{config.label}</Badge>
}
