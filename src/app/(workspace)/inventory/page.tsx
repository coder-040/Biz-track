import { Suspense } from "react"
import { connection } from "next/server"
import Link from "next/link"
import {
  AlertTriangleIcon,
  BoxesIcon,
  PackageIcon,
  WalletIcon,
} from "lucide-react"

import { AddProductDialog } from "@/components/inventory/add-product-dialog"
import { InventorySkeleton } from "@/components/inventory/inventory-skeleton"
import { ProductTable } from "@/components/inventory/product-table"
import { StatCard } from "@/components/inventory/stat-card"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency, formatQuantity } from "@/lib/format"
import { getInventoryOverview } from "@/lib/inventory-data"

export const metadata = {
  title: "Inventory · BizTrack",
  description: "Products, stock levels, movements and low-stock alerts.",
}

async function InventoryContent() {
  await connection()
  const {
    activeProducts,
    archivedProducts,
    lowStockProducts,
    suppliers,
    totalInventoryValue,
  } = await getInventoryOverview()

  const supplierNames = Object.fromEntries(
    suppliers.map((supplier) => [supplier.id, supplier.name])
  )

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Manage products, record stock movements and catch low stock before it
          runs out.
        </p>
      </header>

      <section
        aria-label="Inventory summary"
        className="grid gap-4 sm:grid-cols-3"
      >
        <StatCard
          title="Active products"
          value={String(activeProducts.length)}
          description="Products available in the catalogue."
          icon={<PackageIcon className="size-4" />}
        />
        <StatCard
          title="Low stock"
          value={String(lowStockProducts.length)}
          description="Active products at or below their threshold."
          icon={<AlertTriangleIcon className="size-4" />}
        />
        <StatCard
          title="Inventory value"
          value={formatCurrency(totalInventoryValue)}
          description="Current stock × purchase price, active products."
          icon={<WalletIcon className="size-4" />}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="products-heading" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="products-heading" className="text-lg font-medium">
                Products
              </h2>
              <p className="text-sm text-muted-foreground">
                Stock levels update from recorded movements.
              </p>
            </div>
            <AddProductDialog suppliers={suppliers} />
          </div>
          <Card>
            <CardContent>
              <ProductTable
                products={activeProducts}
                supplierNames={supplierNames}
                emptyTitle="No active products"
                emptyDescription="Add your first product to start tracking stock and low-stock alerts."
              />
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="low-stock-heading">
          <Card>
            <CardHeader>
              <CardTitle id="low-stock-heading" className="flex items-center gap-2">
                <AlertTriangleIcon
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                Low-stock alerts
              </CardTitle>
              <CardDescription>
                Items at or below their minimum threshold.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center">
                  <BoxesIcon
                    className="size-6 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium">Stock levels look healthy</p>
                  <p className="text-xs text-muted-foreground">
                    Alerts clear when stock rises above the threshold.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {lowStockProducts.map((product) => (
                    <li key={product.id}>
                      <Link
                        href={`/inventory/${product.id}`}
                        className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:text-foreground"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatQuantity(product.current_stock)} left · minimum{" "}
                            {formatQuantity(product.min_stock)}
                          </p>
                        </div>
                        <Badge variant="destructive">Low</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {archivedProducts.length > 0 ? (
        <section aria-labelledby="archived-heading">
          <div className="mb-3">
            <h2 id="archived-heading" className="text-lg font-medium">
              Archived products
            </h2>
            <p className="text-sm text-muted-foreground">
              Hidden from active lists, with movement history retained.
            </p>
          </div>
          <Card>
            <CardContent>
              <ProductTable
                products={archivedProducts}
                supplierNames={supplierNames}
                emptyTitle="No archived products"
                emptyDescription="Archived products will appear here."
                archived
              />
            </CardContent>
          </Card>
        </section>
      ) : null}
    </main>
  )
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<InventorySkeleton />}>
      <InventoryContent />
    </Suspense>
  )
}
