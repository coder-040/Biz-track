import { Suspense } from "react"
import {
  AlertTriangleIcon,
  BoxesIcon,
  ClipboardCheckIcon,
  ScanBarcodeIcon,
  StoreIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react"

import { AddProductDialog } from "@/components/inventory/add-product-dialog"
import { ComingSoonButton } from "@/components/inventory/coming-soon-button"
import { ExportButton } from "@/components/inventory/export-button"
import { InventoryExplorer } from "@/components/inventory/inventory-explorer"
import { ProductTable } from "@/components/inventory/product-table"
import { ReorderCard } from "@/components/inventory/reorder-card"
import { StatCard } from "@/components/inventory/stat-card"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCompactCurrency } from "@/lib/format"
import { getInventoryOverview } from "@/lib/inventory-data"
import {
  calculateMarginPercent,
  calculateRetailValue,
  getStockStatus,
  type Product,
} from "@/lib/inventory"

export const metadata = {
  title: "Stockroom · BizTrack",
  description: "Products, stock levels, movements and low-stock alerts.",
}

interface InventoryContentProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function sortForReorder(products: Product[]): Product[] {
  return [...products]
    .sort((a, b) => {
      const aOut =
        getStockStatus(a.current_stock, a.min_stock, a.is_active) === "out"
          ? 0
          : 1
      const bOut =
        getStockStatus(b.current_stock, b.min_stock, b.is_active) === "out"
          ? 0
          : 1

      if (aOut !== bOut) return aOut - bOut

      const aRatio =
        a.min_stock > 0 ? a.current_stock / a.min_stock : a.current_stock
      const bRatio =
        b.min_stock > 0 ? b.current_stock / b.min_stock : b.current_stock

      return aRatio - bRatio
    })
    .slice(0, 3)
}

async function InventoryContent({ searchParams }: InventoryContentProps) {
  const [params, overview] = await Promise.all([
    searchParams,
    getInventoryOverview(),
  ])

  const {
    activeProducts,
    archivedProducts,
    lowStockProducts,
    suppliers,
    totalInventoryValue,
  } = overview

  const query = typeof params.q === "string" ? params.q : ""
  const addOpen = params.add === "1"

  const supplierNames = Object.fromEntries(
    suppliers.map((supplier) => [supplier.id, supplier.name])
  )

  const categoryCount = new Set(
    activeProducts.map((product) => product.category).filter(Boolean)
  ).size

  const retailValue = activeProducts.reduce(
    (total, product) =>
      total +
      calculateRetailValue(product.current_stock, product.selling_price),
    0
  )
  const potentialProfit = retailValue - totalInventoryValue
  const marginPercent = calculateMarginPercent(
    totalInventoryValue,
    retailValue
  )

  const outOfStockCount = activeProducts.filter(
    (product) =>
      getStockStatus(
        product.current_stock,
        product.min_stock,
        product.is_active
      ) === "out"
  ).length
  const lowOnlyCount = lowStockProducts.filter(
    (product) => product.current_stock > 0
  ).length
  const needsAttentionCount = lowStockProducts.length
  const reorderProducts = sortForReorder(lowStockProducts)

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <StoreIcon className="size-3.5" aria-hidden="true" />
              Warehouse &amp; Retail
            </span>
            <span className="text-xs text-muted-foreground">
              • Kirana Multi-Store POS
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Stockroom{" "}
            <span className="text-lg font-normal text-muted-foreground sm:text-xl">
              (सामानको गोदाम र मौज्दात)
            </span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Track items, low stock warnings, cost price, and retail selling
            margins in real-time.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
          <div className="flex flex-wrap gap-2">
            <ComingSoonButton
              label="Bulk Scan"
              icon={<ScanBarcodeIcon aria-hidden="true" />}
            />
            <ComingSoonButton
              label="Stock Audit"
              icon={<ClipboardCheckIcon aria-hidden="true" />}
            />
            <ExportButton products={activeProducts} />
          </div>
          <AddProductDialog
            key={addOpen ? "add-open" : "add-closed"}
            suppliers={suppliers}
            defaultOpen={addOpen}
          />
        </div>
      </header>

      <section
        aria-label="Inventory summary"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          title="Active SKUs"
          value={String(activeProducts.length)}
          unit="Products"
          description={
            categoryCount === 0
              ? "No categories assigned yet"
              : `Spread across ${categoryCount} distinct ${
                  categoryCount === 1 ? "category" : "categories"
                }`
          }
          icon={<BoxesIcon className="size-4" />}
        />

        <StatCard
          title="Wholesale cost value"
          value={formatCompactCurrency(totalInventoryValue)}
          description="Recorded at wholesale cost price"
          icon={<WalletIcon className="size-4" />}
        />

        <StatCard
          tone="dark"
          title="Potential retail return"
          value={formatCompactCurrency(retailValue)}
          badge={
            <span className="rounded-full bg-gold px-2 py-0.5 text-[0.65rem] font-semibold text-gold-foreground">
              {marginPercent >= 0 ? "+" : ""}
              {marginPercent.toFixed(1)}% Margin
            </span>
          }
          description={`Expected gross profit: ${formatCompactCurrency(
            potentialProfit
          )}`}
          icon={<TrendingUpIcon className="size-4" />}
        />

        <StatCard
          tone="danger"
          title="Needs attention"
          value={`${needsAttentionCount} ${
            needsAttentionCount === 1 ? "Product" : "Products"
          }`}
          description="Items at or below their reorder threshold."
          icon={<AlertTriangleIcon className="size-4" />}
          footer={
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-sm">
                {outOfStockCount} Out of stock
              </span>
              <span className="rounded-lg bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-sm">
                {lowOnlyCount} Low stock
              </span>
            </div>
          }
        />
      </section>

      <section
        aria-labelledby="needs-attention-heading"
        className="space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="needs-attention-heading"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <span
              className="size-2 rounded-full bg-destructive"
              aria-hidden="true"
            />
            Needs Attention{" "}
            <span className="text-sm font-normal text-muted-foreground">
              (तुरुन्त माग्नुपर्ने सामानहरू)
            </span>
          </h2>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Fast reorder flow
          </span>
        </div>

        {reorderProducts.length === 0 ? (
          <Card className="rounded-2xl p-6 ring-1 ring-border/70">
            <div className="flex flex-col items-center gap-2 text-center">
              <BoxesIcon
                className="size-6 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="font-semibold">Stock levels look healthy</p>
              <p className="text-sm text-muted-foreground">
                Reorder cards appear when an item reaches its threshold.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {reorderProducts.map((product) => (
              <ReorderCard
                key={product.id}
                product={product}
                supplierName={
                  product.supplier_id
                    ? supplierNames[product.supplier_id]
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </section>

      <InventoryExplorer
        key={query}
        products={activeProducts}
        supplierNames={supplierNames}
        initialQuery={query}
      />

      {archivedProducts.length > 0 ? (
        <section aria-labelledby="archived-heading" className="space-y-3">
          <div>
            <h2
              id="archived-heading"
              className="text-lg font-semibold tracking-tight"
            >
              Archived products
            </h2>
            <p className="text-sm text-muted-foreground">
              Hidden from active lists, with movement history retained.
            </p>
          </div>

          <Card className="overflow-hidden rounded-2xl p-0 ring-1 ring-border/70 [--card-spacing:0px]">
            <ProductTable
              products={archivedProducts}
              supplierNames={supplierNames}
              emptyTitle="No archived products"
              emptyDescription="Archived products will appear here."
              archived
            />
          </Card>
        </section>
      ) : null}
    </div>
  )
}

function InventorySkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
      aria-label="Loading inventory"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-48 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-96 rounded-2xl" />
    </div>
  )
}

export default function InventoryPage({
  searchParams,
}: PageProps<"/inventory">) {
  return (
    <Suspense fallback={<InventorySkeleton />}>
      <InventoryContent searchParams={searchParams} />
    </Suspense>
  )
}
