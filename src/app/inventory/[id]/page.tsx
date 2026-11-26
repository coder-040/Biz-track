import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeftIcon,
  HistoryIcon,
  PackageIcon,
  RulerIcon,
  WalletIcon,
} from "lucide-react"

import { MovementTypeBadge } from "@/components/inventory/movement-type-badge"
import { ProductStatusButton } from "@/components/inventory/product-status-button"
import { RecordMovementDialog } from "@/components/inventory/record-movement-dialog"
import { StatCard } from "@/components/inventory/stat-card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatMovementDate, formatQuantity } from "@/lib/format"
import {
  calculateInventoryValue,
  isLowStock,
  movementDelta,
} from "@/lib/inventory"
import { getProduct, getStockMovements } from "@/lib/inventory-data"
import { cn } from "@/lib/utils"

export const instant = false

export const metadata = {
  title: "Product details · BizTrack",
}

export default async function ProductPage({
  params,
}: PageProps<"/inventory/[id]">) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  const movements = await getStockMovements(product.id)
  const lowStock = isLowStock(
    product.current_stock,
    product.min_stock,
    product.is_active
  )

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <Link
          href="/inventory"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeftIcon aria-hidden="true" />
          Back to inventory
        </Link>
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {product.name}
            </h1>
            {!product.is_active ? (
              <Badge variant="outline">Archived</Badge>
            ) : lowStock ? (
              <Badge variant="destructive">Low stock</Badge>
            ) : (
              <Badge variant="secondary">In stock</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {product.sku ? `SKU ${product.sku}` : "No SKU"}
            {product.category ? ` · ${product.category}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {product.is_active ? <RecordMovementDialog product={product} /> : null}
          <ProductStatusButton
            productId={product.id}
            isActive={product.is_active}
          />
        </div>
      </header>

      {!product.is_active ? (
        <Card className="border-dashed">
          <CardContent>
            <p className="text-sm">
              This product is archived. It is hidden from active inventory and
              low-stock alerts, but its movement history is retained. Restore it
              to record new movements.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <section
        aria-label="Product stock summary"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          title="Current stock"
          value={formatQuantity(product.current_stock)}
          description="Updated atomically with each movement."
          icon={<PackageIcon className="size-4" />}
        />
        <StatCard
          title="Low-stock threshold"
          value={formatQuantity(product.min_stock)}
          description="Alert when current stock is at or below this."
          icon={<RulerIcon className="size-4" />}
        />
        <StatCard
          title="Inventory value"
          value={formatCurrency(
            calculateInventoryValue(
              product.current_stock,
              product.purchase_price
            )
          )}
          description="Current stock × purchase price."
          icon={<WalletIcon className="size-4" />}
        />
        <StatCard
          title="Selling price"
          value={formatCurrency(product.selling_price)}
          description={`Purchase price ${formatCurrency(product.purchase_price)}.`}
          icon={<WalletIcon className="size-4" />}
        />
      </section>

      <section aria-labelledby="movement-history-heading">
        <Card>
          <CardHeader>
            <CardTitle id="movement-history-heading">Movement history</CardTitle>
            <CardDescription>
              Every purchase, sale, damage, loss and adjustment for this
              product.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {movements.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center">
                <HistoryIcon
                  className="size-8 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="font-medium">No movements yet</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Record a restock, sale or adjustment to start the history.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Unit cost</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => {
                    const delta = movementDelta(
                      movement.type,
                      movement.quantity,
                      movement.reason
                    )

                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {formatMovementDate(movement.created_at)}
                        </TableCell>
                        <TableCell>
                          <MovementTypeBadge type={movement.type} />
                        </TableCell>
                        <TableCell
                          className={
                            delta < 0 ? "font-medium text-destructive" : "font-medium"
                          }
                        >
                          {delta > 0 ? "+" : ""}
                          {formatQuantity(delta)}
                        </TableCell>
                        <TableCell>
                          {movement.unit_cost
                            ? formatCurrency(movement.unit_cost)
                            : "—"}
                        </TableCell>
                        <TableCell className="max-w-56 whitespace-normal">
                          {movement.reason ?? "—"}
                        </TableCell>
                        <TableCell>
                          {movement.transaction_id ? (
                            <code
                              className="text-xs text-muted-foreground"
                              title={movement.transaction_id}
                            >
                              {movement.transaction_id.slice(0, 8)}…
                            </code>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
