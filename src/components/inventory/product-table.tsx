import Link from "next/link"
import {
  EyeIcon,
  PackageIcon,
  PlusIcon,
} from "lucide-react"

import { ProductStatusButton } from "@/components/inventory/product-status-button"
import { StockLevelBar } from "@/components/inventory/stock-level-bar"
import { StockStatusBadge } from "@/components/inventory/stock-status-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCompactCurrency, formatQuantity } from "@/lib/format"
import {
  calculateMarginPercent,
  getStockStatus,
  stockLevelPercent,
  type Product,
} from "@/lib/inventory"
import { cn } from "@/lib/utils"

interface ProductTableProps {
  products: Product[]
  supplierNames: Record<string, string>
  emptyTitle: string
  emptyDescription: string
  archived?: boolean
}

function ProductIcon({ isOut }: { isOut: boolean }) {
  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl",
        isOut
          ? "bg-destructive/10 text-destructive"
          : "bg-secondary text-muted-foreground"
      )}
    >
      <PackageIcon className="size-4" aria-hidden="true" />
    </div>
  )
}

export function ProductTable({
  products,
  supplierNames,
  emptyTitle,
  emptyDescription,
  archived = false,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
          <PackageIcon
            className="size-5 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <p className="font-semibold">{emptyTitle}</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {emptyDescription}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/70 bg-secondary/50 hover:bg-secondary/50">
              <TableHead className="h-11 px-4 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Product name &amp; SKU
              </TableHead>
              <TableHead className="h-11 px-4 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Category
              </TableHead>
              <TableHead className="h-11 px-4 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Cost price
              </TableHead>
              <TableHead className="h-11 px-4 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Selling price
              </TableHead>
              <TableHead className="h-11 px-4 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Stock quantity &amp; level
              </TableHead>
              <TableHead className="h-11 px-4 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="h-11 px-4 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const status = getStockStatus(
                product.current_stock,
                product.min_stock,
                product.is_active
              )
              const progress = stockLevelPercent(
                product.current_stock,
                product.min_stock
              )
              const margin = calculateMarginPercent(
                product.purchase_price,
                product.selling_price
              )

              return (
                <TableRow
                  key={product.id}
                  className="border-border/70 hover:bg-secondary/30"
                >
                  <TableCell className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <ProductIcon isOut={status === "out"} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{product.name}</p>
                        <p className="mt-0.5 text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                          {product.sku ?? "No SKU"}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-4 py-4">
                    <Badge
                      variant="secondary"
                      className="h-6 bg-secondary text-muted-foreground"
                    >
                      {product.category ?? "Uncategorized"}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-4 py-4 font-medium">
                    {formatCompactCurrency(product.purchase_price)}
                  </TableCell>

                  <TableCell className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatCompactCurrency(product.selling_price)}
                      </span>
                      {product.purchase_price > 0 ? (
                        <Badge
                          variant={margin >= 0 ? "success" : "destructive"}
                          className="h-5 px-1.5 text-[0.65rem]"
                        >
                          {margin >= 0 ? "+" : ""}
                          {Math.round(margin)}%
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>

                  <TableCell className="px-4 py-4">
                    <div className="min-w-32 space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">
                          {formatQuantity(product.current_stock)}
                        </span>
                        <span className="text-[0.65rem] text-muted-foreground">
                          {progress}%
                        </span>
                      </div>
                      <StockLevelBar value={progress} status={status} />
                      <p className="text-[0.65rem] text-muted-foreground">
                        Min {formatQuantity(product.min_stock)}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="px-4 py-4">
                    <StockStatusBadge
                      currentStock={product.current_stock}
                      minStock={product.min_stock}
                      isActive={product.is_active}
                    />
                  </TableCell>

                  <TableCell className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/inventory/${product.id}`}
                        aria-label={`View ${product.name}`}
                        title="View details"
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon-sm" }),
                          "text-muted-foreground"
                        )}
                      >
                        <EyeIcon aria-hidden="true" />
                      </Link>
                      {!archived ? (
                        <Link
                          href={`/inventory/${product.id}`}
                          aria-label={`Restock ${product.name}`}
                          title="Record movement"
                          className={cn(
                            buttonVariants({
                              variant: "ghost",
                              size: "icon-sm",
                            }),
                            "text-muted-foreground"
                          )}
                        >
                          <PlusIcon aria-hidden="true" />
                        </Link>
                      ) : null}
                      <ProductStatusButton
                        productId={product.id}
                        isActive={product.is_active}
                        compact
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-border/70 md:hidden">
        {products.map((product) => {
          const status = getStockStatus(
            product.current_stock,
            product.min_stock,
            product.is_active
          )
          const progress = stockLevelPercent(
            product.current_stock,
            product.min_stock
          )
          const supplierName = product.supplier_id
            ? supplierNames[product.supplier_id]
            : undefined

          return (
            <li key={product.id} className="p-4">
              <div className="flex items-start gap-3">
                <ProductIcon isOut={status === "out"} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{product.name}</p>
                      <p className="mt-0.5 text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                        {product.sku ?? "No SKU"}
                      </p>
                    </div>
                    <StockStatusBadge
                      currentStock={product.current_stock}
                      minStock={product.min_stock}
                      isActive={product.is_active}
                      short
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="bg-secondary">
                      {product.category ?? "Uncategorized"}
                    </Badge>
                    <span>Cost {formatCompactCurrency(product.purchase_price)}</span>
                    <span>
                      Sell {formatCompactCurrency(product.selling_price)}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="font-medium">
                        {formatQuantity(product.current_stock)} on hand
                      </span>
                      <span className="text-muted-foreground">
                        {progress}%
                      </span>
                    </div>
                    <StockLevelBar value={progress} status={status} />
                    <div className="flex items-center justify-between gap-2 text-[0.65rem] text-muted-foreground">
                      <span>Min {formatQuantity(product.min_stock)}</span>
                      <span className="truncate">
                        {supplierName ?? "No supplier"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Link
                      href={`/inventory/${product.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "flex-1 rounded-lg"
                      )}
                    >
                      <EyeIcon aria-hidden="true" />
                      View
                    </Link>
                    {!archived ? (
                      <Link
                        href={`/inventory/${product.id}`}
                        className={cn(
                          buttonVariants({ variant: "default", size: "sm" }),
                          "flex-1 rounded-lg"
                        )}
                      >
                        <PlusIcon aria-hidden="true" />
                        Restock
                      </Link>
                    ) : null}
                    <ProductStatusButton
                      productId={product.id}
                      isActive={product.is_active}
                      compact
                    />
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
