import Link from "next/link"
import { PackageIcon, PlusIcon, RefreshCwIcon } from "lucide-react"

import { StockLevelBar } from "@/components/inventory/stock-level-bar"
import { StockStatusBadge } from "@/components/inventory/stock-status-badge"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatQuantity } from "@/lib/format"
import {
  getStockStatus,
  stockLevelPercent,
  type Product,
} from "@/lib/inventory"
import { cn } from "@/lib/utils"

interface ReorderCardProps {
  product: Product
  supplierName?: string
}

export function ReorderCard({ product, supplierName }: ReorderCardProps) {
  const status = getStockStatus(
    product.current_stock,
    product.min_stock,
    product.is_active
  )
  const progress = stockLevelPercent(product.current_stock, product.min_stock)
  const isOut = status === "out"

  return (
    <Card className="gap-3 rounded-2xl p-4 ring-1 ring-border/70 [--card-spacing:--spacing(4)]">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-xl",
            isOut
              ? "bg-destructive/10 text-destructive"
              : "bg-secondary text-muted-foreground"
          )}
        >
          <PackageIcon className="size-6" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold leading-snug">
                {product.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {product.sku ? `SKU: ${product.sku}` : "No SKU"}
              </p>
            </div>
            <StockStatusBadge
              currentStock={product.current_stock}
              minStock={product.min_stock}
              isActive={product.is_active}
              short
            />
          </div>

          <div className="mt-3 space-y-2 rounded-xl bg-secondary/60 p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Stock level:</span>
              <span
                className={cn(
                  "font-semibold",
                  isOut ? "text-destructive" : "text-warning"
                )}
              >
                {formatQuantity(product.current_stock)} left{" "}
                <span className="font-normal text-muted-foreground">
                  (Min: {formatQuantity(product.min_stock)})
                </span>
              </span>
            </div>
            <StockLevelBar value={progress} status={status} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Supplier:</span>
              <span className="truncate font-medium">
                {supplierName ?? "No supplier"}
              </span>
            </div>
          </div>

          <Link
            href={`/inventory/${product.id}`}
            className={cn(
              buttonVariants({
                variant: isOut ? "gold" : "default",
                size: "sm",
              }),
              "mt-3 w-full rounded-lg"
            )}
          >
            {isOut ? (
              <RefreshCwIcon aria-hidden="true" />
            ) : (
              <PlusIcon aria-hidden="true" />
            )}
            {isOut ? "Restock now" : "Restock"}
          </Link>
        </div>
      </div>
    </Card>
  )
}
