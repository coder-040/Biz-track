"use client"

import { useMemo, useState, type ReactNode } from "react"
import { PackageIcon, SearchIcon } from "lucide-react"

import { ProductTable } from "@/components/inventory/product-table"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getStockStatus, type Product } from "@/lib/inventory"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 8

type StatusFilter = "all" | "in" | "low" | "out"

interface InventoryExplorerProps {
  products: Product[]
  supplierNames: Record<string, string>
  initialQuery?: string
}

function getPageItems(
  currentPage: number,
  pageCount: number
): Array<number | "ellipsis"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  const items: Array<number | "ellipsis"> = [1]
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(pageCount - 1, currentPage + 1)

  if (start > 2) items.push("ellipsis")
  for (let page = start; page <= end; page += 1) items.push(page)
  if (end < pageCount - 1) items.push("ellipsis")
  items.push(pageCount)

  return items
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "secondary"}
      size="sm"
      className={cn(
        "h-8 shrink-0 rounded-lg px-3",
        !active && "text-muted-foreground"
      )}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}) {
  if (pageCount <= 1) return null

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-lg"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>

      {getPageItems(page, pageCount).map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="px-1 text-xs text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Button
            key={item}
            type="button"
            variant={item === page ? "default" : "ghost"}
            size="icon-sm"
            className="rounded-lg"
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        )
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-lg"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  )
}

export function InventoryExplorer({
  products,
  supplierNames,
  initialQuery = "",
}: InventoryExplorerProps) {
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState("all")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [page, setPage] = useState(1)

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.category)
            .filter((value): value is string => Boolean(value))
        )
      ).sort(),
    [products]
  )

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase()

    return products.filter((product) => {
      const matchesSearch =
        search.length === 0 ||
        [product.name, product.sku, product.category].some((value) =>
          value?.toLowerCase().includes(search)
        )
      const matchesCategory =
        category === "all" || product.category === category
      const matchesStatus =
        status === "all" ||
        getStockStatus(
          product.current_stock,
          product.min_stock,
          product.is_active
        ) === status

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [category, products, query, status])

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  function updateQuery(value: string) {
    setQuery(value)
    setPage(1)
  }

  function updateCategory(value: string) {
    setCategory(value)
    setPage(1)
  }

  function updateStatus(value: StatusFilter) {
    setStatus(value)
    setPage(1)
  }

  return (
    <section aria-labelledby="products-heading" className="space-y-3">
      <h2 id="products-heading" className="sr-only">
        Products
      </h2>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-md">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Search by product name, SKU or barcode..."
            aria-label="Search products"
            className="h-10 rounded-xl border-border/70 bg-card pl-9 shadow-sm"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <FilterChip
              active={category === "all"}
              onClick={() => updateCategory("all")}
            >
              All
            </FilterChip>
            {categories.map((value) => (
              <FilterChip
                key={value}
                active={category === value}
                onClick={() => updateCategory(value)}
              >
                {value}
              </FilterChip>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Filter status:
            </span>
            <Select
              value={status}
              onValueChange={(value) =>
                updateStatus((value ?? "all") as StatusFilter)
              }
            >
              <SelectTrigger
                className="h-9 w-40 rounded-lg border-border/70 bg-card"
                aria-label="Filter by stock status"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stock status</SelectItem>
                <SelectItem value="in">In stock</SelectItem>
                <SelectItem value="low">Low stock</SelectItem>
                <SelectItem value="out">Out of stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card className="gap-0 overflow-hidden rounded-2xl p-0 ring-1 ring-border/70 [--card-spacing:0px]">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
              <PackageIcon
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <p className="font-semibold">No products match these filters</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Try a different search term, category or stock status.
            </p>
          </div>
        ) : (
          <ProductTable
            products={visibleProducts}
            supplierNames={supplierNames}
            emptyTitle="No products"
            emptyDescription="Add a product to start tracking stock."
          />
        )}

        <div className="flex flex-col gap-3 border-t border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {visibleProducts.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {filteredProducts.length}
            </span>{" "}
            registered stock keeping units
            {query.trim() ? ` for “${query.trim()}”` : ""}.
          </p>
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </div>
      </Card>
    </section>
  )
}
